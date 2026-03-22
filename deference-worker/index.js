export default {
  async fetch(request, env, ctx) {
    const rawOrigin = request.headers.get("Origin");

    // [CORS] 허용 도메인 확정 (Strict Matching)
    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "https://www.deference.work",
      "https://deference.work"
    ];

    // Origin 매칭 로직: 리스트에 있으면 해당 Origin 사용, 없으면 운영 도메인 기본값
    let origin = "https://www.deference.work"; 
    if (rawOrigin && allowedOrigins.includes(rawOrigin)) {
      origin = rawOrigin;
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    };

    // 🚀 [OPTIONS] 프리플라이트 요청 최우선 처리 (인증 로직 진입 전)
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ✨ [표준 응답 헬퍼] 모든 응답에 CORS 및 JSON 헤더 강제 주입
    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    };

    const url = new URL(request.url);
    const path = url.pathname;

    // 🛡️ [인증] Bearer 토큰 검사
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "No Token Provided" }, 401);
    }

    const sessionToken = authHeader.split(" ")[1];

    try {
      // 🛂 [JWT 디코딩] 유저 아이디 추출 및 패딩 정규화
      let userId;
      try {
        const tokenParts = sessionToken.split('.');
        if (tokenParts.length < 2) throw new Error("Invalid format");
        
        let base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        if (pad) base64 += '='.repeat(4 - pad);
        const payloadObj = JSON.parse(atob(base64));
        userId = payloadObj.sub;
      } catch (e) {
        return jsonResponse({ error: "Invalid Token Payload" }, 401);
      }

      if (!userId) {
        return jsonResponse({ error: "Invalid User ID" }, 401);
      }

      // ==========================================
      // [1] 파일 업로드 (R2) : POST /upload
      // ==========================================
      if (path === "/upload" && request.method === "POST") {
        try {
          const formData = await request.formData();
          const file = formData.get("file");
          if (!file) return jsonResponse({ error: "파일이 없습니다." }, 400);

          const arrayBuffer = await file.arrayBuffer();
          const uniqueId = crypto.randomUUID();
          const fileName = `uploads/${userId}/${uniqueId}.webp`;

          await env.MY_BUCKET.put(fileName, arrayBuffer, {
            httpMetadata: { contentType: "image/webp" },
          });

          const publicUrl = `https://pub-d2476b64512145c0894fe40bd87e4194.r2.dev/${fileName}`;
          return jsonResponse({ success: true, url: publicUrl, fileName: fileName });
        } catch (e) {
          return jsonResponse({ error: "Upload failed: " + e.message }, 500);
        }
      }

      // ==========================================
      // [2] 자산 목록 (D1) : GET /assets
      // ==========================================
      if (path === "/assets" && request.method === "GET") {
        const requestedStatus = url.searchParams.get("status") || "active";
        const { results } = await env.DB.prepare(
          "SELECT * FROM assets WHERE user_id = ? AND IFNULL(status, 'active') = ? ORDER BY created_at DESC"
        ).bind(userId, requestedStatus).all();
        return jsonResponse(results);
      }

      // ==========================================
      // [3] 새 자산 기록 (D1) : POST /assets
      // ==========================================
      if (path === "/assets" && request.method === "POST") {
        const body = await request.json();
        const query = `
          INSERT INTO assets (
            user_id, item_type, image_url, video_url, page_url, 
            memo, tags, folder, palette_data, created_at, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'active')
        `;
        await env.DB.prepare(query).bind(
          userId,
          body.item_type || "image",
          body.image_url || "",
          body.video_url || "",
          body.page_url || "",
          body.memo || "",
          body.tags || "",
          body.folder || "전체",
          body.palette_data || null
        ).run();
        return jsonResponse({ success: true });
      }

      // ==========================================
      // [4] 자산 수정 (D1) : PUT /assets
      // ==========================================
      if (path === "/assets" && request.method === "PUT") {
        const body = await request.json();
        const id = body.id;
        if (!id) return jsonResponse({ error: "ID 없음" }, 400);

        if (body.memo !== undefined) await env.DB.prepare("UPDATE assets SET memo = ? WHERE id = ? AND user_id = ?").bind(body.memo, id, userId).run();
        if (body.tags !== undefined) await env.DB.prepare("UPDATE assets SET tags = ? WHERE id = ? AND user_id = ?").bind(body.tags, id, userId).run();
        if (body.folder !== undefined) await env.DB.prepare("UPDATE assets SET folder = ? WHERE id = ? AND user_id = ?").bind(body.folder, id, userId).run();
        if (body.palette_data !== undefined) await env.DB.prepare("UPDATE assets SET palette_data = ? WHERE id = ? AND user_id = ?").bind(body.palette_data, id, userId).run();
        if (body.status !== undefined) await env.DB.prepare("UPDATE assets SET status = ? WHERE id = ? AND user_id = ?").bind(body.status, id, userId).run();

        return jsonResponse({ success: true });
      }

      // ==========================================
      // [5] 자산 삭제 (D1 + R2) : DELETE /assets
      // ==========================================
      if (path === "/assets" && request.method === "DELETE") {
        const id = url.searchParams.get("id");
        const fileName = url.searchParams.get("fileName");
        if (id) {
          await env.DB.prepare("DELETE FROM assets WHERE id = ? AND user_id = ?").bind(id, userId).run();
        }
        if (fileName && fileName.includes(userId)) {
          await env.MY_BUCKET.delete(fileName);
        }
        return jsonResponse({ success: true });
      }

      // ==========================================
      // [6] 컬렉션 관리 (폴더) : /collections
      // ==========================================
      if (path === "/collections") {
        if (request.method === "GET") {
          const requestedStatus = url.searchParams.get("status") || "active";
          const { results } = await env.DB.prepare(
            "SELECT * FROM collections WHERE user_id = ? AND status = ? ORDER BY is_pinned DESC, sort_order ASC, created_at ASC"
          ).bind(userId, requestedStatus).all();
          return jsonResponse(results);
        }

        if (request.method === "POST") {
          const body = await request.json();
          const { results: maxResults } = await env.DB.prepare("SELECT MAX(sort_order) as max_order FROM collections WHERE user_id = ?").bind(userId).all();
          const nextOrder = (maxResults[0].max_order || 0) + 1;
          await env.DB.prepare("INSERT INTO collections (name, user_id, sort_order, status, created_at) VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)")
            .bind(body.name || "", userId, nextOrder).run();
          return jsonResponse({ success: true });
        }

        if (request.method === "PUT") {
          const body = await request.json();
          if (Array.isArray(body)) {
            const statements = [];
            for (const item of body) {
              if (item.sort_order !== undefined) {
                statements.push(env.DB.prepare("UPDATE collections SET sort_order = ? WHERE id = ? AND user_id = ?").bind(item.sort_order, item.id, userId));
              }
              if (item.status !== undefined) {
                statements.push(env.DB.prepare("UPDATE collections SET status = ? WHERE id = ? AND user_id = ?").bind(item.status, item.id, userId));
                statements.push(env.DB.prepare("UPDATE assets SET status = ? WHERE collection_id = ? AND user_id = ?").bind(item.status, item.id, userId));
              }
            }
            if (statements.length > 0) await env.DB.batch(statements);
          } else {
            const { id, name, is_pinned, status } = body;
            if (!id) return jsonResponse({ error: "ID 없음" }, 400);

            if (name !== undefined) await env.DB.prepare("UPDATE collections SET name = ? WHERE id = ? AND user_id = ?").bind(name, id, userId).run();
            if (is_pinned !== undefined) {
              const pinnedVal = (is_pinned === true || is_pinned === 1 || String(is_pinned) === "true") ? 1 : 0;
              await env.DB.prepare("UPDATE collections SET is_pinned = ? WHERE id = ? AND user_id = ?").bind(pinnedVal, id, userId).run();
            }
            if (status !== undefined) {
              const validStatus = (status === 'trash' || status === 'active') ? status : 'active';
              await env.DB.batch([
                env.DB.prepare("UPDATE collections SET status = ? WHERE id = ? AND user_id = ?").bind(validStatus, id, userId),
                env.DB.prepare("UPDATE assets SET status = ? WHERE collection_id = ? AND user_id = ?").bind(validStatus, id, userId)
              ]);
            }
          }
          return jsonResponse({ success: true });
        }

        if (request.method === "DELETE") {
          const id = url.searchParams.get("id");
          if (!id) return jsonResponse({ error: "ID 없음" }, 400);
          await env.DB.batch([
            env.DB.prepare("DELETE FROM assets WHERE collection_id = ? AND user_id = ?").bind(id, userId),
            env.DB.prepare("DELETE FROM collections WHERE id = ? AND user_id = ?").bind(id, userId)
          ]);
          return jsonResponse({ success: true });
        }
      }

      // ==========================================
      // [7] 북마크 관리 : /bookmarks
      // ==========================================
      if (path === "/bookmarks") {
        if (request.method === "GET") {
          const { results } = await env.DB.prepare("SELECT * FROM bookmarks WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC").bind(userId).all();
          return jsonResponse(results);
        }

        if (request.method === "POST") {
          const body = await request.json();
          const newId = crypto.randomUUID();
          const { results } = await env.DB.prepare("SELECT MAX(sort_order) as max_order FROM bookmarks WHERE user_id = ?").bind(userId).all();
          const nextOrder = (results[0].max_order || 0) + 1;
          const query = `
            INSERT INTO bookmarks (
              id, user_id, name, url, icon_type, icon_value, sort_order, icon_scale, 
              icon_offset_x, icon_offset_y, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `;
          await env.DB.prepare(query).bind(
            newId, userId, body.name, body.url, body.icon_type, body.icon_value, nextOrder,
            body.icon_scale || 1.0, body.icon_offset_x || 0, body.icon_offset_y || 0
          ).run();
          return jsonResponse({ success: true });
        }

        if (request.method === "PUT") {
          const body = await request.json();
          if (Array.isArray(body)) {
            const statements = body.map(bm => env.DB.prepare("UPDATE bookmarks SET sort_order = ? WHERE id = ? AND user_id = ?").bind(bm.sort_order, bm.id, userId));
            await env.DB.batch(statements);
          } else {
            const query = `
              UPDATE bookmarks SET 
                name = ?, url = ?, icon_type = ?, icon_value = ?, icon_scale = ?, 
                icon_offset_x = ?, icon_offset_y = ? 
              WHERE id = ? AND user_id = ?
            `;
            await env.DB.prepare(query).bind(
              body.name, body.url, body.icon_type, body.icon_value, body.icon_scale || 1.0,
              body.icon_offset_x || 0, body.icon_offset_y || 0, body.id, userId
            ).run();
          }
          return jsonResponse({ success: true });
        }

        if (request.method === "DELETE") {
          const id = url.searchParams.get("id");
          if (id) await env.DB.prepare("DELETE FROM bookmarks WHERE id = ? AND user_id = ?").bind(id, userId).run();
          return jsonResponse({ success: true });
        }
      }

      // ==========================================
      // [8] 사용자 설정 : /preferences
      // ==========================================
      if (path === "/preferences") {
        if (request.method === "GET") {
          const result = await env.DB.prepare("SELECT * FROM preferences WHERE user_id = ?").bind(userId).first();
          return jsonResponse(result || { view_mode: "masonry", masonry_size: 4, grid_size: 6 });
        }

        if (request.method === "PUT") {
          try {
            const body = await request.json();
            const vMode = body.view_mode || body.viewMode || 'masonry';
            const mSize = body.masonry_size !== undefined ? Number(body.masonry_size) : (Number(body.masonrySize) || 4);
            const gSize = body.grid_size !== undefined ? Number(body.grid_size) : (Number(body.gridSize) || 6);

            const query = `
              INSERT INTO preferences (user_id, view_mode, masonry_size, grid_size) 
              VALUES (?, ?, ?, ?) 
              ON CONFLICT(user_id) DO UPDATE SET 
                view_mode = excluded.view_mode, masonry_size = excluded.masonry_size, 
                grid_size = excluded.grid_size, updated_at = CURRENT_TIMESTAMP
            `;
            await env.DB.prepare(query).bind(userId, vMode, mSize, gSize).run();
            return jsonResponse({ success: true });
          } catch (e) {
            return jsonResponse({ error: e.message, message: "설정 저장 실패" }, 500);
          }
        }
      }

      return new Response("Deference Protected API Running 🛡️", { 
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain"
        }
      });

    } catch (globalError) {
      return jsonResponse({ success: false, error: globalError.message }, 500);
    }
  },
};
