<script lang="ts" setup>
import { useToast } from 'wot-design-uni';
import { reactive, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMessage } from 'wot-design-uni';
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetUserInfo, fetchGetUserInfoWithWechat, fetchUnbindwechatInfo } from '@/service/index';
import { hasPermission, maskPhone, doSM2Encrypt } from '@/utils/index';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const message = useMessage();

const dataForm = reactive<{
    username: string;
    phnum: string;
	userimage: string;
	usertype: number;
	udesc: string;
	nickname: string;
	dbtime: string;
	isBind: boolean;
	password: string;
}>({
    username: '',
    phnum: '',
	userimage: '',
	usertype: 0,
	udesc: '',
	nickname: '',
	dbtime: '',
	isBind: false,
	password: ''
});

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif

    uni.$emit('app-on-showuserinfo');
}

// 获取用户基本信息
async function getUserInfo() {
    try {
        const data = await fetchGetUserInfoWithWechat();
        dataForm.username = data.username;
        dataForm.phnum = data.phnum ? data.phnum : '';
		dataForm.userimage = data.userimage || 'https://dingiiot.com/dingiiotTest/static/soybean.jpg';
		dataForm.usertype = data.usertype;
		dataForm.udesc = data.udesc || '';
        dataForm.nickname = data.nickname || '';
        dataForm.dbtime = data.dbtime || '';
		if (data.nickname) {
			dataForm.isBind = true;
		} else {
			dataForm.isBind = false;
		}
    } catch (err) {
        console.error('获取用户信息失败', err);
    }
}

// 跳转页面
async function handleJumpPageChange(url: string) {
    uni.navigateTo({
        url,
    });
}

// 解除微信绑定
async function handleUnbindSubmitChange() {
	try {
		message
		    .prompt({
				title: '请输入密码',
				inputType: 'password',
				inputPlaceholder: '请输入密码',
				inputValue: dataForm.password,
				inputPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{}|;:,.<>\/?]).{6,18}$/,
				inputError: '密码必须为6-18位，包含大小写字母、数字和特殊字符'
		    })
		    .then(async (resp) => {
				console.log('resp', resp);
				const data = await fetchUnbindwechatInfo({ pwd: doSM2Encrypt(resp.value), _t: new Date().getTime() });
				uni.showToast({
					icon: 'none',
					title: '解除微信绑定成功',
					duration: 1500,
					complete: () => {
						getUserInfo();
					}
				})
		    })
		    .catch((error) => {
		      console.log(error)
		    })
	} catch (error) {
		console.log('解除微信绑定失败', error);
	}
}

onShow(() => {
    getUserInfo();
});

onPullDownRefresh(() => {
    getUserInfo();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow title="个人信息" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />
		<wd-message-box />
        <wd-toast />
        <view style="margin: 20rpx; border-radius: 20rpx; overflow: hidden;">
            <wd-cell-group>
                <wd-cell title="用户名" title-width="110px" :value="dataForm.username">
					<view style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
						<wd-img :width="40" :height="40" round :src="dataForm.userimage" :preview-src="dataForm.userimage" :enable-preview="true" />
						<wd-text bold :text="dataForm.username" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
					</view>
				</wd-cell>
                <!-- <wd-cell title="姓名" title-width="110px" :value="dataForm.realName" is-link @click="handleJumpPageChange(`/mePages/updaterealname/Index?name=${dataForm.realName}`)" /> -->
                <wd-cell title="联系方式" title-width="110px" is-link @click="handleJumpPageChange(`/mePages/updatemobile/Index?mobile=${dataForm.phnum}`)">
					<wd-text bold :text="dataForm.phnum ? maskPhone(dataForm.phnum) : ''" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
				</wd-cell>
                <wd-cell title="用户类型" title-width="110px">
					<wd-tag size="small" type="primary" round>
						{{ dataForm.usertype === 0 ? '系统管理员' : dataForm.usertype === 1 ? '销售' : dataForm.usertype === 2 ? '项目负责人' : dataForm.usertype === 3 ? '技术工程师' : dataForm.usertype === 4 ? '综合管理' : dataForm.usertype === 5 ? '研发工程师' : dataForm.usertype === 6 ? '生产工程师' : '未知'  }}
					</wd-tag>
				</wd-cell>
				<wd-cell title="用户描述" title-width="110px">
					<wd-text bold :text="dataForm.udesc" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
				</wd-cell>
				<wd-cell v-if="dataForm.nickname" title="绑定微信昵称" title-width="110px">
					<wd-text bold :text="dataForm.nickname" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
				</wd-cell>
				<wd-cell v-if="dataForm.dbtime" title="绑定微信时间" title-width="110px">
					<wd-text bold :text="dataForm.dbtime" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
				</wd-cell>
				<!-- <wd-cell title="电子邮箱" title-width="110px" :value="dataForm.email" is-link @click="handleJumpPageChange(`/mePages/updateemail/Index?email=${dataForm.email}`)" /> -->
            </wd-cell-group>
			
			<view v-if="dataForm.isBind" style="margin-top: 40rpx;">
				<wd-button type="error" block classPrefix="icon" icon="weixinmw" @click="handleUnbindSubmitChange">解除微信绑定</wd-button>
			</view>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
:deep(.icon-weixinmw){
    color: #0DD116 !important;
}
</style>
