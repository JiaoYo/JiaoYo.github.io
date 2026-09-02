<script lang="ts" setup>
import { useToast } from 'wot-design-uni';
import { reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjInfo } from '@/service/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const dataForm = reactive<{
    id: number | null;
    proname: string;
    status: number | null;
    username: string;
    progess: number;
    prosite: string;
    proaddr: string;
    longitude: number;
    latitude: number;
    sdbtime: string;
    period: number;
    ptype: number;
    dtype: number;
    cpdbtime: string;
    ckusername: string;
    ckdbtime: string;
	businesscon: string;
    uuid: string;
    dbtime: string;
}>({
    id: null,
    proname: '',
    status: null,
    username: '',
    progess: 0,
    prosite: '',
    proaddr: '',
    longitude: 0,
    latitude: 0,
    sdbtime: '',
    period: 0,
    ptype: 0,
    dtype: 0,
    cpdbtime: '',
    ckusername: '',
    ckdbtime: '',
	businesscon: '',
    uuid: '',
    dbtime: ''
});

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取用户基本信息
async function getPrjDetailInfo() {
    try {
        const data = await fetchGetPrjInfo((dataForm.id as number));
        dataForm.id = data.id;
        dataForm.proname = data.proname;
        dataForm.status = data.status;
        dataForm.username = data.username;
        dataForm.progess = data.progess;
        dataForm.prosite = data.prosite || '';
        dataForm.proaddr = data.proaddr || '';
        dataForm.longitude = data.longitude || 0;
        dataForm.latitude = data.latitude || 0;
        dataForm.sdbtime = data.sdbtime || '';
        dataForm.period = data.period || 0;
        dataForm.ptype = data.ptype || 0;
        dataForm.dtype = data.dtype || 0;
        dataForm.ckusername = data.ckusername || '';
        dataForm.ckdbtime = data.ckdbtime || '';
        dataForm.cpdbtime = data.cpdbtime || '';
		dataForm.businesscon = data.businesscon || '';
        dataForm.uuid = data.uuid;
        dataForm.dbtime = data.dbtime;
    } catch (err) {
        console.error('获取项目信息失败', err);
    }
}

// 打开位置
function handleOpenLocation() {
    uni.openLocation({
        longitude: dataForm.longitude,
        latitude: dataForm.latitude
    })
}

onLoad((options: any) => {
    dataForm.id = options.id;
    getPrjDetailInfo();
});

onPullDownRefresh(() => {
	getPrjDetailInfo();
	setTimeout(() => {
	    uni.hideNavigationBarLoading(); // 完成停止加载
	    uni.stopPullDownRefresh();
	}, 1000);
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="项目详情" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view style="margin: 20rpx; border-radius: 20rpx; overflow: hidden;">
            <wd-cell-group>
                <wd-cell title="项目名称" title-width="110px" :value="dataForm.proname" />
                <wd-cell title="项目状态" title-width="110px">
                    <wd-tag :type="dataForm.status === -1 ? 'default' : dataForm.status === 0 ? 'default' : dataForm.status === 1 ? 'primary' : dataForm.status === 2 ? 'warning' : dataForm.status === 3 ? 'success' : 'default'" round>
                        {{ dataForm.status === -1 ? '未核准' : dataForm.status === 0 ? '未开始' : dataForm.status === 1 ? '进行中' : dataForm.status === 2 ? '待审核' : dataForm.status === 3 ? '已完成' : '未知'  }}
                    </wd-tag>
                </wd-cell>
                <wd-cell title="完成情况" title-width="110px">
                    <wd-tag :type="dataForm.ptype === 0 ? 'success' : dataForm.ptype === 1 ? 'warning' : dataForm.ptype === 2 ? 'danger' : 'default'" round>
                        {{ dataForm.ptype === 0 ? '正常' : dataForm.ptype === 1 ? '延期' : dataForm.ptype === 2 ? '作废' : '未知'  }}
                    </wd-tag>
                </wd-cell>
                <wd-cell title="调试类型" title-width="110px">
                    <wd-tag type="primary" round>
                        {{ dataForm.dtype === 0 ? '现场调试' : dataForm.dtype === 1 ? '远程调试' : dataForm.dtype === 2 ? '无需调试' : '未知'  }}
                    </wd-tag>
                </wd-cell>
                <wd-cell v-if="dataForm.longitude && dataForm.latitude" title="项目地址" title-width="110px" clickable @click="handleOpenLocation">
                    <view style="display: flex; align-items: center; justify-content: flex-end">
                        <view class="custom-text">
                            {{ dataForm.prosite }}
                        </view>
                        <wd-icon name="location" size="22px" />
                    </view>
                </wd-cell>
                <wd-cell title="项目详细地址" title-width="110px" :value="dataForm.proaddr" />
                <wd-cell title="当前进度" title-width="110px">
                    <wd-progress color="#4d80f0" :percentage="dataForm.progess" />
                </wd-cell>
                <wd-cell title="开始时间" title-width="110px" :value="dataForm.sdbtime" />
                <wd-cell title="项目周期" title-width="110px" :value="dataForm.period + '天'" />
                <wd-cell title="预计完成日期" title-width="110px" :value="dataForm.cpdbtime" />
                <wd-cell title="验收人" title-width="110px" :value="dataForm.ckusername" />
                <wd-cell title="验收时间" title-width="110px" :value="dataForm.ckdbtime" />
				<wd-cell title="商务联系人" custom-class="cellClass">
					<wd-text bold :text="dataForm.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
				</wd-cell>
                <wd-cell title="创建者" title-width="110px" :value="dataForm.username" />
                <wd-cell title="创建时间" title-width="110px" :value="dataForm.dbtime" />
            </wd-cell-group>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
:deep(.wd-progress__outer) {
    height: 7px !important;
    border-radius: 10px !important;
}

:deep(.wd-progress__inner) {
    border-radius: 10px !important;
}
</style>
