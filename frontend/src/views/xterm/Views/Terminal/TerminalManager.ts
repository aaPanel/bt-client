import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { CanvasAddon } from '@xterm/addon-canvas'
import { WebglAddon } from '@xterm/addon-webgl'
import { routes, ipc } from '@api/http'
import { TrzszFilter } from 'trzsz'
import { pub } from '@/utils/tools'
// import xtermTheme from 'xterm-theme'
type callbackParam = {
	status: string
	_allowPath?: string
}
export class TerminalManager {
	private terminal: Terminal
	private fitAddon: FitAddon
	private channel: string
	private hostInfo: object
	private trzsz: TrzszFilter
	private copy: string = ''
	private isConnected: boolean = false
	private _status: string = 'success'
	private callback: (data: callbackParam) => void
	private _last_time: number = 0
	private _allowPath: string = '' // 允许上传的路径
	private _lsat_resize_time: number = 0
	public isPwd: boolean = false
	private _copyTime: number = 0

	constructor(
		private terminalDom: HTMLElement,
		private channelRef: string,
		private data: object,
		callback: (data: callbackParam) => void
	) {
		this.callback = callback
		this.terminal = new Terminal({
			cursorBlink: true,
			fontSize: 16,
			fontFamily: 'Monaco, Menlo, Consolas, "Courier New", monospace',
			theme: {
				foreground: '#eee',
				// background: "#1c1c1c"
			},
			// theme: xtermTheme.Argonaut,
		})
		this.fitAddon = new FitAddon()

		this.channel = this.channelRef
		this.hostInfo = this.data
		this.terminal.loadAddon(this.fitAddon)
		this.terminal.loadAddon(new CanvasAddon())
		this.terminal.loadAddon(new WebglAddon())

		// 实例化trzsz
		this.trzsz = this.newTrzsz(
			(output: any) => this.writeTerminal(output),
			(input: any) => this.send_to_server(input),
			this.terminal.cols,
			false
		)
		this.openTerminal()
		this.sendData()
	}

	// 写入终端
	public writeTerminal(data: Uint8Array) {
		// // 7 为bell
		// if (data.length == 1 && data[0] == 7) {
		// 	return
		// }

		// // 94,71 ^G
		// if (data.length == 2 && data[0] == 94 && data[1] == 71) {
		// 	return
		// }

		// 检查到输出内容中包含"Inbound: CHANNEL_SUCCESS (r:0)"，则认为连接成功,清空屏幕
		// let msg = 'Inbound: CHANNEL_SUCCESS (r:0)'
		if (typeof data === 'string') {
			let str: string = data
			if (str.indexOf('CHANNEL_SUCCESS (r:0)') > -1) {
				this.terminal.clear()
				if (!this.isConnected) {
					this.isConnected = true
				}

				this.resizeTerminal(500)

				return
			}

			if (
				str.indexOf('CHANNEL_EOF') > -1 ||
				str.indexOf('CHANNEL_CLOSE') > -1 ||
				str.indexOf('Socket ') > -1 ||
				str.indexOf('exit-status') > -1 ||
				str.indexOf('CHANNEL_REQUEST') > -1 ||
				str.indexOf('Received IGNORE') > -1
			) {
				this.isConnected = false
				return
			}
		} else {
			// 使用 TextDecoder 将 Uint8Array 转换为 UTF-8 字符串
			if (this.isPwd === true) {
				const decoder = new TextDecoder('utf-8')
				const decodedString = decoder.decode(data)

				if (decodedString.indexOf('pwd') == 0 || decodedString[0] === '/') {
					if (decodedString[0] === '/') {
						this._allowPath = decodedString.trim()
						// 删除首尾空格和换行符
						this._allowPath = this._allowPath.replace(/(^\s*)|(\s*$)/g, '')

						this.isPwd = false
					} else {
						let arr = decodedString.split('\n')
						if (arr.length > 1) {
							if (arr[1][0] === '/') {
								this._allowPath = arr[1].trim()
								// 删除首尾空格和换行符
								this._allowPath = this._allowPath.replace(/(^\s*)|(\s*$)/g, '')
								this.isPwd = false
							}
						} else {
							this._allowPath = ''
						}
					}
				}
			}
		}

		// console.log(data)

		this.terminal.write(data)
	}

	// 打开终端
	public openTerminal() {
		this.terminal.open(this.terminalDom)
		this.resizeTerminal()
		ipc.on(this.channel, (event: any, arg: any) => {
			// 判断退出
			if (Object.prototype.toString.call(arg) && arg.status) {
				return
			}
			if (
				(Object.prototype.toString.call(arg) && arg.data && arg.data.hasOwnProperty('msg')) ||
				arg.indexOf('SSH连接已关闭') > -1 ||
				arg.indexOf('连接失败') > -1 ||
				arg.indexOf('Not connected') > -1 ||
				arg.indexOf('No response') > -1 ||
				arg.indexOf('连接超时') > -1 ||
				arg.indexOf('认证失败') > -1
			) {
				this._status = 'danger'
				this.isConnected = false
			} else if (arg.indexOf('正在重新连接') > -1) {
				this._status = 'warning'
			}

			// 获取最后一次的时间戳
			var _time = new Date().getTime()
			if (_time - this._last_time > 1000) {
				// 通过 this._status 控制闪烁
				this._status = 'warning'
				this._last_time = _time
				setTimeout(() => {
					if (this._status === 'warning') {
						this._status = 'success'
						this.callback &&
							this.callback({
								status: this._status,
								_allowPath: this._allowPath,
							})
					}
				}, 500)
			}

			this.trzsz.processServerOutput(arg)
			// this.terminal.write(arg)
			this.callback &&
				this.callback({
					status: this._status,
					_allowPath: this._allowPath,
				})
		})
	}

