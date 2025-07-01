import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Vue3 Routable",
  description: "Clean, decorator-based MVC routing for Vue 3 applications",
  base: '/vue3-routable/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide' },
      { text: 'API Reference', link: '/api/globals' }
    ],
    logo: 'images/logo.svg',
    
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/guide' },
          { text: 'Installation', link: '/guide#installation' },
          { text: 'Quick Start', link: '/guide#quick-start' }
        ]
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Route Matching', link: '/guide#route-matching' },
          { text: 'Lifecycle Methods', link: '/guide#lifecycle-methods' },
          { text: 'Parameter Injection', link: '/guide#parameter-injection' },
          { text: 'Route Guards', link: '/guide#route-guards' },
        ]
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Custom Matching', link: '/guide#custom-route-matching' },
          { text: 'Lazy Loading', link: '/guide#lazy-loading' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Documentation', link: '/api/globals' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cleverplatypus/vue3-routable' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2024 CleverPlatypus'
    },

    editLink: {
      pattern: 'https://github.com/cleverplatypus/vue3-routable/edit/main/docs/:path'
    },

    search: {
      provider: 'local'
    }
  }
})
