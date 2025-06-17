<template>
	<div class="layout h-full">
		<div class="layout-tabs select-none" id="layout-tabs"><Tabs /></div>
		<div class="layout-right-main" ref="layoutBody"><Main /></div>
	</div>
</template>

<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import Tabs from './Tabs/index.vue'
import Main from './Main/index.vue'
import { useTheme } from '@/plugins/theme'
import { useSettingStore } from '@store/setting'

const layoutBody = ref<HTMLElement>() // 主视图区域

const useStore = useSettingStore()
const { mainWidth } = storeToRefs(useStore)
const { switchDark } = useTheme()

useResizeObserver(layoutBody, entries => {
	const entry = entries[0]
	const { width, height } = entry.contentRect
	const footer = document.getElementById('layout-tabs')
	const footerRect = footer?.getBoundingClientRect()
	const footerWidth = footerRect?.width || 0
	mainWidth.value = footerWidth
	// mainHeight.value = height // 2px为偏移和预留空间
	useStore.setMainHeight(height)
	// console.log(`Resize observed: height=${height}, width=${width}`)
})
onMounted(() => {
	switchDark()
})
</script>

<style scoped lang="scss">
.layout {
	display: flex;
	width: 100%;
	min-height: 100vh;
	max-height: 100vh;
	flex-direction: column;
	background-color: var(--el-bg-color);
	// 	z-index: 0;
	.layout-right-main {
		flex: 1;
		display: block;
		overflow: auto;
		position: relative;
	}
}
</style>
