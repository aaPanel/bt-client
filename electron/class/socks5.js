
/* From https://github.com/brozeph/simple-socks */

const RFC_1928_ATYP = {
	DOMAINNAME: 0x03,
	IPV4: 0x01,
	IPV6: 0x04
};

const RFC_1928_COMMANDS = {
	BIND: 0x02,
	CONNECT: 0x01,
	UDP_ASSOCIATE: 0x03
};

const RFC_1928_METHODS = {
	BASIC_AUTHENTICATION: 0x02,
	GSSAPI: 0x01,
	NO_ACCEPTABLE_METHODS: 0xff,
	NO_AUTHENTICATION_REQUIRED: 0x00
};

const RFC_1928_REPLIES = {
	ADDRESS_TYPE_NOT_SUPPORTED: 0x08,
	COMMAND_NOT_SUPPORTED: 0x07,
	CONNECTION_NOT_ALLOWED: 0x02,
	CONNECTION_REFUSED: 0x05,
	GENERAL_FAILURE: 0x01,
	HOST_UNREACHABLE: 0x04,
	NETWORK_UNREACHABLE: 0x03,
	SUCCEEDED: 0x00,
	TTL_EXPIRED: 0x06
};

const RFC_1928_VERSION = 0x05;

const RFC_1929_REPLIES = {
	GENERAL_FAILURE: 0xff,
	SUCCEEDED: 0x00
};

const RFC_1929_VERSION = 0x01


const binary = require('binary')
const domain = require('domain')
const net = require('net')
const { SocksClient } = require('socks')
const { pub } = require('./public.js')
const dns = require('dns')


// 模块事件常量
const
	EVENTS = {
		AUTHENTICATION: 'authenticate',
		AUTHENTICATION_ERROR: 'authenticateError',
		CONNECTION_FILTER: 'connectionFilter',
		HANDSHAKE: 'handshake',
		PROXY_CONNECT: 'proxyConnect',
		PROXY_DATA: 'proxyData',
		PROXY_DISCONNECT: 'proxyDisconnect',
		PROXY_END: 'proxyEnd',
		PROXY_ERROR: 'proxyError'
	},
	LENGTH_RFC_1928_ATYP = 4;

/**
 * 参考资料:
 * https://www.ietf.org/rfc/rfc1928.txt - NO_AUTH SOCKS5
 * https://www.ietf.org/rfc/rfc1929.txt - USERNAME/PASSWORD SOCKS5
 *
 **/
