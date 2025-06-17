<template>
	<div class="window-controls">
		<button class="control minimize" @click="minimizeWindow"><span></span></button>
		<button class="control maximize" :class="{ maximized: maximized }" @click="maximizeWindow">
			<span></span>
		</button>
		<button class="control close" @click="closeWindow">
			<span></span>
		</button>
		<el-dialog v-model="dialogVisible" width="360" :show-close="false" draggable>
			<template #header>
				<div>
					<span
						class="text-1.4rem leading-[1.8rem] text-grey-333 truncate"
						v-html="pub.lang('您点击关闭按钮，您需要：')"></span>
					<div
						@click="dialogVisible = false"
						class="absolute -top-1.5rem -right-1.5rem z-99999 w-[3rem] h-3rem rounded-1/2 cursor-pointer">
						<div class="absolute w-[3rem] h-3rem top-0 left-0 origin-center close-popup-btn"></div>
					</div>
				</div>
			</template>
			<el-radio-group v-model="form.action">
				<el-radio value="close">最小化到系统托盘</el-radio>
				<el-radio value="exit">关闭应用</el-radio>
			</el-radio-group>
			<template #footer>
				<div class="dialog-footer">
					<div class="flex justify-between">
						<span>
							<el-checkbox v-model="form.save">不再提示</el-checkbox>
						</span>
						<div class="flex items-conter">
							<el-button @click="dialogVisible = false">{{ pub.lang('取消') }}</el-button>
							<el-button type="primary" @click="setCloseConfig">
								{{ pub.lang('确定') }}
							</el-button>
						</div>
					</div>
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script lang="ts" setup>
import { ElRadioGroup, ElRadio, ElCheckbox, ElDialog } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useSettingStore } from '@/store/setting'
import { common, routes } from '@/api/http'
import { pub } from '@/utils/tools'

const useStore = useSettingStore()
const { maximized } = storeToRefs(useStore)
const minimizeWindow = () => {
	common.send(routes.window.window_minimize.path, {}, (res: any) => {})
}

const maximizeWindow = () => {
	common.send(routes.window.window_maximize.path, {}, (res: any) => {
		common.send(routes.window.is_maximized.path, {}, (result: any) => {
			maximized.value = result.data.Maximized
		})
	})
}
const dialogVisible = ref(false)
const form = reactive({
	action: 'close',
	save: false,
})
const closeWindow = () => {
	common.send(routes.window.get_app_quit_action.path, {}, (res: any) => {
		if (res.status) {
			common.send(routes.window.app_quit.path, {}, (res: any) => {})
		} else {
			dialogVisible.value = true
		}
	})
}
// 关闭应用配置弹窗
const setCloseConfig = () => {
	dialogVisible.value = false
	setTimeout(() => {
		common.send(routes.window.app_quit.path, form, (res: any) => {})
	}, 200)
}
</script>

<style scoped lang="scss">
.window-controls {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	height: 4.1rem;
}

.control {
	width: 4.6rem;
	height: 4.1rem;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	border: none;
	background: none;
}

.control:hover {
	background-color: #a8c7fa;
}
.control.maximize {
	span {
		border: 1px solid #000;
		width: 10px;
		height: 10px;
	}
}
.control.maximized {
	span {
		display: block;
		width: 8px;
		height: 8px;
		border: 1px solid #000;
		position: relative;
		top: -1px;
	}
	span::before {
		content: '';
		position: absolute;
		top: 1px;
		left: -3px;
		width: 6px;
		height: 6px;
		border: 1px solid #000;
		background-color: #d3e3fd;
		&:hover {
			background-color: #a8c7fa;
		}
	}
}
.control.minimize {
	span {
		width: 1rem;
		height: 0.1rem;
		background-color: #000;
	}
}
.control.close {
	span {
		position: relative;
		display: inline-block;
		width: 1.2rem;
		height: 1.2rem;
		// top: 2px;
		&::before,
		&::after {
			position: absolute;
			left: 50%;
			width: 1px;
			height: 100%;
			margin-left: (1px / -2);
			content: '';
			background-color: #000;
		}
		&::before {
			transform: rotate(-45deg);
		}

		&::after {
			transform: rotate(45deg);
		}
	}
}
.control.close:hover {
	background-color: #e81123;
	color: #fff;
	span {
		&::before,
		&::after {
			background-color: #fff;
		}
	}
}
</style>
