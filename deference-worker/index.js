export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // 1. CORS 사전 요청 처리
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    const path = url.pathname;

    // 🛡️ [검문소] 클럭 신분증(JWT 토큰) 확인
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No Token Provided" }), { status: 401, headers: corsHeaders });
    }

    const sessionToken = authHeader.split(" ")[1];

    try {
      // 🛂 클럭 신분증(JWT)에서 유저 ID 추출 (✨ 500 에러 방지용 패딩 로직 적용)
      let base64 = sessionToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      if (pad) base64 += '='.repeat(4 - pad);
      const payloadObj = JSON.parse(atob(base64));
      
      const userId = payloadObj.sub; // ✨ 인증 성공!

      if (!userId) {
        return new Response(JSON.stringify({ error: "Invalid User ID" }), { status: 401, headers: corsHeaders });
      }
      
      // ==========================================
      // [1] 파일 업로드 (R2 창고) : POST /upload
      // ==========================================
      if (path === "/upload" && request.method === "POST") {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) return new Response("파일이 없습니다.", { status: 400, headers: corsHeaders });

        const arrayBuffer = await file.arrayBuffer();
        const uniqueId = crypto.randomUUID();
        const fileName = `uploads/${userId}/${uniqueId}.webp`;

        await env.MY_BUCKET.put(fileName, arrayBuffer, {
          httpMetadata: { contentType: "image/webp" },
        });

        const publicUrl = `https://pub-d2476b64512145c0894fe40bd87e4194.r2.dev/${fileName}`;
        
        return new Response(JSON.stringify({ success: true, url: publicUrl, fileName: fileName }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ==========================================
      // [2] 자산 목록 (D1 장부) : GET /assets
      // ==========================================
      if (path === "/assets" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC"
        ).bind(userId).all();

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ==========================================
      // [3] 새 자산 기록 (D1 장부) : POST /assets
      // ==========================================
      if (path === "/assets" && request.method === "POST") {
        const body = await request.json();
        
        const query = `
          INSERT INTO assets (
            user_id, item_type, image_url, video_url, page_url, 
            memo, tags, folder, palette_data, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } 

      // ==========================================
      // [4] 자산 정보 수정 (D1 장부) : PUT /assets
      // ==========================================
      if (path === "/assets" && request.method === "PUT") {
        const body = await request.json();
        const id = body.id;
        if (!id) return new Response("ID 없음", { status: 400, headers: corsHeaders });

        if (body.memo !== undefined) await env.DB.prepare("UPDATE assets SET memo = ? WHERE id = ? AND user_id = ?").bind(body.memo, id, userId).run();
        if (body.tags !== undefined) await env.DB.prepare("UPDATE assets SET tags = ? WHERE id = ? AND user_id = ?").bind(body.tags, id, userId).run();
        if (body.folder !== undefined) await env.DB.prepare("UPDATE assets SET folder = ? WHERE id = ? AND user_id = ?").bind(body.folder, id, userId).run();
        if (body.palette_data !== undefined) await env.DB.prepare("UPDATE assets SET palette_data = ? WHERE id = ? AND user_id = ?").bind(body.palette_data, id, userId).run();

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // ==========================================
      // [6] 컬렉션 관리 (폴더) : /collections (수정/삭제 추가 ✨)
      // ==========================================
      if (path === "/collections") {
        if (request.method === "GET") {
          const { results } = await env.DB.prepare("SELECT * FROM collections WHERE user_id = ? ORDER BY is_pinned DESC, sort_order ASC, created_at ASC").bind(userId).all();
          return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (request.method === "POST") {
          const body = await request.json();
          // 현재 최대 sort_order 조회
          const { results: maxResults } = await env.DB.prepare("SELECT MAX(sort_order) as max_order FROM collections WHERE user_id = ?").bind(userId).all();
          const nextOrder = (maxResults[0].max_order || 0) + 1;
          
          await env.DB.prepare("INSERT INTO collections (name, user_id, sort_order, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)")
            .bind(body.name || "", userId, nextOrder).run();
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (request.method === "PUT") {
          const body = await request.json();
          
          if (Array.isArray(body)) {
            // 벌크 순서 업데이트
            const statements = body.map(col => 
              env.DB.prepare("UPDATE collections SET sort_order = ? WHERE id = ? AND user_id = ?")
                .bind(col.sort_order, col.id, userId)
            );
            await env.DB.batch(statements);
          } else {
            // 단일 업데이트 (이름 변경 또는 핀 고정 토글)
            const { id, name, is_pinned } = body;
            if (!id) return new Response("ID 없음", { status: 400, headers: corsHeaders });
            
            if (name !== undefined) {
              await env.DB.prepare("UPDATE collections SET name = ? WHERE id = ? AND user_id = ?").bind(name, id, userId).run();
            }
            if (is_pinned !== undefined) {
              await env.DB.prepare("UPDATE collections SET is_pinned = ? WHERE id = ? AND user_id = ?").bind(is_pinned ? 1 : 0, id, userId).run();
            }
          }
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (request.method === "DELETE") {
          const id = url.searchParams.get("id");
          if (!id) return new Response("ID 없음", { status: 400, headers: corsHeaders });
          await env.DB.prepare("DELETE FROM collections WHERE id = ? AND user_id = ?").bind(id, userId).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
      }

      // ==========================================
      // [7] 스피드 다이얼 북마크 관리 : /bookmarks
      // ==========================================
      if (path === "/bookmarks") {
        if (request.method === "GET") {
          const { results } = await env.DB.prepare("SELECT * FROM bookmarks WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC").bind(userId).all();
          return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
            body.icon_scale || 1.0,
            body.icon_offset_x || 0,
            body.icon_offset_y || 0
          ).run();

          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
              body.icon_offset_x || 0,
              body.icon_offset_y || 0,
              body.id, userId
            ).run();
          }
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (request.method === "DELETE") {
          const id = url.searchParams.get("id");
          if (id) await env.DB.prepare("DELETE FROM bookmarks WHERE id = ? AND user_id = ?").bind(id, userId).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
      }

      // 🛡️ API 기본 응답
      return new Response("Deference Protected API Running 🛡️", { headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), { 
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  },
};
