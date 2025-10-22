import type { MetadataRoute } from 'next'

function resolveSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl && /^(http|https):\/\//i.test(envUrl)) return envUrl
  if (envUrl) return `https://${envUrl}`

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) return `https://${vercelUrl}`

  return 'http://localhost:3000'
}

export default function robots(): MetadataRoute.Robots {
  const site = resolveSiteUrl()

  return {
    rules: [
      { userAgent: '*', allow: '/' },
      // Optionnel: désindexer certaines zones techniques
      { userAgent: '*', disallow: ['/api/', '/admin/', '/studio/'] },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  }
}
