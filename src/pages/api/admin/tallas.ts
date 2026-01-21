import type { APIRoute } from 'astro'
import { getDB } from '../../../db'
import { tallasTable } from '../../../db/schema'
import { eq } from 'drizzle-orm'

// GET all sizes
export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = getDB(locals.runtime.env)
    const sizes = await db.select().from(tallasTable)
    return new Response(JSON.stringify(sizes), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al obtener tallas' }), {
      status: 500,
    })
  }
}

// POST new size
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as any
    const { talla, nombre } = body

    if (!talla || !nombre) {
      return new Response(JSON.stringify({ error: 'Faltan campos' }), {
        status: 400,
      })
    }

    const db = getDB(locals.runtime.env)
    await db.insert(tallasTable).values({ talla, nombre })

    return new Response(JSON.stringify({ success: true }), { status: 201 })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al crear talla' }), {
      status: 500,
    })
  }
}

// PUT (update) size
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as any
    const { id, talla, nombre } = body

    if (!id)
      return new Response(JSON.stringify({ error: 'ID requerido' }), {
        status: 400,
      })

    const db = getDB(locals.runtime.env)
    await db
      .update(tallasTable)
      .set({ talla, nombre })
      .where(eq(tallasTable.id, id))

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error al actualizar talla' }),
      { status: 500 },
    )
  }
}

// DELETE size
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const { id } = (await request.json()) as any
    if (!id)
      return new Response(JSON.stringify({ error: 'ID requerido' }), {
        status: 400,
      })

    const db = getDB(locals.runtime.env)
    await db.delete(tallasTable).where(eq(tallasTable.id, id))

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error al eliminar talla' }), {
      status: 500,
    })
  }
}