class SocksServer {
	constructor(options) {
		let self = this
		this.proxys = {}
		this.activeSessions = []
		this.options = options || {}
		this.server = net.createServer((socket) => {
			// pub.debug(`接收到新的客户端连接 ${socket.remoteAddress}:${socket.remotePort}`)
			socket.on('error', (err) => {
				self.server.emit(EVENTS.PROXY_ERROR, err);
			});

			/**
			 * +----+------+----------+------+----------+
			 * |VER | ULEN |  UNAME   | PLEN |  PASSWD  |
			 * +----+------+----------+------+----------+
			 * | 1  |  1   | 1 to 255 |  1   | 1 to 255 |
			 * +----+------+----------+------+----------+
			 *
			 * @name 身份验证
			 * @param {Buffer} buffer - a buffer
			 * @returns {undefined}
			 **/
			function authenticate(buffer) {
				let authDomain = domain.create();

				binary
					.stream(buffer)
					.word8('ver')
					.word8('ulen')
					.buffer('uname', 'ulen')
					.word8('plen')
					.buffer('passwd', 'plen')
					.tap((args) => {
						// 获取原始缓冲区
						args.requestBuffer = buffer;

						// 验证版本是否兼容
						if (args.ver !== RFC_1929_VERSION) {
							return end(RFC_1929_REPLIES.GENERAL_FAILURE, args);
						}

						authDomain.on('error', (err) => {
							// 发出身份验证失败事件
							self.server.emit(
								EVENTS.AUTHENTICATION_ERROR,
								args.uname.toString(),
								err);

							// 响应身份验证失败
							return end(RFC_1929_REPLIES.GENERAL_FAILURE, args);
						});

						// 调用身份验证回调
						self.options.authenticate(
							args.uname.toString(),
							args.passwd.toString(),
							socket,
							authDomain.intercept(() => {
								// 发出成功的身份验证事件
								self.server.emit(EVENTS.AUTHENTICATION, args.uname.toString());

								// 以成功的方式回应...
								let responseBuffer = Buffer.allocUnsafe(2);
								responseBuffer[0] = RFC_1929_VERSION;
								responseBuffer[1] = RFC_1929_REPLIES.SUCCEEDED;

								// 响应然后监听cmd和dst信息
								socket.write(responseBuffer, () => {
									// 监听后续数据
									socket.once('data', connect);
								});
							}));
					});
			}

			/**
			 * +----+-----+-------+------+----------+----------+
			 * |VER | CMD |  RSV  | ATYP | DST.ADDR | DST.PORT |
			 * +----+-----+-------+------+----------+----------+
			 * | 1  |  1  | X'00' |  1   | Variable |    2     |
			 * +----+-----+-------+------+----------+----------+
			 * @name 连接
			 * @param {Buffer} buffer - 缓冲区
			 * @returns {undefined}
			 **/
			function connect(buffer) {
				let binaryStream = binary.stream(buffer);

				binaryStream
					.word8('ver')
					.word8('cmd')
					.word8('rsv')
					.word8('atyp')
					.tap((args) => {
						// 获取原始缓冲区
						args.requestBuffer = buffer;

						// 验证版本是否兼容
						if (args.ver !== RFC_1928_VERSION) {
							return end(RFC_1928_REPLIES.GENERAL_FAILURE, args);
						}

						// 添加socket到活动会话
						self.activeSessions.push(socket);

						// 创建目标对象
						args.dst = {};

						// ipv4
						if (args.atyp === RFC_1928_ATYP.IPV4) {
							binaryStream
								.buffer('addr.buf', LENGTH_RFC_1928_ATYP)
								.tap((args) => {
									args.dst.addr = [].slice.call(args.addr.buf).join('.');
								});

							// domain name
						} else if (args.atyp === RFC_1928_ATYP.DOMAINNAME) {
							binaryStream
								.word8('addr.size')
								.buffer('addr.buf', 'addr.size')
								.tap((args) => {
									args.dst.addr = args.addr.buf.toString();
								});

							// ipv6
						} else if (args.atyp === RFC_1928_ATYP.IPV6) {
							binaryStream
								.word32be('addr.a')
								.word32be('addr.b')
								.word32be('addr.c')
								.word32be('addr.d')
								.tap((args) => {
									args.dst.addr = [];

									// 提取ipv6地址的各个部分
									['a', 'b', 'c', 'd'].forEach((x) => {
										x = args.addr[x];

										// 将DWORD转换为两个WORD值并附加
										/* eslint no-magic-numbers : 0 */
										args.dst.addr.push(((x & 0xffff0000) >> 16).toString(16));
										args.dst.addr.push(((x & 0xffff)).toString(16));
									});

									// 将ipv6地址格式化为字符串
									args.dst.addr = args.dst.addr.join(':');
								});

							// 不支持的地址类型
						} else {
							return end(RFC_1928_REPLIES.ADDRESS_TYPE_NOT_SUPPORTED, args);
						}
					})
					.word16bu('dst.port')
					.tap((args) => {
						if (args.cmd === RFC_1928_COMMANDS.CONNECT) {
							let
								connectionFilter = self.options.connectionFilter,
								connectionFilterDomain = domain.create();

							// 如果没有提供连接过滤器
							if (!connectionFilter || typeof connectionFilter !== 'function') {
								connectionFilter = (destination, origin, callback) => setImmediate(callback);
							}

							// 获取连接筛选器错误
							connectionFilterDomain.on('error', (err) => {
								// pub.debug(`connectionFilterDomain err:${err}`)
								// 发出失败的目标连接事件
								self.server.emit(
									EVENTS.CONNECTION_FILTER,
									// 目标
									{
										address: args.dst.addr,
										port: args.dst.port
									},
									// 源
									{
										address: socket.remoteAddress,
										port: socket.remotePort
									},
									err);

								// 响应连接不允许
								return end(RFC_1929_REPLIES.CONNECTION_NOT_ALLOWED, args);
							});

							// 过滤连接
							return connectionFilter(
								// 目标
								{
									address: args.dst.addr,
									port: args.dst.port
								},
								// 源
								{
									address: socket.remoteAddress,
									port: socket.remotePort
								},
								connectionFilterDomain.intercept(() => {
									const socksClientOptions = self.buildSocksOptions(args.dst.addr, args.dst.port)
									if (socksClientOptions.proxy.host === undefined) {
										pub.debug(`无代理，直连目标: [${args.dst.addr}:${args.dst.port}]`)
										let
											destination = net.createConnection(
												args.dst.port,
												args.dst.addr,
												() => {
													// 准备成功回复
													let responseBuffer = Buffer.alloc(args.requestBuffer.length);
													args.requestBuffer.copy(responseBuffer);
													responseBuffer[1] = RFC_1928_REPLIES.SUCCEEDED;

													// 向客户端回写确认信息...
													socket.write(responseBuffer, () => {
														// 桥接数据
														destination.pipe(socket);
														socket.pipe(destination);
													});
												}),
											destinationInfo = {
												address: args.dst.addr,
												port: args.dst.port
											},
											originInfo = {
												address: socket.remoteAddress,
												port: socket.remotePort
											};

										// 获取连接成功
										destination.on('connect', () => {
											// 发送连接事件
											self.server.emit(EVENTS.PROXY_CONNECT, destinationInfo, destination);

											// 获取代理数据
											destination.on('data', (data) => {
												self.server.emit(EVENTS.PROXY_DATA, data);
											});

											// 获取目的地的关闭并发出挂起的断开连接 
											// 注意：只有在目标套接字完全关闭时才会发出此事件
											destination.on('close', (hadError) => {
												// 客户端关闭
												self.server.emit(EVENTS.PROXY_DISCONNECT, originInfo, destinationInfo, hadError);
											});

											connectionFilterDomain.exit();
										});

										// 处理连接错误
										destination.on('error', (err) => {
											// 退出连接过滤器域
											connectionFilterDomain.exit();

											// 连接错误通知
											err.addr = args.dst.addr;
											err.atyp = args.atyp;
											err.port = args.dst.port;

											self.server.emit(EVENTS.PROXY_ERROR, err);

											if (err.code && err.code === 'EADDRNOTAVAIL') {
												return end(RFC_1928_REPLIES.HOST_UNREACHABLE, args);
											}

											if (err.code && err.code === 'ECONNREFUSED') {
												return end(RFC_1928_REPLIES.CONNECTION_REFUSED, args);
											}

											return end(RFC_1928_REPLIES.NETWORK_UNREACHABLE, args);
										});


									} else {
										// 有代理
										SocksClient.createConnection(socksClientOptions, (err, info) => {
											// pub.debug(`选择代理 :[${socksClientOptions.proxy.host}:${socksClientOptions.proxy.port}]`)
											if (!err) {
												// pub.debug(`已连接到代理:[${socksClientOptions.proxy.host}:${socksClientOptions.proxy.port}] 访问目标: [${args.dst.addr}:${args.dst.port}]`)

												info.socket.on('error', err => {
													// pub.debug('请求远程地址发生错误: ', err.message)
													return end(RFC_1928_REPLIES.NETWORK_UNREACHABLE, args);
												})

												socket.once('data', (e) => {
													// pub.debug(`数据已桥接`)
												})

												socket.once('close', () => {
													// pub.debug(`关闭远程代理连接`)
													info.socket.end()
												})

												let responseBuffer = Buffer.alloc(args.requestBuffer.length);
												args.requestBuffer.copy(responseBuffer);
												responseBuffer[1] = RFC_1928_REPLIES.SUCCEEDED;
												// 向客户端回写确认信息...
												socket.write(responseBuffer, () => {
													// 桥接
													info.socket.pipe(socket)
													socket.pipe(info.socket)
												})
												connectionFilterDomain.exit()

											} else {
												pub.debug(`连接代理服务器失败: ${err.message}`)
												connectionFilterDomain.exit()
												// 连接错误通知
												err.addr = args.dst.addr;
												err.atyp = args.atyp;
												err.port = args.dst.port;

												self.server.emit(EVENTS.PROXY_ERROR, err)

												if (err.code && err.code === 'EADDRNOTAVAIL') {
													return end(RFC_1928_REPLIES.HOST_UNREACHABLE, args);
												}

												if (err.code && err.code === 'ECONNREFUSED') {
													return end(RFC_1928_REPLIES.CONNECTION_REFUSED, args);
												}

												return end(RFC_1928_REPLIES.NETWORK_UNREACHABLE, args);
											}
										})
									}
								}))
						} else {
							// 不支持的命令
							pub.debug(`不支持的命令: ${args.cmd}`)
							return end(RFC_1928_REPLIES.SUCCEEDED, args);
						}
					});
			}

			/**
			 * +----+-----+-------+------+----------+----------+
			 * |VER | REP |  RSV  | ATYP | BND.ADDR | BND.PORT |
			 * +----+-----+-------+------+----------+----------+
			 * | 1  |  1  | X'00' |  1   | Variable |    2     |
			 * +----+-----+-------+------+----------+----------+
			 * @name 代理结束
			 * @param {Buffer} response - 响应缓冲区
			 * @param {object} args - 代理结束事件参数
			 * @returns {undefined}
			 **/
			function end(response, args) {
				// 使用原始缓冲区（如果可用）或创建一个新的缓冲区
				let responseBuffer = args.requestBuffer || Buffer.allocUnsafe(2);

				if (!args.requestBuffer) {
					responseBuffer[0] = (RFC_1928_VERSION);
				}

				responseBuffer[1] = response;

				// 响应，然后结束连接
				try {
					socket.end(responseBuffer);
				} catch (ex) {
					socket.destroy();
				}

				// 通知客户端代理结束
				self.server.emit(EVENTS.PROXY_END, response, args);
			}

			/**
			 * +----+----------+----------+
			 * |VER | NMETHODS | METHODS  |
			 * +----+----------+----------+
			 * | 1  |    1     | 1 to 255 |
			 * +----+----------+----------+
			 * @name 握手
			 * @param {Buffer} buffer - 缓冲区
			 * @returns {undefined}
			 **/
			function handshake(buffer) {
				binary
					.stream(buffer)
					.word8('ver')
					.word8('nmethods')
					.buffer('methods', 'nmethods')
					.tap((args) => {
						// 验证版本是否兼容
						if (args.ver !== RFC_1928_VERSION) {
							return end(RFC_1928_REPLIES.GENERAL_FAILURE, args);
						}

						// 将方法列表转换为接受的方法集合
						let
							acceptedMethods = [].slice.call(args.methods).reduce((methods, method) => {
								methods[method] = true;
								return methods;
							}, {}),
							basicAuth = typeof self.options.authenticate === 'function',
							next = connect,
							noAuth = !basicAuth &&
								typeof acceptedMethods[0] !== 'undefined' &&
								acceptedMethods[0],
							responseBuffer = Buffer.allocUnsafe(2);

						// 响应缓冲区
						responseBuffer[0] = RFC_1928_VERSION;
						responseBuffer[1] = RFC_1928_METHODS.NO_AUTHENTICATION_REQUIRED;

						// 检查是否支持基本身份验证
						if (basicAuth) {
							responseBuffer[1] = RFC_1928_METHODS.BASIC_AUTHENTICATION;
							next = authenticate;

							// 如果没有提供基本身份验证
						} else if (!basicAuth && noAuth) {
							responseBuffer[1] = RFC_1928_METHODS.NO_AUTHENTICATION_REQUIRED;
							next = connect;

							// 未提供基本身份验证回调，不支持无身份验证
						} else {
							return end(RFC_1928_METHODS.NO_ACCEPTABLE_METHODS, args);
						}

						// 响应，然后监听cmd和dst信息
						socket.write(responseBuffer, () => {
							// 发出握手事件
							self.server.emit(EVENTS.HANDSHAKE, socket);

							// 等待下一个数据包
							socket.once('data', next);
						});
					});
			}

			// 获取握手数据
			socket.once('data', handshake)

			// 监听连接关闭
			socket.once('end', () => {
				// pub.debug(`客户端 ${socket.remoteAddress}:${socket.remotePort} 已关闭`)
				// 从活动会话中删除socket
				self.activeSessions.splice(self.activeSessions.indexOf(socket), 1);
			});
		});
	}

