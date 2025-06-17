<script setup lang="ts">
import { computed, reactive } from 'vue';

const props = defineProps({
	type: {
		type: String,
		default: 'font-class'
	},
	className: {
		type: String,
		default: ''
	},
	icon: {
		type: String,
		require: true
	},
	size: {
		type: [String, Number],
		default: '16'
	},
	color: {
		type: String,
		default: '#8a8a8a'
	}
});
const style = reactive({
	icon: props.icon,
	'font-size': props.size + 'px',
	color: props.color
});
// 给图标添加上类名
const svgClass = computed(() => {
	if (props.className) {
		return `svg-icon ${props.className}`;
	}
	return 'svg-icon';
});
</script>

<template>
	<div class="my-icon">
		<template v-if="type == 'font-class'">
			<i :class="'iconfont ' + icon" :style="style"><slot></slot></i>
		</template>
		<template v-if="type == 'svg'">
			<svg :class="svgClass" aria-hidden="true" :style="style"><use :xlink:href="'#' + icon" :fill="color" /></svg>
		</template>
	</div>
</template>
<style scoped lang="scss">
.my-icon {
	display: inline-block;
	vertical-align: middle;
}
.svg-icon {
	width: 1em;
	height: 1em;
	position: relative;
	fill: currentColor;
	vertical-align: -2px;
}
</style>
