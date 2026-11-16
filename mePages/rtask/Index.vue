<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<view class="page-layout">
			<view class="top-area">
				<wd-navbar left-arrow title="实时任务" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
				<wd-tabs v-model="activeTab" animated>
					<wd-tab title="今日任务"></wd-tab>
					<wd-tab title="任务列表"></wd-tab>
					<wd-tab title="操作日志"></wd-tab>
				</wd-tabs>
			</view>

			<view class="content-area">
				<today v-if="activeTab === 0" :content-height="contentHeight" />
				<tasklist v-else-if="activeTab === 1" :content-height="contentHeight" />
				<loglist v-else :content-height="contentHeight" />
			</view>
		</view>

		<wd-message-box />
	</wd-config-provider>
</template>

<script lang="ts" setup>
import { ref, nextTick, onMounted } from 'vue'
import { useTheme } from '@/composables/theme/theme'
import today from './modules/today.vue'
import tasklist from './modules/tasklist.vue'
import loglist from './modules/loglist.vue'

const { themeVars, theme } = useTheme()

const activeTab = ref<number>(0)
const contentHeight = ref<number>(0)

function handleClickLeft() {
    // #ifdef H5
    history.go(-1)
    // #endif

    // #ifndef H5
    uni.navigateBack()
    // #endif
}

// 测量内容区实际可用高度（px），传给各模块内部的 scroll-view
function recalcContentHeight() {
    uni.createSelectorQuery()
        .select('.content-area')
        .boundingClientRect((rect: any) => {
            if (rect && rect.height !== undefined) {
                contentHeight.value = rect.height
            }
        })
        .exec()
}

onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcContentHeight()
        }, 50)
    })
})
</script>

<style lang="scss" scoped>
.page-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
}

.top-area {
    flex-shrink: 0;
    background-color: #F5F5F5;
    box-sizing: border-box;
}

.content-area {
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
    overflow: hidden;
}
</style>
