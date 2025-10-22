import type { MetadataRoute } from 'next'

function resolveSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl && /^(http|https):\/\//i.test(envUrl)) return envUrl
  if (envUrl) return `https://${envUrl}`

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) return `https://${vercelUrl}`

  return 'http://localhost:3000'
}

export default function sitemap(): MetadataRoute.Sitemap {
  const site = resolveSiteUrl()
  const now = new Date()

  return [
    {
      url: `${site}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${site}/dashboard/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.4,
    },
  ]
}