	/**
	 * @name 获取地址
	 * @returns { string }
	 */
	get address() {
		return this.server.address().address
	}

	/**
	 * @name 获取端口
	 * @returns { int }
	 */
	get port() {
		return this.server.address().port
	}

	/**
	 * @name 代理服务器监听
	 * @param {string} event 事件名称
	 * @param {function} cb 回调函数
	 * @returns {object} 代理服务器
	 */
	on(...args) {
		return this.server.on(...args)
	}

	/**
	 * @name 开始监听
	 * @param {string} host 监听地址
	 * @param {int} port 监听端口
	 * @param {function} cb 回调函数
	 * @returns {object} 代理服务器
	 */
	start(host, port, cb) {
		return this.server.listen(port, host, cb)
	}

	/**
	 * @name 选择代理服务器
	 * @param {string} addr 目标地址
	 * @param {int} port  目标端口
	 * @returns {object} 代理服务器配置
	 */
	buildSocksOptions(addr, port) {
		let proxy_ids = Object.keys(this.proxys)
		let proxy = {}
		for (let i = 0; i < proxy_ids.length; i++) {
			let proxy_id = proxy_ids[i]
			let p = this.proxys[proxy_id]
			for (let j = 0; j < p.match_addr.length; j++) {
				let match_addr = p.match_addr[j]
				if (match_addr === addr) {
					proxy = {
						host: p.proxy_host,
						port: Number(p.proxy_port),
						type: 5,
						userId: p.proxy_username,
						password: p.proxy_password
					}
					break
				}
			}
		}


		return {
			proxy: proxy,
			command: 'connect', // Socks指令，只支持connect

			destination: {
				host: addr, // 目标地址或域名
				port: port
			}
		}
	}

