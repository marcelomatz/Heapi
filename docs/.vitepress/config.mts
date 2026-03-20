import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "API-Go Documentation",
  description: "Advanced API Client & Terminal Documentation",
  base: '/docs/',
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Architecture', link: '/architecture_overview' },
      { text: 'API', link: '/api_reference' }
    ],
    sidebar: [
      {
        text: '🚀 Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Developer Guide', link: '/DEVELOPER_GUIDE' },
          { text: 'Architecture Overview', link: '/architecture_overview' },
        ]
      },
      {
        text: '📐 Design System',
        items: [
          { text: 'Data Models', link: '/data_models' },
          { text: 'Examples', link: '/examples' },
        ]
      },
      {
        text: '📡 API Reference',
        items: [
          { text: 'Endpoints', link: '/api_reference' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/matz/apiGo' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Marcelo'
    }
  }
})
