<template>
	<div class="main h-full">
		<el-scrollbar>
			<router-view v-slot="{ Component, route }" :key="key">
				<keep-alive :include="['Terminal', 'Home']">
					<component :is="Component" :key="route.path" />
				</keep-alive>
			</router-view>
		</el-scrollbar>
	</div>
</template>

<script lang="ts" setup>
const key = computed(() => {
	return Math.random()
})
</script>

<style scoped lang="scss"></style>
