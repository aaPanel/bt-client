/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Router } from 'vue-router'
import { storeToRefs } from 'pinia'

const whiteList = ['/login', '/lock'] // 定义白名单  所有不受权限控制的页面
const history = ['/home', '/setting', '/xterm']

export default (router: Router) => {
	router.beforeEach(async (to, _from, next) => {
		// 遍历所有.el-overlay,检测属性style.display是否为none，否则不允许跳转
		const overlays = document.querySelectorAll('.el-overlay')
		let isOverlay = false
		overlays.forEach((item: any) => {
			if (item.style.display !== 'none') {
				isOverlay = true
			}
		})
		if (isOverlay) {
			return
		}

		const { useUserStore } = await import('@/store/user')
		const userStores = useUserStore()
		const userStore = storeToRefs(userStores)
		//  首先判断是否登录
		if (
			// userStore.isLogin.value &&
			userStore.isSetAdminPassword.value &&
			userStore.passwordIsRight.value
		) {
			if (to.path === '/lock') {
				next(userStore.routerHistory.value || '/home')
			} else {
				userStore.routerHistory.value = history.includes(to.path) ? to.path : '/home'
				next()
			}
		} else if (whiteList.includes(to.path)) {
			next()
		} else {
			await userStores.getBindUser() // 获取用户信息
			await userStores.getAdminPassword() // 获取管理密码状态
			const config: any = await userStores.isFreeAdminPassword() // 是否免管理密码

			if (config.not_password) {
				let path = userStore.routerHistory.value
				path = path === '/' ? '/home' : path
				next(path)
			} else {
				next('/lock')
			}
			// let _status = await userStores.isLoginStatus()
			// if (_status) {
			// } else {
			// 	next('/login')
			// }
		}
	})
}
