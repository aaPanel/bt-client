import { defineStore } from 'pinia'
interface PanelParams {
	label: string
	key: string
	id: number
	favico?: string | (() => string)
}
export const useSettingStore = defineStore('settingStore', {
	state: () => {
		return {
			mainWidth: 0, // 主体宽度
			mainHeight: 0, // 主体高度
			fileManagementWidth: 300, // 文件管理宽度
			maximized: false, // 是否最大化
			panelList: [] as PanelParams[], // 面板列表
			addPanel: {} as PanelParams | {}, // 添加面板
			lang: {}, // 语言包
			panelActive: '', // 当前激活面板
			locale: 'zh', // 语言
			dark: false, // 暗号模式
			downloadFile: {}, // 下载文件
			serverRefresh: {
				status: false,
				param: {},
			},
		}
	},
	getters: {},
	actions: {
		setMainHeight(val: number) {
			this.mainHeight = val
		},
		setLocale(locale: string) {
			this.locale = locale
		},
	},
	persist: {
		paths: ['dark', 'locale'],
	},
})
