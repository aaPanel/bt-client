<template>
	<div class="lock-container">
		<el-card class="lock-wrapper">
			<template v-if="status">
				<div class="flex items-center justify-center mb-10">
					<svg
						t="1723520077767"
						class="icon"
						viewBox="0 0 1024 1024"
						version="1.1"
						xmlns="http://www.w3.org/2000/svg"
						p-id="17252"
						width="48"
						height="48">
						<path
							d="M871.618713 155.502214A492.103716 492.103716 0 0 0 511.979847 6.399268a494.023496 494.023496 0 0 0-361.558647 149.102946A494.023496 494.023496 0 0 0 0.0384 516.420934a492.103716 492.103716 0 0 0 150.3828 360.278793A491.463789 491.463789 0 0 0 511.979847 1023.882893a490.183935 490.183935 0 0 0 360.278793-149.102946A492.103716 492.103716 0 0 0 1023.921293 516.420934a494.023496 494.023496 0 0 0-152.30258-360.91872z m-470.346204 140.783898A143.983532 143.983532 0 0 1 506.860432 255.970723a143.983532 143.983532 0 0 1 106.22785 43.515023 139.504044 139.504044 0 0 1 39.035536 69.112096 134.38463 134.38463 0 0 1 3.839561 32.636267V447.948766h-56.31356v-48.634438a105.587923 105.587923 0 0 0 0-20.477657 95.989021 95.989021 0 0 0-24.957145-42.23517H575.972528a91.509534 91.509534 0 0 0-63.992681-26.876926 88.949826 88.949826 0 0 0-63.992681 26.876926 91.509534 91.509534 0 0 0-26.876926 63.992681V447.948766h-57.593413v-45.434804a144.623459 144.623459 0 0 1 37.755682-106.22785z m319.963404 399.314329a51.194145 51.194145 0 0 1-56.313559 55.673632h-307.164868a51.194145 51.194145 0 0 1-55.673632-55.673632V524.739983a51.194145 51.194145 0 0 1 55.673632-55.673632h306.524941a51.194145 51.194145 0 0 1 56.313559 55.673632z"
							fill="#4A4A4A"
							p-id="17253"></path>
						<path
							d="M481.26336 579.773688a43.515023 43.515023 0 1 0 63.992681 0 43.515023 43.515023 0 0 0-63.992681 0z"
							fill="#4A4A4A"
							p-id="17254"></path>
					</svg>
					<span class="locked text-[3rem] ml-[1rem]">{{ pub.lang('请输入管理密码') }}</span>
				</div>
				<div class="password-input">
					<el-input
						v-model="password"
						prefix-icon="Lock"
						autofocus
						type="password"
						show-password
						size="large"
						:placeholder="pub.lang('请输入管理密码')"
						@keydown.enter="unlock" />
					<el-button type="primary" size="large" @click="unlock" class="w-full mt-[2rem]">{{
						pub.lang('解锁')
					}}</el-button>
				</div>
			</template>
			<template v-else>
				<span class="locked text-[3rem] text-[#000]">{{ pub.lang('请设置管理密码') }}</span>
				<div class="password-input">
					<el-form ref="pwRef" :model="setPassword" :rules="rule">
						<el-form-item prop="password1">
							<el-input
								v-model="setPassword.password1"
								prefix-icon="Lock"
								type="password"
								autofocus
								show-password
								size="large"
								:placeholder="pub.lang('请输入管理密码')"
								@keydown.enter="setLock" />
						</el-form-item>
						<el-form-item prop="password2">
							<el-input
								v-model="setPassword.password2"
								prefix-icon="Lock"
								type="password"
								show-password
								size="large"
								:placeholder="pub.lang('确认管理密码')"
								@keydown.enter="setLock" />
						</el-form-item>
						<el-button type="primary" @click="setLock" size="large" class="w-full">{{
							pub.lang('确认')
						}}</el-button>
					</el-form>
					<div class="tips-head text-[1.6rem]">
						<li>{{ pub.lang('每次打开程序所需的解锁步骤') }}</li>
						<li>{{ pub.lang('管理密码无法找回，请妥善保管') }}</li>
					</div>
				</div>
			</template>
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'
import { useMessage } from '@utils/hooks/message'
import { RouteLocationRaw, useRouter } from 'vue-router'
import { common, routes } from '@api/http'
import { pub } from '@utils/tools'

const router = useRouter()
const useStore = useUserStore()
const Message = useMessage() // 消息提示
const { isSetAdminPassword, passwordIsRight, routerHistory } = storeToRefs(useStore)

const status = toRaw(isSetAdminPassword)

const password = ref('')
const pwRef = ref()
const setPassword = reactive({
	password1: '',
	password2: '',
})
const rule = {
	password1: [
		{ required: true, message: pub.lang('请输入管理密码'), trigger: 'blur' },
		{ min: 8, message: pub.lang('密码长度不能小于8位'), trigger: 'blur' },
	],
	password2: [
		{ required: true, message: pub.lang('请输入管理密码'), trigger: 'blur' },
		{ min: 8, message: pub.lang('密码长度不能小于8位'), trigger: 'blur' },
		{
			validator: (rule: any, value: string, callback: any) => {
				if (value !== setPassword.password1) {
					callback(pub.lang('两次输入密码不一致'))
				} else {
					callback()
				}
			},
			trigger: 'blur',
		},
	],
}

const setLock = async () => {
	await pwRef.value.validate()
	common.send(
		routes.index.set_password.path,
		{ password: toRaw(setPassword.password1) },
		(res: any) => {
			if (res.status) {
				Message.success(res.msg)
				isSetAdminPassword.value = res.status
				passwordIsRight.value = true
				router.push({ path: '/home' } as RouteLocationRaw)
			} else {
				Message.request(res)
			}
		}
	)
}

const unlock = () => {
	if (!password.value) {
		Message.warn(pub.lang('请输入密码'))
		return
	}
	common.send(routes.index.check_password.path, { password: password.value }, (res: any) => {
		if (res.status) {
			router.push({ path: routerHistory.value || '/home' } as RouteLocationRaw)
		} else {
			Message.error(res.msg)
		}
		useStore.updateLockScreen(res.status)
	})
}
</script>

<style lang="scss" scoped>
.lock-wrapper {
	position: fixed;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 600px;
	text-align: center;
	transition: all 0.5s linear 0s;
	background: rgba(255, 255, 255, 0.3);
	border-radius: 10px;
	-webkit-border-radius: 10px;
	.tips {
		color: #999;
		font-size: 12px;
		margin-top: 10px;
	}
	.tips-head {
		margin-top: 10px;
		text-align: left;
		background: rgba(64, 158, 255, 0.1);
		padding: 5px 10px;
		border-radius: 6px;
	}
}
</style>
