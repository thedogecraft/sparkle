import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import { appName, gitConfig } from "./shared"

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: (
        <>
          <img
            src="https://raw.githubusercontent.com/parcoil/logos/refs/heads/main/logos/sparklelogo.png"
            className="w-8 h-8"
          ></img>
          <h1 className="text-xl">Sparkle</h1>
        </>
      ),
    },
    links: [],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  }
}
