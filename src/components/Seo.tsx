import { useEffect } from 'react'

export const SITE_NAME = 'Roll Credits'
export const SITE_URL = 'https://roll-credits-titles.vercel.app'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

interface SeoProps {
  /** Page-specific title. Rendered as "{title} — Roll Credits" unless it already equals the site name. */
  title: string
  description: string
  /** Path starting with "/", used to build the canonical and og:url. */
  path: string
  image?: string
  /**
   * This is a client-rendered SPA: search engines that execute JavaScript (Google, Bing) will see
   * these per-page tags, but link-unfurling bots (Facebook, Twitter/X, Slack, WhatsApp) generally
   * read only the static index.html and will always show that page's default card — a real
   * limitation of a client-only app, not something this component can work around.
   */
  noindex?: boolean
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLinkTag(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/** Sets document title, meta description, canonical link, and Open Graph/Twitter tags for the current page. */
export function Seo({ title, description, path, image, noindex = false }: SeoProps) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`
    const url = `${SITE_URL}${path}`
    const imageUrl = image ?? DEFAULT_OG_IMAGE

    document.title = fullTitle
    setMetaTag('name', 'description', description)
    setLinkTag('canonical', url)
    setMetaTag('name', 'robots', noindex ? 'noindex, follow' : 'index, follow')

    setMetaTag('property', 'og:title', fullTitle)
    setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:url', url)
    setMetaTag('property', 'og:image', imageUrl)
    setMetaTag('property', 'og:type', 'website')
    setMetaTag('property', 'og:site_name', SITE_NAME)

    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', fullTitle)
    setMetaTag('name', 'twitter:description', description)
    setMetaTag('name', 'twitter:image', imageUrl)
  }, [title, description, path, image, noindex])

  return null
}
