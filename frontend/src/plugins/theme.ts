import { useSettingStore } from '@/store/setting'

export const useTheme = () => {
	const useStore = useSettingStore()
	const { dark } = storeToRefs(useStore)

	const switchDark = () => {
		const html = document.documentElement
		if (dark.value) {
			html.setAttribute('class', 'dark')
		} else {
			html.setAttribute('class', '')
		}
	}
	return { switchDark }
}
