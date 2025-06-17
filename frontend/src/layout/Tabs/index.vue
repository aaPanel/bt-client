<template>
	<div class="flex layout-header">
		<!-- 菜单栏 -->
		<Menu />
		<!-- 面板已打开的列表 -->
		<List />
		<!-- 空白区域【鼠标事件】 -->
		<operation />
	</div>
</template>

<script setup lang="ts">
import Menu from './menu.vue'
import List from './list.vue'
import operation from './operation.vue'
</script>

<style scoped lang="scss">
.layout-header {
	position: relative;
	background-color: #d3e3fd;
}
</style>
