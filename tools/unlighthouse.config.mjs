import { defineUnlighthouseConfig } from 'unlighthouse/config'

export default defineUnlighthouseConfig({
  site: 'https://wecocompany.com',
  scanner: {
    device: 'mobile',
    exclude: ['/admin/*', '/brand-discovery/admin*']
  },
  lighthouseOptions: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
  },
  ci: {
    budget: {
      performance: 65,
      accessibility: 85,
      'best-practices': 85,
      seo: 90
    }
  }
})
