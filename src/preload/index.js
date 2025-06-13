import { contextBridge,ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'


// Custom APIs for renderer
const api = {
  getSubfolders: (dirPath) => ipcRenderer.invoke('list-subfolders', dirPath),
  getPhpInfo: (phpPath) => ipcRenderer.invoke('getPhpInfo', phpPath),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronStorage', {
      get: (key) => localStorage.getItem(key),
      set: (key, value) => localStorage.setItem(key, value),
      remove: (key) => localStorage.removeItem(key),
      clear: () => localStorage.clear()
    });


    contextBridge.exposeInMainWorld('electronAPI', {
      minimize: () => ipcRenderer.send('window:minimize'),
      minihide: () => ipcRenderer.send('window:hide'),
      maximize: () => ipcRenderer.send('window:maximize'),
      close: () => ipcRenderer.send('window:close'),
      getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    });

    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('devkitAPI', {
      addHost: (domain) => ipcRenderer.invoke('hosts:add', domain)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
