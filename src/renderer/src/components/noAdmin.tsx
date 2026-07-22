import Modal from "./ui/modal"
import Button from "./ui/button"

function NoAdmin({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-sparkle-card p-4 rounded-2xl border border-sparkle-border text-sparkle-text w-[90vw] max-w-md">
        <h1 className="text-lg font-semibold mb-2">Sparkle Not Running as Admin</h1>
        <p className="text-sm mb-4">
          Sparkle is not running with administrator privileges. Some features may not work
          correctly.
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}

export default NoAdmin
