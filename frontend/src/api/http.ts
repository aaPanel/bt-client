// 引用IPC通信库
import { ipc } from '@utils/ipcRenderer'
// 引用后端路由
import routes from '*electron.route.js'

interface AsyncProps {
	route: string
	data: any
}
class IpcCommon {
	time() {
		return Math.round(new Date().getTime() / 1000)
	}

	send(route: string, data: any, callback?: any) {
		let channel = route
		ipc.removeAllListeners(channel)
		ipc.on(channel, (event: any, result: any) => {
			// console.log(channel, result, 'ipcData')
			if (result && callback) {
				callback(result)
			}
		})
		let pdata = {
			channel: channel,
			data: toRaw(data),
		}

		ipc.send(channel, pdata)
	}

	//异步发送
	sendAsync({ route, data }: AsyncProps) {
		return new Promise((resolve, reject) => {
			let channel = route
			ipc.removeAllListeners(channel)
			ipc.on(channel, (event: any, result: any) => {
				// console.log(channel, result, 'Async')
				if (result) {
					resolve(result)
				}
			})
			let pdata = {
				channel: channel,
				data: toRaw(data),
			}
			ipc.send(channel, pdata)
		})
	}
}

const common = new IpcCommon()
export { common, routes, ipc }
