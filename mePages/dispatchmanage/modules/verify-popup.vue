<template>
	<wd-popup v-model="visible" position="bottom" :duration="0" :z-index="1000" custom-style="bottom:45vh;border-radius: 24rpx 24rpx 24rpx 24rpx; overflow: hidden;">
		<view class="verify-wrap" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
			<view class="verify-header" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
				<text class="verify-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">查看 {{ contactName || '' }} 明文联系方式</text>
				<wd-icon name="close" size="20px" :color="isDark ? '#8a9099' : '#4e5969'" @click="visible = false"></wd-icon>
			</view>

			<wd-tabs v-model="method" custom-style="margin-bottom: 20rpx;">
				<wd-tab title="密码验证" name="password"></wd-tab>
				<wd-tab title="短信验证" name="code"></wd-tab>
			</wd-tabs>

			<!-- 密码验证 -->
			<view v-if="method === 'password'" class="verify-form">
				<wd-input
					type="password"
					label="登录密码"
					label-width="110px"
					v-model="pwd"
					placeholder="请输入当前登录账号密码"
					clearable
					show-password
				/>
			</view>

			<!-- 短信验证 -->
			<view v-else class="verify-form">
				<view class="code-row">
					<wd-input
						type="number"
						label="验证码"
						label-width="110px"
						v-model="code"
						placeholder="请输入6位验证码"
						maxlength="6"
					/>
					<wd-button size="small" :disabled="countdown > 0" @click="handleSendCode" custom-style="margin-top: 4rpx; flex-shrink: 0;">
						{{ countdown > 0 ? countdown + 's' : '获取验证码' }}
					</wd-button>
				</view>
			</view>

			<!-- 查询结果 -->
			<view v-if="results.length" class="verify-result">
				<view class="result-title" :style="{ color: isDark ? '#8a9099' : '#4e5969' }">查询结果：</view>
				<view v-for="(r, idx) in results" :key="idx" class="result-row">
					<text class="result-phone" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ r.phone || '-' }}</text>
					<wd-button v-if="r.phone" size="mini" type="primary" plain @click="copyText(r.phone)">复制</wd-button>
				</view>
			</view>

			<view class="verify-footer">
				<wd-button size="medium" plain @click="visible = false">取消</wd-button>
				<wd-button size="medium" type="primary" :loading="loading" @click="handleSubmit">查询</wd-button>
			</view>
		</view>
	</wd-popup>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { useTheme } from "@/composables/theme/theme";

const { theme } = useTheme();
const isDark = computed(() => theme.value === "dark");
import { doSM2Encrypt } from '@/utils/index';
import { fetchSendCode, fetchDispatchContactDecrypt } from '@/service/dispatch';
import { pickRows } from './constants';

const props = defineProps<{
	ids: string;
	contactName?: string;
}>();

const visible = defineModel<boolean>({ default: false });

const method = ref<'password' | 'code'>('password');
const pwd = ref('');
const code = ref('');
const countdown = ref(0);
const loading = ref(false);
const results = ref<any[]>([]);

watch(visible, (v) => {
	if (v) {
		method.value = 'password';
		pwd.value = '';
		code.value = '';
		countdown.value = 0;
		results.value = [];
	}
});

// 获取短信验证码
async function handleSendCode() {
	try {
		await fetchSendCode();
		countdown.value = 60;
		const timer = setInterval(() => {
			countdown.value--;
			if (countdown.value <= 0) clearInterval(timer);
		}, 1000);
		uni.showToast({ icon: 'success', title: '验证码已发送' });
	} catch (e) {
		uni.showToast({ icon: 'none', title: '发送失败，请重试' });
	}
}

// 提交查询
async function handleSubmit() {
	if (!props.ids) {
		uni.showToast({ icon: 'none', title: '无可查询的联系人' });
		return;
	}
	if (method.value === 'password') {
		if (!pwd.value) {
			uni.showToast({ icon: 'none', title: '请输入登录密码' });
			return;
		}
	} else {
		if (!code.value) {
			uni.showToast({ icon: 'none', title: '请输入验证码' });
			return;
		}
	}

	loading.value = true;
	try {
		const params: any = { ids: props.ids };
		if (method.value === 'password') {
			params.pwd = doSM2Encrypt(pwd.value);
		} else {
			params.smsCode = code.value;
		}
		const data = await fetchDispatchContactDecrypt(params);
		const list = pickRows(data);
		if (list.length) {
			results.value = list.map((it: any) => ({
				name: it.contactPerson || it.name || '',
				phone: it.contactInformation || it.phone || ''
			}));
		} else {
			results.value = [{ name: props.contactName || '', phone: '' }];
			uni.showToast({ icon: 'none', title: '未查询到明文' });
		}
	} catch (e) {
		uni.showToast({ icon: 'none', title: '验证失败' });
	} finally {
		loading.value = false;
	}
}

// 复制
function copyText(text: string) {
	uni.setClipboardData({
		data: text,
		success: () => uni.showToast({ icon: 'success', title: '已复制' })
	});
}
</script>

<style lang="scss" scoped>
.verify-wrap {
	padding: 24rpx 32rpx;
	padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

.verify-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}

.verify-title {
	font-size: 30rpx;
	font-weight: 600;
}

.verify-form {
	margin-bottom: 8rpx;
}

.code-row {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
}

.code-row :deep(.wd-input) {
	flex: 1;
	min-width: 0;
}

.verify-result {
	margin-top: 20rpx;
	border-radius: 16rpx;
	padding: 20rpx 24rpx;
}

.result-title {
	font-size: 26rpx;
	margin-bottom: 12rpx;
}

.result-row {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 10rpx 0;
}

.result-name {
	font-size: 26rpx;
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.result-phone {
	font-size: 26rpx;
	font-family: monospace;
}

.verify-footer {
	display: flex;
	justify-content: flex-end;
	gap: 20rpx;
	margin-top: 28rpx;
}

/* 暗黑模式 */
@media (prefers-color-scheme: dark) {
	.verify-wrap,
	.verify-header {
		background: #2a2a2a;
	}
	.verify-title {
		color: #e8e8e8;
	}
	.verify-result {
		background: #1b1b1b;
	}
	.result-title {
		color: #8a9099;
	}
	.result-name {
		color: #e8e8e8;
	}
	.result-phone {
		color: #69b1ff;
	}
}
</style>
