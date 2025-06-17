<template>
	<svg aria-hidden="true" class="svg-icon" :style="{ 'font-size': size + 'px' }" @click="onClick">
		<use :xlink:href="iconName" :fill="color" />
	</svg>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits, withDefaults } from 'vue'
interface Props {
	name: string
	size?: string
	color?: string
	prefix?: string
}

const props = withDefaults(defineProps<Props>(), {
	prefix: 'icon',
})

const emit = defineEmits<{
	(event: 'click', e: MouseEvent): void
}>()

const iconName = computed(() => `#${props.prefix}-${props.name}`)

const onClick = (e: MouseEvent) => {
	emit('click', e)
}
</script>

<style lang="scss" scoped>
.svg-icon {
	width: 1em;
	height: 1em;
	fill: currentColor;
	vertical-align: -0.15em;
}
</style>
