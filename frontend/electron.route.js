// Description: Electron IPC通信路由配置文件
// 本文件包含后端控制器路由，及传参说明，返回结果说明
// 引用方式：import routes from '../electron.route.js'  // 注意相对路径
// 如： routes.panel.list.path 为控制器路由的路径
//      routes.panel.list.args 为控制器路由的参数说明
//      routes.panel.list.result 为控制器路由的返回结果说明
//      routes.panel.list.result.format 为返回结果的格式说明
//      routes.panel.list.method 为调用方式，inovke: 单向调用，直接返回结果; ipc: 双向调用,需要on监听channel

const routes = {
	panel: {
		list: {
			title: '获取面板列表', // 接口标题
			method: 'ipc', // 调用方式 inovke: 单向调用，直接返回结果; ipc: 双向调用,需要on监听channel
			path: 'controller.panel.list', // 调用路径
			args: {
				// 参数列表
				channel: {
					// 参数名称
					type: 'string', // 参数类型
					required: true, // 是否必传
					description: '通道标识', // 参数描述
				},
				data: {
					page: {
						type: 'number',
						required: false,
						default: 1,
						description: '页码',
					},
					limit: {
						type: 'number',
						required: false,
						default: 10,
						description: '每页显示数量',
					},
					search: {
						type: 'string',
						required: false,
						default: '',
						description: '搜索关键字',
					},
					group_id: {
						type: 'number',
						required: false,
						description: '分组ID，-1:全部，0:默认分组,>0:指定分组',
					},
				},
			},
			result: {
				// 返回结果
				type: 'object', // 返回结果类型
				format: {
					// 返回结果格式
					groups: 'number',
					data: 'array',
				},
			},
		},
		record_disk: {
			title: '记录面板选中的磁盘',
			method: 'ipc',
			path: 'controller.panel.record_disk',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					panel_id: {
						type: 'number',
						required: true,
						description: '面板ID',
					},
					disk_path: {
						type: 'string',
						required: true,
						description: '磁盘路径',
					},
				},
			},
		},
		find: {
			title: '获取指定面板信息',
			method: 'ipc',
			path: 'controller.panel.find',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					panel_id: {
						type: 'number',
						required: true,
						description: '面板ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		bind: {
			title: '绑定新面板',
			method: 'ipc',
			path: 'controller.panel.bind',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					title: {
						type: 'string',
						required: true,
						description: '面板名称',
					},
					url: {
						type: 'string',
						required: true,
						description: '面板URL',
					},
					auth_type: {
						type: 'number',
						required: true,
						description: '验证类型，1：密码验证，2：Token验证，3：无验证',
					},
					token: {
						type: 'string',
						required: true,
						description: '面板Token',
					},
					admin_path: {
						type: 'string',
						required: true,
						description: '面板安全入口',
					},
					username: {
						type: 'string',
						required: true,
						description: '面板用户名',
					},
					password: {
						type: 'string',
						required: true,
						description: '面板密码',
					},
					group_id: {
						type: 'number',
						required: false,
						description: '面板分组ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		bind_app: {
			title: '通过APP接口绑定',
			method: 'ipc',
			path: 'controller.panel.bind_app',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					auth_type: {
						type: 'number',
						required: true,
						description: '验证类型=3',
					},
					token: {
						type: 'string',
						required: true,
						description: '从面板堡塔APP插件中获取的app_token',
					},
					group_id: {
						type: 'number',
						required: false,
						description: '面板分组ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		modify: {
			title: '修改面板信息',
			method: 'ipc',
			path: 'controller.panel.modify',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					panel_id: {
						type: 'number',
						required: true,
						description: '面板ID',
					},
					title: {
						type: 'string',
						required: true,
						description: '面板名称',
					},
					url: {
						type: 'string',
						required: true,
						description: '面板URL',
					},
					auth_type: {
						type: 'number',
						required: true,
						description: '验证类型，1：密码验证，2：Token验证，3：无验证',
					},
					token: {
						type: 'string',
						required: true,
						description: '面板Token',
					},
					admin_path: {
						type: 'string',
						required: true,
						description: '面板安全入口',
					},
					username: {
						type: 'string',
						required: true,
						description: '面板用户名',
					},
					password: {
						type: 'string',
						required: true,
						description: '面板密码',
					},
					group_id: {
						type: 'number',
						required: false,
						description: '面板分组ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		remove: {
			title: '删除面板',
			method: 'ipc',
			path: 'controller.panel.remove',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					panel_id: {
						type: 'number',
						required: true,
						description: '面板ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		get_load: {
			title: '获取面板负载信息',
			method: 'ipc',
			path: 'controller.panel.get_load',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					panel_id: {
						type: 'number',
						required: true,
						description: '面板ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		get_tmp_token: {
			title: '获取临时登录地址',
			method: 'ipc',
			path: 'controller.panel.get_tmp_token',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		set_common_use: {
			title: '设置面板为常用面板',
			method: 'ipc',
			path: 'controller.panel.set_common_use',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					panel_ids: {
						type: 'array',
						required: true,
						description: '面板ID列表，最多10个，示例：[1,2,3]',
					}
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		start_load: {
			title: '开始获取面板负载信息',
			method: 'ipc',
			path: 'controller.panel.start_load',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					any_channel: {
						type: 'string',
						required: true,
						description: '用于接收负载信息的通道标识',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		stop_load: {
			title: '停止获取面板负载信息',
			method: 'ipc',
			path: 'controller.panel.stop_load',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		add_group: {
			title: '添加分组',
			method: 'ipc',
			path: 'controller.panel.add_group',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					group_name: {
						type: 'string',
						required: true,
						description: '分组名称',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		modify_group: {
			title: '修改分组',
			method: 'ipc',
			path: 'controller.panel.modify_group',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					group_id: {
						type: 'number',
						required: true,
						description: '分组ID',
					},
					group_name: {
						type: 'string',
						required: true,
						description: '分组名称',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		remove_group: {
			title: '删除分组',
			method: 'ipc',
			path: 'controller.panel.remove_group',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					group_id: {
						type: 'number',
						required: true,
						description: '分组ID',
					}
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		export: {
			title: '导出面板数据',
			method: 'ipc',
			path: 'controller.panel.export',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'string',
				},
			},
		},
		import: {
			title: '导入面板数据',
			method: 'ipc',
			path: 'controller.panel.import',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		save_panel: {
			title: '保存面板登录信息至桌面',
			method: 'ipc',
			path: 'controller.panel.save_panel',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					filename: {
						type: 'string',
						required: true,
						description: '文件名',
					},
					content: {
						type: 'string',
						required: true,
						description: '面板登录信息',
					}
				}
			}
		},
		get_install_script: {
			title: '获取面板安装脚本',
			method: 'ipc',
			path: 'controller.panel.get_install_script',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
		}

	},
	term: {
		list: {
			title: '获取终端列表',
			method: 'ipc',
			path: 'controller.term.list',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					search: {
						type: 'string',
						required: false,
						default: '',
						description: '搜索关键字',
					},
					group_id: {
						type: 'number',
						required: false,
						description: '分组ID，-1:全部，0:默认分组,>0:指定分组',
					}

				},
			},
			result: {
				type: 'object',
				format: {
					groups: 'array',
					data: 'array',
				},
			},
		},
		find: {
			title: '获取指定终端信息',
			method: 'ipc',
			path: 'controller.term.find',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: '终端ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		bind: {
			title: '绑定新终端',
			method: 'ipc',
			path: 'controller.term.bind',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					title: {
						type: 'string',
						required: true,
						description: '终端名称',
					},
					host: {
						type: 'string',
						required: true,
						description: '主机',
					},
					port: {
						type: 'number',
						required: true,
						description: '端口',
					},
					auth_type: {
						type: 'number',
						required: true,
						description: '认证类型，0：密码认证，1：私钥认证',
					},
					username: {
						type: 'string',
						required: true,
						description: '用户名',
					},
					password: {
						type: 'string',
						required: true,
						description: '密码',
					},
					privateKey: {
						type: 'string',
						required: true,
						description: '私钥',
					},
					group_id: {
						type: 'number',
						required: false,
						description: '终端分组ID',
					},
					is_recording: {
						type: 'number',
						required: false,
						description: '是否录屏，1：是，0：否',
					},
					os_type: {
						type: 'string',
						required: false,
						description: '操作系统类型，Windows/Linux',
					},
					mstsc_options: {
						fullscreen: {
							type: 'boolean',
							required: false,
							description: '是否全屏，true：是，false：否，默认false',
						},
						enableDrives: {
							type: 'boolean',
							required: false,
							description: '是否启用映射驱动器，true：是，false：否，默认false',
						},
						width: {
							type: 'number',
							required: false,
							description: '桌面宽度，默认0，0表示自适应，注意：只有在fullscreen=false时有效',
						},
						height: {
							type: 'number',
							required: false,
							description: '桌面高度，默认0，0表示自适应，注意：只有在fullscreen=false时有效',
						}
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		modify: {
			title: '修改终端信息',
			method: 'ipc',
			path: 'controller.term.modify',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: '终端ID',
					},
					title: {
						type: 'string',
						required: true,
						description: '终端名称',
					},
					host: {
						type: 'string',
						required: true,
						description: '主机',
					},
					port: {
						type: 'number',
						required: true,
						description: '端口',
					},
					auth_type: {
						type: 'number',
						required: true,
						description: '认证类型，0：密码认证，1：私钥认证',
					},
					username: {
						type: 'string',
						required: true,
						description: '用户名',
					},
					password: {
						type: 'string',
						required: true,
						description: '密码',
					},
					privateKey: {
						type: 'string',
						required: true,
						description: '私钥',
					},
					group_id: {
						type: 'number',
						required: false,
						description: '终端分组ID',
					},
					is_recording: {
						type: 'number',
						required: false,
						description: '是否录屏，1：是，0：否',
					},
					os_type: {
						type: 'string',
						required: false,
						description: '操作系统类型，Windows/Linux',
					},
					mstsc_options: {
						fullscreen: {
							type: 'boolean',
							required: false,
							description: '是否全屏，true：是，false：否，默认false',
						},
						enableDrives: {
							type: 'boolean',
							required: false,
							description: '是否启用本地驱动器，true：是，false：否，默认false',
						},
						width: {
							type: 'number',
							required: false,
							description: '桌面宽度，默认0，0表示自适应，注意：只有在fullscreen=false时有效',
						},
						height: {
							type: 'number',
							required: false,
							description: '桌面高度，默认0，0表示自适应，注意：只有在fullscreen=false时有效',
						}
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		remove: {
			title: '删除终端',
			method: 'ipc',
			path: 'controller.term.remove',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: '终端ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		get_load: {
			title: '获取终端负载信息',
			method: 'ipc',
			path: 'controller.term.get_load',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: '终端ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		connect: {
			title: '连接终端',
			method: 'ipc',
			path: 'controller.term.connect',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识，通常是ssh_id+时间戳',
				},
				data: {
					// 主机信息
					ssh_id: {
						type: 'number',
						required: false,
						description: '终端ID，如果传了此参数，将忽略下面的参数',
					},
					host: {
						type: 'string',
						required: false,
						description: '主机',
					},
					port: {
						type: 'number',
						required: false,
						description: '端口',
					},
					auth_type: {
						type: 'number',
						required: false,
						description: '认证类型，0：密码认证，1：私钥认证',
					},
					username: {
						type: 'string',
						required: false,
						description: '用户名',
					},
					password: {
						type: 'string',
						required: false,
						description: '密码',
					},
					privateKey: {
						type: 'string',
						required: false,
						description: '私钥,如果是私钥认证，此参数必传',
					},
					os_type: {
						type: 'string',
						required: false,
						description: '操作系统类型，Windows/Linux',
					},
					mstsc_options: {
						fullscreen: {
							type: 'boolean',
							required: false,
							description: '是否全屏，true：是，false：否，默认false',
						},
						enableDrives: {
							type: 'boolean',
							required: false,
							description: '是否启用本地驱动器，true：是，false：否，默认false',
						},
						width: {
							type: 'number',
							required: false,
							description: '桌面宽度，默认0，0表示自适应，注意：只有在fullscreen=false时有效',
						},
						height: {
							type: 'number',
							required: false,
							description: '桌面高度，默认0，0表示自适应，注意：只有在fullscreen=false时有效',
						}
					},
				},
			},
			result: {
				type: 'bytes',
				format: {},
			},
		},
		disconnect: {
			title: '断开终端',
			method: 'invoke',
			path: 'controller.term.disconnect',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识，通常是ssh_id+时间戳',
				},
				data: {},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		delete_connect: {
			title: '关闭终端',
			method: 'invoke',
			path: 'controller.term.delete_connect',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识，通常是ssh_id+时间戳',
				},
				data: {
					mode:{
						type: 'number',
						required: true,
						description: '模式 all:全部, other:其他, self:自己',
					},
					ssh_id: {
						type: 'number',
						required: false,
						description: '终端ID，mode=other时必传',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		write: {
			title: '写入终端数据',
			method: 'ipc',
			path: 'controller.term.write',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识，通常是ssh_id+时间戳',
				},
				data: {
					type: 'bytes',
					required: true,
					description: '写入的数据',
				},
			},
			result: {},
		},
		resize: {
			title: '调整终端大小',
			method: 'ipc',
			path: 'controller.term.resize',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识，通常是ssh_id+时间戳',
				},
				data: {
					cols: {
						type: 'number',
						required: true,
						description: '列',
					},
					rows: {
						type: 'number',
						required: true,
						description: '行',
					},
				},
			},
		},
		connect_list: {
			title: '获取连接的终端列表',
			method: 'ipc',
			path: 'controller.term.connect_list',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识，通常是ssh_id+时间戳',
				},
			},
			result: {
				type: 'array',
				format: 'string',
			},
		},
		get_load: {
			title: '获取终端负载信息',
			method: 'ipc',
			path: 'controller.term.get_load',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识，通常是ssh_id+时间戳',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: '终端ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		set_common_use: {
			title: '设置终端为常用终端',
			method: 'ipc',
			path: 'controller.term.set_common_use',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'array',
						required: true,
						description: '终端ID列表，最多10个，示例：[1,2,3]',
					}
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		add_group: {
			title: '添加分组',
			method: 'ipc',
			path: 'controller.term.add_group',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					group_name: {
						type: 'string',
						required: true,
						description: '分组名称',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		modify_group: {
			title: '修改分组',
			method: 'ipc',
			path: 'controller.term.modify_group',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					group_id: {
						type: 'number',
						required: true,
						description: '分组ID',
					},
					group_name: {
						type: 'string',
						required: true,
						description: '分组名称',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		remove_group: {
			title: '删除分组',
			method: 'ipc',
			path: 'controller.term.remove_group',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					group_id: {
						type: 'number',
						required: true,
						description: '分组ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		video_list: {
			title: '获取屏幕录像视频列表',
			method: 'ipc',
			path: 'controller.term.video_list',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: '终端ID',
					}
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		remove_video: {
			title: '删除屏幕录像视频',
			method: 'ipc',
			path: 'controller.term.remove_video',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					record_id: {
						type: 'number',
						required: true,
						description: '视频ID',
					}
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		get_video: {
			title: '获取屏幕录像视频',
			method: 'ipc',
			path: 'controller.term.get_video',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					record_id: {
						type: 'number',
						required: true,
						description: '视频ID',
					}
				},
			},
			result: {
				type: 'object',
				format: {},
			},
		},
		command_list: {
			title: '获取常用命令列表',
			method: 'ipc',
			path: 'controller.term.command_list',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'array',
				format: 'string',
			},
		},
		add_command: {
			title: '添加常用命令',
			method: 'ipc',
			path: 'controller.term.add_command',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					title: {
						type: 'string',
						required: true,
						description: '命令名称',
					},
					content: {
						type: 'string',
						required: true,
						description: '命令内容',
					}
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		remove_command: {
			title: '删除常用命令',
			method: 'ipc',
			path: 'controller.term.remove_command',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					shell_id: {
						type: 'number',
						required: true,
						description: '命令ID',
					}
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		modify_command: {
			title: '修改常用命令',
			method: 'ipc',
			path: 'controller.term.modify_command',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					shell_id: {
						type: 'number',
						required: true,
						description: '命令ID',
					},
					title: {
						type: 'string',
						required: true,
						description: '命令名称',
					},
					content: {
						type: 'string',
						required: true,
						description: '命令内容',
					}
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		show_open_dialog: {
			title: '显示打开文件对话框',
			method: 'ipc',
			path: 'controller.term.show_open_dialog',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'string',
				},
			},
		},
		export: {
			title: '导出终端数据',
			method: 'ipc',
			path: 'controller.term.export',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'string',
				},
			},
		},
		import: {
			title: '导入终端数据',
			method: 'ipc',
			path: 'controller.term.import',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		set_sort: {
			title: '设置终端排序',
			method: 'ipc',
			path: 'controller.term.set_sort',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					id: {
						type: 'number',
						required: true,
						description: '终端ID，示例：1',
					},
					sort: {
						type: 'number',
						required: true,
						description: '排序值，示例：1',
					}
				},
			},
		}
	},
	window: {
		cancel_download: {
			title: '取消下载任务',
			method: 'ipc',
			path: 'controller.window.cancel_download',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					download_id: {
						type: 'string',
						required: true,
						description: '下载任务ID',
					}
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		open_download_window: {
			title: '打开下载窗口',
			method: 'ipc',
			path: 'controller.window.open_download_window',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		get_download_list: {
			title: '获取下载列表',
			method: 'ipc',
			path: 'controller.window.get_download_list',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		remove_download: {
			title: '删除下载任务 -- 仅已完成的或失败的任务',
			method: 'ipc',
			path: 'controller.window.remove_download',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					download_id: {
						type: 'string',
						required: true,
						description: '下载任务ID',
					}
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		list: {
			title: '获取子视图列表',
			method: 'ipc',
			path: 'controller.window.list',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
			},
			result: {
				type: 'array',
				format: 'string',
			},
		},
		create: {
			title: '创建子视图',
			method: 'ipc',
			path: 'controller.window.create',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					view_key: {
						type: 'string',
						required: true,
						description: '视图KEY,唯一标识,用于后续控制视图',
					},
					url: {
						type: 'string',
						required: true,
						description: '视图URL,例如：http://www.baidu.com',
					},
					bounds: {
						type: 'object',
						required: true,
						description: '视图位置 {x: number, y: number, width: number, height: number}',
					},
					auto_resize: {
						type: 'object',
						required: true,
						description: '自动调整大小 {width: boolean, height: boolean,horizontal: boolean, vertical: boolean}',
					},
					options: {
						type: 'object',
						required: true,
						description: '视图参数，参考：https://www.electronjs.org/zh/docs/latest/api/browser-view#new-browserviewoptions-experimental-deprecated',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		destroy: {
			title: '销毁子视图',
			method: 'ipc',
			path: 'controller.window.destroy',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					view_key: {
						type: 'string',
						required: true,
						description: '视图KEY,唯一标识,用于后续控制视图',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		set_bounds: {
			title: '设置子视图位置',
			method: 'ipc',
			path: 'controller.window.set_bounds',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					view_key: {
						type: 'string',
						required: true,
						description: '视图KEY,唯一标识,用于后续控制视图',
					},
					bounds: {
						type: 'object',
						required: true,
						description: '视图位置 {x: number, y: number, width: number, height: number}',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		set_auto_resize: {
			title: '设置子视图自动调整大小',
			method: 'ipc',
			path: 'controller.window.set_auto_resize',
		},
		show: {
			title: '显示子视图',
			method: 'ipc',
			path: 'controller.window.show',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					view_key: {
						type: 'string',
						required: true,
						description: '视图KEY,唯一标识,用于后续控制视图',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		hide: {
			title: '隐藏子视图',
			method: 'ipc',
			path: 'controller.window.hide',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					view_key: {
						type: 'string',
						required: true,
						description: '视图KEY,唯一标识,用于后续控制视图',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		window_maximize: {
			title: '最大化主窗口/恢复主窗口',
			method: 'ipc',
			path: 'controller.window.window_maximize',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		window_minimize: {
			title: '最小化主窗口',
			method: 'ipc',
			path: 'controller.window.window_minimize',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: {
						Minimized: 'boolean',
					}
				},
			}
		},
		window_close: {
			title: '关闭主窗口',
			method: 'ipc',
			path: 'controller.window.window_close',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		window_fullscreen: {
			title: '全屏/退出全屏',
			method: 'ipc',
			path: 'controller.window.window_fullscreen',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: {
						FullScreen: 'boolean',
					}
				},
			}
		},
		window_top: {
			title: '置顶/取消置顶',
			method: 'ipc',
			path: 'controller.window.window_top',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		app_quit: {
			title: '退出应用/最小化到托盘',
			method: 'ipc',
			path: 'controller.window.app_quit',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					action: {
						type: 'string',
						required: false,
						description: '操作类型，quit：退出，close：最小化到托盘',
					},
					save: {
						type: 'boolean',
						required: false,
						description: '是否保存配置',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		get_app_quit_action: {
			title: '获取关闭按钮操作类型',
			method: 'ipc',
			path: 'controller.window.get_app_quit_action',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: {
						action: 'string',
					}
				},
			}
		},
		app_reload: {
			title: '重新加载应用',
			method: 'ipc',
			path: 'controller.window.app_reload',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		is_fullscreen: {
			title: '主窗口是否为全屏状态',
			method: 'ipc',
			path: 'controller.window.is_fullscreen',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: {
						FullScreen: 'boolean',
					}
				},
			}
		},
		is_maximized: {
			title: '主窗口是否为最大化状态',
			method: 'ipc',
			path: 'controller.window.is_maximized',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: {
						Maximized: 'boolean',
					}
				},
			}
		},
		set_tab_context_menu: {
			title: '设置tab右键信息至全局',
			method: 'ipc',
			path: 'controller.window.set_tab_context_menu',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					key: {
						type: 'number',
						required: true,
						description: '唯一id',
					},
					type: {
						type: 'string',
						required: true,
						description: '模式',
					},
				}
			}
		},
		refresh_panel: {
			title: ' 刷新面板',
			method: 'ipc',
			path: 'controller.window.refresh_panel',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					view_key: {
						type: 'string',
						required: true,
						description: '视图KEY,唯一标识',
					},
				},
			},
		}
	},
	files: {
		os_open_folder: {
			title: '在文件管理器中显示指定的文件',
			method: 'ipc',
			path: 'controller.files.os_open_folder',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					filename: {
						type: 'string',
						required: true,
						description: '文件全路径',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		os_open_file: {
			title: '在默认程序中打开指定的文件',
			method: 'ipc',
			path: 'controller.files.os_open_file',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					filename: {
						type: 'string',
						required: true,
						description: '文件全路径',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		get_sftp_items: {
			title: '获取SFTP连接列表',
			method: 'ipc',
			path: 'controller.files.get_sftp_items',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		connect: {
			title: '连接SFTP',
			method: 'ipc',
			path: 'controller.files.connect',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},

		list_dir: {
			title: '获取文件列表',
			method: 'ipc',
			path: 'controller.files.list_dir',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					path: {
						type: 'string',
						required: true,
						description: '路径',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},

		upload: {
			title: '上传文件',
			method: 'ipc',
			path: 'controller.files.upload',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					localPath: {
						type: 'string',
						required: true,
						description: '本地路径',
					},
					remotePath: {
						type: 'string',
						required: true,
						description: '远程路径',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},

		get_download_items: {
			title: '获取下载文件列表',
			method: 'ipc',
			path: 'controller.files.get_download_items',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},

		get_upload_items: {
			title: '获取上传文件列表',
			method: 'ipc',
			path: 'controller.files.get_upload_items',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},

		download: {
			title: '下载文件',
			method: 'ipc',
			path: 'controller.files.download',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					remotePath: {
						type: 'string',
						required: true,
						description: '远程路径',
					},
					localPath: {
						type: 'string',
						required: true,
						description: '本地路径',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},

		disconnect: {
			title: '断开SFTP',
			method: 'ipc',
			path: 'controller.files.disconnect',
			args: {
				ssh_id: {
					type: 'number',
					required: true,
					description: 'SSH ID',
				},
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},

		rename: {
			title: '重命名文件或目录',
			method: 'ipc',
			path: 'controller.files.rename',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					oldPath: {
						type: 'string',
						required: true,
						description: '旧路径',
					},
					newPath: {
						type: 'string',
						required: true,
						description: '新路径',
					},
				}
			},
		},

		remove: {
			title: '删除文件',
			method: 'ipc',
			path: 'controller.files.remove',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					filename: {
						type: 'string',
						required: true,
						description: '路径',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		touch: {
			title: '创建文件',
			method: 'ipc',
			path: 'controller.files.touch',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					filename: {
						type: 'string',
						required: true,
						description: '路径',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		mkdir: {
			title: '创建目录',
			method: 'ipc',
			path: 'controller.files.mkdir',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					path: {
						type: 'string',
						required: true,
						description: '路径',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		rmdir: {
			title: '删除目录',
			method: 'ipc',
			path: 'controller.files.rmdir',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					path: {
						type: 'string',
						required: true,
						description: '路径',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		stat: {
			title: '获取文件信息',
			method: 'ipc',
			path: 'controller.files.stat',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					filename: {
						type: 'string',
						required: true,
						description: '路径',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		read_file: {
			title: '读取文件',
			method: 'ipc',
			path: 'controller.files.read_file',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					filename: {
						type: 'string',
						required: true,
						description: '路径',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'string',
				},
			},
		},
		write_file: {
			title: '写入文件',
			method: 'ipc',
			path: 'controller.files.write_file',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					filename: {
						type: 'string',
						required: true,
						description: '路径',
					},
					data: {
						type: 'string',
						required: true,
						description: '内容',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		get_user_group: {
			title: '获取用户和组列表',
			method: 'ipc',
			path: 'controller.files.get_user_group',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
				},
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		chmod: {
			title: '修改文件权限',
			method: 'ipc',
			path: 'controller.files.chmod',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					filename: {
						type: 'string',
						required: true,
						description: '路径',
					},
					mode: {
						type: 'number',
						required: true,
						description: '权限',
					},
				}
			},
		},
		chown: {
			title: '修改文件所有者',
			method: 'ipc',
			path: 'controller.files.chown',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					},
					filename: {
						type: 'string',
						required: true,
						description: '路径',
					},
					uid: {
						type: 'number',
						required: true,
						description: '用户ID',
					},
					gid: {
						type: 'number',
						required: true,
						description: '组ID',
					},
				}
			},
		},
		start_panel_api: {
			title: '启动面板API',
			method: 'ipc',
			path: 'controller.files.start_panel_api',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					ssh_id: {
						type: 'number',
						required: true,
						description: 'SSH ID',
					}
				}
			},
		}
	},
	index: {
		check_update: {
			title: '检查更新',
			method: 'ipc',
			path: 'controller.index.check_update',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		set_sync_password: {
			title: '设置同步密码',
			method: 'ipc',
			path: 'controller.index.set_sync_password',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					password: {
						type: 'string',
						required: true,
						description: '密码',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		not_password: {
			title: '设置免输锁屏密码',
			method: 'ipc',
			path: 'controller.index.not_password',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					password: {
						type: 'string',
						required: true,
						description: '密码',
					},
					not_password: {
						type: 'boolean',
						required: true,
						description: '是否免输锁屏',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},

		get_languages: {
			title: '获取当前语言和支持的语言列表',
			method: 'ipc',
			path: 'controller.index.get_languages',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		set_language: {
			title: '设置语言',
			method: 'ipc',
			path: 'controller.index.set_language',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					language: {
						type: 'string',
						required: true,
						description: '语言',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		get_client_language: {
			title: '获取客户端语言包',
			method: 'ipc',
			path: 'controller.index.get_client_language',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		get_server_language: {
			title: '获取服务端语言包',
			method: 'ipc',
			path: 'controller.index.get_server_language',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		has_password: {
			title: '是否设置过管理密码',
			method: 'ipc',
			path: 'controller.index.has_password',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'boolean',
				},
			},
		},
		set_password: {
			title: '设置管理密码',
			method: 'ipc',
			path: 'controller.index.set_password',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					password: {
						type: 'string',
						required: true,
						description: '密码',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		check_password: {
			title: '检查管理密码是否正确',
			method: 'ipc',
			path: 'controller.index.check_password',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					password: {
						type: 'string',
						required: true,
						description: '密码',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		manual_sync: {
			title: '手动同步',
			method: 'ipc',
			path: 'controller.index.manual_sync',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		get_config: {
			title: '获取配置信息',
			method: 'ipc',
			path: 'controller.index.get_config',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		set_config: {
			title: '设置配置信息',
			method: 'ipc',
			path: 'controller.index.set_config',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					key: {
						type: 'string',
						required: true,
						description: '键',
					},
					value: {
						type: 'string',
						required: true,
						description: '值',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
	},
	user: {
		bind: {
			title: '用户绑定',
			method: 'ipc',
			path: 'controller.user.bind',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					username: {
						type: 'string',
						required: true,
						description: '用户名',
					},
					password: {
						type: 'string',
						required: true,
						description: '密码',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		unbind: {
			title: '用户解绑',
			method: 'ipc',
			path: 'controller.user.unbind',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		get_user_info: {
			title: '获取用户绑定信息',
			method: 'ipc',
			path: 'controller.user.get_user_info',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		}

	},
	proxy: {
		getProxyList: {
			title: '获取代理列表',
			method: 'ipc',
			path: 'controller.proxy.getProxyList',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		addProxy: {
			title: '添加代理',
			method: 'ipc',
			path: 'controller.proxy.addProxy',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					proxy_name: {
						type: 'string',
						required: true,
						description: '代理名称',
					},
					proxy_host: {
						type: 'string',
						required: true,
						description: '代理地址',
					},
					proxy_port: {
						type: 'number',
						required: true,
						description: '代理端口',
					},
					proxy_username: {
						type: 'string',
						required: false,
						description: '代理用户名',
					},
					proxy_password: {
						type: 'string',
						required: false,
						description: '代理密码，如果有用户名，此参数不能为空',
					},
					proxy_type: {
						type: 'number',
						required: true,
						description: '代理类型,0=HTTP, 1=HTTPS,2=SOCKS5',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		modifyProxy: {
			title: '修改代理',
			method: 'ipc',
			path: 'controller.proxy.modifyProxy',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					proxy_id: {
						type: 'number',
						required: true,
						description: '代理ID',
					},
					proxy_name: {
						type: 'string',
						required: true,
						description: '代理名称',
					},
					proxy_host: {
						type: 'string',
						required: true,
						description: '代理地址',
					},
					proxy_port: {
						type: 'number',
						required: true,
						description: '代理端口',
					},
					proxy_username: {
						type: 'string',
						required: false,
						description: '代理用户名',
					},
					proxy_password: {
						type: 'string',
						required: false,
						description: '代理密码，如果有用户名，此参数不能为空',
					},
					proxy_type: {
						type: 'number',
						required: true,
						description: '代理类型,0=HTTP, 1=HTTPS,2=SOCKS5',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		delProxy: {
			title: '删除代理',
			method: 'ipc',
			path: 'controller.proxy.delProxy',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					proxy_id: {
						type: 'number',
						required: true,
						description: '代理ID',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		}
	},
	batch: {
		get_script_list: {
			title: '获取脚本列表',
			method: 'ipc',
			path: 'controller.batch.get_script_list',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					p: {
						type: 'number',
						required: false,
						description: '页码',
					},
					rows: {
						type: 'number',
						required: false,
						description: '每页数量',
					},
					search: {
						type: 'string',
						required: false,
						description: '搜索关键字',
					},
					type_id: {
						type: 'number',
						required: false,
						description: '类型ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		get_script_info: {
			title: '获取脚本信息',
			method: 'ipc',
			path: 'controller.batch.get_script_info',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					script_id: {
						type: 'number',
						required: true,
						description: '脚本ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		create_script: {
			title: '创建脚本',
			method: 'ipc',
			path: 'controller.batch.create_script',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					script_name: {
						type: 'string',
						required: true,
						description: '脚本名称',
					},
					type_id: {
						type: 'number',
						required: true,
						description: '分类ID',
					},
					content: {
						type: 'string',
						required: true,
						description: '脚本内容',
					},
					script_type: {
						type: 'string',
						required: true,
						description: '脚本类型,shell/python',
					},
					remark: {
						type: 'string',
						required: false,
						description: '备注',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		modify_script: {
			title: '修改脚本',
			method: 'ipc',
			path: 'controller.batch.modify_script',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					script_id: {
						type: 'number',
						required: true,
						description: '脚本ID',
					},
					type_id: {
						type: 'number',
						required: true,
						description: '分类ID',
					},
					content: {
						type: 'string',
						required: true,
						description: '脚本内容',
					},
					remark: {
						type: 'string',
						required: false,
						description: '备注',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		remove_script: {
			title: '删除脚本',
			method: 'ipc',
			path: 'controller.batch.remove_script',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					script_id: {
						type: 'number',
						required: true,
						description: '脚本ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		execute_script: {
			title: '执行脚本',
			method: 'ipc',
			path: 'controller.batch.execute_script',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					script_id: {
						type: 'number',
						required: true,
						description: '脚本ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		get_script_record: {
			title: '获取脚本执行记录',
			method: 'ipc',
			path: 'controller.batch.get_script_record',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					script_id: {
						type: 'number',
						required: true,
						description: '脚本ID',
					},
					p: {
						type: 'number',
						required: false,
						description: '页码',
					},
					rows: {
						type: 'number',
						required: false,
						description: '每页数量',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		get_script_type_list: {
			title: '获取脚本分类列表',
			method: 'ipc',
			path: 'controller.batch.get_script_type_list',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		create_script_type: {
			title: '创建脚本分类',
			method: 'ipc',
			path: 'controller.batch.create_script_type',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					type_name: {
						type: 'string',
						required: true,
						description: '分类名称',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		modify_script_type: {
			title: '修改脚本分类',
			method: 'ipc',
			path: 'controller.batch.modify_script_type',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					type_id: {
						type: 'number',
						required: true,
						description: '分类ID',
					},
					type_name: {
						type: 'string',
						required: true,
						description: '分类名称',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		remove_script_type: {
			title: '删除脚本分类',
			method: 'ipc',
			path: 'controller.batch.remove_script_type',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					type_id: {
						type: 'number',
						required: true,
						description: '分类ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		get_script_exec_queue: {
			title: '获取脚本执行队列',
			method: 'ipc',
			path: 'controller.batch.get_script_exec_queue',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					p: {
						type: 'number',
						required: false,
						description: '页码',
					},
					rows: {
						type: 'number',
						required: false,
						description: '每页数量',
					},
					script_id: {
						type: 'number',
						required: false,
						description: '通过脚本ID筛选',
					},
					record_id: {
						type: 'number',
						required: false,
						description: '通过记录ID筛选',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		get_server_list: {
			title: '获取服务器列表',
			method: 'ipc',
			path: 'controller.batch.get_server_list',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		get_crontab_list: {
			title: '获取定时任务列表',
			method: 'ipc',
			path: 'controller.batch.get_crontab_list',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					p: {
						type: 'number',
						required: false,
						description: '页码',
					},
					rows: {
						type: 'number',
						required: false,
						description: '每页数量',
					},
					search: {
						type: 'string',
						required: false,
						description: '搜索关键字',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		create_crontab: {
			title: '创建定时任务',
			method: 'ipc',
			path: 'controller.batch.create_crontab',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					task_name: {
						type: 'string',
						required: true,
						description: '任务名称',
					},
					script_id: {
						type: 'number',
						required: true,
						description: '脚本ID',
					},
					ssh_type_id_list: {
						type: 'string',
						required: true,
						description: '服务器类型ID列表',
					},
					ssh_id_list: {
						type: 'string',
						required: true,
						description: '服务器ID列表',
					},
					task_type: {
						type: 'string',
						required: true,
						description: '任务类型',
					},
					// MONTH: 每月，如：每月1日15:00执行（cycle=MONTH,day=1,hour=15,minute=0）
					// WEEK: 每周，如：每周三15:30执行（cycle=WEEK,day=3,hour=15,minute=30）
					// DAY：每天，如：每天23:59执行（cycle=DAY,day=0,hour=23,minute=59）
					// N-DAY: 每隔N天，如：每隔3天12小时30分执行（cycle=N-DAY,day=3,hour=12,minute=30）
					// HOUR：每小时，如：每小时第40分钟执行（cycle=HOUR,day=0,hour=0,minute=40）
					// N-HOUR: 每隔N小时，如：每隔2小时20分钟执行（cycle=N-HOUR,day=0,hour=2,minute=20）
					// N-MINUTE: 每隔N分钟，如：每隔10分钟执行（cycle=N-MINUTE,day=0,hour=0,minute=10）
					// N-SECOND: 每隔N秒钟，如：每隔30秒钟执行（cycle=N-SECOND,day=0,hour=0,minute=0,second=30）
					cycle: {
						type: 'string',
						required: true,
						description: '周期',
					},
					day: {
						type: 'string',
						required: true,
						description: '天',
					},
					hour: {
						type: 'string',
						required: true,
						description: '小时',
					},
					minute: {
						type: 'string',
						required: true,
						description: '分钟',
					},
					second: {
						type: 'string',
						required: true,
						description: '秒',
					},
					remark: {
						type: 'string',
						required: false,
						description: '备注',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		modify_crontab: {
			title: '修改定时任务',
			method: 'ipc',
			path: 'controller.batch.modify_crontab',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					task_id: {
						type: 'number',
						required: true,
						description: '任务ID',
					},
					script_id: {
						type: 'number',
						required: true,
						description: '脚本ID',
					},
					ssh_type_id_list: {
						type: 'string',
						required: true,
						description: '服务器类型ID列表',
					},
					ssh_id_list: {
						type: 'string',
						required: true,
						description: '服务器ID列表',
					},
					task_type: {
						type: 'string',
						required: true,
						description: '任务类型',
					},
					cycle: {
						type: 'string',
						required: true,
						description: '周期',
					},
					day: {
						type: 'string',
						required: true,
						description: '天',
					},
					hour: {
						type: 'string',
						required: true,
						description: '小时',
					},
					minute: {
						type: 'string',
						required: true,
						description: '分钟',
					},
					second: {
						type: 'string',
						required: true,
						description: '秒',
					},
					remark: {
						type: 'string',
						required: false,
						description: '备注',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		remove_crontab: {
			title: '删除定时任务',
			method: 'ipc',
			path: 'controller.batch.remove_crontab',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					task_id: {
						type: 'number',
						required: true,
						description: '任务ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		get_crontab_info: {
			title: '获取定时任务信息',
			method: 'ipc',
			path: 'controller.batch.get_crontab_info',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					task_id: {
						type: 'number',
						required: true,
						description: '任务ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		get_crontab_record: {
			title: '获取定时任务执行记录',
			method: 'ipc',
			path: 'controller.batch.get_crontab_record',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					task_id: {
						type: 'number',
						required: true,
						description: '任务ID',
					},
					p: {
						type: 'number',
						required: false,
						description: '页码',
					},
					rows: {
						type: 'number',
						required: false,
						description: '每页数量',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		execute_crontab: {
			title: '立即执行定时任务',
			method: 'ipc',
			path: 'controller.batch.execute_crontab',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					task_id: {
						type: 'number',
						required: true,
						description: '任务ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		get_soft_type: {
			title: '获取软件分类',
			method: 'ipc',
			path: 'controller.batch.get_soft_type',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		create_soft_type: {
			title: '创建软件分类',
			method: 'ipc',
			path: 'controller.batch.create_soft_type',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					type_name: {
						type: 'string',
						required: true,
						description: '分类名称',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		modify_soft_type: {
			title: '修改软件分类',
			method: 'ipc',
			path: 'controller.batch.modify_soft_type',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					type_id: {
						type: 'number',
						required: true,
						description: '分类ID',
					},
					type_name: {
						type: 'string',
						required: true,
						description: '分类名称',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		remove_soft_type: {
			title: '删除软件分类',
			method: 'ipc',
			path: 'controller.batch.remove_soft_type',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data: {
					type_id: {
						type: 'number',
						required: true,
						description: '分类ID',
					}
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},

		get_soft_list: {
			title: '获取软件列表',
			method: 'ipc',
			path: 'controller.batch.get_soft_list',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					p: {
						type: 'number',
						required: false,
						description: '页码',
					},
					rows: {
						type: 'number',
						required: false,
						description: '每页数量',
					},
					search: {
						type: 'string',
						required: false,
						description: '搜索关键字',
					},
					type_id: {
						type: 'number',
						required: false,
						description: '类型ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		get_soft_info: {
			title: '获取软件信息',
			method: 'ipc',
			path: 'controller.batch.get_soft_info',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					soft_id: {
						type: 'number',
						required: true,
						description: '软件ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		create_soft: {
			title: '创建软件',
			method: 'ipc',
			path: 'controller.batch.create_soft',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					// softTitle := r.FormValue("soft_title")
					// remark := r.FormValue("remark")
					// softVersion := r.FormValue("soft_version")
					// typeIdStr := r.FormValue("type_id")
					// softPath := r.FormValue("soft_path")

					soft_title: {
						type: 'string',
						required: true,
						description: '软件标题',
					},
					remark: {
						type: 'string',
						required: false,
						description: '备注',
					},
					soft_version: {
						type: 'string',
						required: true,
						description: '软件版本',
					},
					type_id: {
						type: 'number',
						required: true,
						description: '分类ID',
					},
					soft_path: {
						type: 'string',
						required: true,
						description: '文件路径,请调用文件选择器选择文件: controller.batch.file_selector',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		modify_soft: {
			title: '修改软件',
			method: 'ipc',
			path: 'controller.batch.modify_soft',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					soft_id: {
						type: 'number',
						required: true,
						description: '软件ID',
					},
					soft_title: {
						type: 'string',
						required: true,
						description: '软件标题',
					},
					remark: {
						type: 'string',
						required: false,
						description: '备注',
					},
					soft_version: {
						type: 'string',
						required: true,
						description: '软件版本',
					},
					type_id: {
						type: 'number',
						required: true,
						description: '分类ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			}
		},
		remove_soft: {
			title: '删除软件',
			method: 'ipc',
			path: 'controller.batch.remove_soft',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					soft_id: {
						type: 'number',
						required: true,
						description: '软件ID',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
				},
			},
		},
		get_soft_install_record: {
			title: '获取软件安装记录',
			method: 'ipc',
			path: 'controller.batch.get_soft_install_record',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					soft_id: {
						type: 'number',
						required: true,
						description: '软件ID',
					},
					p: {
						type: 'number',
						required: false,
						description: '页码',
					},
					rows: {
						type: 'number',
						required: false,
						description: '每页数量',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		execute_soft_install: {
			title: '执行软件安装',
			method: 'ipc',
			path: 'controller.batch.execute_soft_install',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				},
				data:{
					soft_id: {
						type: 'number',
						required: true,
						description: '软件ID',
					},
					ssh_type_id_list: {
						type: 'string',
						required: true,
						description: '服务器类型ID列表,多个以逗号分隔',
					},
					ssh_id_list: {
						type: 'string',
						required: true,
						description: '服务器ID列表,多个以逗号分隔',
					},
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'object',
				},
			},
		},
		get_soft_install_queue: {
			title: '获取软件安装队列',
			method: 'ipc',
			path: 'controller.batch.get_soft_install_queue',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'array',
				},
			},
		},
		file_selector: {
			title: '文件选择器(通用)',
			method: 'ipc',
			path: 'controller.batch.file_selector',
			args: {
				channel: {
					type: 'string',
					required: true,
					description: '通道标识',
				}
			},
			result: {
				type: 'object',
				format: {
					status: 'boolean',
					msg: 'string',
					data: 'string', // 如果status=true,这里返回用户选择的文件路径
				},
			},
		},
	}
};

export default routes;
