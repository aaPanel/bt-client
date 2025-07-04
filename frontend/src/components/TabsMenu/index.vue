<template>
	<div class="vue3-tabs-chrome">
		<div class="tabs-content" :ref="setContentRef">
			<div class="tabs-item" draggable="true" v-for="(tab, i) in tabs" :class="{ active: tab.key === modelValue }" :key="tab.key" :style="{ width: tabWidth + 'px' }" :ref="e => setTabRef(e, tab)" @contextmenu="e => handleContextMenu(e, tab, i)" @click="e => handleNativeClick(e, tab, i)">
				<div class="tabs-background">
					<div class="tabs-background-divider"></div>
					<div class="tabs-background-content"></div>
					<svg class="tabs-background-before" width="7" height="7">
						<path d="M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z"></path>
					</svg>
					<svg class="tabs-background-after" width="7" height="7">
						<path d="M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z"></path>
					</svg>
				</div>
				<div class="tabs-refresh" :style="isWidthMin ? { right:'34px'  } : {}" @click.stop="handleRefresh(tab,i)" v-show="showTabRefreshIcon(tab)">
					<svg class="tabs-close-icon p-[.1rem]" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" width="10" height="10"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"></path></svg>
				</div>
				<div class="tabs-close" :style="isWidthMin ? { right:(tabWidth/2-6)+'px'  } : {}" @click.stop="handleDelete(tab, i)" v-show="showTabCloseIcon(tab)">
					<svg t="1733121642503" class="tabs-close-icon p-[.2rem]" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7382" width="10" height="10"><path d="M621.312 493.824l253.184-252.928a67.584 67.584 0 0 0 7.168-89.088 64.512 64.512 0 0 0-95.744-4.864l-256 256a25.6 25.6 0 0 1-36.352 0l-252.672-253.44a67.584 67.584 0 0 0-89.088-7.168 64.512 64.512 0 0 0-4.864 95.744l256 256a25.6 25.6 0 0 1 0 36.352l-253.44 252.672a67.584 67.584 0 0 0-7.168 89.088 64.512 64.512 0 0 0 95.744 4.864l256-256a25.6 25.6 0 0 1 36.352 0l252.928 253.184a67.584 67.584 0 0 0 89.088 7.168 64.512 64.512 0 0 0 4.864-95.744l-256-256a25.6 25.6 0 0 1 0-35.84z" p-id="7383" fill="currentColor"></path></svg>
				</div>
				<div class="tabs-main" :title="tab.label">
					<span class="tabs-favico" v-if="tab.favico">
						<render-temp v-if="typeof tab.favico === 'function'" :render="tab.favico" :params="[tab, i]" />
						<img v-else-if="tab.favico" :src="tab.favico" alt="" />
					</span>
					<span class="tabs-label" :class="{ 'no-close': !showTabCloseIcon(tab), 'no-icon': !tab.favico }">
						<render-temp v-if="typeof renderLabel === 'function'" :render="renderLabel" :params="[tab, i]" />
						<template v-else>{{ tab.label }}</template>
					</span>
				</div>
			</div>
			<span class="tabs-after" :ref="setAfterRef" :style="{ left: (tabWidth - gap * 2) * tabs.length + gap * 2 + 'px' }">
				<slot name="after" />
			</span>
		</div>
	</div>
</template>

<script lang="ts">
import Draggabilly from 'draggabilly';
import RenderTemp from './renderTemp.vue';
import { defineComponent, ref, reactive, onMounted, PropType, nextTick, h, onUnmounted, ComponentPublicInstance, VNode } from 'vue';

export type FavicoType = ((...args: unknown[]) => VNode) | ((...args: unknown[]) => string) | NodeRequire | string;
export interface Tab {
	/** 显示名称 */
	label: string;
	/** 唯一 key */
	key: string;
	favico?: FavicoType;
	/**
	 * 是否可关闭
	 */
	closable?: boolean;
	/**
	 * 是否可被交换
	 */
	swappable?: boolean;
	/**
	 * 是否可拖拽
	 */
	dragable?: boolean;
	$el?: HTMLElement;
	// eslint-disable-next-line
	_instance?: any;
	_x?: number;
}

export interface Refs {
	[key: string]: Element | null;
}

