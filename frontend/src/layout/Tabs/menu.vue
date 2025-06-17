<template>
	<div class="flex items-center">
		<ul class="flex m-0">
			<li :class="{ active: $route.path === '/setting' }" @click="goTo('/setting')">
				<div class="bg-color"></div>
				<div class="flex bg-text">
					<bt-icon name="user" color="1f1f1f" size="16" class="z-1" />
				</div>
			</li>
			<li :class="{ active: $route.path === '/home' }" @click="goTo('/home')">
				<div class="bg-color"></div>
				<div class="flex bg-text">
					<bt-icon name="panel" color="1f1f1f" size="16" class="z-1" />
					<span class="title">{{ pub.lang('面板') }}</span>
				</div>
			</li>
			<li :class="{ active: $route.path === '/xterm' }" @click="goTo('/xterm')">
				<div class="bg-color"></div>
				<div class="flex bg-text">
					<bt-icon name="xterm" color="1f1f1f" size="16" class="z-1" />
					<span class="title">{{ pub.lang('终端') }}</span>
				</div>
			</li>
			<!-- <li :class="{ active: $route.path === '/batchSender' }" @click="goTo('/batchSender')">
				<div class="bg-color"></div>
				<div class="flex bg-text">
					<bt-icon name="bulk" color="1f1f1f" size="16" class="z-1" />
					<span class="title">{{ pub.lang('群发') }}</span>
				</div>
			</li> -->
		</ul>
		<el-divider direction="vertical" class="menu-line"></el-divider>
	</div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { pub } from '@utils/tools'

const router = useRouter()

const goTo = (path: string) => {
	router.push(path)
}
</script>

<style scoped lang="scss">
ul {
	padding: 0;
	padding-top: 7px;
	height: 100%;
	color: #1f1f1f;
	li {
		display: flex;
		align-items: center;
		height: 3.4rem;
		padding: 0.5rem 1rem;
		border-radius: 1rem;
		margin-right: 0.5rem;
		position: relative;
		cursor: pointer;
		.bg-text {
			z-index: 1;
			margin-top: -4px;
			.title {
				font-size: 1.2rem;
				margin-left: 0.5rem;
			}
		}
		&:hover {
			.bg-color {
				background-color: #a8c7fa;
				height: 2.8rem;
				border-radius: 1rem;
				box-shadow: none;
				width: 100%;
				position: absolute;
				top: 0;
				left: 0;
			}
			&:first-child {
				.bg-color {
					width: 3.6rem;
				}
			}
		}
		&.active {
			.bg-color {
				position: absolute;
				background-color: #fff;
				border-radius: 5px;
				width: 100%;
				height: 3.5rem;
				left: 0;
				&::before,
				&::after {
					position: absolute;
					bottom: 0;
					content: '';
					width: 21px;
					height: 20px;
					border-radius: 50%;
					box-shadow: 0 0 0 40px #fff; /*使用box-shadow不影响尺寸*/
				}
				&::before {
					left: -19px;
					clip-path: inset(50% -10px 0 50%);
				}
				&::after {
					right: -19px;
					clip-path: inset(50% 50% 0 -10px);
				}
			}
		}
		&:first-child {
			&.active {
				.bg-color {
					width: 3.6rem;
				}
			}
		}
		&:last-child {
			margin-right: 0;
		}
	}
}
.menu-line {
	border-width: 0.2rem;
	border-color: #b8c0cd;
}
</style>
