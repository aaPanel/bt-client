<template>
	<div class="pt-[2.4rem] px-[3.6rem] setting-style">
		<h1>{{ pub.lang('设置') }}</h1>
		<el-divider></el-divider>
		<el-form label-width="auto" size="large">
			<el-form-item :label="pub.lang('账号')">
				<el-input v-model="account" class="!w-[28rem] mr-4" disabled />
				<el-button type="primary" @click="handleUnbind">{{
					pub.lang(info.username ? '解绑' : '绑定')
				}}</el-button>
			</el-form-item>
			<el-form-item :label="pub.lang('同步至云端')">
				<el-switch v-model="configData.sync_cloud" @change="hanelCloudSync" />
				<el-button size="small" @click="handleSyncPassword" class="ml-8">{{
					pub.lang('同步密码')
				}}</el-button>
				<el-button
					size="small"
					:disabled="!configData.sync_cloud"
					@click="handle_sync"
					class="ml-8"
					>{{ pub.lang('手动同步') }}</el-button
				>
				<span class="ml-8 help-text-color">{{
					pub.lang('*开启同步后，同一账号及同步密码的其他设备将自动接收本设备的增量数据')
				}}</span>
			</el-form-item>
			<el-form-item :label="pub.lang('免密登录')">
				<el-switch v-model="configData.not_password" @change="hanelNotPassword" />
				<el-button size="small" @click="handleEditManage" class="ml-8">{{
					pub.lang('修改管理密码')
				}}</el-button>
				<span class="ml-8 help-text-color">{{
					pub.lang('*开启免密登录后，无需每次打开应用时输入管理密码')
				}}</span>
			</el-form-item>
			<el-form-item :label="pub.lang('主题颜色')">
				<el-radio-group v-model="Theme" @change="handleTheme">
					<el-radio value="lightMode">{{ pub.lang('明亮模式') }}</el-radio>
					<el-radio value="darkMode">{{ pub.lang('暗黑模式') }}</el-radio>
				</el-radio-group>
			</el-form-item>
			<el-form-item :label="pub.lang('关闭按钮')">
				<el-radio-group v-model="configData.exit_action" @change="handleExit">
					<el-radio value="close">{{ pub.lang('最小化到系统托盘') }}</el-radio>
					<el-radio value="exit">{{ pub.lang('关闭应用') }}</el-radio>
				</el-radio-group>
			</el-form-item>
			<el-form-item :label="pub.lang('当前版本')">
				<span>{{ configData.version }}</span>
				<!-- <el-button class="ml-8" size="small" @click="handelCheckUpdate">{{ pub.lang('检查更新') }}</el-button> -->
			</el-form-item>
			<el-form-item :label="pub.lang('系统语言')">
				<el-select v-model="languageType" style="width: 10rem" @change="handleLang">
					<el-option
						v-for="item in languageList"
						:key="item.name"
						:label="item.title"
						:value="item.name"></el-option>
				</el-select>
			</el-form-item>
		</el-form>
		<h1 class="mt-[4rem]">{{ pub.lang('代理池') }}</h1>
		<el-divider></el-divider>
		<el-button type="primary" size="large" @click="handleAddProxy" class="mb-[2rem]">{{
			pub.lang('添加代理')
		}}</el-button>

		<el-table
			:data="proxyList"
			style="width: 650px"
			height="280"
			:empty-text="pub.lang('暂无数据')">
			<el-table-column prop="proxy_name" :label="pub.lang('名称')"></el-table-column>
			<el-table-column prop="proxy_ip" :label="pub.lang('IP')" width="120"></el-table-column>
			<el-table-column prop="proxy_port" :label="pub.lang('端口')" width="80"></el-table-column>
			<el-table-column prop="proxy_type" :label="pub.lang('类型')" width="80">
				<template #default="{ row }">
					{{ row.proxy_type === 0 ? 'HTTP' : row.proxy_type === 1 ? 'HTTPS' : 'SOCKS5' }}
				</template>
			</el-table-column>
			<el-table-column :label="pub.lang('操作')" align="right" width="120">
				<template #default="{ row }">
					<el-button link size="small" type="primary" @click="editProxy(row)">{{
						pub.lang('编辑')
					}}</el-button>
					<el-button link size="small" type="primary" @click="removeProxy(row)">{{
						pub.lang('删除')
					}}</el-button>
				</template>
			</el-table-column>
		</el-table>

		<!-- 添加、编辑代理 -->
		<addProxy ref="proxyRef" @refresh="getProxyList" />
		<NotPassword ref="notpwRef" @close="configData.not_password = false" @refresh="getConfig" />
		<SyncPassword ref="syncpwRef" @refresh="getConfig" />
	</div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useSettingStore } from '@/store/setting'
import { useUserStore } from '@/store/user'
import { common, routes } from '@api/http'
import { useMessage } from '@utils/hooks/message'
import addProxy from './components/addProxy.vue'
import NotPassword from './components/notPassword.vue'
import SyncPassword from './components/syncPassword.vue'
import { useLanguage } from '@plugins/language'
import { useTheme } from '@/plugins/theme'
import { pub,formatTime } from '@utils/tools'
import { handle_sync } from './controller'

