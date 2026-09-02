import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SITE_URL } from './Seo'

export interface Crumb {
  label: string
  /** Path starting with "/". Omitted for the current page (rendered as plain text, not a link). */
  path?: string
}

/** Visible breadcrumb trail plus a matching BreadcrumbList structured-data script for search engines. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const key = JSON.stringify(items)

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.label,
        ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
      })),
    })
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden="true">/</span>}
          {item.path ? (
            <Link to={item.path} className="transition-colors hover:text-cherry">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-ink/60">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
