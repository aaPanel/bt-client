// uno.config.ts
import { defineConfig, presetAttributify, presetUno, transformerDirectives, transformerVariantGroup } from 'unocss';

export default defineConfig({
	shortcuts: {
		btCustomForm: 'px-[2rem] py-[2.4rem]',
	},
	theme: {
		colors: {
			white: '#fff',
			orange: '#fc6d26',
			primary: '#1a73e8',
			warning: '#e6a23c',
			danger: '#ef0808',
			black: '#000',
			dark: '#333',
			medium: '#666',
			light: '#999',
			lighter: '#ccc',
			lightest: '#f5f5f5',
		},
		backgroundColor: {
			white: '#fff',
			primary: '#1a73e8',
			aside: '#3c444d',
			black: '#000',
			dark: '#333',
			medium: '#666',
			light: '#999',
			orange: '#fc6d26',
			warning: '#e6a23c',
			danger: '#ef0808',
		},
		borderRadius: {
			none: '0',
			sm: '0.125rem',
			default: '0.25rem',
			md: '0.375rem',
			lg: '0.5rem',
			full: '9999px',
		},
	},
	presets: [
		presetUno(), // 基础配置
		presetAttributify(), // 属性配置，使用属性方式归类参数
	],
	transformers: [transformerDirectives(), transformerVariantGroup()],
});
