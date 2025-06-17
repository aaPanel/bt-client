import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
import vueJsx from '@vitejs/plugin-vue-jsx';
import UnoCSS from 'unocss/vite';

import path from 'path';
// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
	return {
		// 项目插件
		plugins: [
			vue(),
			vueJsx(),
			UnoCSS(),
			AutoImport({
				imports: ['vue', 'vue-router', 'pinia'],
				resolvers: [ElementPlusResolver()],
				dts: './src/types/auto-imports.d.ts',
			}),
			Components({
				resolvers: [
					ElementPlusResolver({
						importStyle: 'sass',
					}),
				],
				dts: './src/types/components.d.ts',
			}),
			createSvgIconsPlugin({
				iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
				symbolId: 'icon-[name]',
			}),
		],
		// 基础配置
		base: './',
		publicDir: 'public',
		resolve: {
			alias: {
				'@': path.resolve(__dirname, 'src'),
				'@api': path.resolve(__dirname, 'src/api'),
				'@views': path.resolve(__dirname, 'src/views'),
				'@store': path.resolve(__dirname, 'src/store'),
				'@styles': path.resolve(__dirname, 'src/styles'),
				'@locales': path.resolve(__dirname, 'src/locales'),
				'@layout': path.resolve(__dirname, 'src/layout'),
				'@types': path.resolve(__dirname, 'src/types'),
				'@utils': path.resolve(__dirname, 'src/utils'),
				'@router': path.resolve(__dirname, 'src/router'),
				'@assets': path.resolve(__dirname, 'src/assets'),
				'@plugins': path.resolve(__dirname, 'src/plugins'),
				'*electron.route.js': path.resolve(__dirname, 'src/../electron.route.js'),
			},
		},
		// css: {
		// 	preprocessorOptions: {
		// 		sass: {
		// 			sassOptions: { quietDeps: true },
		// 			additionalData: ['@use "@styles/base/variable.scss"\n', '@use "@styles/base/mixin.scss"\n'].join(''),
		// 		},
		// 		scss: {
		// 			// additionalData: `@use "@styles/element/theme.scss" as *;@use "@styles/base/variable.scss" as *;@use '@styles/base/mixin.scss' as *;`,
		// 			additionalData: ["@use '@styles/element/theme.scss' as *;", "@use '@styles/base/variable.scss' as *;", "@use '@styles/base/mixin.scss' as *;"].join(''),
		// 		},
		// 	},
		// },
		build: {
			outDir: 'dist',
			assetsDir: 'assets',
			assetsInlineLimit: 4096,
			cssCodeSplit: true,
			brotliSize: false,
			sourcemap: false,
			minify: 'terser',
			terserOptions: {
				compress: {
					// 生产环境去除console及debug
					drop_console: false,
					drop_debugger: true,
				},
			},
		},
	};
});
