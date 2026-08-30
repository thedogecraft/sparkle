import { useEffect, useState, type ComponentProps } from "react"
import Modal from "@/components/ui/modal"
import Button from "./ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

const GITHUB_REPO = "Parcoil/Sparkle"

interface Release {
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
}

type CodeProps = ComponentProps<"code"> & { inline?: boolean }

function ChangelogContent({ body }: { body: string }) {
  return (
    <div className="prose prose-sm prose-green marker:text-sparkle-secondary max-w-none text-sparkle-text prose-headings:text-sparkle-text prose-a:text-blue-400 prose-code:bg-sparkle-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-normal prose-pre:bg-sparkle-card prose-pre:border prose-pre:border-sparkle-border prose-img:rounded-lg prose-img:border prose-img:border-sparkle-border">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ href, children, ...props }) => (
            <a
              {...props}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault()
                window.open(href, "_blank")
              }}
            >
              {children}
            </a>
          ),
          img: ({ ...props }) => (
            <img
              {...props}
              className="max-w-full h-auto rounded-lg border border-sparkle-border"
              loading="lazy"
            />
          ),
          code: ({ inline, className, children, ...props }: CodeProps) => {
            if (inline) {
              return (
                <code
                  className="bg-sparkle-primary px-1.5 py-0.5 rounded-md text-sm font-normal"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}

export default function ChangelogModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (releases.length > 0) return

    setLoading(true)
    setError(null)

    fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=10`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch releases (${res.status})`)
        return res.json()
      })
      .then((data: Release[]) => {
        setReleases(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load changelog")
        setLoading(false)
      })
  }, [open, releases.length])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-sparkle-card border border-sparkle-border rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-sparkle-border shrink-0">
          <h2 className="text-xl font-semibold text-sparkle-text">What's New</h2>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && <p className="text-sparkle-text-secondary">Loading changelog...</p>}
          {error && (
            <p className="text-red-500">
              Failed to load changelog. Please check your internet connection.
            </p>
          )}
          {!loading &&
            !error &&
            releases.map((release) => (
              <div
                key={release.tag_name}
                className="border-b border-sparkle-border pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-sparkle-text">
                    {release.name || release.tag_name}
                  </h3>
                  <span className="text-sm text-sparkle-text-secondary">
                    {new Date(release.published_at).toLocaleDateString()}
                  </span>
                </div>
                <ChangelogContent body={release.body} />
              </div>
            ))}
        </div>
      </div>
    </Modal>
  )
}
