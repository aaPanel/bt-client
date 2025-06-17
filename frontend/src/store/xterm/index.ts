import { defineStore } from 'pinia'
import { type xterm_connection_params } from '@views/xterm/controller'

export const useXtermBase = defineStore('xtermBase', () => {
	// 服务器列表排序开关
	const serverSort = ref(false)
	// 测试窗口
	const testConnectionDialog = ref(false)
	// 测试窗口数据
	const testConnectionData = ref<xterm_connection_params>()
	// 测试状态
	const testCodeStatus = ref(0) // 0:连接中 1:连接成功 2:连接失败
	// 终端区域文件上传
	const commadUpload = ref({
		visible: false,
		progress: 0,
		filename: '',
		status: false,
	})
	// 重置终端区域文件上传
	function resetCommandUpload() {
		commadUpload.value = {
			visible: false,
			progress: 0,
			filename: '',
			status: false,
		}
	}
	return {
		serverSort,
		testConnectionDialog,
		testConnectionData,
		testCodeStatus,
		commadUpload,
		resetCommandUpload,
	}
})
