import type { APIRoute } from 'astro'
import { getDB } from '../../../db'
import { pedidosTable } from '../../../db/schema'
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

    const rows = await db
      .select({ pagado: pedidosTable.pagado })
      .from(pedidosTable)
      .where(eq(pedidosTable.id, id))

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), { status: 404 })
    }

    const current = rows[0].pagado as number
    const next = current ? 0 : 1

    await db
      .update(pedidosTable)
      .set({ pagado: next })
      .where(eq(pedidosTable.id, id))

    // Redirigir de vuelta a la lista
    return new Response(null, {
      status: 303,
      headers: { Location: '/admin/pedidos' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Error al actualizar el estado' }), { status: 500 })
  }
}
