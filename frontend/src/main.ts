import router from '@/router'
import { initPlugins } from './plugins'
import errorHandler from '@/utils/errorHandler'
//导入自定义全局组件
import gloalComponents from '@/gloalComponents'
// import contentmenu from 'v-contextmenu' // 右键菜单

import { createApp } from 'vue'
import App from './App.vue'

import 'virtual:svg-icons-register'
import '@styles/element/theme.scss' // 引入element-plus主题样式[这一条一定要在最前面]
import '@styles/base/variable.scss' // 引入全局变量
import '@styles/base/mixin.scss' // 引入全局mixin
import '@styles/index.scss' // 引入全局样式
// import './assets/main.css'

const app = createApp(App)
//全局代码错误捕捉
app.config.errorHandler = errorHandler

initPlugins(app)
app.use(gloalComponents)
// app.use(contentmenu)
app.use(router)
app.mount('#app')
