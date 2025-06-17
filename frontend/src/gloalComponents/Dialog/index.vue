<template>
	<Teleport to="body">
		<Transition name="dialog-fade">
			<div
				v-if="show"
				v-move
				class="dialog-box"
				:class="{ dark }"
				:style="style"
				@mousewheel.prevent
				@keyup.esc="tapCloseFn"
				ref="dialogBox">
				<my-overlay
					:show="props.showOverlay"
					:tapClose="props.tapClose"
					@tapCloseOverlay="tapCloseFn" />
				<div class="dialog-header">
					<slot name="header">
						<div class="dialog-title">
							<slot name="title">{{ title }}</slot>
						</div>
						<!-- <div class="move"></div> -->
						<div
							v-if="showControl"
							class="dialog-control"
							@mouseenter="showIcon = true"
							@mouseleave="showIcon = false">
							<slot name="control">
								<!-- <div v-if="props.showFullscreen" v-show="!isFullscreen" class="icon fullscreen" @click="tapFullscreenFn">
									<my-icon v-show="showIcon" icon="icon-fangda" size="12" color="#515151" />
								</div> -->
								<!-- <div v-if="props.showFullscreen" v-show="!isMini" class="icon jian" @click="onMiniFn"><my-icon v-show="showIcon" icon="icon-jian" size="14" color="#515151" /></div> -->
								<my-icon
									@click="tapCloseFn"
									icon="icon-x"
									size="18"
									color="#515151"
									class="DialogcloseIcon" />
							</slot>
						</div>
					</slot>
				</div>
				<div class="dialog-container">
					<el-scrollbar><slot></slot></el-scrollbar>
				</div>
				<div v-if="showFooter" class="dialog-footer">
					<slot name="footer">
						<el-button @click="tapCancel">{{ props.cancelText }}</el-button>
						<el-button type="primary" :loading="loading" @click="tapConfirmFn">{{
							props.confirmText
						}}</el-button>
					</slot>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>
<script setup lang="ts">
import { ref, reactive, onUpdated, Directive, DirectiveBinding } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingStore } from '@/store/setting'

const useStore = useSettingStore()
const { dark } = storeToRefs(useStore)
const props = defineProps({
	title: {
		type: String,
		default: '提示',
	},
	confirmText: {
		type: String,
		default: '确定',
	},
	cancelText: {
		type: String,
		default: '取消',
	},
	width: {
		type: String,
		default: '500px',
	},
	height: {
		type: String,
		default: '300px',
	},
	zIndex: {
		type: [String, Number],
		default: 3,
	},
	show: {
		type: Boolean,
		default: false,
	},
	showOverlay: {
		type: Boolean,
		default: true,
	},
	showFullscreen: {
		type: Boolean,
		default: true,
	},
	showControl: {
		type: Boolean,
		default: true,
	},
	showFooter: {
		type: Boolean,
		default: true,
	},
	tapClose: {
		type: Boolean,
		default: false,
	},
	loading: {
		type: Boolean,
		default: false,
	},
})
let style = reactive({
	'z-index': props.zIndex,
	width: props.width,
	height: props.height,
	top: '25%',
	left: '50%',
	marginLeft: `-${parseInt(props.width) / 2}px`,
	borderRadius: 'none',
})

let showIcon = ref(false)
const emit = defineEmits(['close', 'confirm', 'onMini', 'onMax', 'cancel', 'open'])
onUpdated(() => {
	if (props.show) {
		emit('open')
	}
})

const tapCloseFn = (): void => {
	emit('close', false)
	// 全屏关闭后还显示的，所以把样式改回默认的
	style.width = props.width
	style.height = props.height
	style.borderRadius = '10px'
	style.top = '25%'
	style.left = '50%'
	style.marginLeft = `-${parseInt(props.width) / 2}px`
	showIcon.value = false
}
const tapConfirmFn = (): void => {
	emit('confirm')
}
const tapCancel = (): void => {
	emit('cancel')
}
// 自定义移动插件
const vMove: Directive<any, void> = (el: HTMLElement, bingding: DirectiveBinding) => {
	let moveElement = el.firstElementChild as HTMLDivElement
	const moveDown = (e: MouseEvent) => {
		// 点击的是左上角的时候不触发
		if (el.offsetLeft == 0 || e.target?.classList.contains('icon-x')) return
		let X = e.clientX - el.offsetLeft
		let Y = e.clientY - el.offsetTop
		const move = (e: MouseEvent) => {
			let newLeft = e.clientX - X
			let newTop = e.clientY - Y

			// 获取视图范围
			const minX = 0
			const minY = 0
			const maxX = window.innerWidth - el.offsetWidth
			const maxY = window.innerHeight - el.offsetHeight - 41
			// 限制移动范围
			if (newLeft < minX) newLeft = minX
			if (newLeft > maxX) newLeft = maxX
			if (newTop < minY) newTop = minY
			if (newTop > maxY) newTop = maxY
			// console.log(newLeft, newTop)
			// return
			el.style.left = newLeft + 'px'
			el.style.top = newTop + 'px'
			el.style.marginLeft = '0'
		}
		document.addEventListener('mousemove', move)
		document.addEventListener('mouseup', () => {
			document.removeEventListener('mousemove', move)
		})
	}
	moveElement.addEventListener('mousedown', moveDown)
}
</script>
<style scoped lang="scss">
.dialog-box {
	position: absolute;
	filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3));
	box-sizing: border-box;
	background-color: #fff;
	display: flex;
	flex-direction: column;
}

.dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px 15px;
	cursor: move;
	background-color: #f8f8f8;
	border-bottom: 0.5px solid #eee;
	.dialog-title {
		font-weight: bold;
		color: #555;
	}
	// .move {
	// 	flex: 1;
	// 	cursor: move;
	// 	height: 24px;
	// }
	.dialog-control {
		display: flex;
		cursor: pointer;
		.DialogcloseIcon {
			width: 25px;
			height: 25px;
			text-align: center;
			&:hover {
				background-color: #dfdfdf;
				border-radius: 50%;
			}
		}
	}
}
.dialog-container {
	flex: 1;
	margin: 10px 15px;
	overflow: hidden;
}
.dialog-footer {
	padding: 8px 15px;
	text-align: right;
	border-top: 0.5px solid #edf1f2;
	background-color: #f6f8f8;
}
// .v-enter-active{
//   transition: opacity 0.3s linear;
// }
// .v-leave-active {
//   transition: opacity 0.2s linear;
// }
// .v-enter-from,
// .v-leave-to {
//   opacity: 0;
// }
// 进入动画
.dialog-fade-enter-active {
	animation: dialog-fade-in 0.2s;
}
// 离开动画
.dialog-fade-leave-active {
	animation: dialog-fade-out 0.2s;
}

@keyframes dialog-fade-in {
	0% {
		opacity: 0.3;
		transform: scale(0.3);
	}
	100% {
		opacity: 1;
		transform: scale(1);
	}
}

@keyframes dialog-fade-out {
	0% {
		opacity: 1;
		transform: scale(1);
	}
	100% {
		opacity: 0;
		transform: scale(0.3);
	}
}
</style>
