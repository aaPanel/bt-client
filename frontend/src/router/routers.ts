import type { RouteRecordRaw } from 'vue-router'
import Layout from '@layout/index.vue'

export const routeList: Array<RouteRecordRaw> = [
	{
		path: '/',
		component: Layout,
		redirect: '/home',
		children: [
			{
				path: '/home',
				component: () => import('@views/panel/index.vue'),
			},
			{
				path: '/details/:id&:key',
				name: 'details',
				component: () => import('@views/panel/Views/Details/index.vue'),
			},
			{
				path: '/xterm',
				component: () => import('@views/xterm/index.vue'),
			},
			{
				path: '/setting',
				component: () => import('@views/setting/index.vue'),
			},
			{
				path: '/lock',
				component: () => import('@views/lock/index.vue'),
			},
			{
				path: '/login',
				component: () => import('@/pages/login/index.vue'),
			},
		],
	},
]
