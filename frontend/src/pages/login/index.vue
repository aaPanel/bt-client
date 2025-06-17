<template>
	<div class="login-container">
		<el-card class="login-wrapper">
			<div class="flex justify-center mb-[3rem]">
				<span class="text-[3rem] text-dark inline-block mr-2 font-bold">{{
					pub.lang('绑定宝塔官网账号')
				}}</span>
				<el-popover
					placement="top-start"
					width="200"
					trigger="hover"
					:content="
						pub.lang(
							'宝塔面板许多功能都依赖于官网，绑定仅限于为您提供更好的面板服务体验，不涉及您服务器任何敏感信息，请放心使用。'
						)
					"
					class="inline-block relative -top-1.5">
					<template #reference>
						<a class="bt-ico-ask align-middle inline-block mt-[15px]" href="javascript:;">?</a>
					</template>
				</el-popover>
			</div>
			<el-form ref="formRef" :model="form" :rules="rules">
				<el-form-item prop="username">
					<el-input
						v-model="form.username"
						clearable
						:placeholder="pub.lang('请输入宝塔官网账号')"
						size="large"
						@keydown.enter="login"></el-input>
				</el-form-item>
				<el-form-item prop="password">
					<el-input
						v-model="form.password"
						clearable
						:placeholder="pub.lang('请输入密码')"
						size="large"
						show-password
						@keydown.enter="login"></el-input>
				</el-form-item>
			</el-form>
			<div class="butt">
				<el-button
					type="primary"
					@click.native.prevent="login"
					:loading="loading"
					:disabled="loading"
					size="large"
					class="w-full">
					{{ pub.lang('登录') }}
				</el-button>
			</div>
			<div class="flex justify-end items-center mt-8 text-[1.2rem]">
				<a class="link" href="https://www.bt.cn/register" target="_blank">{{
					pub.lang('注册账号')
				}}</a>
				<el-divider direction="vertical" />
				<a class="link" href="https://www.bt.cn/login.html?page=reset" target="_blank">{{
					pub.lang('忘记密码')
				}}</a>
				<el-divider direction="vertical" />
				<a class="link" href="https://www.bt.cn/bbs" target="_blank">{{ pub.lang('问题反馈') }}</a>
			</div>
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

const { isLogin } = storeToRefs(useStore)
const loading = ref(false)
const formRef = ref()
const form = reactive({
	username: '',
	password: '',
})
const rules = {
	username: [{ required: true, message: pub.lang('请输入宝塔官网账号'), trigger: 'blur' }],
	password: [{ required: true, message: pub.lang('请输入密码'), trigger: 'blur' }],
}

// 登录
const login = async () => {
	await formRef.value?.validate()
	let load = Message.load(pub.lang('登录中...'))
	loading.value = true
	try {
		common.send(routes.user.bind.path, form, async (res: any) => {
			load.close()
			// // 登录成功
			if (res.status) {
				isLogin.value = true
				// 获取管理密码
				await useStore.getBindUser()
				await useStore.getAdminPassword()
				setTimeout(async () => {
					router.push({ path: '/lock' } as RouteLocationRaw)
				}, 1200)
				Message.success(res.data)
			} else {
				Message.error(res.msg)
			}
		})
	} finally {
		load.close()
		loading.value = false
	}
}
</script>

<style lang="scss" scoped>
.login-wrapper {
	position: fixed;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 440px;
	text-align: center;
	transition: all 0.5s linear 0s;
	background: rgba(255, 255, 255, 0.3);
	padding: 20px;
	border-radius: 10px;
	-webkit-border-radius: 10px;
	a {
		text-decoration: none;
	}
}
</style>
