import type { APIRoute } from 'astro'
import { getDB } from '../../db'
import { pedidosTable, pedidoItemsTable, estilosTable } from '../../db/schema'
import { inArray, sql } from 'drizzle-orm'
import { notifyDiscord } from '../../lib/discord'

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as any
    const { persona, nombre, tallaId, estiloIds, turnstileToken } = body as {
      persona: string
      nombre?: string
      tallaId: number
      estiloIds: number[]
      turnstileToken: string
    }

    if (!persona || !tallaId || !Array.isArray(estiloIds) || estiloIds.length === 0 || !turnstileToken) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos del pedido o verificación de seguridad' }),
        { status: 400 },
      )
    }

    // VALIDACIÓN DE CLOUDFLARE TURNSTILE
    const isLocal = request.url.includes('localhost') || request.url.includes('127.0.0.1');
    const SECRET_KEY = locals.runtime.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
    
    // Si estamos en local y no hay llave real, podemos saltarnos la validación de red
    // o usar la llave de prueba universal de Cloudflare.
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(SECRET_KEY)}&response=${encodeURIComponent(turnstileToken)}`,
    });

    const verifyData = await verifyResponse.json() as { success: boolean };
    if (!verifyData.success) {
      return new Response(
        JSON.stringify({ error: 'Verificación de seguridad fallida. Eres un robot?' }),
        { status: 403 },
      )
    }

    const db = getDB(locals.runtime.env)

    // Obtener precios de estilos y calcular total en el servidor
    const estilos = await db
      .select()
      .from(estilosTable)
      .where(inArray(estilosTable.id, estiloIds))

    if (estilos.length !== estiloIds.length) {
      return new Response(
        JSON.stringify({ error: 'Algún estilo seleccionado no existe' }),
        { status: 400 },
      )
    }

    const total = estilos.reduce((acc, e) => acc + (e.precio as number), 0)

    const result = await db.insert(pedidosTable).values({
      persona,
      nombre: nombre || 'Sin nombre',
      tallaId,
      total,
      pagado: 0,
    }).returning({ insertedId: pedidosTable.id })

    const pedidoId = result[0].insertedId

    // Insertar los items del pedido
    await db.insert(pedidoItemsTable).values(
      estiloIds.map((estiloId: number) => ({ pedidoId, estiloId })),
    )

    // Aviso a Discord (best-effort): nunca altera la respuesta del pedido.
    try {
      const _t = Number(total || 0)
      const _p = String(persona || '').trim().split(/\s+/).filter(Boolean)
      const _nm = _p.length ? _p[0] + (_p[1] ? ' ' + _p[1].charAt(0) + '.' : '') : ''
      notifyDiscord(locals.runtime.env, 'pedidos',
        `\u{1F4E6} Nuevo pedido \u2014 Tienda Stryd${_nm ? ' \u00b7 ' + _nm : ''} \u00b7 $${_t.toFixed(2)}`,
        locals.runtime.ctx)
    } catch { /* best-effort */ }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pedido realizado con éxito',
        pedidoId,
      }),
      { status: 201 },
    )
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: 'Error al procesar el pedido' }),
      { status: 500 },
    )
  }
}
