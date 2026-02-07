import { Tray, Menu, app, BrowserWindow } from "electron"
import path from "path"

export function createTray(mainWindow: BrowserWindow): Tray {
  const tray = new Tray(path.join(__dirname, "../../resources/sparkle2.ico"))

  const contextMenu = Menu.buildFromTemplate([
    { label: "Open Window", click: (): void => mainWindow.show() },
    { label: "Quit", click: (): void => app.quit() },
  ])

  tray.setToolTip("Sparkle Optimizer")
  tray.setTitle("Sparkle Optimizer")
  tray.setContextMenu(contextMenu)
  tray.on("click", (): void => ToggleWindowState(mainWindow))

  return tray
}

function ToggleWindowState(mainWindow: BrowserWindow): void {
  mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
}
