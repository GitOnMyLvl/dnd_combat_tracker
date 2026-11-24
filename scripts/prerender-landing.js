import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Build-time only: renders the landing page into index.html so search engines
// and link previews see real content without running JavaScript, and adds
// FAQPage structured data from the same FAQ list. React replaces the markup
// when it mounts (createRoot), so there is no hydration contract to keep.
export function prerenderLanding() {
  return {
    name: 'prerender-landing',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      async handler(html) {
        const server = await createServer({
          configFile: false,
          appType: 'custom',
          logLevel: 'error',
          server: { middlewareMode: true, hmr: false, ws: false },
          plugins: [react()],
        })
        try {
          const { default: LandingPage } = await server.ssrLoadModule('/src/components/landing/LandingPage.jsx')
          const { FAQ } = await server.ssrLoadModule('/src/components/landing/faq.js')

          const faqJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map(({ q, a }) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          }
          return html
            .replace('<!--landing-html-->', renderToStaticMarkup(createElement(LandingPage)))
            .replace(
              '<!--faq-jsonld-->',
              `<script type="application/ld+json">${JSON.stringify(faqJsonLd).replace(/</g, '\\u003c')}</script>`,
            )
        } finally {
          await server.close()
        }
      },
    },
  }
}
