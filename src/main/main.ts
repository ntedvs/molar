import { app, BrowserWindow } from "electron"
import * as path from "path"
import { setupIPCHandlers, cleanupEngine } from "./ipc/handlers"

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.loadFile("index.html")

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools()

  // Setup IPC handlers
  setupIPCHandlers(mainWindow)

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  cleanupEngine()
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