export default defineComponent({
	name: 'TabsMenu',
	components: { RenderTemp },
	emits: ['click', 'update:modelValue', 'remove', 'dragstart', 'dragging', 'dragend', 'swap', 'contextmenu','refresh'],
	props: {
		modelValue: {
			type: [String, Number],
			default: '',
		},
		tabs: {
			type: Array as PropType<Tab[]>,
			default: () => [],
		},
		/**
		 * 当宽度小于设置的值时，会自动隐藏关闭按钮
		 */
		autoHiddenCloseIconWidth: {
			type: Number,
			default: 120,
		},
		/**
		 * tab 的最小宽度
		 */
		minWidth: {
			type: Number,
			default: 40,
		},
		/**
		 * tab 的最大宽度
		 */
		maxWidth: {
			type: Number,
			default: 245,
		},
		/**
		 * 两个相邻的 tab 的空隙大小
		 */
		gap: {
			type: Number,
			default: 7,
		},
		/**
		 * 关闭事件
		 */
		onClose: {
			type: Function,
		},
		/**
		 * 新 tab 追加时，是否追加到当前 tab 之后
		 */
		insertToAfter: {
			type: Boolean,
			default: false,
		},
		/**
		 * 鼠标按下时，是否自动将命中的 tab 设置为激活状态
		 */
		isMousedownActive: {
			type: Boolean,
			default: true,
		},
		/**
		 * 自定义渲染 label
		 */
		renderLabel: {
			type: Function,
		},
	},
	setup(props, context) {
		const $refs = reactive<Refs>({});
		const tabWidth = ref<number>(0);
		const isWidthMin = ref<boolean>(false);

		/**
		 * 计算单个 tab 的宽度
		 */
		const calcTabWidth = () => {
			const { tabs, minWidth, maxWidth, gap } = props;
			const { $content } = $refs;
			const afterWidth = $refs.$after?.getBoundingClientRect().width || 0;
			if (!$content) return Math.max(maxWidth, minWidth);
			const contentWidth: number = $content.clientWidth - gap * 3 - afterWidth;
			let width: number = contentWidth / tabs.length;
			width += gap * 2;
			if (width > maxWidth) width = maxWidth;
			if (width < minWidth) width = minWidth;
			isWidthMin.value = width < 56;
			tabWidth.value = width;
		};

		/**
		 * 拖拽开始事件
		 * @param e 拖拽事件
		 * @param tab 当前正在拖拽的 tab
		 * @param i 当前拖拽的下标
		 */
		const handlePointerDown = (e: Event, tab: Tab, i: number) => {
			const { emit } = context;
			const { isMousedownActive } = props;
			// 如果允许按下就 active，才命中
			if (isMousedownActive) {
				emit('update:modelValue', tab.key);
			}
			emit('dragstart', e, tab, i);
		};

		/**
		 * 拖拽事件监听
		 * @param e 拖拽事件
		 * @param tab 当前正在拖拽的 tab
		 * @param i 当前拖拽的下标
		 */
		const handleDragMove = (e: Event, tab: Tab, i: number) => {
			const { tabs, gap } = props;
			const { emit } = context;

			if (tab.swappable === false) {
				return;
			}

			// 获取一半 tab 宽度
			const halfWidth = (tabWidth.value - gap) / 2;
			// 获取 tab 当前的 x 值
			const { x } = tab._instance.position;
			let swapTab: Tab | null = null;
			for (let i = 0; i < tabs.length; i++) {
				const currentTab: Tab = tabs[i];
				const targetX: number = (currentTab._x || 1) - 1;

				// 如果命中自己本身，则无需交换
				if (tab.key === currentTab.key) {
					// eslint-disable-next-line no-continue
					continue;
				}
				// 判断是否有重叠的 tab，只需要判定是否在前半部分即可
				if (targetX <= x && x < targetX + halfWidth) {
					swapTab = currentTab;
					swapTabs(tab, swapTab);
					break;
				}
			}
			emit('dragging', e, tab, i);
		};

		/**
		 * 交换俩 tab
		 * @param tab 当前 tab
		 * @param swapTab 需要交换的 tab
		 */
		const swapTabs = (tab: Tab, swapTab: Tab) => {
			if (swapTab.swappable === false) {
				return;
			}
			const { tabs } = props;
			const { emit } = context;

			let index = -1;
			let swapIndex = -1;

			for (let i = 0; i < tabs.length; i++) {
				const obj: Tab = tabs[i];
				if (obj.key === tab.key) {
					index = i;
				}
				if (obj.key === swapTab.key) {
					swapIndex = i;
				}
			}

			if (index < 0 || swapIndex < 0 || index === swapIndex) {
				return;
			}

			// eslint-disable-next-line
			[tabs[index], tabs[swapIndex]] = [tabs[swapIndex], tabs[index]];

			// swap x
			const { _x } = tab;
			tab._x = swapTab._x;
			swapTab._x = _x;

			// swap position
			const { _instance } = swapTab;
			setTimeout(() => {
				_instance.element.classList.add('move');
				_instance.setPosition(_x, _instance.position.y);
			}, 50);
			setTimeout(() => {
				_instance.element.classList.remove('move');
				emit('swap', tab, swapTab);
			}, 200);
		};

		/**
		 * 拖拽完成监听
		 * @param e 拖拽事件
		 * @param tab 命中的 tab
		 * @param i 当前拖拽的下标
		 */
		const handleDragEnd = (e: Event, tab: Tab, i: number) => {
			const { _instance } = tab;
			const { emit } = context;

			if (_instance.position.x === 0) return;
			setTimeout(() => {
				_instance.element.classList.add('move');
				_instance.setPosition(tab._x, 0);
			}, 50);
			setTimeout(() => {
				_instance.element.classList.remove('move');
				emit('dragend', e, tab, i);
			}, 200);
			return false;
		};

		/**
		 * 单击事件监听
		 * @param e 单击事件
		 * @param tab 命中的 tab
		 * @param i 当前单击的下标
		 */
		const handleClick = (e: Event, tab: Tab, i: number) => {
			const { emit } = context;
			emit('click', e, tab, i);
		};

		/**
		 * 原生点击事件
		 * @param e 单击事件
		 * @param tab 命中的 tab
		 * @param i 当前单击的下标
		 */
		const handleNativeClick = (e: Event, tab: Tab, i: number) => {
			if (tab.dragable === false) {
				handleClick(e, tab, i);
			}
		};

		/**
		 * 右键事件监听
		 * @param e 右键事件
		 * @param tab 命中的 tab
		 * @param i 当前右键的下标
		 */
		const handleContextMenu = (e: Event, tab: Tab, i: number) => {
			const { emit } = context;
			emit('contextmenu', e, tab, i);
		};

		/**
		 * 删除事件
		 * @param tab 当前命中 tab
		 * @param i 当前命中 tab 的下标
		 */
		const handleDelete = (tab: Tab, i: number) => {
			const { tabs, modelValue, onClose } = props;
			const { emit } = context;
			const index = tabs.findIndex(item => item.key === modelValue);

			// 可以通过 onClose 返回 false 来主动阻止事件
			if (typeof onClose === 'function' && onClose(tab, tab.key, i) === false) {
				return false;
			}

			let after, before;
			if (i === index) {
				after = tabs[i + 1];
				before = tabs[i - 1];
			}

			if (after) {
				emit('update:modelValue', after.key);
			} else if (before) {
				emit('update:modelValue', before.key);
			} else if (tabs.length <= 1) {
				emit('update:modelValue', null);
			}
			tabs.splice(i, 1);
			emit('remove', tab, i);

			nextTick(() => {
				doLayout();
			});
		};
		/**
		 * 刷新事件
		 * @param tab 当前命中 tab
		 * @param i 当前命中 tab 的下标
		 */
		const handleRefresh = (tab: Tab, i: number) => { 
			const { emit } = context;
			emit('refresh', tab, i);
		}

		/**
		 * 主动添加 tab
		 * @param newTabs 用户需要添加的 tab
		 */
		const addTab = (...newTabs: Array<Tab>) => {
			const { insertToAfter, modelValue, tabs } = props;
			if (insertToAfter) {
				const i = tabs.findIndex(tab => tab.key === modelValue);
				tabs.splice(i + 1, 0, ...newTabs);
			} else {
				tabs.push(...newTabs);
			}

			nextTick(() => {
				init();
				doLayout();
			});
		};

		/**
		 * 主动移除 tab
		 * @param tabKey 如果为数字则判定为用下标删除
		 */
		const removeTab = (tabKey: string | number) => {
			const { tabs } = props;

			if (typeof tabKey === 'number') {
				const index: number = tabKey;
				const tab = tabs[index];
				handleDelete(tab, index);
			} else {
				const index: number = tabs.findIndex(item => item.key === tabKey);
				const tab: Tab | undefined = tabs.find(item => item.key === tabKey);
				if (tab) {
					handleDelete(tab, index);
				}
			}
		};

		// 计时器
		let timer: number;
		/**
		 * 窗口改变，重新布局
		 */
		const handleResize = () => {
			if (timer) window.clearTimeout(timer);
			timer = window.setTimeout(() => {
				doLayout();
			}, 100);
		};

		/**
		 * 判断关闭按钮是否展示
		 */
		const showTabCloseIcon = (tab: Tab) => {
			const { modelValue, autoHiddenCloseIconWidth } = props;
			if (tab.closable === false) {
				return false;
			}

			if (tab.key === modelValue) {
				return true;
			}

			if (autoHiddenCloseIconWidth > tabWidth.value) {
				return false;
			}

			return true;
		};
		/**
		 * 判断刷新按钮是否展示
		 */
		const showTabRefreshIcon = (tab: Tab) => {
			const { modelValue } = props;
			return tab.key === modelValue;
		};

		/**
		 * 渲染文本
		 */
		const renderLabelText = (tab: Tab) => {
			const { renderLabel } = props;
			if (renderLabel) {
				return renderLabel(tab);
			}
			return h('span', tab.label);
		};

		/**
		 * 重新调整 tab 位置
		 */
		const doLayout = () => {
			calcTabWidth();
			const { tabs, gap } = props;
			tabs.forEach((tab, i) => {
				const instance = tab._instance;
				const _x = (tabWidth.value - gap * 2) * i;
				tab._x = _x;
				instance.setPosition(_x, 0);
			});
		};

		/**
		 * 添加 tab 实例
		 * @param tab 当前命中 tab
		 * @param i 当前命中 tab 的下标
		 */
		const addInstance = (tab: Tab, i: number) => {
			const { gap } = props;

			// 如果已经存在实例，则重新设置位置
			if (tab._instance) {
				tab._instance.setPosition(tab._x, 0);
				return;
			}
			// 如果不存在 dom 元素，则无需设置
			if (!tab.$el || !$refs.$content) {
				return;
			}
			// // 添加实例
			tab._instance = new Draggabilly(tab.$el, {
				axis: 'x',
				containment: $refs.$content,
				handle: '.tabs-main',
			});
			if (tab.dragable === false) {
				tab._instance.disable();
			}
			// 计算实际 x 值
			const x = (tabWidth.value - gap * 2) * i;
			// 记录 x 位置到 tab 上
			tab._x = x;
			// 设置位置
			tab._instance.setPosition(x, 0);
			// 绑定拖拽事件
			tab._instance.on('pointerDown', (e: Event) => handlePointerDown(e, tab, i));
			tab._instance.on('dragMove', (e: Event) => handleDragMove(e, tab, i));
			tab._instance.on('dragEnd', (e: Event) => handleDragEnd(e, tab, i));
			tab._instance.on('staticClick', (e: Event) => handleClick(e, tab, i));
		};

		/**
		 * 初始化，为 tab 添加实例
		 */
		const init = () => {
			props.tabs.forEach((tab: Tab, i: number) => {
				addInstance(tab, i);
			});
		};

		/**
		 * 为 Tab 添加 dom 节点
		 * @param el 当前 tab 对应的 dom 元素
		 * @param tab 当前命中 tab
		 */
		const setTabRef = (el: Element | ComponentPublicInstance | null, tab: Tab) => {
			if (el) {
				tab.$el = el as HTMLElement;
			}
		};

		/**
		 * 添加容器 dom 节点
		 * @param el tab 对应的 dom 父元素
		 */
		const setContentRef = (el: Element | ComponentPublicInstance | null) => {
			if (el) {
				$refs.$content = el as Element;
			}
		};

		/**
		 * 添加后缀元素 dom 节点
		 * @param el 在 tab 后面的元素
		 */
		const setAfterRef = (el: Element | ComponentPublicInstance | null) => {
			if (el) {
				$refs.$after = el as Element;
			}
		};

		onMounted(() => {
			calcTabWidth();
			init();
			window.addEventListener('resize', handleResize);
		});

		onUnmounted(() => {
			window.removeEventListener('resize', handleResize);
			if (timer) window.clearTimeout(timer);
		});

		return {
			setTabRef,
			setContentRef,
			setAfterRef,
			tabWidth,
			isWidthMin,
			handleDelete,
			handleRefresh,
			handleContextMenu,
			showTabCloseIcon,
			showTabRefreshIcon,
			renderLabelText,
			handleNativeClick,
			doLayout,
			addTab,
			removeTab,
		};
	},
});
</script>

