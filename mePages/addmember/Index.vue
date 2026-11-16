<script lang="ts" setup>
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { doSM2Encrypt } from '@/utils/index';
import { fetchGetUserInfoById, fetchSaveUserInfo, fetchUpdateUserInfo } from '@/service/index';
import { onLoad } from '@dcloudio/uni-app';

const form = ref();

const { themeVars, theme } = useTheme();

const loading = ref<boolean>(false);

const usertypeColumns = ref([
    {
        value: 1,
        label: '销售人员'
    },
    {
        value: 2,
        label: '项目负责人'
    },
    {
        value: 3,
        label: '调试工程师'
    },
    {
        value: 4,
        label: '综合管理'
    },
    {
        value: 5,
        label: '研发工程师'
    },
    {
        value: 6,
        label: '生产工程师'
    },
	{
		value: 7,
		label: '厂家'
	},
	// {
	// 	value: 8,
	// 	label: '测试'
	// },
	{
		value: 9,
		label: '组长'
	}
]);

const rankColumns = ref([
    {
        value: 0,
        label: 'T1'
    },
    {
        value: 1,
        label: 'T2'
    },
    {
        value: 2,
        label: 'T3'
    },
    {
        value: 3,
        label: 'T4'
    },
    {
        value: 4,
        label: 'T5'
    },
    {
        value: 5,
        label: 'T6'
    },
	{
		value: 6,
		label: 'T7'
	}
]);

const model = reactive<{
    id: number | null;
    username: string;
    password: string;
    confirmPassword: string;
    usertype: number;
    status: number;
    superadmin: number;
    phnum: string;
    udesc: string;
	rank: number | null;
}>({
    id: null,
    username: '',
    password: '',
    confirmPassword: '',
    usertype: 3,
    status: 0,
    superadmin: 0,
    phnum: '',
    udesc: '',
	rank: null
});

const rules: FormRules = {
    username: [
        {
            required: true,
            message: '请输入用户名',
            validator: (value: string) => {
                if (!value) {
                    return Promise.reject('请输入用户名');
                } else if (value.length < 2) {
                    return Promise.reject('用户名不能少于2位');
                } else {
                    return Promise.resolve();
                }
            }
        },
    ],
    password: [
        {
            required: true,
            message: '请输入密码',
            validator: (value: string) => {
                if (!value) {
                    return Promise.reject('请输入密码');
                } else if (String(value).length < 6) {
                    return Promise.reject('长度不得小于6位');
                } else if (String(value).length > 18) {
                    return Promise.reject('长度不得大于18位');
                } else {
                    if (value.toLocaleLowerCase().includes(model.username.toLocaleLowerCase())) {
                        return Promise.reject('密码不能包含用户名');
                    } else {
                        const regex: string = "^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>]).{6,18}$";
                        const regexPattern = new RegExp(regex);
                        if (!regexPattern.test(value)) {
                            return Promise.reject('密码必须包含 数字、大写字母、小写字母、特殊字符');
                        } else {
                            return Promise.resolve();
                        }
                    }
                }
            }
        }
    ],
    confirmPassword: [
        {
            required: true,
            message: '请输入密码',
            validator: (value: string) => {
                if (!value) {
                    return Promise.reject('请输入密码');
                } else if (String(value).length < 6) {
                    return Promise.reject('长度不得小于6位');
                } else if (String(value).length > 18) {
                    return Promise.reject('长度不得大于18位');
                } else {
                    if (value.toLocaleLowerCase().includes(model.username.toLocaleLowerCase())) {
                        return Promise.reject('密码不能包含用户名');
                    } else if (model.password !== value) {
                        return Promise.reject('密码不一致');
                    } else {
                        const regex: string = "^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>]).{6,18}$";
                        const regexPattern = new RegExp(regex);
                        if (!regexPattern.test(value)) {
                            return Promise.reject('密码必须包含 数字、大写字母、小写字母、特殊字符');
                        } else {
                            return Promise.resolve();
                        }
                    }
                }
            }
        }
    ],
    phnum: [
        {
            required: true,
            message: '请输入手机号码',
            validator: (value: string) => {
                if (!value) {
                    return Promise.reject('请输入手机号码');
                } else {
                    const regexPhnum: any = /^1[3-9]\d{9}$/;;
                    if (!regexPhnum.test(value)) {
                        return Promise.reject('请输入正确的手机号码');
                    } else {
                        return Promise.resolve();
                    }
                }
            }
        }
    ]
};

