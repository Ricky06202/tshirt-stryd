import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, hostname } = context.url;

  // Detectamos si estamos en entorno local
  const isLocal = hostname === "localhost" || 
                 hostname === "127.0.0.1" || 
                 hostname.endsWith(".local");

  // Definimos qué rutas requieren autenticación
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/") && 
                    !pathname.startsWith("/api/order") && 
                    !pathname.startsWith("/api/images");

  if (isAdminPath || isAdminApi) {
    // BYPASS TOTAL EN LOCAL: Si estamos en localhost, inyectamos usuario dummy y seguimos
    if (isLocal) {
      context.locals.user = { 
        email: "admin@local.dev",
        name: "Admin Local"
      };
      return next();
    }

    // LÓGICA DE PRODUCCIÓN (CLOUDFLARE ACCESS)
    const userEmail = context.request.headers.get("Cf-Access-Authenticated-User-Email");
    const userName = context.request.headers.get("Cf-Access-Authenticated-User-Name");

    if (userEmail) {
      context.locals.user = { 
        email: userEmail,
        name: userName || userEmail.split('@')[0]
      };
    } else {
      // Bloqueo en producción si no hay cabeceras de Cloudflare
      if (isAdminApi) {
        return new Response(
          JSON.stringify({ 
            error: "No autorizado", 
            message: "Cloudflare Access es requerido." 
          }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response("No autorizado: Cloudflare Access es requerido", { status: 401 });
    }
  }

  return next();
});
