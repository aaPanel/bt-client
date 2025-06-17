import { common, routes } from '@api/http'

export const useLanguage = () => {
	// 设置当前语言[接口]
	const setLanguage = async (language: string, isSetting: boolean = false) => {
		await common.sendAsync({ route: routes.index.set_language.path, data: { language } })
	}
	// 获取当前语言
	const getLanguage = async () => {
		const res: any = await common.sendAsync({ route: routes.index.get_languages.path, data: {} })
		return res.data
	}

	return { setLanguage, getLanguage }
}
