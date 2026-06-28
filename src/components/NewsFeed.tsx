"use client"

import { useState, useEffect } from "react"
import { ExternalLink } from "lucide-react"

interface Article {
  title: string
  description: string
  pubDate: string
  link: string
  source: string
}

const TOPICS = [
  { key: "tech", label: "Tech & AI" },
  { key: "value", label: "Value Investing" },
  { key: "markets", label: "Global Markets" },
  { key: "regional", label: "Regional Business" },
] as const

const FEED_URLS: Record<string, string> = {
  tech: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
  value: "https://feeds.content.dowjones.io/public/rss/mw_top_stories",
  markets: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
  regional: "https://www.arabianbusiness.com/rss/news",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "")
}

export default function NewsFeed() {
  const [topic, setTopic] = useState("tech")
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeed(topic)
  }, [topic])

  async function fetchFeed(topicKey: string) {
    setLoading(true)
    setArticles([])

    const url = FEED_URLS[topicKey]
    if (!url) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
      )
      const json = await res.json()

      if (json.status === "ok" && Array.isArray(json.items)) {
        setArticles(
          json.items.slice(0, 8).map((item: any) => ({
            title: item.title,
            description: stripHtml(item.description || ""),
            pubDate: item.pubDate,
            link: item.link,
            source: item.author || new URL(item.link).hostname.replace("www.", ""),
          })),
        )
      }
    } catch {
      // feed failed — show empty
    }

    setLoading(false)
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h2 className="mb-3 text-lg font-semibold text-text-secondary">News & Articles</h2>

      <div className="mb-3 flex gap-1 rounded-lg bg-bg-card-hover p-1">
        {TOPICS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTopic(t.key)}
            className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${
              topic === t.key
                ? "bg-accent/20 text-accent"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-1.5 rounded-lg bg-bg-card-hover p-3">
              <div className="h-2.5 w-16 rounded bg-border" />
              <div className="h-3.5 w-full rounded bg-border" />
              <div className="h-3 w-3/4 rounded bg-border" />
            </div>
          ))}
        </div>
      )}

      {!loading && articles.length === 0 && (
        <p className="py-6 text-center text-xs text-text-secondary">No articles available for this topic.</p>
      )}

      {!loading && articles.length > 0 && (
        <div className="space-y-1">
          {articles.map((a, i) => (
            <a
              key={i}
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-bg-card-hover"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                  <span className="font-medium text-accent">{a.source}</span>
                  <span>·</span>
                  <span>{timeAgo(a.pubDate)}</span>
                </div>
                <p className="mt-0.5 text-sm font-medium leading-snug tracking-tight text-text-primary line-clamp-2">
                  {a.title}
                </p>
                {a.description && (
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-text-secondary">
                    {a.description}
                  </p>
                )}
              </div>
              <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
