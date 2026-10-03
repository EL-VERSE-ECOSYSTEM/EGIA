import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://el-goodnews-academy.com'
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/llms.txt', '/llms-full.txt', '/og'],
      disallow: ['/dashboard/', '/api/admin/', '/api/super-admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
