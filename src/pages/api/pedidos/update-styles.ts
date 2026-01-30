import type { APIRoute } from 'astro'
import { getDB } from '../../../db'
import { pedidoItemsTable, pedidosTable, estilosTable } from '../../../db/schema'
import { eq, inArray } from 'drizzle-orm'

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

    // Calculate new total
    let newTotal = 0
    if (estilosIds.length > 0) {
      const selectedStyles = await db
        .select({ precio: estilosTable.precio })
        .from(estilosTable)
        .where(inArray(estilosTable.id, estilosIds))
      
      newTotal = selectedStyles.reduce((acc, style) => acc + style.precio, 0)
    }

    // Transaction to update styles and total
    await db.batch([
      db.delete(pedidoItemsTable).where(eq(pedidoItemsTable.pedidoId, pedidoId)),
      ...(estilosIds.length > 0 
        ? [db.insert(pedidoItemsTable).values(estilosIds.map(estiloId => ({
            pedidoId,
            estiloId
          })))]
        : []),
      db.update(pedidosTable)
        .set({ total: newTotal })
        .where(eq(pedidosTable.id, pedidoId))
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
