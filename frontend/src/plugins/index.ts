import type { App } from 'vue'
import { pinia } from './pinia'
import { setupElementPlus } from './element-plus'
// unocss
import 'virtual:uno.css'
// https://unocss.dev/guide/style-reset#normalize-css
import '@unocss/reset/normalize.css'

export const initPlugins = (app: App<Element>) => {
	setupElementPlus(app)
	app.use(pinia)
}
