//1.创建store
import { defineStore } from 'pinia'
import { common, routes } from '@api/http'
//2.第一个参数是id,传入一个字符串，第二个参数是是对象
export const useUserStore = defineStore('userStore', {
	state: () => {
		return {
			isLogin: false, // 是否登录
			info: {
				username: '', // 用户名
			}, // 用户信息
			isSetAdminPassword: false, // 是否设置管理密码
			passwordIsRight: false, // 密码是否正确
			lockScreen: false, //锁定屏幕
			routerHistory: '',
		}
	},
	getters: {},
	actions: {
		// 获取绑定用户
		getBindUser() {
			return new Promise((resolve, reject) => {
				common.send(routes.user.get_user_info.path, {}, (res: any) => {
					this.isLogin = res.status
					if (res.status) {
						this.info = res.data
					} else {
						this.info = {
							username: '',
						}
					}
					resolve(res)
				})
			})
		},
		//管理密码是否正确
		updateLockScreen(value: boolean) {
			this.passwordIsRight = value
		},
		// 获取管理密码状态
		getAdminPassword() {
			return new Promise((resolve, reject) => {
				common.send(routes.index.has_password.path, {}, (res: any) => {
					this.isSetAdminPassword = res.status
					resolve(res)
				})
			})
		},
		// 是否免管理密码
		isFreeAdminPassword() {
			return new Promise((resolve, reject) => {
				common.send(routes.index.get_config.path, {}, (res: any) => {
					if (res.data.not_password) {
						this.passwordIsRight = true
					}
					resolve(res)
				})
			})
		},
		// 登录时判断
		// isLoginStatus() {
		// 	return new Promise((resolve, reject) => {
		// 		resolve(this.isLogin)
		// 	})
		// },
	},
	persist: {
		paths: ['routerHistory'],
	},
})
