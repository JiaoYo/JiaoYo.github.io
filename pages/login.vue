<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { getUUID, doSM2Encrypt, extractPermissionsByPtype } from '@/utils/index';
import { BASE_URL } from '@/utils/request';
import { globalData } from '@/utils/global';
import { useWxLogin } from "@/hooks/useWxLogin";
import wechatPng from '@/static/wechat.png';
import phonePng from '@/static/phone.png';
import accountpasswordPng from '@/static/accountpassword.png';
import { fetchGetCaptchaInfo, fetchGetCaptchaImageInfo, fetchGetUserInfo, fetchGetSystemMenuInfo, login, fetchGetPhoneNumberCodeInfo, fetchPhoneNumberCodeLoginInfo } from '@/service/index';

const { themeVars, theme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

const activeTab = ref<number>(0);
const codeText = ref<string>('获取验证码');
const currentSeconds = ref<number>(60);
const codeTimer = ref<any>();
const bindShow = ref<boolean>(false);
const loginLoading = ref<boolean>(false);

const tabsList = ref<{ title: string, value: number }[]>([
    {
        title: '账号密码登录',
        value: 0
    },
    // {
    //     title: '微信授权登录',
    //     value: 1
    // },
    {
        title: '手机验证码登录',
        value: 1
    }
]);

const model = reactive<{
    username: string;
    password: string;
    captchaEnable: boolean;
    uuid: string;
    captcha: string;
    captchaImageSrc: string;
    checked: boolean;
	phone: string;
	code: string;
}>({
    username: '',
    password: '',
    captchaEnable: false,
    uuid: '',
    captcha: '',
    captchaImageSrc: '',
    checked: false,
	phone: '',
	code: ''
});

const bindWechatModel = reactive<{
    username: string;
    password: string;
    confirmpassword: string;
}>({
    username: '',
    password: '',
    confirmpassword: ''
});

const form = ref();
const bindWechatModelForm = ref();

// 获取是否启用验证码
async function getCaptchaEnableInfo() {
    try {
        const data = await fetchGetCaptchaInfo();
        model.captchaEnable = data == 0 ? false : true;
        if (model.captchaEnable) {
            getCaptchaImageInfo();
        }
    } catch (err) {
        console.error('获取是否启用验证码失败', err);
    }
}

// 获取验证码图片
async function getCaptchaImageInfo() {
    try {
        model.uuid = getUUID();
        model.captchaImageSrc = BASE_URL + '/captcha?uuid=' + model.uuid + '&_t=' + new Date().getTime();
    } catch (err) {
        console.error('获取验证码图片失败', err);
    }
}

// 验证手机号码
function validatorPhone(val: string) {
    if (String(val)) {
        if (!/^1[3-9]\d{9}$/.test(String(val))) {
            return Promise.reject('请输入正确的手机号码');
        } else {
            return Promise.resolve();
        }
    } else {
        return Promise.reject('请输入手机号码');
    }
}

// 验证手机号验证码
function validatorPhoneCaptcha(val: string) {
    if (String(val)) {
        return Promise.resolve();
    } else {
        return Promise.reject('请输入验证码');
    }
}

// 验证用户名
function validatorUsername(val: string) {
    if (String(val)) {
        return Promise.resolve();
    } else {
        return Promise.reject('请输入用户名');
    }
}

// 验证密码
function validator(val: any) {
    if (!val) {
        return Promise.reject('请输入密码');
    } else if (String(val).length < 6) {
        return Promise.reject('长度不得小于6位');
    } else if (String(val).length > 18) {
        return Promise.reject('长度不得大于18位');
    } else {
        if (val.toLocaleLowerCase().includes(model.username.toLocaleLowerCase())) {
            return Promise.reject('密码不能包含用户名');
        } else {
            const regex: string = "^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>]).{6,18}$";
            const regexPattern = new RegExp(regex);
            if (!regexPattern.test(val)) {
                return Promise.reject('密码必须包含 数字、大写字母、小写字母、特殊字符');
            } else {
                return Promise.resolve();
            }
        }
    }

    // if (String(val).length > 18) {
    //     return Promise.resolve();
    // } else if (String(val).length >= 6) {
    //     return Promise.resolve();
    // } else if (String(val).length > 0) {
    //     return Promise.reject('长度不得小于6位');
    // } else {
    //     return Promise.reject('请输入密码');
    // }
}

// 验证密码
function validatorConfirmpassword(val: any) {
    if (!val) {
        return Promise.reject('请输入密码');
    } else if (String(val).length < 6) {
        return Promise.reject('长度不得小于6位');
    } else if (String(val).length > 18) {
        return Promise.reject('长度不得大于18位');
    } else {
        if (val.toLocaleLowerCase().includes(model.username.toLocaleLowerCase())) {
            return Promise.reject('密码不能包含用户名');
        } else {
            const regex: string = "^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>]).{6,18}$";
            const regexPattern = new RegExp(regex);
            if (!regexPattern.test(val)) {
                return Promise.reject('密码必须包含 数字、大写字母、小写字母、特殊字符');
            } else {
                if (val !== bindWechatModel.password) {
                    return Promise.reject('密码不一致');
                } else {
                    return Promise.resolve();
                }
            }
        }
    }

    // if (String(val).length > 18) {
    //     return Promise.resolve();
    // } else if (String(val).length >= 6) {
    //     return Promise.resolve();
    // } else if (String(val).length > 0) {
    //     return Promise.reject('长度不得小于6位');
    // } else {
    //     return Promise.reject('请输入密码');
    // }
}

// 验证验证码
function validatorCaptcha(val: string) {
    if (String(val)) {
        return Promise.resolve();
    } else {
        return Promise.reject('请输入验证码');
    }
}

// 获取手机验证码
async function handleGetPhoneCodeChange() {
    try {
        if (!String(model.phone)) {
            uni.showToast({
                icon: 'none',
                title: '请输入手机号码',
                duration: 1500
            })
        } else {
            if (!/^1[3-9]\d{9}$/.test(String(model.phone))) {
                uni.showToast({
                    icon: 'none',
                    title: '请输入正确的手机号码',
                    duration: 1500
                })
            } else {
                const data = await fetchGetPhoneNumberCodeInfo({ phoneNumber: model.phone });
                currentSeconds.value--;
                codeText.value = currentSeconds.value + 's后重新获取';
                codeTimer.value = setInterval(() => {
                    currentSeconds.value--;
                    codeText.value = currentSeconds.value + 's后重新获取';
                    if (currentSeconds.value === 0) {
                        currentSeconds.value = 60;
                        codeText.value = "获取验证码";
                        clearInterval(codeTimer.value);
                        codeTimer.value = null;
                    }
                }, 1000);
            }
        }
    } catch (error) {
        currentSeconds.value = 60;
        codeText.value = "获取验证码";
    }
}

function handleSubmit() {
    form.value
        .validate()
        .then(({ valid, errors }: { valid: any; errors: any }) => {
            console.log('valid', valid);
            console.log('errors', errors);
            if (valid) {
				try {
					async function handleLoginChange() {
						loginLoading.value = true;
						// uni.login({
						// 	provider: 'weixin',
						// 	onlyAuthorize: true,
						// 	success: (loginRes) => {
						// 		console.log('登录成功', loginRes);
						// 	},
						// 	fail: (err) => {
						// 		console.error('登录失败', err);
						// 	}
						// });
					    // try {
					    //     const res = await useWxLogin();
					    //     if (!res) {
					    //         console.log("H5第一次跳转授权，等待用户授权回调");
					    //         return;
					    //     }
					    //     console.log("登录成功：", res);
					    // } catch (err) {
					    //     console.error("登录失败：", err);
					    // }
					    if (activeTab.value === 0) {
							async function handleLoginChange() {
								try {
									const data = model.captchaEnable ? await login({ username: doSM2Encrypt(model.username), password: doSM2Encrypt(model.password), uuid: model.uuid, captcha: model.captcha }) : await login({ username: doSM2Encrypt(model.username), password: doSM2Encrypt(model.password) });
									if (data.code === 0) {
										if (model.checked) {
											uni.setStorageSync('username', model.username);
											uni.setStorageSync('password', model.password);
											uni.setStorageSync('checked', model.checked);
										} else {
											uni.removeStorageSync('username');
											uni.removeStorageSync('password');
											uni.removeStorageSync('checked');
											uni.removeStorageSync('usertype');
										}
										uni.setStorageSync('token', data.data.token);
										handleLoginResultChange();
									} else {
										uni.showToast({ title: data.data || data.msg || '请求出错', icon: 'none' });
										if (model.captchaEnable) {
											getCaptchaImageInfo();
											model.captcha = "";
										}
									}
								} catch (err) {
									console.error('登录失败', err);
									if (model.captchaEnable) {
										getCaptchaImageInfo();
										model.captcha = "";
									}
								}
							}
							handleLoginChange();
						} else if (activeTab.value === 1) {
							async function handlePhoneCodeLoginChange() {
								try {
									const data = await fetchPhoneNumberCodeLoginInfo({ phnum: model.phone, code: model.code });
									if (data.code === 0) {
										if (codeTimer.value) {
											clearInterval(codeTimer.value);
											codeTimer.value = null;
											currentSeconds.value = 60;
											codeText.value = "获取验证码";
										}
										uni.setStorageSync('phoneNumber', model.phone);
										uni.setStorageSync('token', data.data.token);
										handleLoginResultChange();
									} else {
										uni.showToast({ title: data.data || data.msg || '请求出错', icon: 'none' });
										if (codeTimer.value) {
											clearInterval(codeTimer.value);
											codeTimer.value = null;
											currentSeconds.value = 60;
											codeText.value = "获取验证码";
										}
									}
								} catch (err) {
									console.error('登录失败', err);
									if (codeTimer.value) {
										clearInterval(codeTimer.value);
										codeTimer.value = null;
										currentSeconds.value = 60;
										codeText.value = "获取验证码";
									}
								}
							}
							handlePhoneCodeLoginChange();
						}
					}
					handleLoginChange();
				} catch (loginError) {
					console.error('登录失败', loginError);
					loginLoading.value = false;
				}
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

// 绑定微信
async function handleBindWechatSubmit() {
    bindWechatModelForm.value
        .validate()
        .then(({ valid, errors }: { valid: any; errors: any }) => {
            console.log('valid', valid);
            console.log('errors', errors);
            if (valid) {
                // 微信绑定用户名、密码
                bindShow.value = false;
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

async function handleLoginResultChange() {
    const data = await fetchGetUserInfo();
    const systemMenuInfo = await fetchGetSystemMenuInfo();
    uni.setStorageSync('userId', data.id);
    uni.setStorageSync('username', data.username);
    uni.setStorageSync('usertype', data.usertype);
    const permissionList = extractPermissionsByPtype(systemMenuInfo, data.usertype);
    globalData.permissionList = permissionList;
    uni.setStorageSync('permissionList', permissionList);
    uni.$emit('user-login-success'); // 通知 App.vue 去建立 WebSocket 连接
	if (data.usertype === 7) {
		uni.switchTab({
		    url: '/pages/me',
			complete: () => {
				loginLoading.value = false;
			}
		});
	} else {
		uni.switchTab({
		    url: '/pages/project',
			complete: () => {
				loginLoading.value = false;
			}
		});
	}
}

onLoad(() => {
    if (uni.getStorageSync('checked')) {
        model.username = uni.getStorageSync('username') || '';
        model.password = uni.getStorageSync('password') || '';
        model.checked = uni.getStorageSync('checked') || false;
    }
	model.phone = uni.getStorageSync('phoneNumber');
});

onShow(() => {
    getCaptchaEnableInfo();
})
</script>

<template>
	<wd-config-provider :theme="theme">
		<view class="loginContainer">
			<view class="loginMask">
				<view class="loginWrap">
					<view class="loginHeader">
						<wd-img :width="80" mode="widthFix" src="https://firmware.linkqi.cn/eb5100c9-5a18-4066-818f-6c5685611b51" />
						<wd-text bold text="领祺项目管理" size="24px" :color="isDark ? '#ffffff' : '#ffffff'" />
					</view>

					<wd-form ref="form" :model="model" style="width: 100%; padding: 20rpx 0;">
						<wd-tabs v-model="activeTab" animated>
							<wd-tab v-for="(item, index) in tabsList" :key="index" :title="item.title">
								<wd-cell-group border style="border-radius: 20rpx; overflow: hidden">
									<wd-input v-if="activeTab === 0" v-model="model.username" label="用户名" label-width="70px" prefix-icon="user-circle" prop="username" clearable placeholder="请输入用户名" placeholder-class="lightPlaceholderClass" :rules="[{ required: false, message: '请输入用户名', validator: validatorUsername }]" />
									<wd-input
										v-if="activeTab === 0"
										v-model="model.password"
										label="密码"
										show-password
										label-width="70px"
										prefix-icon="view"
										prop="password"
										clearable
										placeholder="请输入密码"
										placeholder-class="lightPlaceholderClass"
										:maxlength="18"
										:rules="[
											{
												required: false,
												validator,
												message: '请输入正确的密码'
											},
										]"
									/>
									<wd-input v-if="model.captchaEnable && activeTab === 0" custom-class="captchaInputWrap" v-model="model.captcha" label="验证码" label-width="70px" prefix-icon="creditcard" prop="captcha" clearable placeholder="请输入验证码" placeholder-class="lightPlaceholderClass" :rules="[{ required: false, message: '请输入用户名', validator: validatorCaptcha }]">
										<template #suffix>
											<image style="height: 35px; margin-right: 5px; width: 90px;" :src="model.captchaImageSrc" @click="getCaptchaImageInfo" />
										</template>
									</wd-input>

									<view style="padding: 24rpx" v-if="activeTab === 0">
										<wd-checkbox v-model="model.checked" shape="square"> 记住密码 </wd-checkbox>
									</view>

									<wd-input v-if="activeTab === 1" v-model="model.phone" label="手机号码" label-width="80px" prefix-icon="mobile" prop="phone" clearable placeholder="手机号码" placeholder-class="lightPlaceholderClass" :rules="[{ required: false, message: '请输入手机号码', validator: validatorPhone }]" />
									<wd-input v-if="activeTab === 1" v-model="model.code" label="验证码" label-width="80px" prefix-icon="creditcard" prop="code" clearable placeholder="验证码" placeholder-class="lightPlaceholderClass" :rules="[{ required: false, message: '请输入验证码', validator: validatorPhoneCaptcha }]" center>
										<template #suffix>
											<wd-button type="primary" :disabled="currentSeconds !== 60" @click="handleGetPhoneCodeChange" custom-class="customLoginButton">{{ codeText }}</wd-button>
										</template>
									</wd-input>
									<!-- <view style="display: flex; justify-content: space-around; align-items: center; margin-top: 20rpx; margin-bottom: 20rpx;">
										<image style="width: 30px; height: 30px;" :src="wechatPng" @click="handleSubmit" />
										<image style="width: 30px; height: 30px;" :src="phonePng" />
										<image style="width: 30px; height: 30px;" :src="accountpasswordPng" />
									</view> -->
								</wd-cell-group>
						
								<view class="footer" v-if="activeTab === 0 || activeTab === 1">
									<wd-button :loading="loginLoading" type="primary" size="large" block @click="handleSubmit" custom-class="customLoginButton">登录</wd-button>
								</view>
						
								<!-- #ifdef MP-WEIXIN -->
								<view :style="{ marginTop: '20rpx', color: isDark ? '#FFFFFF' : '#000000', padding: '0 20rpx', width: 'calc(100% - 40rpx)' }">
									<view style="font-size: 16px; font-weight: bolder; margin-bottom: 5px">领祺项目管理</view>
									<view class="tipWrap" :style="{ color: isDark ? '#FFFFFF' : 'lightgrey' }">
										<view class="tipListItem">
											<view class="dot" :style="{ background: isDark ? '#FFFFFF' : 'lightgrey' }"></view>
											申请获取以下权限
										</view>
										<view class="tipListItem">
											<view class="dot" :style="{ background: isDark ? '#FFFFFF' : 'lightgrey' }"></view>
											获得你的公开信息(昵称，头像等)
										</view>
										<view class="tipListItem">
											<view class="dot" :style="{ background: isDark ? '#FFFFFF' : 'lightgrey' }"></view>
											登录即可享受此系统完整功能
										</view>
									</view>
								</view>
								<!-- #endif -->
							</wd-tab>
						</wd-tabs>
					</wd-form>
				</view>
			</view>
		</view>
		
		<wd-popup v-model="bindShow" :close-on-click-modal="false" safe-area-inset-bottom custom-style="border-radius:32rpx;">
			<view :style="{ width: '90vw', backgroundColor: isDark ? '#303D54' : '', padding: '20rpx' }">
				<wd-text bold text="绑定微信" :color="isDark ? '#FFFFFF' : '#FFFFFF'" size="30rpx">
					<template #suffix>
						<view style="color: #F87171; margin-left: 10rpx; display: inline-block; font-size: 24rpx;">绑定过期时间10分钟</view>
					</template>
				</wd-text>

				<wd-form ref="bindWechatModelForm" :model="bindWechatModel">
					<wd-cell-group border style="margin-top: 20rpx;">
						<wd-input v-model="bindWechatModel.username" label="用户名" label-width="80px" prefix-icon="user-circle" prop="username" clearable placeholder="请输入用户名" :rules="[{ required: false, message: '请输入用户名', validator: validatorUsername }]" />
						<wd-input v-model="bindWechatModel.password" label="密码" show-password label-width="80px" prefix-icon="view" prop="password" clearable
							placeholder="请输入密码" :maxlength="18"
							:rules="[
								{
									required: false,
									validator,
									message: '请输入正确的密码'
								},
							]"
						/>
						<wd-input v-model="bindWechatModel.confirmpassword" label="确认密码" show-password label-width="80px" prefix-icon="view" prop="confirmpassword" clearable
							placeholder="请再次输入密码" :maxlength="18"
							:rules="[
								{
									required: false,
									validator: validatorConfirmpassword,
									message: '请输入正确的密码'
								},
							]"
						/>
					</wd-cell-group>

					<view class="footer" style="margin: 40rpx 0 20rpx;">
						<wd-button type="primary" block @click="handleBindWechatSubmit" custom-class="customLoginButton">确定</wd-button>
					</view>
				</wd-form>
			</view>
		</wd-popup>
	</wd-config-provider>
</template>

<style lang="scss" scoped>
.wot-theme-dark {
	.loginMask {
		background-image: url('data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%221%22%20x1%3D%220%22%20x2%3D%221%22%20y1%3D%220%22%20y2%3D%220%22%20gradientTransform%3D%22matrix(6.123233995736766e-17%2C%201%2C%20-4.6978042184964846%2C%206.123233995736766e-17%2C%200.5%2C%200)%22%3E%3Cstop%20stop-color%3D%22%230a0f1d%22%20stop-opacity%3D%221%22%20offset%3D%220%22%3E%3C%2Fstop%3E%3Cstop%20stop-color%3D%22%23152a4a%22%20stop-opacity%3D%220.8%22%20offset%3D%221%22%3E%3C%2Fstop%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%231)%22%3E%3C%2Frect%3E%3C%2Fsvg%3E');
	}
	
	:deep(.wd-form) {
		background: transparent !important;
	}
	
	:deep(.wd-tabs) {
		background: transparent !important;
	}
	
	:deep(.wd-tabs__nav) {
		background: transparent !important;
	}
	
	:deep(.wd-cell-group__body) {
		background: transparent !important;
	}
	
	:deep(.wd-cell-group) {
		background: transparent !important;
	}
	
	:deep(.wd-input) {
		background: transparent !important;
	}
}

.wot-theme-light {
	.loginMask {
	    background-image: url('data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%221%22%20x1%3D%220%22%20x2%3D%221%22%20y1%3D%220%22%20y2%3D%220%22%20gradientTransform%3D%22matrix(6.123233995736766e-17%2C%201%2C%20-4.6978042184964846%2C%206.123233995736766e-17%2C%200.5%2C%200)%22%3E%3Cstop%20stop-color%3D%22%23002962%22%20stop-opacity%3D%221%22%20offset%3D%220%22%3E%3C%2Fstop%3E%3Cstop%20stop-color%3D%22%231677fe%22%20stop-opacity%3D%220.8%22%20offset%3D%221%22%3E%3C%2Fstop%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%231)%22%3E%3C%2Frect%3E%3C%2Fsvg%3E');
	}
	
	:deep(.wd-form) {
		background: transparent !important;
	}
	
	:deep(.wd-tabs) {
		background: transparent !important;
	}
	
	:deep(.wd-tabs__nav) {
		background: transparent !important;
	}
	
	:deep(.wd-cell-group__body) {
		background: transparent !important;
	}
	
	:deep(.wd-cell-group) {
		background: transparent !important;
	}
	
	:deep(.wd-input) {
		background: transparent !important;
	}
	
	:deep(.wd-icon) {
		color: #FFFFFF !important;
		background: transparent !important;
	}
	
	:deep(.wd-tabs__nav-item) {
		color: #E8E6E3CC !important;
		
		&.is-active {
			.wd-tabs__nav-item-text {
				color: #FFFFFF !important;
			}
		}
	}
	
	:deep(.wd-input__label) {
		color: #FFFFFF !important;
	}
	
	:deep(.wd-input__inner) {
		color: #FFFFFF !important;
	}
	
	:deep(.wd-checkbox__txt) {
		color: #FFFFFF !important;
	}
}
	
.loginContainer {
    height: 100vh;
    box-sizing: border-box;
    background-image: url('https://pms.linkqi.cn:18443/login_bg.png');
    // background-image: url('https://dingiiot.com/bg.jpg');
    background-size: 100% 100%;
    background-repeat: no-repeat;

    .loginMask {
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40rpx 30rpx;
        box-sizing: border-box;
        // background-image: url('data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%221%22%20x1%3D%220%22%20x2%3D%221%22%20y1%3D%220%22%20y2%3D%220%22%20gradientTransform%3D%22matrix(6.123233995736766e-17%2C%201%2C%20-4.6978042184964846%2C%206.123233995736766e-17%2C%200.5%2C%200)%22%3E%3Cstop%20stop-color%3D%22%23002962%22%20stop-opacity%3D%221%22%20offset%3D%220%22%3E%3C%2Fstop%3E%3Cstop%20stop-color%3D%22%231677fe%22%20stop-opacity%3D%220.8%22%20offset%3D%221%22%3E%3C%2Fstop%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%231)%22%3E%3C%2Frect%3E%3C%2Fsvg%3E');
        // background-image: url('https://dingiiot.com/bg.jpg');
        background-size: 100% 100%;
        background-repeat: no-repeat;
    }

    .loginWrap {
        width: calc(100% - 60rpx);
        display: flex;
        flex-direction: column;
        align-items: center;
        // background: rgba(255, 255, 255, 0.05);
        background: rgba(22, 132, 252, 0.05);
        padding: 30rpx;
        border-radius: 20rpx;
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: rgba(255, 255, 255, 0.8) 0px 0px 6px 0px;
        // box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
        // box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.1); // 柔和阴影
        backdrop-filter: blur(12rpx); // 背景虚化（部分平台支持）

        .loginHeader {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            margin-bottom: 60rpx;
            width: 100%;
        }

        .footer {
            padding: 40rpx 10rpx;
        }
    }

    .tipListItem {
        display: flex;
        align-items: center;
        margin-bottom: 10rpx;
        margin-left: 20rpx;

        .dot {
            width: 10rpx !important;
            height: 10rpx !important;
            border-radius: 50%;
            // background: #ffffff;
            margin-right: 10rpx;
        }
    }

    .customLoginButton {
        background: #1684fc !important;
    }

    .captchaInputWrap {
        height: 40px !important;

        :deep(.wd-input__label) {
            height: 40px !important;
            display: flex !important;
            align-items: center !important;
        }
    }
}

:deep(.wd-input__suffix) {
	display: flex !important;
	align-items: center !important;
	gap: 0 10rpx !important;
}

.wot-theme-light {
	.lightPlaceholderClass {
		color: #E8E6E3CC;
	}
	
	:deep(.wd-popup-wrapper .wd-popup) {
		background: rgba(42, 54, 71, 0.9) !important;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
		                    inset 0 1px 0 rgba(255, 255, 255, 0.05) !important; /* 内发光提升质感 */
		backdrop-filter: blur(4px) important; /* 如果支持，加毛玻璃效果（可选） */
		border: 1px solid rgba(255, 255, 255, 0.06) important;
	}
}
</style>
