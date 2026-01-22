import type { APIRoute } from 'astro'
import { getDB } from '../../../db'
import { estilosTable } from '../../../db/schema'
import { eq } from 'drizzle-orm'

// GET all styles
export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = getDB(locals.runtime.env)
    const styles = await db.select().from(estilosTable)
    return new Response(JSON.stringify(styles), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al obtener estilos' }), {
      status: 500,
    })
  }
}

// POST new style
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as any
    const { nombre, estilo, precio, imagen } = body

    if (!nombre || !estilo || !precio) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios' }),
        { status: 400 },
      )
    }

    const db = getDB(locals.runtime.env)
    await db.insert(estilosTable).values({
      nombre,
      estilo: parseInt(estilo),
      precio: parseFloat(precio),
      imagen: imagen || '',
    })

    return new Response(JSON.stringify({ success: true }), { status: 201 })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al crear estilo' }), {
      status: 500,
    })
  }
}

// PUT (update) style
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as any
    const { id, nombre, estilo, precio, imagen } = body

    if (!id)
      return new Response(JSON.stringify({ error: 'ID requerido' }), {
        status: 400,
      })

    const db = getDB(locals.runtime.env)

    // Si viene una nueva imagen, obtener la imagen anterior y borrarla en R2
    if (typeof imagen === 'string' && imagen.length > 0) {
      const current = await db
        .select({ imagen: estilosTable.imagen })
        .from(estilosTable)
        .where(eq(estilosTable.id, id))

      if (current.length > 0) {
        const oldKey = current[0].imagen as string
        if (oldKey && oldKey !== imagen) {
          try {
            const { IMAGES } = locals.runtime.env as any
            await IMAGES.delete(oldKey)
          } catch (e) {
            console.error('Error borrando imagen antigua en R2:', e)
            // No bloqueamos la actualización si el borrado falla,
            // pero podríamos retornar 502 si quieres forzar consistencia.
          }
        }
      }
    }

    await db
      .update(estilosTable)
      .set({
        nombre,
        estilo: estilo ? parseInt(estilo) : undefined,
        precio: precio ? parseFloat(precio) : undefined,
        imagen,
      })
      .where(eq(estilosTable.id, id))

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error al actualizar estilo' }),
      { status: 500 },
    )
  }
}

// DELETE style
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const { id } = (await request.json()) as any
    if (!id)
      return new Response(JSON.stringify({ error: 'ID requerido' }), {
        status: 400,
      })

    const db = getDB(locals.runtime.env)

    // Obtener imagen asociada para borrarla de R2 primero
    const rows = await db
      .select({ imagen: estilosTable.imagen })
      .from(estilosTable)
      .where(eq(estilosTable.id, id))

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Estilo no encontrado' }), {
        status: 404,
      })
    }

    const key = rows[0].imagen as string

    // Borrar imagen en R2 si existe clave
    if (key) {
      try {
        const { IMAGES } = locals.runtime.env as any
        await IMAGES.delete(key)
      } catch (e) {
        console.error('Error al borrar imagen en R2:', e)
        return new Response(
          JSON.stringify({ error: 'No se pudo borrar la imagen asociada' }),
          { status: 502 },
        )
      }
    }

    // Borrar estilo (pedido_items se eliminan por ON DELETE CASCADE)
    await db.delete(estilosTable).where(eq(estilosTable.id, id))

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al eliminar estilo' }), {
      status: 500,
    })
  }
}
