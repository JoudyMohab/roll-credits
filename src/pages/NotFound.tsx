import { Link } from 'react-router-dom'
import { Seo } from '@/components/Seo'

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center">
      <Seo title="Page Not Found" description="This screen doesn't exist." path="/404" noindex />
      <p className="text-3xl">🎞️</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-ink">NOT PLAYING TONIGHT.</h1>
      <p className="mt-2 font-sans text-sm text-ink/55">This screen doesn't exist.</p>
      <Link to="/" className="mt-6 font-mono text-xs font-bold uppercase tracking-wide text-cherry">
        ← Back to the box office
      </Link>
    </section>
  )
}
