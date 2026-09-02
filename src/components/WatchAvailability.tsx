import type { WatchProvider } from '@/api/tmdb'
import { watchProviderLogoUrl } from '@/api/tmdb'
import type { MediaType } from '@/types/media'
import { useWatchAvailability } from '@/lib/watchAvailabilityStore'

function dedupeProviders(...lists: WatchProvider[][]): WatchProvider[] {
  const map = new Map<number, WatchProvider>()
  for (const list of lists) for (const p of list) map.set(p.id, p)
  return [...map.values()]
}

function ProviderList({ providers }: { providers: WatchProvider[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {providers.map((p) => (
        <span key={p.id} className="flex items-center gap-1.5">
          {watchProviderLogoUrl(p.logoPath) ? (
            <img
              src={watchProviderLogoUrl(p.logoPath)!}
              alt={`${p.name} logo`}
              className="h-5 w-5 rounded-sm border border-ink/10 object-cover"
            />
          ) : null}
          <span className="font-sans text-[13px] text-ink/80">{p.name}</span>
        </span>
      ))}
    </div>
  )
}

export function WatchAvailability({ mediaType, id }: { mediaType: MediaType; id: number }) {
  const { data, loading, error } = useWatchAvailability(mediaType, id)
  const rentBuy = data ? dedupeProviders(data.rent, data.buy) : []
  const isEmpty = data && data.flatrate.length === 0 && rentBuy.length === 0

  return (
    <div>
      <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">Where To Watch In Egypt</p>

      <div className="mt-2">
        {loading && <p className="font-sans text-sm text-ink/45">Checking availability…</p>}

        {!loading && error && (
          <p className="font-sans text-sm text-ink/50">Availability couldn't be checked right now.</p>
        )}

        {!loading && !error && (data === null || isEmpty) && (
          <p className="font-sans text-sm text-ink/50">No streaming availability found in Egypt right now.</p>
        )}

        {!loading && !error && data && !isEmpty && (
          <div className="flex flex-col gap-3">
            {data.flatrate.length > 0 && (
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-wide text-cherry/70">Streaming</p>
                <div className="mt-1.5">
                  <ProviderList providers={data.flatrate} />
                </div>
              </div>
            )}
            {rentBuy.length > 0 && (
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-wide text-cherry/70">Rent / Buy</p>
                <div className="mt-1.5">
                  <ProviderList providers={rentBuy} />
                </div>
              </div>
            )}
            {data.link && (
              <a
                href={data.link}
                target="_blank"
                rel="noreferrer"
                className="w-fit font-mono text-[10px] font-bold uppercase tracking-wide text-cherry hover:underline"
              >
                View options →
              </a>
            )}
            <p className="font-mono text-[9px] text-ink/25">Streaming data via JustWatch</p>
          </div>
        )}
      </div>
    </div>
  )
}
