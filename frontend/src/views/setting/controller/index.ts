import { common, routes } from '@api/http'
import { useMessage } from '@utils/hooks/message'

/**
 * @description 手动同步
 */
export async function handle_sync() {
	const res = await common.sendAsync({
		route: routes.index.manual_sync.path,
		data: {},
	})
	useMessage().request(res)
}

/**
 * @description 保存设置页面的配置
 * @param {string} key 键
 * @param {any} value 值
 */
export async function saveConfig(key: string, value: any) {
	return await common.sendAsync({
		route: routes.index.set_config.path,
		data: {
			key,
			value,
		},
	})
}