	/**
	 * @name 设置代理到代理池
	 * @param {object} proxy {
	 * 		proxy_id: {string} 代理ID,
	 * 		proxy_host: {string} 代理地址,
	 * 		proxy_port: {int} 代理端口,
	 * 		proxy_username: {string} 代理用户名,
	 * 		proxy_password: {string} 代理密码,
	 * 		match_addr: {array} 匹配地址
	 * } 代理配置
	 * @returns {undefined}
	 */
	setProxy(proxy) {
		this.proxys[proxy.proxy_id] = {
			proxy_id: proxy.proxy_id,
			proxy_host: proxy.proxy_host,
			proxy_port: proxy.proxy_port,
			proxy_username: proxy.proxy_username,
			proxy_password: proxy.proxy_password,
			match_addr: proxy.match_addr
		}
	}

	/**
	 * @name 获取代理
	 * @param {string} proxy_id 代理ID
	 * @returns {object} 代理配置
	 */
	getProxy(proxy_id) {
		return this.proxys[proxy_id]
	}

	/**
	 * @name 修改代理
	 * @param {object} proxy {
	 * 		proxy_id: {string} 代理ID,
	 * 		proxy_host: {string} 代理地址,
	 * 		proxy_port: {int} 代理端口,
	 * 		proxy_username: {string} 代理用户名,
	 * 		proxy_password: {string} 代理密码,
	 * 		match_addr: {array} 匹配地址
	 * } 代理配置
	 * @returns {boolean} 是否修改成功
	 */
	modifyProxy(proxy) {
		if (this.proxys[proxy.proxy_id]) {
			this.proxys[proxy.proxy_id] = {
				proxy_id: proxy.proxy_id,
				proxy_host: proxy.proxy_host,
				proxy_port: proxy.proxy_port,
				proxy_username: proxy.proxy_username,
				proxy_password: proxy.proxy_password,
				match_addr: proxy.match_addr
			}
			return true
		}
		return false
	}

