import { defineStore } from 'pinia'
import { type Panel_Params, NewPanel_Params } from '@/views/panel/controller'

export const usePanelBase = defineStore(
	'panelBase',
	() => {
		const addGroupVisible = ref(false) // 添加分组弹窗
		const isEditGroup = ref(false) // 是否编辑分组
		const editGroupParams = ref({
			group_id: 0,
			group_name: '',
		}) // 编辑分组参数
		const scriptList = ref<SelectOptions[]>([]) // 面板安装脚本列表
		const installLogVisible = ref(false) // 安装日志弹窗
		const installParams = ref<NewPanel_Params>({
			host: '',
			port: 22,
			username: '',
			password: '',
			auth_type: 0,
			group_id: 0,
			proxy_id: 0,
			isSSH: false,
			privateKey: null,
			version: '',
			installTitle: '',
		}) // 安装参数
		// IP类型是否为内网
		const innerIP = ref(false)

		const resultsVisible = ref(false) // 安装结果弹窗
		const resultsParams = ref() // 安装结果参数

		const groupManageVisible = ref(false) // 分组管理弹窗

		const isShowIP = ref(true) // 是否显示IP
		const addPanelVisible = ref(false) // 添加面板弹窗
		const isEdit = ref(false) // 是否编辑模式
		const panelParams = ref<Panel_Params>()

		const currentGroupID = ref(-1) // 当前分组ID

		const groupList = ref<groupOptions[]>([]) // 面板分组列表
		const proxyList = ref<proxyOptions[]>([]) // 代理列表
		return {
			scriptList,
			installLogVisible,
			installParams,
			innerIP,
			resultsVisible,
			resultsParams,
			addGroupVisible,
			isEditGroup,
			editGroupParams,
			groupManageVisible,
			isShowIP,
			addPanelVisible,
			isEdit,
			panelParams,
			groupList,
			proxyList,
			currentGroupID,
		}
	},
	{
		persist: {
			paths: ['isShowIP', 'currentGroupID'],
		},
	}
)
