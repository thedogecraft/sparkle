import { Badge } from "@/components/ui/badge";

async function getReleases() {
  try {
    const res = await fetch(
      "https://api.github.com/repos/Parcoil/Sparkle/releases?per_page=20",
      { redirect: "follow", next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const releases = await res.json();
    return releases.map((release: any) => ({
      version: release.tag_name ? release.tag_name.replace("v", "") : "Unknown",
      date: release.published_at
        ? new Date(release.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Unknown",
      body: release.body || "",
    }));
  } catch {
    return null;
  }
}

function parseMarkdown(text: string): string {
  if (!text) return "";

  let html = text
    .replace(
      /^### (.*$)/gm,
      '<h4 class="text-base font-semibold mt-4 mb-2">$1</h4>'
    )
    .replace(
      /^## (.*$)/gm,
      '<h3 class="text-lg font-semibold mt-5 mb-2">$1</h3>'
    )
    .replace(/^# (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>'
    )
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\n(?=<li)/g, "\n");

  html = '<p class="mb-3">' + html + "</p>";

  html = html.replace(
    /<li class="ml-4 list-disc">/g,
    '<ul class="my-2 ml-4 list-disc space-y-1"><li>'
  );
  html = html.replace(/<\/li>\n<li class="ml-4 list-disc">/g, "</li><li>");
  html = html.replace(/<\/li>(?=[^<])/g, "</li></ul>");

  return html;
}

export const metadata = {
  title: "Patch Notes - Sparkle",
  description:
    "View the latest updates, new features, and bug fixes for Sparkle.",
};

export default async function PatchNotesPage() {
  const releases = await getReleases();

  return (
    <div className="container mx-auto mt-5 min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="animate-gradient mb-4 bg-gradient-to-r from-[#0096ff] to-[#0042ff] bg-clip-text pb-2 text-4xl font-bold text-transparent sm:text-5xl">
            Patch Notes
          </h1>
          <p className="text-lg text-muted-foreground">
            Stay up to date with the latest features, bug fixes, and
            improvements.
          </p>
        </div>

        {!releases ? (
          <div className="text-center text-muted-foreground">
            <p>Failed to load patch notes. Please try again later.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {releases.map((patch: any) => (
              <div key={patch.version} className="overflow-hidden rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="text-sm">
                      v{patch.version}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {patch.date}
                    </span>
                  </div>
                </div>
                <div>
                  {patch.body ? (
                    <div
                      className="text-foreground/90"
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(patch.body),
                      }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No release notes available.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
