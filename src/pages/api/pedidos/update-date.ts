import type { APIRoute } from 'astro'
import { getDB } from '../../../db'
import { pedidosTable } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData()
    const idStr = formData.get('id')?.toString()
    const dateStr = formData.get('date')?.toString()

    if (!idStr || !dateStr) {
      return new Response(JSON.stringify({ error: 'ID y fecha requeridos' }), { status: 400 })
    }

    const id = Number(idStr)
    if (!Number.isFinite(id)) {
      return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 })
    }

    // SQLite expects YYYY-MM-DD HH:MM:SS for CURRENT_TIMESTAMP type columns if we want consistency
    // But since it's a text column, we can store what we want. 
    // Let's ensure it's a valid date and format it nicely.
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return new Response(JSON.stringify({ error: 'Fecha inválida' }), { status: 400 })
    }

    // Format to YYYY-MM-DD HH:MM:SS for SQLite compatibility
    const formattedDate = date.toISOString().replace('T', ' ').split('.')[0]

    const db = getDB(locals.runtime.env)

    await db
      .update(pedidosTable)
      .set({ createdAt: formattedDate })
      .where(eq(pedidosTable.id, id))

    return new Response(null, {
      status: 303,
      headers: { Location: '/admin/pedidos' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Error al actualizar la fecha' }), { status: 500 })
  }
}
