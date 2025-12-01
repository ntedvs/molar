import { app, BrowserWindow } from "electron"

const createWindow = () => {
  const win = new BrowserWindow()
  win.loadFile("index.html")
}

app.whenReady().then(createWindow)
