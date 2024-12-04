import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Vue Routable",
  description: "Low Code Annotated MVC Vue Routing",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],
    logo: 'images/logo.svg',
    
    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' },
          { text: 'API Docs', link: '/api/globals' },

        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cleverplatypus/vue3-routable' }
    ]
  }
})
