import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://el-goodnews-academy.com'
  const currentDate = new Date()

  const routes: Array<{
    url: string
    lastModified: Date
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority: number
  }> = [
    // Main Public Marketing Pages
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/admissions`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/school-registration`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // Auth & Onboarding Routes
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/setup-role`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },

    // Dashboards & Portals
    {
      url: `${baseUrl}/dashboard-redirect`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard/student`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard/parent`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard/teacher`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard/admin`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard/super-admin`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },

    // Feature Modules & Workspaces
    {
      url: `${baseUrl}/student`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/parent`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/parent/children`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/teacher`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/admin/super-admin`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/todos`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  return routes
}