const router = useRouter()
const Message = useMessage() // 消息提示
const { switchDark } = useTheme()
const { setLanguage } = useLanguage()

const useStore = useSettingStore()
const useUStore = useUserStore()
const { dark } = storeToRefs(useStore)
const { info, isLogin } = storeToRefs(useUStore)
const Theme = ref('lightMode')

const proxyRef = ref()
const languageList = ref(window.languageList.languages)
const languageType = ref(window.languageList.current)
const notpwRef = ref()
const syncpwRef = ref()
const panelInfo = ref({})
const proxyList = ref([])
const configData: {
	sync_cloud: boolean
	exit_action: string
	not_password: boolean
	sync_password: string
	version: string
} = reactive({
	sync_cloud: false, // 同步至云端
	sync_password: '', // 同步密码
	exit_action: 'close', // 关闭按钮
	not_password: false, // 免密登录
	version: '',
})

// 账号
const account = computed(() => {
	//将中间四位替换为*
	return (
		info.value.username.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || pub.lang('[未绑定宝塔账号]')
	)
})
// 获取配置信息
const getConfig = () => {
	common.send(routes.index.get_config.path, {}, (result: any) => {
		const { sync_cloud, sync_password, exit_action, not_password, version } = result.data
		configData.sync_cloud = (sync_cloud && sync_password != '') || false
		configData.sync_password = sync_password
		configData.exit_action = exit_action || 'close'
		configData.not_password = not_password || false
		configData.version = version
	})
}
// 同步至云端
const hanelCloudSync = async () => {
	if (!isLogin.value) {
		Message.error(pub.lang('请绑定宝塔账号后再开启同步至云端'))
		configData.sync_cloud = false
		return
	}
	if (!configData.sync_password) {
		configData.sync_cloud = false
		syncpwRef.value.acceptParams()
		return
	}
	const res: any = await setConfig('sync_cloud', configData.sync_cloud)
	Message.request(res)
	if (!res.status) {
		configData.sync_cloud = !configData.sync_cloud
	}
}
// 同步密码
const handleSyncPassword = () => {
	syncpwRef.value.acceptParams()
}
// 设置免密登录
const hanelNotPassword = async (val: any) => {
	if (val) {
		notpwRef.value.acceptParams({ notpw: true })
	} else {
		const res: any = await setConfig('not_password', false)
		Message.request(res)
	}
}
// 修改管理密码
const handleEditManage = () => {
	notpwRef.value.acceptParams({ isEdit: true })
}
// 关闭按钮
const handleExit = async () => {
	const res: any = await setConfig('exit_action', configData.exit_action)
	Message.request(res)
}

// 配置保存
const setConfig = async (key: string, value: any) => {
	return await common.sendAsync({ route: routes.index.set_config.path, data: { key, value } })
}

// 获取代理列表
const getProxyList = () => {
	common.send(routes.proxy.getProxyList.path, {}, (result: any) => {
		proxyList.value = result.data
	})
}
// 添加代理
const handleAddProxy = () => {
	proxyRef.value.acceptParams({})
}
// 编辑代理
const editProxy = (row: any) => {
	proxyRef.value.acceptParams(row)
}
// 删除代理
const removeProxy = (row: any) => {
	ElMessageBox.confirm(
		pub.lang('是否将【{}】从列表中删除?', row.proxy_name),
		pub.lang('删除代理'),
		{
			confirmButtonText: pub.lang('确认'),
			cancelButtonText: pub.lang('取消'),
			type: 'warning',
		}
	).then(async () => {
		let res: any = await common.sendAsync({
			route: routes.proxy.delProxy.path,
			data: {
				proxy_id: row.proxy_id,
			},
		})
		Message.request(res)
		if (res.status) {
			getProxyList()
		}
	})
}

// 主题切换
const handleTheme = (command: any) => {
	dark.value = command === 'darkMode'
	Theme.value = command
	switchDark()
}

// 检查更新
const handelCheckUpdate = () => {
	console.log('检查更新')
	common.send(routes.index.check_update.path, {}, (result: any) => {
		console.log('result:', result)
	})
}

// 中英文切换
const handleLang = (command: any) => {
	setLanguage(command, true)
	window.location.reload()
}
// 解绑账号
const handleUnbind = () => {
	common.send(routes.user.unbind.path, {}, (result: any) => {
		if (result.status) {
			isLogin.value = false
			router.push({ path: '/login' })
		}
	})
}
onMounted(async () => {
	Theme.value = dark.value ? 'darkMode' : 'lightMode'
	await useUStore.getBindUser()
	// 获取代理列表
	getProxyList()

	// 获取配置信息
	getConfig()
})
</script>

<style scoped lang="scss">
// .setting-style {
// :deep(.el-from) {
// 	.el-form .el-form-item__label {
// 		font-size: inherit !important;
// 	}
// }
// }
</style>