// 返回上个页面
function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshList'); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取用户基本信息
async function getUserBaseInfo() {
    try {
        const data = await fetchGetUserInfoById(Number(model.id));
        console.log('获取用户基本信息成功', data);
        model.username = data.username;
        model.usertype = data.usertype;
        model.superadmin = data.superadmin;
        model.status = data.status;
        model.phnum = data.phnum;
        model.udesc = data.udesc;
        if (model.usertype === 0) {
            usertypeColumns.value = [{ label: '超级管理员', value: 0 }].concat(usertypeColumns.value);
        }
    } catch (error) {
        console.log('获取用户基本信息错误', error);
    }
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
                loading.value = true;
                try {
                    if (model.id) {
                        let queryParams = {
                            id: model.id,
                            username: model.username,
                            usertype: model.usertype,
                            status: model.status,
                            // superadmin: model.superadmin,
                            phnum: model.phnum,
                            udesc: model.udesc
                        };
						if (model.usertype === 2 || model.usertype === 3) {
							queryParams['rank'] = model.rank;
						}
                        const data = await fetchUpdateUserInfo(queryParams);
                        uni.showToast({
                            title: '修改用户成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    } else {
                        let queryParams = {
                            username: model.username,
                            password: model.password,
                            usertype: model.usertype,
                            status: model.status,
                            // superadmin: model.superadmin,
                            phnum: model.phnum,
                            udesc: model.udesc
                        };
						if (model.usertype === 2 || model.usertype === 3) {
							queryParams['rank'] = model.rank;
						}
                        const data = await fetchSaveUserInfo(queryParams);
                        uni.showToast({
                            title: '新增用户成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft(true);
                            }
                        });
                    }
                } catch (err) {
                    loading.value = false;
                    if (model.id) {
                        console.error('修改用户失败', err);
                    } else {
                        console.error('新增用户失败', err);
                    }
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

onLoad((options: any) => {
    model.id = options.id;
    if (model.id) {
        getUserBaseInfo();
    }
})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <wd-navbar left-arrow :title="model.id ? '修改用户' : '新增用户'" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
                <wd-input label="用户名" label-width="100px" prop="username" required clearable v-model="model.username" placeholder="请输入用户名" :disabled="model.id ? true : false" />
                <wd-input
                    v-if="!model.id"
                    required
                    label="密码"
                    show-password
                    label-width="100px"
                    prefix-icon="view"
                    prop="password"
                    clearable
                    :maxlength="18"
                    v-model="model.password"
                    placeholder="请输入密码"
                />
                <wd-input
                    v-if="!model.id"
                    required
                    label="确认密码"
                    show-password
                    label-width="100px"
                    prefix-icon="view"
                    prop="confirmPassword"
                    clearable
                    :maxlength="18"
                    v-model="model.confirmPassword"
                    placeholder="请输入确认密码"
                />
                <wd-picker :columns="usertypeColumns" label="用户类型" v-model="model.usertype" align-right label-width="100px" />
				<wd-picker v-if="model.usertype === 2 || model.usertype === 3" :columns="rankColumns" label="技术等级" v-model="model.rank" align-right label-width="100px" />
                <wd-cell title="用户状态">
                    <wd-radio-group v-model="model.status" shape="dot" inline>
                        <wd-radio :value="0">正常</wd-radio>
                        <wd-radio :value="1">异常</wd-radio>
                    </wd-radio-group>
                </wd-cell>
                <wd-cell title="是否为我司内部人员">
                    <wd-radio-group v-model="model.superadmin" shape="dot" inline disabled>
                        <wd-radio :value="0">是</wd-radio>
                        <wd-radio :value="1">否</wd-radio>
                    </wd-radio-group>
                </wd-cell>
                <wd-input label="手机号码" label-width="100px" prop="phnum" required clearable v-model="model.phnum" placeholder="请输入手机号码" :maxlength="11" />
                <wd-textarea v-model="model.udesc" placeholder="请输入用户描述" label="用户描述" label-width="100px"></wd-textarea>
                <view class="footer">
                    <wd-button hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.footer {
    padding: 0 20rpx 40rpx 20rpx;
    margin-top: 40rpx;
}
</style>