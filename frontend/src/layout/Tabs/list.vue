<template>
	<div class="w-full flex flex-1">
		<div class="tabs-container flex-1" @click="handleClick">
			<div class="flex">
				<tabsMenu
					ref="tabChrome"
					class="w-full"
					:tabs="panelList"
					v-model="panelActive"
					@click="showPanelView"
					@remove="deletePanel"
					@refresh="refreshPanel"
					@contextmenu="openMenu" />
			</div>
		</div>
		
		<!-- 下载进度 -->
		<div v-show="noXtermRouter" class="flex items-center w-[3rem]">
			<template v-if="status === 'download'">
				<el-progress
					@click="openDownLoadView"
					type="circle"
					:percentage="downloadFile.percent"
					status="success"
					color="#409eff"
					:stroke-width="2"
					:width="20">
					<svg
						t="1724315093957"
						class="icon"
						viewBox="0 0 1024 1024"
						version="1.1"
						xmlns="http://www.w3.org/2000/svg"
						p-id="48179"
						width="12"
						height="12">
						<path
							d="M846.7456 421.96992L591.872 676.757504V73.728h-159.744v603.041792L177.225728 421.96992l-113.195008 113.164288 391.430144 391.389184c15.607808 15.663104 36.114432 23.492608 56.573952 23.492608 20.45952 0 40.972288-7.831552 56.633344-23.492608l391.288832-391.389184-113.211392-113.164288z"
							p-id="48180"
							fill="#409eff"></path>
					</svg>
				</el-progress>
			</template>
			<template v-else>
				<el-tooltip
					class="item"
					effect="dark"
					:content="endTips"
					placement="left"
					:visible.sync="downloadTooltip">
					<div class="download-end" @click="openDownLoadView">
						<svg
							t="1724315212639"
							class="icon"
							viewBox="0 0 1024 1024"
							version="1.1"
							xmlns="http://www.w3.org/2000/svg"
							p-id="49349"
							width="16"
							height="16">
							<path
								d="M938.855808 638.776382l0 270.299169c0 27.41028-22.210861 49.634444-49.621141 49.634444l-754.442728 0c-27.41028 0-49.647747-22.224164-49.647747-49.634444L85.144192 638.776382c0-27.41028 22.224164-49.634444 49.634444-49.634444s49.634444 22.224164 49.634444 49.634444l0 220.664725 655.17384 0L839.58692 638.776382c0-27.41028 22.224164-49.634444 49.634444-49.634444S938.855808 611.366102 938.855808 638.776382zM476.55165 701.027168c9.335622 9.534144 22.116717 14.905478 35.46063 14.905478 13.344936 0 26.121937-5.371334 35.461653-14.905478l198.014866-202.167442c19.179828-19.583011 18.85544-51.006697-0.732687-70.190619-19.587104-19.175735-51.016931-18.85544-70.196759 0.731664l-112.924909 115.285676L561.634444 114.924449c0-27.41028-22.224164-49.634444-49.634444-49.634444-27.41028 0-49.634444 22.224164-49.634444 49.634444l0 429.754834L349.473393 429.40077c-19.179828-19.583011-50.590212-19.902282-70.186526-0.731664-19.583011 19.179828-19.910469 50.603515-0.730641 70.190619L476.55165 701.027168z"
								p-id="49350"
								fill="#555555"></path>
						</svg>
					</div>
				</el-tooltip>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import tabsMenu from '@/components/TabsMenu/index.vue'
import { storeToRefs } from 'pinia'
import { useSettingStore } from '@store/setting'
import { useRoute, useRouter } from 'vue-router'
import { common, routes, ipc } from '@api/http'

const route = useRoute()
const router = useRouter()
const useStore = useSettingStore()

const { mainWidth, mainHeight, panelList, panelActive, addPanel,hideProIcon } = storeToRefs(useStore)
const tabChrome = ref()

const status = ref('')
const noXtermRouter = ref(true)
const downloadFile = ref<{ percent?: number }>({})
const downloadTooltip = ref(false)
const endTips = ref('')
const showLoginPopover = ref(false)

const openMenu = (event: MouseEvent, tab: any) => {
	common.send(routes.window.set_tab_context_menu.path, {
		key: tab.key,
		type: 'rightClick',
	})
}
// 面板刷新图标事件
const refreshPanel = (tab: any,index:number) => {
	common.send(routes.window.refresh_panel.path, { view_key: tab.key })
}

