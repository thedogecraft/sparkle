import { useState, useEffect } from 'react'
import Button from '../components/ui/button'
import Loading from '../components/Loading'
import RootDiv from '../components/RootDiv'
import Modal from '../components/ui/modal'
import { invoke } from '../lib/electron'
import { AlertTriangle } from 'lucide-react'

const Updates = () => {
  const [loading, setLoading] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [updates, setUpdates] = useState([])
  const [updateStatus, setUpdateStatus] = useState('')
  const [lastCheck, setLastCheck] = useState(null)
  const [progress, setProgress] = useState(0)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [warningUpdate, setWarningUpdate] = useState(null)

  useEffect(() => {
    loadUpdateHistory()
  }, [])

  const loadUpdateHistory = async () => {
    try {
      const history = await invoke({ channel: 'get-update-history' })
      if (history && history.lastCheck) {
        setLastCheck(new Date(history.lastCheck).toLocaleString())
      }
    } catch (error) {
      console.error('Failed to load update history:', error)
    }
  }

  // Function to check if an update might revert optimizations
  const isRiskyUpdate = (update) => {
    const riskyKeywords = [
      'windows update',
      'security baseline',
      'group policy',
      'registry',
      'defender',
      'antivirus',
      'telemetry',
      'diagnostic',
      'privacy',
      'cortana',
      'onedrive',
      'windows search',
      'indexer',
      'superfetch',
      'prefetch',
      'windows update medic',
      'update orchestrator',
      'compatibility',
      'feature update',
      'cumulative update',
      'quality update'
    ]
    
    const title = update.title?.toLowerCase() || ''
    const description = update.description?.toLowerCase() || ''
    
    return riskyKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    )
  }

  const showRiskWarning = (update, action) => {
    setWarningUpdate(update)
    setPendingAction(action)
    setShowWarningModal(true)
  }

  const proceedWithAction = async () => {
    if (pendingAction && warningUpdate) {
      await pendingAction()
    }
    setShowWarningModal(false)
    setPendingAction(null)
    setWarningUpdate(null)
  }

  const checkForUpdates = async () => {
    setCheckingUpdates(true)
    setUpdateStatus('Checking for updates...')
    setUpdates([])
    
    try {
      console.log('Invoking check-windows-updates...')
      const result = await invoke({ channel: 'check-windows-updates' })
      console.log('Update check result:', result)
      
      if (result && result.success) {
        setUpdates(result.updates || [])
        setLastCheck(new Date().toLocaleString())
        
        if (result.updates && result.updates.length > 0) {
          setUpdateStatus(`Found ${result.updates.length} update(s) available`)
        } else {
          setUpdateStatus('Your system is up to date')
        }
      } else if (result) {
        let errorMsg = result.error || 'Failed to check for updates'
        
        // Provide more helpful error messages
        if (errorMsg.includes('0x80070422')) {
          errorMsg = 'Windows Update service is disabled. Enable it from the Tweaks page first.'
        } else if (errorMsg.includes('0x80240438')) {
          errorMsg = 'Windows Update service is not available. Please restart your computer.'
        } else if (errorMsg.includes('Access is denied')) {
          errorMsg = 'Administrator privileges required. Please run Sparkle as administrator.'
        } else if (errorMsg.includes('cannot be loaded')) {
          errorMsg = 'Windows Update components not available. This might be a Windows issue.'
        }
        
        setUpdateStatus(errorMsg)
      } else {
        setUpdateStatus('No response from update service')
      }
    } catch (error) {
      console.error('Error in checkForUpdates:', error)
      // Show the actual error instead of generic message
      const errorMsg = error.message || error.toString() || 'Failed to connect to update service'
      setUpdateStatus(errorMsg)
    } finally {
      setCheckingUpdates(false)
    }
  }

  const installUpdates = async (selectedUpdates = null, skipWarning = false) => {
    const updatesToInstall = selectedUpdates || updates.map(u => u.id)
    
    // Check for risky updates
    if (!skipWarning) {
      const riskyUpdates = updates.filter(u => 
        updatesToInstall.includes(u.id) && isRiskyUpdate(u)
      )
      
      if (riskyUpdates.length > 0) {
        showRiskWarning(
          riskyUpdates[0], // Show warning for first risky update
          () => installUpdates(selectedUpdates, true)
        )
        return
      }
    }

    setInstalling(true)
    setProgress(0)
    setUpdateStatus('Preparing to install updates...')
    
    // Simulate progress during installation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 1000)
    
    try {
      const result = await invoke({ channel: 'install-windows-updates', payload: updatesToInstall })
      
      clearInterval(progressInterval)
      setProgress(100)
      
      if (result.success) {
        setUpdateStatus('Updates installed successfully. A restart may be required.')
        
        // Mark installed updates instead of clearing the list
        setUpdates(prevUpdates => 
          prevUpdates.map(update => 
            updatesToInstall.includes(update.id) 
              ? { ...update, installed: true }
              : update
          )
        )
        
        if (result.requiresRestart) {
          const restart = window.confirm('Updates installed successfully. Would you like to restart now?')
          if (restart) {
            await invoke({ channel: 'restart-windows' })
          }
        }
      } else {
        setUpdateStatus(result.error || 'Failed to install updates')
      }
    } catch (error) {
      console.error('Error installing updates:', error)
      setUpdateStatus('Failed to install updates')
      clearInterval(progressInterval)
    } finally {
      setInstalling(false)
      setTimeout(() => setProgress(0), 2000)
    }
  }

  const installSingleUpdate = async (updateId, skipWarning = false) => {
    const update = updates.find(u => u.id === updateId)
    
    if (!skipWarning && update && isRiskyUpdate(update)) {
      showRiskWarning(update, () => installSingleUpdate(updateId, true))
      return
    }

    await installUpdates([updateId], true) // Skip warning since we already checked
  }

  const downloadUpdate = async (updateId, skipWarning = false) => {
    const update = updates.find(u => u.id === updateId)
    
    if (!skipWarning && update && isRiskyUpdate(update)) {
      showRiskWarning(update, () => downloadUpdate(updateId, true))
      return
    }

    setUpdateStatus('Downloading update...')
    try {
      const result = await invoke({ channel: 'download-update', payload: updateId })
      if (result.success) {
        setUpdateStatus('Update downloaded successfully')
        // Update only the specific update to mark it as downloaded
        setUpdates(prevUpdates => 
          prevUpdates.map(u => 
            u.id === updateId ? { ...u, downloaded: true } : u
          )
        )
      } else {
        setUpdateStatus(result.error || 'Failed to download update')
      }
    } catch (error) {
      console.error('Error downloading update:', error)
      setUpdateStatus('Failed to download update')
    }
  }

  if (loading) {
    return (
      <RootDiv>
        <Loading />
      </RootDiv>
    )
  }

  return (
    <RootDiv>
      <div className="w-full h-full flex flex-col p-8 gap-6 fade-in">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white">Windows Updates</h1>
          <p className="text-gray-400">
            Manually manage Windows updates to control when your system is updated
          </p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Update Status</h2>
              {lastCheck && (
                <p className="text-sm text-gray-400">Last checked: {lastCheck}</p>
              )}
            </div>
            <Button
              onClick={checkForUpdates}
              disabled={checkingUpdates || installing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {checkingUpdates ? 'Checking...' : 'Check for Updates'}
            </Button>
          </div>
          
          <div className="bg-yellow-900/20 text-yellow-400 p-3 rounded-lg mb-4 text-sm">
            <p className="font-semibold mb-1">Note:</p>
            <p>If you've disabled Windows Updates via Tweaks, the update service will be temporarily enabled during the check, then disabled again automatically.</p>
          </div>

          {updateStatus && (
            <div className={`p-3 rounded-lg mb-4 ${
              updateStatus.includes('Failed') ? 'bg-red-900/20 text-red-400' :
              updateStatus.includes('up to date') ? 'bg-green-900/20 text-green-400' :
              'bg-blue-900/20 text-blue-400'
            }`}>
              {updateStatus}
            </div>
          )}

          {installing && (
            <div className="mb-4">
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 text-center">{progress}% Complete</p>
            </div>
          )}
        </div>

        {updates.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Available Updates</h2>
            </div>

            <div className="space-y-3">
              {updates.map((update, index) => {
                const isRisky = isRiskyUpdate(update)
                const isInstalled = update.installed
                
                return (
                  <div key={index} className={`bg-[#242424] rounded-lg p-4 border ${
                    isInstalled ? 'border-green-500/50 bg-green-900/5' :
                    isRisky ? 'border-red-500/50 bg-red-900/5' : 'border-gray-700'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium">{update.title}</h3>
                          {isInstalled && (
                            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded font-medium">
                              Installed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{update.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          {update.size && <span>Size: {formatBytes(update.size)}</span>}
                          {update.type && <span>Type: {update.type}</span>}
                          {update.severity && (
                            <span className={`px-2 py-1 rounded ${
                              update.severity === 'Critical' ? 'bg-red-900/30 text-red-400' :
                              update.severity === 'Important' ? 'bg-orange-900/30 text-orange-400' :
                              'bg-gray-700 text-gray-400'
                            }`}>
                              {update.severity}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {!isInstalled && (
                          <div className="flex gap-2">
                            {!update.downloaded && (
                              <Button
                                onClick={() => downloadUpdate(update.id)}
                                disabled={installing}
                                size="sm"
                                className={isRisky 
                                  ? "bg-orange-600 hover:bg-orange-700 border border-orange-500/50" 
                                  : "bg-blue-600 hover:bg-blue-700"
                                }
                              >
                                Download {isRisky && <AlertTriangle size={12} className="ml-1" />}
                              </Button>
                            )}
                            <Button
                              onClick={() => installSingleUpdate(update.id)}
                              disabled={installing || !update.downloaded}
                              size="sm"
                              className={isRisky 
                                ? "bg-red-600 hover:bg-red-700 border border-red-500/50" 
                                : "bg-green-600 hover:bg-green-700"
                              }
                            >
                              Install {isRisky && <AlertTriangle size={12} className="ml-1" />}
                            </Button>
                          </div>
                        )}
                        {isRisky && !isInstalled && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-900/30 rounded text-xs text-red-400">
                            <AlertTriangle size={12} />
                            <span>May Revert Tweaks</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Warning Modal */}
        <Modal open={showWarningModal} onOpenChange={setShowWarningModal}>
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-red-500/50 text-white w-[90vw] max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-500" size={24} />
              <h2 className="text-lg font-semibold text-red-400">Warning: Risky Update</h2>
            </div>
            
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">{warningUpdate?.title}</p>
              <p className="text-sm text-gray-400 mb-4">
                This update might revert some optimizations made by Sparkle. 
                It could re-enable disabled services, restore registry settings, 
                or modify system configurations that were changed by tweaks.
              </p>
              <div className="bg-red-900/20 p-3 rounded-lg">
                <p className="text-sm text-red-300">
                  <strong>Recommendation:</strong> Only install if you need this specific security update. 
                  You may need to re-apply some tweaks after installation.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={() => setShowWarningModal(false)} 
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={proceedWithAction}
                className="bg-red-600 hover:bg-red-700"
              >
                Proceed Anyway
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </RootDiv>
  )
}

const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default Updates