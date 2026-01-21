import type { APIRoute } from 'astro'
import { getDB } from '../../db'
import { estilosTable } from '../../db/schema'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const nombre = formData.get('nombre') as string | null
    const estiloCode = formData.get('estilo') as string | null
    const precio = formData.get('precio') as string | null

    if (!file) {
      return new Response(
        JSON.stringify({
          error: 'Faltan el archivo.',
        }),
        { status: 400 },
      )
    }

    // 1. Generar nombre único para R2
    const fileExtension = file.name.split('.').pop()
    const key = `${crypto.randomUUID()}.${fileExtension}`

    // 2. Subir a R2
    const { IMAGES } = locals.runtime.env
    await IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      },
    })

    // 3. Guardar en D1 (Base de Datos) - Solo si hay metadata
    if (nombre && estiloCode && precio) {
      const db = getDB(locals.runtime.env)
      await db.insert(estilosTable).values({
        estilo: parseInt(estiloCode),
        nombre: nombre,
        imagen: key,
        precio: parseFloat(precio),
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        key,
        message: 'Imagen subida correctamente',
      }),
      { status: 201 },
    )
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido'
    return new Response(
      JSON.stringify({
        error: 'Error al subir la imagen',
        details: errorMessage,
      }),
      { status: 500 },
    )
  }
}
