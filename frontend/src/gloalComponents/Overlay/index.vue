<script setup lang="ts">
const props = defineProps({
	backgroundColor: {
		type: String,
		default: '#ccc',
	},
	// duration: {
	//   type: [String, Number],
	//   default: '2s',
	// },
	zIndex: {
		type: [String, Number],
		default: 1,
	},
	show: {
		type: Boolean,
		default: false,
	},
	tapClose: {
		type: Boolean,
		default: false,
	},
})
const style = {
	'background-color': props.backgroundColor,
	'z-index': props.zIndex,
}
const emit = defineEmits(['update:show', 'tapCloseOverlay'])
const click = (): void => {
	if (!props.tapClose) return
	emit('update:show', !props.show)
	emit('tapCloseOverlay')
}
</script>

<template>
	<Teleport to=".layout-right-main">
		<Transition>
			<!-- @mousewheel.prevent 禁止背景跟着滑动-->
			<div
				v-if="show"
				class="overlay"
				id="overlay"
				:style="style"
				@click="click"
				@mousewheel.prevent>
				<div class="overlay-container">
					<slot></slot>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>
<style scoped lang="scss">
.overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	opacity: 0.3;
	// background-color:v-bind(duration);
}
.overlay-container {
	position: absolute;
	z-index: 2;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	box-shadow: 0 0 10px #8ab2e3;
}
.v-enter-active {
	transition: opacity 0.3s ease;
}
.v-leave-active {
	transition: opacity 0.2s linear;
}
.v-enter-from,
.v-leave-to {
	opacity: 0;
}
</style>
