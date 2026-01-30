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
      .select({ 
        pagado: pedidosTable.pagado,
        total: pedidosTable.total 
      })
      .from(pedidosTable)
      .where(eq(pedidosTable.id, id))

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), { status: 404 })
    }

    const { pagado: current, total } = rows[0]
    const next = current ? 0 : 1

    // Al marcar como pagado (next === 1), igualamos el abonado al total.
    // Al marcar como pendiente (next === 0), dejamos el abonado como estaba o decidimos si resetearlo.
    // Según el feedback, el problema es que al marcar como pagado no se suma en el informe porque abonado queda en 0.
    const updateData: any = { pagado: next }
    if (next === 1) {
      updateData.abonado = total
    }

    await db
      .update(pedidosTable)
      .set(updateData)
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
