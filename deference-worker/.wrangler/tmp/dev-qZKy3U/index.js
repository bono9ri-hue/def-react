var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-76Epz5/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-76Epz5/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// index.js
var deference_worker_default = {
  async fetch(request, env, ctx) {
    const rawOrigin = request.headers.get("Origin");
    const allowedOrigins = ["http://localhost:3000", "https://www.deference.work"];
    const origin = allowedOrigins.includes(rawOrigin) ? rawOrigin : allowedOrigins[1];
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Allow-Credentials": "true",
      // 인증 정보 포함 허용
      "Access-Control-Max-Age": "86400"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const url = new URL(request.url);
    const path = url.pathname;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No Token Provided" }), { status: 401, headers: corsHeaders });
    }
    const sessionToken = authHeader.split(" ")[1];
    try {
      let base64 = sessionToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const pad = base64.length % 4;
      if (pad)
        base64 += "=".repeat(4 - pad);
      const payloadObj = JSON.parse(atob(base64));
      const userId = payloadObj.sub;
      if (!userId) {
        return new Response(JSON.stringify({ error: "Invalid User ID" }), { status: 401, headers: corsHeaders });
      }
      if (path === "/upload" && request.method === "POST") {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file)
          return new Response("\uD30C\uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", { status: 400, headers: corsHeaders });
        const arrayBuffer = await file.arrayBuffer();
        const uniqueId = crypto.randomUUID();
        const fileName = `uploads/${userId}/${uniqueId}.webp`;
        await env.MY_BUCKET.put(fileName, arrayBuffer, {
          httpMetadata: { contentType: "image/webp" }
        });
        const publicUrl = `https://pub-d2476b64512145c0894fe40bd87e4194.r2.dev/${fileName}`;
        return new Response(JSON.stringify({ success: true, url: publicUrl, fileName }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (path === "/assets" && request.method === "GET") {
        const status = url.searchParams.get("status") || "active";
        const { results } = await env.DB.prepare(
          "SELECT * FROM assets WHERE user_id = ? AND IFNULL(status, 'active') = 'active' ORDER BY created_at DESC"
        ).bind(userId).all();
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
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
          body.folder || "\uC804\uCCB4",
          body.palette_data || null
        ).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (path === "/assets" && request.method === "PUT") {
        const body = await request.json();
        const id = body.id;
        if (!id)
          return new Response("ID \uC5C6\uC74C", { status: 400, headers: corsHeaders });
        if (body.memo !== void 0)
          await env.DB.prepare("UPDATE assets SET memo = ? WHERE id = ? AND user_id = ?").bind(body.memo, id, userId).run();
        if (body.tags !== void 0)
          await env.DB.prepare("UPDATE assets SET tags = ? WHERE id = ? AND user_id = ?").bind(body.tags, id, userId).run();
        if (body.folder !== void 0)
          await env.DB.prepare("UPDATE assets SET folder = ? WHERE id = ? AND user_id = ?").bind(body.folder, id, userId).run();
        if (body.palette_data !== void 0)
          await env.DB.prepare("UPDATE assets SET palette_data = ? WHERE id = ? AND user_id = ?").bind(body.palette_data, id, userId).run();
        if (body.status !== void 0)
          await env.DB.prepare("UPDATE assets SET status = ? WHERE id = ? AND user_id = ?").bind(body.status, id, userId).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
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
      if (path === "/collections") {
        if (request.method === "GET") {
          const requestedStatus = url.searchParams.get("status") || "active";
          const { results } = await env.DB.prepare(
            "SELECT * FROM collections WHERE user_id = ? AND status = ? ORDER BY is_pinned DESC, sort_order ASC, created_at ASC"
          ).bind(userId, requestedStatus).all();
          return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (request.method === "POST") {
          const body = await request.json();
          const { results: maxResults } = await env.DB.prepare("SELECT MAX(sort_order) as max_order FROM collections WHERE user_id = ?").bind(userId).all();
          const nextOrder = (maxResults[0].max_order || 0) + 1;
          await env.DB.prepare("INSERT INTO collections (name, user_id, sort_order, status, created_at) VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)").bind(body.name || "", userId, nextOrder).run();
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (request.method === "PUT") {
          const body = await request.json();
          if (Array.isArray(body)) {
            const statements = [];
            for (const item of body) {
              if (item.sort_order !== void 0) {
                statements.push(env.DB.prepare("UPDATE collections SET sort_order = ? WHERE id = ? AND user_id = ?").bind(item.sort_order, item.id, userId));
              }
              if (item.status !== void 0) {
                statements.push(env.DB.prepare("UPDATE collections SET status = ? WHERE id = ? AND user_id = ?").bind(item.status, item.id, userId));
                statements.push(env.DB.prepare("UPDATE assets SET status = ? WHERE collection_id = ? AND user_id = ?").bind(item.status, item.id, userId));
              }
            }
            if (statements.length > 0)
              await env.DB.batch(statements);
          } else {
            const { id, name, is_pinned, status } = body;
            if (!id)
              return new Response("ID \uC5C6\uC74C", { status: 400, headers: corsHeaders });
            if (name !== void 0) {
              await env.DB.prepare("UPDATE collections SET name = ? WHERE id = ? AND user_id = ?").bind(name, id, userId).run();
            }
            if (is_pinned !== void 0) {
              const pinnedVal = is_pinned === true || is_pinned === 1 || String(is_pinned) === "true" ? 1 : 0;
              await env.DB.prepare("UPDATE collections SET is_pinned = ? WHERE id = ? AND user_id = ?").bind(pinnedVal, id, userId).run();
            }
            if (status !== void 0) {
              const validStatus = status === "trash" || status === "active" ? status : "active";
              const statements = [
                env.DB.prepare("UPDATE collections SET status = ? WHERE id = ? AND user_id = ?").bind(validStatus, id, userId),
                env.DB.prepare("UPDATE assets SET status = ? WHERE collection_id = ? AND user_id = ?").bind(validStatus, id, userId)
              ];
              await env.DB.batch(statements);
            }
          }
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (request.method === "DELETE") {
          const id = url.searchParams.get("id");
          if (!id)
            return new Response("ID \uC5C6\uC74C", { status: 400, headers: corsHeaders });
          const statements = [
            env.DB.prepare("DELETE FROM assets WHERE collection_id = ? AND user_id = ?").bind(id, userId),
            env.DB.prepare("DELETE FROM collections WHERE id = ? AND user_id = ?").bind(id, userId)
          ];
          await env.DB.batch(statements);
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
      }
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
            newId,
            userId,
            body.name,
            body.url,
            body.icon_type,
            body.icon_value,
            nextOrder,
            body.icon_scale || 1,
            body.icon_offset_x || 0,
            body.icon_offset_y || 0
          ).run();
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (request.method === "PUT") {
          const body = await request.json();
          if (Array.isArray(body)) {
            const statements = body.map((bm) => env.DB.prepare("UPDATE bookmarks SET sort_order = ? WHERE id = ? AND user_id = ?").bind(bm.sort_order, bm.id, userId));
            await env.DB.batch(statements);
          } else {
            const query = `
              UPDATE bookmarks SET 
                name = ?, url = ?, icon_type = ?, icon_value = ?, icon_scale = ?, 
                icon_offset_x = ?, icon_offset_y = ? 
              WHERE id = ? AND user_id = ?
            `;
            await env.DB.prepare(query).bind(
              body.name,
              body.url,
              body.icon_type,
              body.icon_value,
              body.icon_scale || 1,
              body.icon_offset_x || 0,
              body.icon_offset_y || 0,
              body.id,
              userId
            ).run();
          }
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (request.method === "DELETE") {
          const id = url.searchParams.get("id");
          if (id)
            await env.DB.prepare("DELETE FROM bookmarks WHERE id = ? AND user_id = ?").bind(id, userId).run();
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
      }
      if (path === "/preferences") {
        if (request.method === "GET") {
          const result = await env.DB.prepare("SELECT * FROM preferences WHERE user_id = ?").bind(userId).first();
          return new Response(JSON.stringify(result || { view_mode: "masonry", masonry_size: 4, grid_size: 6 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        if (request.method === "PUT") {
          try {
            const body = await request.json();
            const vMode = body.view_mode || body.viewMode || "masonry";
            const mSize = body.masonry_size !== void 0 ? Number(body.masonry_size) : Number(body.masonrySize) || 4;
            const gSize = body.grid_size !== void 0 ? Number(body.grid_size) : Number(body.gridSize) || 6;
            console.log("D1 Binding Params:", { userId, vMode, mSize, gSize });
            const query = `
              INSERT INTO preferences (user_id, view_mode, masonry_size, grid_size) 
              VALUES (?, ?, ?, ?) 
              ON CONFLICT(user_id) DO UPDATE SET 
                view_mode = excluded.view_mode, 
                masonry_size = excluded.masonry_size, 
                grid_size = excluded.grid_size, 
                updated_at = CURRENT_TIMESTAMP
            `;
            await env.DB.prepare(query).bind(
              userId,
              vMode,
              mSize,
              gSize
            ).run();
            return new Response(JSON.stringify({ success: true }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          } catch (error) {
            console.error("PUT /preferences Error:", error);
            return new Response(JSON.stringify({
              error: error.message,
              stack: error.stack,
              message: "\uC0AC\uC6A9\uC790 \uC124\uC815 \uC800\uC7A5 \uC911 \uC11C\uBC84 \uC5D0\uB7EC\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
            }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }
      }
      return new Response("Deference Protected API Running \u{1F6E1}\uFE0F", { headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-76Epz5/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = deference_worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-76Epz5/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
