import type { APIRoute } from 'astro'
import { getDB } from '../../../db'
import { pedidoItemsTable, pedidosTable } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData()
    const idStr = formData.get('id')?.toString()

    if (!idStr) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400 })
    }

    const id = Number(idStr)
    if (!Number.isFinite(id)) {
      return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 })
    }

    const db = getDB(locals.runtime.env)

    // Borrar items del pedido primero para mantener integridad
    await db.delete(pedidoItemsTable).where(eq(pedidoItemsTable.pedidoId, id))

    // Borrar el pedido
    await db.delete(pedidosTable).where(eq(pedidosTable.id, id))

    return new Response(null, {
      status: 303,
      headers: { Location: '/admin/pedidos' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Error al borrar el pedido' }), { status: 500 })
  }
}