// 监听面板内的文件下载
const downloadListener = () => {
	ipc.on('download-progress', (event: any, arg: any) => {
		status.value = 'download' // 下载中
		downloadFile.value = arg // 下载进度
		if (arg.percent === 100 || arg.total === 0 || arg.percent < 0) {
			downloadEnd()
			endTips.value = arg.percent < 0 ? '下载失败' : '下载已完成'
		}
	})
}
// 下载完成
const downloadEnd = () => {
	status.value = 'end' // 下载完成
	downloadFile.value = {}
	setTimeout(() => {
		downloadTooltip.value = false
	}, 3000)
}
// 打开下载列表
const openDownLoadView = () => {
	common.send(routes.window.open_download_window.path, {}, (res: any) => {})
}

// 跳转到登录页面
const goToLogin = () => {
	showLoginPopover.value = false
	router.push('/login')
}
downloadListener()
// 添加面板
watch(
	() => addPanel.value,
	val => {
		// val不是空对象
		if (Object.keys(val).length) {
			tabChrome.value.addTab(val)
			addPanel.value = {}
		}
	}
)
// 显示视图
const showPanelView = (event?: Event, tab?: any, index?: number) => {
	if (route.path.indexOf('details') === -1) {
		router.push(`/details/${tab.id}&${tab.key}`)
		return false
	}
	common.send(routes.window.show.path, { view_key: panelActive.value }, (res: any) => {})
	panelViewBounds()
}
// 设置视图位置
const panelViewBounds = () => {
	common.send(
		routes.window.set_bounds.path,
		{
			view_key: panelActive.value,
			bounds: { x: 0, y: 40, width: mainWidth.value, height: mainHeight.value },
		},
		(result: any) => {
			// console.log(result)
		}
	)
}
// 处理标签底部点击不会触发自身点击事件
const handleClick = (event: Event) => {
	// 如果点击的元素是tabs-item，但不含active类名
	if (
		event.target &&
		(event.target as HTMLElement).classList.contains('tabs-item') &&
		!(event.target as HTMLElement).classList.contains('active')
	) {
		// 获取当前event处于tabs-item的索引
		const target = event.target as HTMLElement;
		const parent = target.parentNode as HTMLElement;
		if (parent && parent.children) {
			const index = Array.from(parent.children).indexOf(target);
			// 获取当前索引对应的key
			const key = panelList.value[index].key
			// 设置当前激活的面板
			panelActive.value = key
			showPanelView(event, panelList.value[index], index)
		}
	}
}

// 监听宽度变化 [调整面板视图位置]
watch(
	() => mainWidth.value,
	val => {
		if (route.path.indexOf('details') === -1) return
		panelViewBounds()
	}
)
watch(
	() => route.path,
	val => {
		if (val.indexOf('xterm') > -1) {
			noXtermRouter.value = false
		} else {
			noXtermRouter.value = true
		}
	}
)
// 处理面板复制
const handlePanelDuplicate = () => {
	ipc.on('duplicate-panel', (event: any, key: string) => {
		const current = panelList.value.find(panel => panel.key === key)
		if (current) {
			// 找到要复制的面板
			router.push({
				name: 'details',
				params: { id:current.id,key:new Date().getTime() },
			})
		}
  })
}

// 处理面板关闭
const handlePanelClose = () => {
  ipc.on('close-panel', (event: any, key: string) => {
    tabChrome.value.removeTab(key)
  })
}

// 关闭面板
const deletePanel = (tab: any, index: number) => {
	// 关闭选择项
	common.send(routes.window.destroy.path, { view_key: tab.key }, (result: any) => {
		// 激活项不为空
		if (panelActive.value) {
			showPanelView()
		} else {
			router.push(`/home`) // 跳转到面板列表
		}
	})
}
onMounted(() => {
	if (route.path == '/xterm') {
		noXtermRouter.value = false
	}
  handlePanelDuplicate() // 添加复制面板监听
  handlePanelClose()     // 添加关闭面板监听
})
// 在组件卸载时移除事件监听
onUnmounted(() => {
  ipc.removeAllListeners('duplicate-panel')
  ipc.removeAllListeners('close-panel')
})
</script>

<style lang="sass" scoped>
:deep(.el-progress)
	.el-progress__text
		display: flex
		left: 4px
.download-end
	position: relative
	cursor: pointer
	z-index:1
	&:hover::before
		content: ''
		background-color: #a8c7fa
		position: absolute
		width: 3rem
		height: 3rem
		display: inline-block
		left: -7px
		top: -6px
		border-radius: 20px
		z-index:-1
.dark
	.download-end
		&:hover::before
			background-color: #1f1f1f
</style>
