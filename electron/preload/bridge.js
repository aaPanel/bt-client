/* 
 * 如果启用了上下文隔离，渲染进程无法使用electron的api，
 * 可通过contextBridge 导出api给渲染进程使用
 */

// const { contextBridge, ipcRenderer } = require('electron')
const { pub } = require('../class/public.js')


// contextBridge.exposeInMainWorld('electron', {
//   ipcRenderer: ipcRenderer,
//   languageObject: pub.get_client_language()
// })

window.languageObject = pub.get_client_language()
window.languageList = pub.get_languages()