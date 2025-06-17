<template>
	<div></div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSettingStore } from '@store/setting'
import { common, routes, ipc } from '@api/http'
import { pub } from '@utils/tools'

const useStore = useSettingStore()
import { useMessage } from '@utils/hooks/message'
const { mainWidth, mainHeight, panelList, panelActive, addPanel } = storeToRefs(useStore)
const route = useRoute()
const router = useRouter()

const Message = useMessage() // 消息提示
const xBounds = 0 // x轴偏移量
const yBounds = 40 // y轴偏移量

// 获取当前key
const getCurrentRefKey = () => {
	const key = panelList.value.find((item: any) => item.key === panelActive.value)
	if (key) return key.key
}
// 显示视图
const showPanelView = () => {
	common.send(routes.window.show.path, { view_key: getCurrentRefKey() }, (res: any) => {
		// 设置位置
		panelViewBounds()
	})
}
// 设置视图位置
const panelViewBounds = () => {
	common.send(
		routes.window.set_bounds.path,
		{
			view_key: panelActive.value,
			bounds: { x: xBounds, y: yBounds, width: mainWidth.value, height: mainHeight.value },
		},
		(result: any) => {
			// console.log(result)
		}
	)
}

// Ctrl+1-9切换面板 / Ctrl+Tab切换面板
const onKeyEvents = () => {
	ipc.on('panel-switch', (event: any, result: any) => {
		if (result === 'next') {
			const index = panelList.value.findIndex((item: any) => item.key === panelActive.value)
			if (index === panelList.value.length - 1) {
				onPanelSwitch(0)
			} else {
				onPanelSwitch(index + 1)
			}
		} else if (Number(result) >= 1) {
			const index = parseInt(result) - 1
			if (panelList.value[index]) {
				onPanelSwitch(index)
			}
		}
	})
}

// 触发面板切换
const onPanelSwitch = (index: any) => {
	const currentTab = panelList.value[index]
	const key = currentTab.key
	panelActive.value = key
	showPanelView()
	if (route.path.indexOf('details') === -1) {
		router.push(`/details/${currentTab.id}&${index}`)
		return false
	}
}

// 返回列表
const goBack = () => {
	router.push(`/home`)
}
// 创建面板
const createPanel = (item: any) => {
	// item.key = new Date().getTime() // 随机id
	addPanel.value = item // 添加面板tab
	panelActive.value = item.key // 激活当前面板
	// 创建面板子视图
	createChildView(item)
}
// 创建面板子视图
const createChildView = (item: any) => {
	common.send(
		routes.window.create.path,
		{
			view_key: item.key,
			url: item.url,
			options: {},
			bounds: {
				x: xBounds,
				y: yBounds,
				width: mainWidth.value,
				height: mainHeight.value,
			},
			auto_resize: {
				width: true,
				height: true,
				horizontal: true,
				vertical: true,
			},
			proxy_id: item.proxy_id,
		},
		(result: any) => {
			// console.log(result, item, '创建')
		}
	)
}
// 初始化面板
const initPanel = () => {
	const {id,key} = route.params

	// 情况一：key是否已经存在（当处于其他路由切换回details时）
	if(panelList.value.length > 0 && panelList.value.find((item: any) => item.key === key)){
		panelActive.value = key as string
		showPanelView()
		return
	}

	// 情况二：创建新的列表
  const load = Message.load(pub.lang('正在创建面板应用'))
	
	try {
		// 获取面板信息
		common.send(routes.panel.find.path, { panel_id: id }, (info: any) => {
			// 获取拼接的token
			common.send(routes.panel.get_tmp_token.path, { panel_id: id }, (res: any) => {
				if (!res.data) {
					Message.error(res.msg)  // 错误提示

					if (panelList.value.length === 0) return goBack()
					// 切换上一个面板
					panelActive.value = panelList.value[panelList.value.length - 1].key
					showPanelView()
				} else {
					// 检查id是否存在当前列表
					const isIdExist = panelList.value.find((item: any) => item.id === id)
					// 创建新面板
					createPanel({
						id,
						url: isIdExist ? info.data.url : res.data, // ID存在使用旧的token
						label: info.data.title,
						proxy_id: info.data.proxy_id,
						key: key,
						favico: () => {
							return ' '
						},
					})
				}
			})
		})
	} finally {
		load.close()
	}
}

initPanel()
watch(
	() => route.params,
	() => {
		initPanel()
	}
)
onMounted(() => {
	// 监听快捷键
	onKeyEvents()
})

onBeforeUnmount(() => {
	common.send(routes.window.list.path, {}, (res: any) => {
		res.data.forEach((item: any) => {
			common.send(routes.window.hide.path, { view_key: item }, (result: any) => {
				panelActive.value = ''
			})
		})
	})
})
</script>
