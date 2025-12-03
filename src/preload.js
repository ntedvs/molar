"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const types_1 = require("./shared/types");
// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Engine selection
    selectEngine: () => electron_1.ipcRenderer.invoke(types_1.IPCChannel.ENGINE_SELECT),
    // Request engine move
    requestEngineMove: (request) => electron_1.ipcRenderer.invoke(types_1.IPCChannel.ENGINE_MOVE, request),
    // Start new game
    startNewGame: (config) => electron_1.ipcRenderer.send(types_1.IPCChannel.GAME_NEW, config),
    // Listen for engine errors
    onEngineError: (callback) => {
        const subscription = (_event, error) => callback(error);
        electron_1.ipcRenderer.on(types_1.IPCChannel.ENGINE_ERROR, subscription);
        // Return unsubscribe function
        return () => {
            electron_1.ipcRenderer.removeListener(types_1.IPCChannel.ENGINE_ERROR, subscription);
        };
    },
});
//# sourceMappingURL=preload.js.map