<style lang="scss">
.vue3-tabs-chrome {
	$bg: #d3e3fd;
	$gap: 7px;
	$divider: #a9adb0;
	$speed: 150ms;

	padding-top: 0.55rem;
	background-color: $bg;
	position: relative;
	color: #1f1f1f;

	.tabs-content {
		height: 3.5rem;
		position: relative;
		overflow: hidden;
	}

	/* divider */
	.tabs-divider {
		left: 0;
		top: 50%;
		width: 1px;
		height: 20px;
		background-color: $divider;
		position: absolute;
		transform: translateY(-50%);
	}

	.tabs-item {
		height: 100%;
		display: flex;
		align-items: center;
		user-select: none;
		box-sizing: border-box;
		// transition: width $speed;
		position: absolute;

		&:hover {
			z-index: 1;

			.tabs-background-divider {
				display: none;
			}

			.tabs-background-content {
				background-color: #f2f3f5;
			}

			.tabs-background-before,
			.tabs-background-after {
				fill: #f2f3f5;
			}
		}

		&.move {
			transition: $speed;
		}

		&.is-dragging {
			z-index: 3;

			.tabs-background-content {
				background-color: #f2f3f5;
			}

			.tabs-background-divider {
				display: none;
			}

			.tabs-background-before,
			.tabs-background-after {
				fill: #f2f3f5;
			}
		}

		&.active {
			z-index: 2;
			min-width:66px;
			.tabs-refresh,.tabs-close {
				background-color: #fff;
			}
			.tabs-background{
				z-index: 1;
			}
			.tabs-main{
				background-color: transparent;
				.tabs-favico,
					.tabs-label{
						z-index:2;
					}
					.tabs-label{
						margin-right: 40px;
					}
			}

			.tabs-background-divider {
				display: none;
			}

			.tabs-background-content {
				background-color: #fff;
			}

			.tabs-background-before,
			.tabs-background-after {
				fill: #fff;
			}
		}

		&:first-of-type {
			.tabs-background-divider::before {
				display: none;
			}
		}
		&:not(.active):hover {
			.tabs-background {
				display: none;
			}
			.tabs-main {
				background-color: #a8c7fa;
			}
		}
	}

	.tabs-main {
		height: 2.8rem;
		top: 1px;
		left: 0;
		right: 0;
		margin: 0 $gap * 2;
		border-top-left-radius: 5px;
		border-top-right-radius: 5px;
		border-radius: 1rem;
		transition: $speed;
		display: flex;
		align-items: center;
		position: absolute;
		box-sizing: border-box;
		overflow: hidden;
	}
	.tabs-refresh,
	.tabs-close {
		top: 44%;
		right: 22px;
		width: 16px;
		height: 16px;
		z-index: 1;
		position: absolute;
		transform: translateY(-50%);
	}
	.tabs-refresh{
		right: 40px;
	}

	.tabs-close-icon {
		width: 100%;
		height: 100%;
		border-radius: 50%;

		&:hover {
			background-color: #e8eaed;
		}
	}

	.tabs-favico {
		width: 16px;
		height: 16px;
		background: url('data:image/png;base64,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');
		background-size: 16px 16px;
		margin-left: 3%;
		display: inline-block;
		align-items: center;
		overflow: hidden;

		img {
			height: 100%;
		}
	}

	.tabs-label {
		flex: 1;
		margin-left: 5%;
		margin-right: 16px;
		box-sizing: border-box;
		overflow: hidden;
		white-space: nowrap;
		position: relative;

		&.no-close {
			margin-right: 0;
		}

		&.no-icon {
			margin-left: 0;
		}
	}

	.tabs-background {
		width: 100%;
		height: 100%;
		padding: 0 $gap - 1px;
		position: absolute;
		box-sizing: border-box;
	}

	.tabs-background-divider {
		left: 0;
		width: calc(100% - 14px);
		height: 100%;
		margin: 0 7px;
		position: absolute;

		&::before {
			content: '';
			top: 30%;
			right: 100%;
			width: 1px;
			height: 42%;
			background-color: #81878c;
			position: absolute;
		}

		&::after {
			content: '';
			top: 30%;
			left: calc(100% - 1px);
			width: 1px;
			height: 42%;
			background-color: #81878c;
			position: absolute;
		}
	}

	.tabs-background-content {
		height: 100%;
		border-top-left-radius: 5px;
		border-top-right-radius: 5px;
		transition: $speed;
	}

	.tabs-background-before,
	.tabs-background-after {
		bottom: -1px;
		position: absolute;
		fill: transparent;
		transition: $speed;
	}

	.tabs-background-before {
		left: -1px;
	}

	.tabs-background-after {
		right: -1px;
	}

	.tabs-footer {
		height: 4px;
		background-color: #fff;
	}

	.tabs-after {
		top: 50%;
		display: flex;
		position: absolute;
		overflow: hidden;
		transform: translateY(-50%);
	}

	@keyframes tab-show {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}
}
</style>
