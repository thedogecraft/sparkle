import { Wrench, Home, Folder, LayoutGrid, Icon, Globe } from 'lucide-react'
import { broom } from '@lucide/lab'
import { useLocation, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import useRestartStore from '../store/restartState'
import info from '../../../../package.json'
import Button from './ui/button'
import Modal from './ui/modal'
import { invoke } from '@/lib/electron'
import GithubIcon from './GithubIcon'
import DiscordIcon from './Discordicon'
import { Box } from 'lucide-react'
import { Settings } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { Download } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

const tabIcons = {
  home: <Home size={20} />,
  tweaks: <Wrench size={20} />,
  clean: <Icon iconNode={broom} size={20} />,
  backup: <Folder size={20} />,
  utilities: <Box size={20} />,
  dns: <Globe size={20} />,
  apps: <LayoutGrid size={20} />,
  updates: <Download size={20} />,
  settings: <Settings size={20} />
}

const tabs = {
  home: { label: 'Dashboard', path: '/' },
  tweaks: { label: 'Tweaks', path: '/tweaks' },
  clean: { label: 'Cleaner', path: '/clean' },
  backup: { label: 'Restore Points', path: '/backup' },
  utilities: { label: 'Utilities', path: '/utilities' },
  dns: { label: 'DNS Manager', path: '/dns' },
  apps: { label: 'Apps', path: '/apps' },
  updates: { label: 'Updates', path: '/updates' },
  settings: { label: 'Settings', path: '/settings' }
}

function Nav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { needsRestart } = useRestartStore()

  const tabRefs = useRef({})
  const containerRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 })
  const [showRestartModal, setShowRestartModal] = useState(false)

  const getActiveTab = () => {
    const path = location.pathname
    if (path === '/') return 'home'
    const match = Object.entries(tabs).find(([, { path: p }]) => p === path)
    return match ? match[0] : ''
  }

  const activeTab = getActiveTab()

  useEffect(() => {
    const updateIndicator = () => {
      const ref = tabRefs.current[activeTab]
      const container = containerRef.current
      if (ref && ref instanceof HTMLElement && container) {
        const tabRect = ref.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        setIndicatorStyle({
          top: tabRect.top - containerRect.top,
          height: tabRect.height
        })
      }
    }
    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeTab])

  return (
    <nav className="h-screen w-52 text-sparkle-text fixed left-0 top-0 flex flex-col py-6 border-r border-sparkle-border-secondary z-40">
      <div className="flex-1 flex flex-col gap-2 px-3 mt-10 relative" ref={containerRef}>
        <div
          className="absolute left-0 w-1 bg-sparkle-primary rounded transition-all duration-300"
          style={{
            top: indicatorStyle.top,
            height: indicatorStyle.height,
            transition: 'top 0.2s ease, height 0.2s ease'
          }}
        />
        {Object.entries(tabs).map(([id, { label, path }]) => (
          <Button
            variant=""
            key={id}
            ref={(el) => (tabRefs.current[id] = el)}
            onClick={() => navigate(path)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 border relative',
              activeTab === id
                ? 'border-transparent text-sparkle-primary'
                : 'text-sparkle-text-secondary hover:bg-sparkle-border-secondary hover:text-sparkle-text border-transparent'
            )}
          >
            <div>{tabIcons[id]}</div>
            <span className="text-sm">{label}</span>
          </Button>
        ))}
      </div>
      {needsRestart && (
        <button
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 border m-3',
            'bg-sparkle-card text-sparkle-text border-sparkle-border-secondary hover:bg-sparkle-border-secondary hover:text-sparkle-text'
          )}
          onClick={() => setShowRestartModal(true)}
        >
          <span
            className="text-sm flex text-center items-center gap-2 text-red-500"
            title="Restart Windows"
          >
            <RefreshCw size={16} /> Restart Now
          </span>
        </button>
      )}
      <Modal open={showRestartModal} onOpenChange={setShowRestartModal}>
        <div className="bg-sparkle-card p-6 rounded-2xl border border-sparkle-border text-sparkle-text w-[90vw] max-w-md">
          <h2 className="text-lg font-semibold">Confirm Restart</h2>
          <p>Are you sure you want to restart your computer now?</p>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setShowRestartModal(false)} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowRestartModal(false)
                invoke({ channel: 'restart' })
              }}
              variant="danger"
            >
              Restart
            </Button>
          </div>
        </div>
      </Modal>
      <div className="flex items-center justify-center gap-2 mt-4 mb-2">
        <a href="https://github.com/parcoil/sparkle" target="_blank">
          <GithubIcon className="w-5 fill-sparkle-text-secondary" />
        </a>
        <a href="https://discord.com/invite/En5YJYWj3Z" target="_blank">
          <DiscordIcon className="w-5 fill-sparkle-text-secondary" />
        </a>
      </div>
      <p className="text-sparkle-text-secondary text-center">v{info.version}</p>
    </nav>
  )
}

export default Nav