	// 定时调整终端大小
	public resize() {
		if (!this.isConnected || this._status == 'danger') return
		let nowtime = new Date().getTime()
		let timeout = 30 * 1000
		if (nowtime - this._lsat_resize_time < timeout) return
		this._lsat_resize_time = nowtime
		setTimeout(() => {
			this.resizeTerminal()
			this.resize()
		}, timeout)
	}

	// 适应终端
	public fitTerminal() {
		if (!this.fitAddon) return
		if (this.terminal) this.fitAddon.fit()
		let { cols, rows } = this.terminal
		cols = parseInt(cols.toFixed(0))
		rows = parseInt(rows.toFixed(0))
		this.terminal.resize(cols, rows)
		ipc.send(routes.term.resize.path, {
			channel: this.channel,
			data: { cols: cols, rows: rows },
		})
	}

	public send_to_server(data: any) {
		// 如果是Ctrl+C
		if (data == '\x03') {
			// console.log('Ctrl+C',new Date().getTime() - this._copyTime)
			// 如果是复制操作
			if (new Date().getTime() - this._copyTime < 2) {
				this._copyTime = 0
				return
			}
		}
		ipc.send(routes.term.write.path, {
			channel: this.channel,
			data,
		})
	}

	// 发送数据
	public sendData() {
		ipc.send(routes.term.connect.path, {
			channel: this.channel,
			data: this.hostInfo,
		})
		this.terminal.focus() // 终端获取焦点

		this.terminal.onData(data => {
			if (data == '\x03') {
				// Ctrl+C 复制到剪贴板
				if (this.copy.length > 0) {
					navigator.clipboard.writeText(this.copy)
					this.copy = ''
				}
			} else if (data == '\x16') {
				// Ctrl+V 粘贴
				navigator.clipboard.readText().then(clipText => {
					if (clipText.length > 0) {
						this.send_to_server(clipText)
					}
				})
			}

			// 转发到trzsz
			this.trzsz.processTerminalInput(data)
		})

		// 选择文本时将文本复制到剪贴板中间属性，用于Ctrl+C复制
		this.terminal.onSelectionChange(() => {
			if (this.terminal.hasSelection()) {
				this.copy = this.terminal.getSelection()
			} else {
				this._copyTime = new Date().getTime()
			}
		})

		// 二进制数据
		this.terminal.onBinary(data => {
			this.trzsz.processBinaryInput(data)
		})
	}
	/**
	 * 终端状态
	 * @returns 'success' | 'warning' | 'danger'
	 */
	get status(): string {
		return this._status
	}

	set status(value: string) {
		if (this._status !== value) {
			this._status = value
		}
	}

	public resizeTerminal(timeout = 100) {
		// console.log('resizeTerminal')
		let self = this
		setTimeout(function () {
			self.fitTerminal()
			// 写入终端的列数到trzsz
			self.trzsz.setTerminalColumns(self.terminal.cols)
		}, timeout)
	}

	public dispose() {
		this.terminal.clear()
		this.terminal.dispose()
		this.isConnected = false
	}
	public focus() {
		this.terminal.focus()
	}
	public scrollToBottom() { 
		this.terminal.scrollToBottom()
	}

	/**
	 * 实例化trzsz
	 * @param writeToTerminal 写入终端回调函数
	 * @param sendToServer  写入到服务器的回调函数
	 * @param terminalColumns  终端列数
	 * @param isWindowsShell 是否是windows shell
	 * @returns
	 */
	public newTrzsz(
		writeToTerminal: any,
		sendToServer: any,
		terminalColumns: any,
		isWindowsShell: any
	) {
		return new TrzszFilter({
			// write the server output to the terminal
			writeToTerminal: writeToTerminal,
			// send the user input to the server
			sendToServer: sendToServer,
			// choose some files to be sent to the server
			chooseSendFiles: async (directory: any) => {
				const properties = [
					'openFile',
					'multiSelections',
					'showHiddenFiles',
					'noResolveAliases',
					'treatPackageAsDirectory',
					'dontAddToRecent',
				]
				if (directory) {
					properties.push('openDirectory')
				}
				return ipc.invoke(routes.term.show_open_dialog.path, {
					title: pub.lang('请选择要发送到服务器的文件'),
					message: pub.lang('请选择要发送到服务器的文件'),
					properties: properties,
				})
			},
			// choose a directory to save the received files
			chooseSaveDirectory: async () => {
				const savePaths = await ipc.invoke(routes.term.show_open_dialog.path, {
					title: pub.lang('请选择保存目录'),
					message: pub.lang('请选择保存目录'),
					properties: [
						'openDirectory',
						'showHiddenFiles',
						'createDirectory',
						'noResolveAliases',
						'treatPackageAsDirectory',
						'dontAddToRecent',
					],
				})
				if (!savePaths || !savePaths.length) {
					return undefined
				}
				return savePaths[0]
			},
			// the terminal columns
			terminalColumns: terminalColumns,
			// there is a windows shell
			isWindowsShell: isWindowsShell,
		})
	}
}
