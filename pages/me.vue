<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { throttle } from "@/utils/debounce";
import { computed, ref, reactive, onMounted, onUnmounted } from 'vue';
import { onReady, onLoad, onShow } from '@dcloudio/uni-app';
import { uploadFile } from '@/utils/uploadFile';
import { useToast, useMessage } from 'wot-design-uni';
// import { useI18nSync } from '@/hooks/useI18nSync';
import { useTheme } from '@/composables/theme/theme';
import { copyText } from '@/utils/copyText';
import { BASE_URL, QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import { fetchGetUploadFileTokenInfo, fetchGetUserInfo, fetchGetUserInfoWithWechat, logout, fetchUpdateUserImageInfo } from '@/service/index';
import { hasPermission, maskPhone } from '@/utils/index';
import { silenceUpdate } from '@/utils/silence-update';
import { WEB_URL } from '@/utils/request';
import { useTabbar } from '@/composables/useTabbar';
import weChatpng from '@/static/wechat.png';
import type { UploadMethod, UploadFile } from 'wot-design-uni/components/wd-upload/types';
import LevelCertificate from '@/components/awardpopup.vue';

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();

// 使用国际化钩子
// const { setLocale, currentLang } = useI18nSync();

const { theme } = useTheme();

const message = useMessage();

// 点击锁定
const clickLock = ref<boolean>(false);

// 控制语言切换弹出层的显示
const showLanguageSwitch = ref(false);

// 版本号
const version = ref<string>('');

const fileList = ref<UploadFile[]>([]);

const userId = ref<string>(uni.getStorageSync('userId'));

const userType = ref<any>(uni.getStorageSync('usertype'));

const showModal = ref<boolean>(false);

const rankName = ref<string>('');

const showCert = () => {
	showModal.value = true
}

// 用户信息
const userInfo = reactive<{ 
	username: string; 
	phnum: string;
	nickname: string;
	dbtime: string;
	isBind: boolean;
	usertype: number;
	rank?: number;
}>({
    username: '',
    phnum: '',
	nickname: '',
	dbtime: '',
	isBind: false,
	usertype: 0,
	rank: null
})

const rankMap: any = ref<any>({
    0: 'T1_#CCCCCC',
    1: 'T2_#3399FF',
    2: 'T3_#0066CC',
    3: 'T4_#33CC66',
    4: 'T5_#FFCC00',
    5: 'T6_#FF6600',
    6: 'T7_#CC0000',
});

// 获取用户基本信息
async function getUserDetailInfo() {
    try {
		const data = await fetchGetUserInfoWithWechat();
		userInfo.username = data.username || uni.getStorageSync('username');
		userInfo.phnum = data.phnum ? data.phnum : '';
		userInfo.nickname = data.nickname;
		userInfo.dbtime = data.dbtime;
		userInfo.usertype = data.usertype;
		userInfo.rank = data.rank;
		if (userInfo.nickname) {
			userInfo.isBind = true;
		} else {
			userInfo.isBind = false;
		}
		fileList.value = [{ url: data.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg', status: 'success' }];
		uni.setStorageSync('usertype', data.usertype);
		if ((userInfo.usertype === 2 || userInfo.usertype === 3 || userInfo.usertype === 9) && rankMap.value[userInfo.rank]) {
			if (uni.getStorageSync('oldRank')) {
				if (uni.getStorageSync('oldRank') !== String(userInfo.rank)) {
					rankName.value = rankMap.value[userInfo.rank].substring(0, 2);
					showModal.value = true;
					uni.setStorageSync('oldRank', userInfo.rank);
				}
			} else {
				rankName.value = rankMap.value[userInfo.rank].substring(0, 2);
				showModal.value = true;
				uni.setStorageSync('oldRank', String(userInfo.rank));
			}
		}
		// const data = await fetchGetUserInfo();
        // userInfo.username = data.username || uni.getStorageSync('username');
        // userInfo.phnum = data.phnum ? data.phnum : '';
        // fileList.value = [{ url: data.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg', status: 'success' }];
        // uni.setStorageSync('usertype', data.usertype);
    } catch (err) {
		console.error('获取用户信息失败', err);
        userInfo.username = uni.getStorageSync('username');
        userInfo.phnum = '';
		userInfo.nickname = '';
		userInfo.dbtime = '';
		userInfo.isBind = false;
        fileList.value = [{ url: 'https://pms.linkqi.cn:18443/soybean.jpg', status: 'success' }];
    }
}

// 语言切换选项
// const languageActions = computed(() => [
//     {
//         name: '中文 🇨🇳',
//         color: currentLang.value === 'zh-CN' ? '#0083ff' : '',
//     },
//     {
//         name: 'English 🇺🇸',
//         color: currentLang.value === 'en-US' ? '#0083ff' : '',
//     },
// ]);

// 语言选择
function handleLanguageSelect({ index }: { index: number }) {
    const locale = index === 0 ? 'zh-CN' : 'en-US';
    switchLanguage(locale);
}

// 切换语言
function switchLanguage(locale: string) {
    // setLocale(locale);
}

const isDark = computed(() => theme.value === 'dark');

const { toggleTheme, themeVars, colorColumns } = useTheme();

function handleToggleThemeChange() {
    toggleTheme();
}

// 拨打电话
function handleMakePhoneChange() {
    if (!userInfo.phnum) {
        return false
    }
    uni.makePhoneCall({
        phoneNumber: userInfo.phnum
    })
}

// 复制
async function handleCopyChange() {
    try {
        await copyText(userInfo.phnum);
        uni.showToast({ title: '复制成功', icon: 'success' });
    } catch (err) {
        if (err instanceof Error) {
            uni.showToast({ title: err.message, icon: 'none' });
        }
    }
}

// 跳转页面
const handleJumpPageChange = throttle(async (url: string) => {
	try {
		if (clickLock.value) return;
		clickLock.value = true;
		uni.navigateTo({
		    url,
			complete: () => {
				clickLock.value = false;
			}
		});
	} catch(err) {
		clickLock.value = false;
	}
}, 1000)

// 清除缓存
function handleClearStorageChange() {
    message
        .confirm({
            msg: '确定要清除缓存吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            uni.removeStorageSync('username');
            uni.removeStorageSync('password');
            uni.removeStorageSync('checked');
            uni.removeStorageSync('usertype');
			uni.removeStorageSync('phoneNumber');
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
}

// 检查新版本
const handleCheckUpgradeChange = throttle(async (url: string) => {
	try {
		if (clickLock.value) return;
		clickLock.value = true;
		
	} catch (err) {
		clickLock.value = false;
	}
    // #ifdef MP-WEIXIN
    const updateManager = uni.getUpdateManager();
    updateManager.onCheckForUpdate((res) => {
        // 请求完新版本信息的回调
        console.log(res.hasUpdate);
		clickLock.value = false;
    });

    updateManager.onUpdateReady((res1: any) => {
        console.log('res1', res1);
        uni.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success(res: any) {
                if (res.confirm) {
                    // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                    updateManager.applyUpdate();
                } else if (res.cancel) {
                    console.log('用户点击取消，不更新');
                }
            },
        });
    });

    updateManager.onUpdateFailed((res: any) => {
        console.log('res', res);
        // 新的版本下载失败
        uni.showModal({
            title: '已经有新版本了哟~',
            content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
        });
    });
    // #endif

    // #ifdef APP || APP-PLUS
    const platform = uni.getSystemInfoSync().platform;
    plus.runtime.getProperty((plus.runtime as any).appid, (inf) => {
        console.log('inf', inf);
        // 获取服务器的版本号
        uni.request({
            url: WEB_URL + '/projectcontract.json',
            method: 'GET',
            data: {
                edition_type: plus.runtime.appid,
                version_type: platform, // android或者ios
                edition_number: inf.versionCode, // 打包时manifest设置的版本号
                _t: new Date().getTime(),
            },
            success: (resVersion: any) => {
                console.log('resVersion', resVersion);
                if (Number(resVersion.data.data[platform].edition_number) <= Number(inf.versionCode)) {
                    uni.showToast({
                        icon: 'none',
                        duration: 2000,
                        title: '已是最新版本',
						complete: () => {
							clickLock.value = false;
						}
                    });
                } else {
					clickLock.value = false;
                    // 如果是wgt升级，并且是静默更新 （注意！！！ 如果是手动检查新版本，就不用判断静默更新，请直接跳转更新页，不然点击检查新版本后会没反应）
                    if (resVersion.data.data[platform].package_type === 1) {
                        // 调用静默更新方法 传入下载地址
                        silenceUpdate(resVersion.data.data[platform].edition_url);
                    } else {
                        message
                            .confirm({
                                // msg: `亲爱的用户，发现新版本${resVersion.data.data.describe.replace(/<br>/g, ' ')}`,
                                msg: `亲爱的用户，发现新版本${resVersion.data.data[platform].edition_name}。${resVersion.data.data.describe.replace(/<br>/g, ' ')}`,
                                title: '更新提示',
                            })
                            .then(() => {
                                plus.runtime.openURL(resVersion.data.data[platform].edition_url);
                            })
                            .catch((error) => {
                                console.log(error);
                            });
                    }
                }
            },
            fail: () => {},
        });
    });
    // #endif
}, 2000)

// 退出登录
function handleLogoutChange() {
    message
        .confirm({
            msg: '确定要退出登录吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            try {
                const data = await logout();
                uni.removeStorageSync('userId');
                uni.removeStorageSync('token');
                uni.removeStorageSync('usertype');
                uni.removeStorageSync('permissionList');
                uni.$emit('user-logout');
                uni.reLaunch({
                    url: '/pages/login',
                });
            } catch (err) {
                console.error('退出登录失败', err);
				uni.removeStorageSync('userId');
				uni.removeStorageSync('token');
				uni.removeStorageSync('usertype');
				uni.removeStorageSync('permissionList');
				uni.$emit('user-logout');
				uni.reLaunch({
				    url: '/pages/login',
				});
            }
            // setTabbarItemActive('home');
            // router.pushTab({ name: 'home' });
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
}

// 上传头像
const handleImgUploadChange: UploadMethod = async(file, formData, options) => {
    console.log('file', file);

    // #ifdef H5
    uni.uploadFile({
        url: BASE_URL + '/projectFile/uploadFile.do',
        filePath: file.url,
        name: 'multipartFile',
        header: {
            token: uni.getStorageSync('token')
        },
        success: async(res) => {
            try {
                let result: any = JSON.parse(res.data);
                if (result.code !== 0) {
                    uni.showToast({
                        icon: 'none',
                        title: result.data || result.msg,
                        duration: 1500
                    })
                } else {
                    const dataRes = result.data; // 解析后端返回
                    const data = await fetchUpdateUserImageInfo({ id: Number(uni.getStorageSync('userId')), image: dataRes });
                    uni.showToast({
                        icon: 'none',
                        title: '修改头像成功',
                        duration: 1500,
                        success: () => {
                            fileList.value = [{ url: dataRes, status: 'success' }];
                        }
                    })
                }
            } catch (error) {
                console.log('修改头像失败', error);
                fileList.value = [{ url: 'https://pms.linkqi.cn:18443/soybean.jpg', status: 'success' }];
            }
        },
        fail(err) {
            uni.showToast({
                icon: 'none',
                title: '上传头像失败',
                duration: 1500
            })
        }
    })
    // #endif

    // #ifdef APP || APP-PLUS
    uni.uploadFile({
        url: BASE_URL + '/projectFile/uploadFile.do',
        filePath: file.url,
        name: 'multipartFile',
        header: {
            token: uni.getStorageSync('token')
        },
        success: async(res) => {
            try {
                let result: any = JSON.parse(res.data);
                if (result.code !== 0) {
                    uni.showToast({
                        icon: 'none',
                        title: result.data || result.msg,
                        duration: 1500
                    })
                } else {
                    const dataRes = result.data; // 解析后端返回
                    const data = await fetchUpdateUserImageInfo({ id: Number(uni.getStorageSync('userId')), image: dataRes });
                    uni.showToast({
                        icon: 'none',
                        title: '修改头像成功',
                        duration: 1500,
                        success: () => {
                            fileList.value = [{ url: dataRes, status: 'success' }];
                        }
                    })
                }
            } catch (error) {
                console.log('修改头像失败', error);
                fileList.value = [{ url: 'https://pms.linkqi.cn:18443/soybean.jpg', status: 'success' }];
            }
        },
        fail: (uploadErr) => {
            console.error('上传失败:', uploadErr);
        }
    })
    // #endif
}

// 底部tabbar切换
function handleTabbarChange({ value }: { value: string }) {
    if (value !== 'me') {
		if (clickLock.value) return;
		clickLock.value = true;
		setTabbarItemActive(value);
		uni.switchTab({
			url: '/pages/' + activeTabbar.value.name,
			complete: () => {
				clickLock.value = false;
			}
		})
	}
}

// 获取版本号
function getAppversion() {
	// #ifdef H5 || MP-WEIXIN
	const systemInfo: any = uni.getSystemInfoSync();
	version.value = systemInfo.appVersion;
	// #endif
	
	// #ifdef APP || APP-PLUS
	plus.runtime.getProperty(plus.runtime.appid, function(inf) {
		version.value = inf.version;
	})
	// #endif
}

onReady(() => {
	// #ifdef APP || APP-PLUS
	uni.hideTabBar();
	// #endif
})

onLoad(() => {
    getAppversion();
})

onShow(() => {
	getUserDetailInfo();
})
</script>

<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-navbar title="我" safe-area-inset-top placeholder fixed :bordered="false" />
		
		<view style="padding: 20rpx">
			<view :style="{ borderRadius: '20rpx', display: 'flex', alignItems: 'center', padding: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<view style="border-radius: 50%; overflow: hidden; width: 50px; height: 50px;">
					<wd-upload v-model:file-list="fileList" reupload :limit="1" :upload-method="handleImgUploadChange"></wd-upload>
				</view>
				
				<view style="display: flex; justify-content: space-around; flex-direction: column; margin-left: 20rpx; line-height: 2">
					<view style="display: flex; align-items: center; gap: 0 10rpx;">
						<wd-text bold :text="'用户名: ' + userInfo.username" :color="isDark ? '#ffffff' : '#000000'" />
						<wd-tag size="small" type="primary" round v-if="userType !== 7">
							{{ userInfo.usertype === 0 ? '系统管理员' : userInfo.usertype === 1 ? '销售' : userInfo.usertype === 2 ? '项目负责人' : userInfo.usertype === 3 ? '技术工程师' : userInfo.usertype === 4 ? '综合管理' : userInfo.usertype === 5 ? '研发工程师' : userInfo.usertype === 6 ? '生产工程师' : userInfo.usertype === 7 ? '厂家' : userInfo.usertype === 8 ? '测试' : userInfo.usertype === 9 ? '组长' : userInfo.usertype === 10 ? '只读' : '未知'  }}
						</wd-tag>
						<wd-tag size="small" round color="#FFFFFF" :bg-color="rankMap[userInfo.rank].substring(3)" v-if="(userType === 2 || userType === 3 || userType === 9) && rankMap[userInfo.rank]">
							{{ rankMap[userInfo.rank].substring(0, 2) }}
						</wd-tag>
						<wd-icon v-if="userInfo.isBind" class-prefix="icon" name="weixinmw" color="#0DD116" @click="handleJumpPageChange('/mePages/userinfo/Index')"></wd-icon>
					</view>
					<view style="display: flex; align-items: center">
						<wd-text :text="'联系方式: ' + (maskPhone(userInfo.phnum) || '暂无')" mode="phone" :format="true" size="12px" @click="handleMakePhoneChange" />
						<wd-icon v-if="userInfo.phnum" name="file-copy" color="#909399" custom-style="margin-left: 10rpx;" @click="handleCopyChange" />
					</view>
				</view>
			</view>

			<wd-gap height="20rpx" />

			<view style="border-radius: 20rpx; overflow: hidden">
				<wd-cell v-if="hasPermission('sys:user:getById')" title="个人信息" title-width="200px" is-link @click="handleJumpPageChange('/mePages/userinfo/Index')" />
				<wd-cell v-if="hasPermission('sys:user:update')" title="修改密码" title-width="200px" is-link @click="handleJumpPageChange('/mePages/updatepassword/Index')" />
				<wd-cell v-if="hasPermission('sys:user:getPage') && userType === 0" title="用户管理" title-width="200px" is-link @click="handleJumpPageChange('/mePages/membermanage/Index')" />
				<!-- <wd-cell v-if="hasPermission('project:Info:select')" title="项目管理" title-width="200px" is-link @click="handleJumpPageChange('/mePages/prjmanage/Index')" /> -->
				<!-- <wd-cell v-if="hasPermission('project:ContractCorrelation:select')" title="项目合同管理" title-width="200px" is-link @click="handleJumpPageChange('/projectPages/projectcontractpage/Index')" /> -->
				<!-- <wd-cell v-if="hasPermission('project:Contract:select')" title="合同管理" title-width="200px" is-link @click="handleJumpPageChange('/projectPages/contractpage/Index')" /> -->
				<!-- <wd-cell v-if="hasPermission('project:Device:select')" title="合同设备管理" title-width="200px" is-link @click="handleJumpPageChange('/projectPages/contractdevicepage/Index')" /> -->
				<wd-cell v-if="hasPermission('project:Dispatch:select')" title="主站联系人管理" title-width="200px" is-link @click="handleJumpPageChange('/mePages/dispatchmanage/Index')" />
				<wd-cell v-if="hasPermission('project:Weight:select')" title="项目权重管理" title-width="200px" is-link @click="handleJumpPageChange('/mePages/prjweightpage/Index')" />
				<wd-cell v-if="hasPermission('project:Change:Info:select')" title="项目变更" title-width="200px" is-link @click="handleJumpPageChange('/mePages/projectchange/Index')" />
				<wd-cell v-if="hasPermission('project:Change:Contract:select') && userType !== 5" title="合同变更" title-width="200px" is-link @click="handleJumpPageChange('/mePages/contractchange/Index')" />
				<wd-cell v-if="(userType === 0 || userType === 2) && hasPermission('project:team:select')" title="项目分组管理" title-width="200px" is-link @click="handleJumpPageChange('/mePages/groupmanage/Index')" />
				<wd-cell v-if="userType === 0 || userType === 2" title="待审核管理" title-width="200px" is-link @click="handleJumpPageChange('/mePages/auditmanage/Index')" />
				<wd-cell v-if="userType !== 7" title="关于我们" title-width="200px" is-link @click="handleJumpPageChange('/mePages/webview/Index')" />
			</view>

			<wd-gap v-if="userType !== 7" height="20rpx" />

			<view style="border-radius: 20rpx; overflow: hidden" v-if="hasPermission('project:DailyReport:select') || hasPermission('project:Week:select') || hasPermission('project:Summary:select') || hasPermission('project:Meeting:select') || hasPermission('project:Clockin:report:select') || hasPermission('system:Real:Time:Trajectory:select') || hasPermission('project:moji:select') || hasPermission('system.conf.update')">
				<wd-cell v-if="hasPermission('project:DailyReport:select') && userType !== 5" title="技术支持日报" title-width="200px" is-link @click="handleJumpPageChange('/mePages/technicalsupportdaily/Index')" />
				<wd-cell v-if="hasPermission('project:Week:select') && userType !== 5" title="技术支持周报" title-width="200px" is-link @click="handleJumpPageChange('/mePages/technicalsupportweekly/Index')" />
				<wd-cell v-if="hasPermission('project:Summary:select') && userType !== 5" title="项目总结" title-width="200px" is-link @click="handleJumpPageChange('/projectPages/prjsummarypage/Index')" />
				<wd-cell v-if="hasPermission('project:report') && userType !== 5" title="项目报表" title-width="200px" is-link @click="handleJumpPageChange('/mePages/prjreport/Index')" />
				<wd-cell v-if="hasPermission('project:debug') && userType !== 5" title="调试报表" title-width="200px" is-link @click="handleJumpPageChange('/mePages/debugreport/Index')" />
				<!-- <wd-cell v-if="hasPermission('project:aftermarket')" title="售后报表" title-width="200px" is-link @click="handleJumpPageChange('/mePages/aftersalereport/Index')" /> -->
				<wd-cell v-if="hasPermission('project:Meeting:select') && userType !== 3" title="会议纪要" title-width="200px" is-link @click="handleJumpPageChange('/mePages/meetingminutes/Index')" />
				<!-- <wd-cell title="团队日志" title-width="200px" is-link @click="handleJumpPageChange('/mePages/teamlog/Index')" /> -->
				<wd-cell v-if="userType === 0 || userType === 4" title="行为规范报表" title-width="200px" is-link @click="handleJumpPageChange('/mePages/dailyweeksummaryreport/Index')" />
				<wd-cell v-if="userType !== 0 && userType !== 1 && userType !== 4 && (userId === '1024' || userId === '1010')" title="工程中心人员实时考勤统计" title-width="200px" is-link @click="handleJumpPageChange('/mePages/engineeringcenterstaffattendancestatistics/Index')" />
				<!-- <wd-cell v-if="hasPermission('sys:user:get:list') && hasPermission('system:Real:Time:Trajectory:select')" title="工程中心人员实时考勤统计" title-width="200px" is-link @click="handleJumpPageChange('/mePages/engineeringcenterstaffattendancestatistics/Index')" /> -->
				<wd-cell v-if="hasPermission('project:Clockin:report:select')" title="考勤统计" title-width="200px" is-link @click="handleJumpPageChange('/mePages/attendancestatistics/Index')" />
				<!-- <wd-cell title="考勤统计" title-width="200px" is-link @click="handleJumpPageChange('/mePages/attendancestatistics/Index')" /> -->
				<wd-cell v-if="hasPermission('system:Real:Time:Trajectory:select') && (userType === 0 || userType === 4)" title="历史轨迹" title-width="200px" is-link @click="handleJumpPageChange('/mePages/historytrajectory/Index')" />
				<wd-cell v-if="hasPermission('project:moji:select')" title="气象信息" title-width="200px" is-link @click="handleJumpPageChange('/mePages/prjmoji/Index')" />
				<wd-cell v-if="hasPermission('system.conf.update') || userId === '1024' || userType === 4" title="系统配置" title-width="200px" is-link @click="handleJumpPageChange('/mePages/systemconfig/Index')" />
			</view>

			<wd-gap height="20rpx" v-if="hasPermission('project:DailyReport:select') || hasPermission('project:Week:select') || hasPermission('project:Summary:select') || hasPermission('project:Meeting:select') || hasPermission('project:Clockin:report:select') || hasPermission('system:Real:Time:Trajectory:select') || hasPermission('project:moji:select') || hasPermission('system.conf.update')" />

			<view style="border-radius: 20rpx; overflow: hidden" v-if="hasPermission('aftermarket:select:permission.do') || hasPermission('project:afterMarket:reason:select')">
				<wd-cell v-if="userType !== 7" title="售后管理" title-width="200px" is-link @click="handleJumpPageChange('/mePages/aftersalemanage/Index')" />
				<wd-cell title="售后设备" title-width="200px" is-link @click="handleJumpPageChange('/mePages/aftersaledevice/Index')" />
				<wd-cell v-if="hasPermission('project:afterMarket:reason:select')" title="售后原因" title-width="200px" is-link @click="handleJumpPageChange('/mePages/aftersalereason/Index')" />
			</view>
			
			<wd-gap height="20rpx" v-if="hasPermission('aftermarket:select:permission.do') || hasPermission('project:afterMarket:reason:select')" />

			<view style="border-radius: 20rpx; overflow: hidden">
				<!-- <wd-cell :title="$t('yuYan')" title-width="200px" :value="currentLang === 'zh-CN' ? '中文' : 'English'" is-link @click="showLanguageSwitch = true" /> -->
				<wd-cell title="暗黑模式">
					<wd-switch v-model="isDark" size="18px" @change="handleToggleThemeChange" />
				</wd-cell>
				<wd-cell title="清除缓存" is-link @click="handleClearStorageChange" />
				<!-- #ifdef APP || APP-PLUS || MP-WEIXIN -->
				<wd-cell title="版本" title-width="200px" :value="version" is-link @click="handleCheckUpgradeChange" />
				<!-- #endif -->
				<!-- #ifdef H5 -->
				<wd-cell title="版本" title-width="200px" :value="version" />
				<!-- #endif -->
				<wd-cell v-if="userType !== 7" title="用户协议" title-width="200px" is-link @click="handleJumpPageChange('/mePages/webview/Index?url=https://pms.linkqi.cn:18443/userprotocol.html&title=' + encodeURIComponent('用户协议'))" />
				<wd-cell v-if="userType !== 7" title="隐私政策" title-width="200px" is-link @click="handleJumpPageChange('/mePages/webview/Index?url=https://pms.linkqi.cn:18443/privacy.html&title=' + encodeURIComponent('隐私政策'))" />
				<!-- <wd-select-picker v-if="themeVars.colorTheme" v-model="themeVars.colorTheme" :show-confirm="false" label="切换颜色" :columns="colorColumns" type="radio" :z-index="100" /> -->
			</view>

			<wd-gap height="40rpx" />

			<wd-button hairline type="error" :custom-class="isDark ? 'darkButtonWrap' : 'lightButtonWrap'" block @click="handleLogoutChange">退出登录</wd-button>

			<wd-gap height="40rpx" />

			<!-- <view class="wd-action-sheet-else">
				<wd-action-sheet v-model="showLanguageSwitch" class="" safe-area-inset-bottom :actions="languageActions" :cancel-text="$t('qu-xiao')" :title="$t('yuYan')" @select="handleLanguageSelect" />
			</view> -->
			
			<wd-tabbar v-if="userType !== 7" shape="round" model-value="me" placeholder bordered safe-area-inset-bottom fixed @change="handleTabbarChange">
				<wd-tabbar-item v-for="(item, index) in tabbarList" :key="index" :name="item.name" :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon" />
			</wd-tabbar>
			
			<wd-message-box />
			
			<LevelCertificate v-model:visible="showModal" :level="rankName" :department="'工程中心'"
				:honorQuote="'引领AI技术革新，突破多项技术壁垒，特授予首席技术荣誉'" :achievement="'发表顶会论文8篇 | 专利12项 | 培养5名高级专家'" />
		</view>
	</wd-config-provider>
</template>

<style lang="scss" scoped>
:deep(uni-image > div) {
    width: 50px !important;
    height: 50px !important;
}

:deep(.wd-upload__close) {
    display: none !important;
}

:deep(.wechatImage) {
	scale: 0.4 !important;
	margin-left: -20rpx !important;
}
</style>
