import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <img
            src="/sparklelogo.png"
            alt="Sparkle"
            className="h-6 w-auto"
          />
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-lg font-bold text-transparent">
            {appName}
          </span>
        </div>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
