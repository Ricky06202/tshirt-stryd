import type { APIRoute } from 'astro'
import { getDB } from '../../../db'
import { pedidosTable } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData()
    const idStr = formData.get('id')?.toString()
    const montoStr = formData.get('monto')?.toString()

    if (!idStr || montoStr === undefined) {
      return new Response(JSON.stringify({ error: 'ID y monto requeridos' }), { status: 400 })
    }

    const id = Number(idStr)
    const monto = Number(montoStr)

    if (!Number.isFinite(id) || !Number.isFinite(monto)) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 })
    }

    const db = getDB(locals.runtime.env)

    const rows = await db
      .select({ total: pedidosTable.total })
      .from(pedidosTable)
      .where(eq(pedidosTable.id, id))

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), { status: 404 })
    }

    const total = rows[0].total as number
    const pagado = monto >= total ? 1 : 0

    await db
      .update(pedidosTable)
      .set({ 
        abonado: monto,
        pagado: pagado
      })
      .where(eq(pedidosTable.id, id))

    return new Response(null, {
      status: 303,
      headers: { Location: '/admin/pedidos' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Error al actualizar el abono' }), { status: 500 })
  }
}