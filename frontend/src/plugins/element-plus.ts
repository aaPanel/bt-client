import type { App } from 'vue'
// 导入 element-plus
import ElementPlus from 'element-plus'
// 导入 element-plus 样式
import 'element-plus/dist/index.css'
// 导入 element-plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 导入 element-plus 全局配置国际化的配置
import el_zh_cn from 'element-plus/es/locale/lang/zh-cn'
import el_en from 'element-plus/es/locale/lang/en'
// 导入 dayjs 全局配置国际化的配置
import 'dayjs/locale/zh-cn'
// import 'dayjs/locale/en'

import { createPinia } from 'pinia'
import { useSettingStore } from '@/store/setting'
const settingStore = useSettingStore(createPinia())

export const setupElementPlus = (app: App<Element>) => {
	app.use(ElementPlus, {
		locale: settingStore.locale === 'en' ? el_en : el_zh_cn,
	})
	// 注册全部图标
	for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
		app.component(key, component)
	}
}