	/**
	 * @name 修改代理匹配地址
	 * @param {string} proxy_id 代理ID
	 * @param {array} match_addr 匹配地址
	 * @returns {boolean} 是否修改成功
	 */
	modifyMetchAddr(proxy_id, match_addr) {
		if (this.proxys[proxy_id]) {
			this.proxys[proxy_id].match_addr = match_addr
			return true
		}
		return false
	}

	/**
	 * @name 添加代理匹配地址
	 * @param {string} proxy_id 代理ID
	 * @param {string|array} match_addr 匹配地址
	 * @returns {boolean} 是否添加成功
	 */
	pushMetchAddr(proxy_id, match_addr) {
		if (this.proxys[proxy_id]) {
			if (typeof match_addr === 'string') {
				// 如果是字符串
				if (this.proxys[proxy_id].match_addr.indexOf(match_addr) === -1) {
					this.proxys[proxy_id].match_addr.push(match_addr)
				}
			} else {
				// 如果是数组
				for (let i = 0; i < match_addr.length; i++) {
					if (this.proxys[proxy_id].match_addr.indexOf(match_addr[i]) === -1) {
						this.proxys[proxy_id].match_addr.push(match_addr[i])
					}
				}
			}
			return true
		}
		return false
	}

	/**
	 * @name 删除代理
	 * @param {string} proxy_id 代理ID
	 * @return {boolean} 是否删除成功
	 */
	delProxy(proxy_id) {
		if (this.proxys[proxy_id]) {
			delete this.proxys[proxy_id]
			return true
		}
		return false
	}

