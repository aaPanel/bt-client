// 导入阿里图标库
import '@/assets/fonts/iconfont.css'
import '@/assets/iconfont/iconfont.js'

import icon from './my-icon/my-icon.vue'
import Overlay from './Overlay/index.vue'
import Dialog from './Dialog/index.vue'
import BtIcon from './bt-icon/index.vue'
import BtDitor from './bt-ditor/index.vue'

export default {
	install(app: any) {
		app.component('my-icon', icon)
		app.component('my-overlay', Overlay)
		app.component('my-dialog', Dialog)
		app.component('bt-icon', BtIcon)
		app.component('bt-ditor', BtDitor)
	},
}
