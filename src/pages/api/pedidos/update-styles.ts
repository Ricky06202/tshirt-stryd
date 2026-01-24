import type { APIRoute } from 'astro'
import { getDB } from '../../../db'
import { pedidoItemsTable } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData()
    const idStr = formData.get('id')?.toString()
    const estilosIds = formData.getAll('estilos').map(id => Number(id))

    if (!idStr) {
      return new Response(JSON.stringify({ error: 'ID de pedido requerido' }), { status: 400 })
    }

    const pedidoId = Number(idStr)
    if (!Number.isFinite(pedidoId)) {
      return new Response(JSON.stringify({ error: 'ID de pedido inválido' }), { status: 400 })
    }

    const db = getDB(locals.runtime.env)

    // Transaction to delete and insert new styles
    await db.batch([
      db.delete(pedidoItemsTable).where(eq(pedidoItemsTable.pedidoId, pedidoId)),
      ...(estilosIds.length > 0 
        ? [db.insert(pedidoItemsTable).values(estilosIds.map(estiloId => ({
            pedidoId,
            estiloId
          })))]
        : [])
    ])

    return new Response(null, {
      status: 303,
      headers: { Location: '/admin/pedidos' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Error al actualizar los estilos' }), { status: 500 })
  }
}