	/**
	 * @name 获取代理列表
	 * @returns {object} 代理列表
	 */
	getProxys() {
		return this.proxys
	}

	/**
	 * @name 清空代理列表
	 * @returns {undefined}
	 */
	clearProxys() {
		this.proxys = {}
	}


	/**
	 * @name 同步代理信息到代理池
	 * @description 该方法用于将数据库中的代理信息同步到代理池中
	 */
	syncProxy() {
		let self = this;
		pub.log(pub.lang('同步代理信息到代理池'))
		self.clearProxys() // 先清空代理池

		// 获取代理列表
		let proxy_list = pub.M('proxy_info').where("proxy_type=? and proxy_status=?", [2, 1]).select()
		if (!proxy_list) return

		// 将代理信息同步到代理池
		proxy_list.forEach((proxy_info) => {
			let panel_list = pub.M('panel_info').where('proxy_id=?', [proxy_info.proxy_id]).select()
			let ssh_list = pub.M('ssh_info').where('proxy_id=?', [proxy_info.proxy_id]).select()

			// 设置代理到代理池
			self.setProxy({
				proxy_id: proxy_info.proxy_id,
				proxy_host: proxy_info.proxy_ip,
				proxy_port: proxy_info.proxy_port,
				proxy_username: proxy_info.proxy_username,
				proxy_password: proxy_info.proxy_password,
				match_addr: []
			})

			let proxy_id = proxy_info.proxy_id

			// 设置代理匹配地址 -- 面板
			panel_list.forEach((panel) => {
				let panel_url = panel.url
				let tmp = panel_url.split('://')
				let host = tmp[1].split(':')[0]
				if (pub.isIp(host)) {
					self.proxys[proxy_id].match_addr.push(host)
				} else {
					dns.resolve(host, (err, address) => {
						if (err) {
							return
						}

						if (typeof address === 'string') {
							self.proxys[proxy_id].match_addr.push(address)
						} else {
							address.forEach((addr) => {
								self.proxys[proxy_id].match_addr.push(addr)
							});
						}
					})
				}
			});

			// 设置代理匹配地址 -- SSH
			ssh_list.forEach((ssh) => {
				let host = ssh.host
				if (pub.isIp(host)) {
					self.proxys[proxy_id].match_addr.push(host)
				} else {
					dns.resolve(host, (err, address) => {
						if (err) {
							return
						}
						if (typeof address === 'string') {
							self.proxys[proxy_id].match_addr.push(address)
						} else {
							address.forEach((addr) => {
								self.proxys[proxy_id].match_addr.push(addr)
							});
						}
					})
				}
			});
		})

		pub.log(pub.lang('代理信息同步完成'))
	}
}

exports.createServer = (options) => {
	let socksServer = new SocksServer(options)
	return socksServer
};
exports.events = EVENTS
exports.SocksServer = SocksServer