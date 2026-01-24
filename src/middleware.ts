import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Protegemos todas las rutas que empiecen con /admin o sean APIs de admin
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Cloudflare Access inyecta estas cabeceras tras una autenticación exitosa
    const userEmail = context.request.headers.get("Cf-Access-Authenticated-User-Email");
    const userName = context.request.headers.get("Cf-Access-Authenticated-User-Name");

    if (userEmail) {
      context.locals.user = { 
        email: userEmail,
        name: userName || userEmail.split('@')[0] // Fallback al nombre de usuario del email si no hay nombre real
      };
    } else {
      // Si estamos en producción y no hay cabecera, es un acceso no autorizado
      // En desarrollo (localhost), permitimos el paso para no bloquear el trabajo
      if (context.url.hostname !== "localhost" && context.url.hostname !== "127.0.0.1") {
        return new Response("No autorizado: Cloudflare Access es requerido", { status: 401 });
      }
      
      // Usuario dummy para desarrollo
      context.locals.user = { 
        email: "admin@local.dev",
        name: "Administrador Local"
      };
    }
  }

  return next();
});
