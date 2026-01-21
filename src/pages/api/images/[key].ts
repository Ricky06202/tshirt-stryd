import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { key } = params

    if (!key) {
      return new Response('Image key is required', { status: 400 })
    }

    const { IMAGES } = locals.runtime.env
    const object = await IMAGES.get(key)

    if (!object) {
      return new Response('Image not found', { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/png')
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new Response(object.body, { headers })
  } catch (error) {
    console.error('Error serving image:', error)
    return new Response('Error loading image', { status: 500 })
  }
}
