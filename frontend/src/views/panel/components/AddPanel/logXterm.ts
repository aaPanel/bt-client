import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { CanvasAddon } from '@xterm/addon-canvas'
import { routes, ipc } from '@api/http'
type callbackParam = {
	status: string
	isConnected?: boolean // 是否连接成功
}
export class logXterm {
	private terminal: Terminal
	private fitAddon: FitAddon
	private channel: string
	private hostInfo: object
	private copy: string = ''
	private isConnected: boolean = false
	private _status: string = 'success'
	private callback: (data: callbackParam) => void
	private _last_time: number = 0
	public examineAttr: {
		isPanelExists: boolean // 是否存在面板
		examineStatus: boolean // 检查状态
		loginInfo: Record<string, any> // 登录状态
		firstXterm: Record<string, any> // 第一个终端
		logInfo: string // 日志信息
	} = {
		examineStatus: false,
		isPanelExists: false,
		loginInfo: {
			isRead: false,
			text: '',
		},
		firstXterm: {
			status: false,
			isSuccess: 0, // 1:成功 -1:失败
		},
		logInfo: '',
	}

	constructor(
		private terminalDom: HTMLElement,
		private channelRef: string,
		private data: object,
		callback: (data: callbackParam) => void
	) {
		this.callback = callback
		this.terminal = new Terminal({
			cursorBlink: true,
			fontSize: 14,
			fontFamily: 'Monaco, Menlo, Consolas, "Courier New", monospace',
			theme: {
				foreground: '#eee',
			},
		})
		this.fitAddon = new FitAddon()

		this.channel = this.channelRef
		this.hostInfo = this.data
		this.terminal.loadAddon(this.fitAddon)
		this.terminal.loadAddon(new CanvasAddon())

		this.openTerminal()
		this.sendData()
	}

	// 写入终端
	public writeTerminal(data: Uint8Array) {
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
			const decoder = new TextDecoder('utf-8')
			const decodedString = decoder.decode(data)
			// 检测已存在面板|检查安装状态
			if (this.examineAttr.examineStatus) {
				// 检测到存在宝塔面板
				const isStart = decodedString.indexOf('already running') > -1

				if (isStart) {
					this.examineAttr.isPanelExists = true
				}
				this.examineAttr.examineStatus = false
			}

			// 检测第一个终端成功输出安装时间\输出面板信息
			if (this.examineAttr.firstXterm.status) {
				const isStart = decodedString.indexOf('外网') > -1
				const isEnd = decodedString.indexOf('Time consumed') > -1
				const isError = decodedString.indexOf('截图以上报错') > -1
				if (isStart || isEnd || this.examineAttr.loginInfo.isRead) {
					// 开始截取内容
					if (isStart) {
						this.examineAttr.loginInfo.isRead = true
					}
					// 结束截取内容
					if (isEnd) {
						this.examineAttr.loginInfo.isRead = false
						this.examineAttr.firstXterm.status = false
						this.examineAttr.firstXterm.isSuccess = 1
					}
					this.examineAttr.loginInfo.text += decodedString
				}
				// 记录当前执行日志
				this.examineAttr.logInfo += decodedString
				// 仅保留最新5000字符信息
				if (this.examineAttr.logInfo.length > 5000) {
					this.examineAttr.logInfo = this.examineAttr.logInfo.slice(-5000)
				}
				// 错误信息
				if (isError) {
					this.examineAttr.firstXterm.status = false
					this.examineAttr.firstXterm.isSuccess = -1
				}
			}
		}

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
								isConnected: this.isConnected,
							})
					}
				}, 500)
			}
			this.writeTerminal(arg)
			this.callback &&
				this.callback({
					status: this._status,
					isConnected: this.isConnected,
				})
		})
	}

	// 定时调整终端大小
	public resize() {
		if (!this.isConnected || this._status == 'danger') return
		let timeout = 30 * 1000
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
			this.send_to_server(data)
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
}
