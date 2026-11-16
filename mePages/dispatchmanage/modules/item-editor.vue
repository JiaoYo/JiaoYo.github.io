<template>
	<wd-popup v-model="visible" position="right" :z-index="1000" :custom-style="'width: 100vw; height: 100vh; background: ' + (isDark ? '#1b1b1b' : '#f5f6f8')">
		<view class="form-page" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
			<!-- 顶部 -->
			<view class="form-header" :style="{ paddingTop: headerPad, background: isDark ? '#1b1b1b' : '#ffffff' }">
				<view class="form-header-left" :style="{ background: isDark ? '#2a2a2a' : '#f5f6f8' }" @click="visible = false">
					<wd-icon name="arrow-left" size="20px" :color="isDark ? '#e8e8e8' : '#1a1a1a'"></wd-icon>
				</view>
				<text class="form-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ isEdit ? '编辑' : '添加' }}{{ typeLabel }}</text>
				<view class="form-header-right"></view>
			</view>

			<!-- 表单主体 -->
			<scroll-view scroll-y class="form-scroll">
				<view class="basic-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
					<view class="basic-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">
						<view class="basic-dot"></view>
						<text :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ isContactType ? (type === 0 ? 'IP信息' : '联系方式') : '证书信息' }}</text>
					</view>

					<!-- 联系方式 / 主站IP -->
					<template v-if="isContactType">
						<wd-input
							:label="type === 0 ? '描述' : '姓名'"
							label-width="90px"
							v-model="form.name"
							:placeholder="type === 0 ? '请输入IP描述' : '请输入联系人姓名'"
							clearable
						/>
						<wd-input
							:label="type === 0 ? 'IP地址' : '联系方式'"
							label-width="90px"
							v-model="form.value"
							:placeholder="type === 0 ? '如 192.168.1.1' : '手机号/座机号'"
							clearable
						/>
						<view v-if="errMsg" class="editor-error" :style="{ color: isDark ? '#ff7875' : '#e53e3e' }">{{ errMsg }}</view>
					</template>

					<!-- 证书 -->
					<template v-else>
						<CjxUpload v-model="certFileList" :limit="1" @change="handleCertFileChange">
							<view class="cert-file" :style="{ borderColor: isDark ? '#3a3a3a' : '#c1c9d6', background: isDark ? '#1b1b1b' : '#f8fafc' }">
								<view class="cert-file-icon" :style="{ background: isDark ? '#1a3a5c' : '#e6f4ff' }">
									<wd-icon name="plus" size="22px" color="#1677ff"></wd-icon>
								</view>
								<view class="cert-file-info">
									<text class="cert-file-name" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ form.fileName || '选择证书文件' }}</text>
									<text class="cert-file-tip" :style="{ color: isDark ? '#8a9099' : '#86909c' }">{{ uploading ? '上传中...' : '点击选择文件（证书/压缩包等）' }}</text>
								</view>
							</view>
						</CjxUpload>
						<wd-input label="别名" label-width="90px" v-model="form.name" placeholder="请输入证书别名" clearable />
					</template>

					<wd-input label="备注" label-width="90px" v-model="form.notes" placeholder="请输入备注" clearable maxlength="255" />
				</view>
			</scroll-view>

			<!-- 底部保存 -->
			<view class="form-footer" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-button block type="primary" :loading="saving" @click="handleSave">保存</wd-button>
			</view>
		</view>
	</wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { uploadFile } from '@/utils/uploadFile';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';
import { fetchAddDispatchContact, fetchEditDispatchContact } from '@/service/dispatch';
import { CONTACT_TYPES, isValidPhone, isValidIp, parseCertValue } from './constants';
import { useTheme } from "@/composables/theme/theme";

const { theme } = useTheme();
const isDark = computed(() => theme.value === "dark");


const props = defineProps<{
	type: number;
	item?: any;
	pid?: number;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', v: boolean): void;
	(e: 'saved', payload: any): void;
}>();

const visible = defineModel<boolean>({ default: false });

const typeLabel = computed(() => {
	const t = CONTACT_TYPES.find(c => c.type === props.type);
	return t ? t.label : '';
});

const isContactType = computed(() => props.type !== 7 && props.type !== 8 && props.type !== 9);
const isEdit = computed(() => !!(props.item && props.item.id != null));

const saving = ref(false);
const uploading = ref(false);
const errMsg = ref('');
const localFile = ref<any>(null);
const certFileList = ref<any[]>([]);

const form = ref<{ name: string; value: string; notes: string; fileName: string }>({
	name: '',
	value: '',
	notes: '',
	fileName: ''
});

// 状态栏高度（自定义导航，弹层从屏幕顶端开始，需手动避让状态栏）
const statusBarHeight = ref(0);
const headerPad = computed(() => (statusBarHeight.value + 10) + 'px');

onMounted(() => {
    try {
        const info = uni.getSystemInfoSync();
        statusBarHeight.value = info.statusBarHeight || 0;
    } catch (e) { /* ignore */ }
});

// 打开时初始化
watch(visible, (v) => {
	if (v) {
		errMsg.value = '';
		localFile.value = null;
		form.value = {
			name: props.item?.name || '',
			value: props.item?.value || '',
			notes: props.item?.notes || '',
			fileName: props.item?.fileName || ''
		};
		if (!isContactType.value) {
			// 证书：解析 JSON，回显 别名/文件名/下载地址
			const c = parseCertValue(props.item?.value || '');
			form.value.name = c.alias || props.item?.name || '';
			form.value.fileName = c.fileName || props.item?.fileName || '';
			form.value.value = c.url || '';
		}
	}
});

// 证书文件选择（CjxUpload 选中后回调，参考 projectdetail 上传方式）
function handleCertFileChange(list: any[]) {
	const f = list && list[0];
	if (!f) return;
	localFile.value = f;
	form.value.fileName = f.name || (f.file && f.file.name) || '';
	// 清空选择列表，下次点击可重新选择
	certFileList.value = [];
}

// 校验
function validate(): string {
	if (isContactType.value) {
		if (props.type === 0) {
			const ip = form.value.value.trim();
			if (!props.item && !ip) return '请输入IP地址';
			if (ip && !isValidIp(ip)) return 'IP格式不正确，每段0-255，如 192.168.1.1';
		} else {
			const name = form.value.name.trim();
			const value = form.value.value.trim();
			if (!name && !value && !form.value.notes.trim()) return '请填写联系人或联系方式';
			if (value && !isValidPhone(value)) return '请输入正确的手机号或座机号';
		}
	} else {
		// 证书：新增必须选择文件
		if (!props.item && !localFile.value) return '请先选择证书文件';
	}
	return '';
}

// 证书上传（返回 url，参考 projectdetail 上传方式：已是线上地址直接通过，否则 uploadFile 上传）
function doUpload(): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!localFile.value) {
			// 未选择新文件：沿用已有 url（证书编辑时回显的下载地址）
			resolve(form.value.value || '');
			return;
		}
		// 已是有效线上地址直接通过
		if (localFile.value.url && localFile.value.url.startsWith('https://pictures.linkqi.cn')) {
			resolve(localFile.value.url);
			return;
		}
		uploading.value = true;
		uploadFile(
			localFile.value,
			'',
			(response: any) => {
				uploading.value = false;
				const url = response && (response.data || response.url || response);
				if (url) {
					resolve(String(url));
				} else {
					reject(new Error('上传失败'));
				}
			},
			() => {
				uploading.value = false;
				reject(new Error('上传失败'));
			}
		);
	});
}

async function handleSave() {
	const msg = validate();
	if (msg) {
		errMsg.value = msg;
		return;
	}
	errMsg.value = '';

	// 组装 payload（contactPerson/contactInformation/notes 与后端字段一致）
	let payload: any = {
		contactPerson: form.value.name.trim(),
		notes: form.value.notes.trim()
	};

	if (isContactType.value) {
		payload.contactInformation = form.value.value.trim();
	} else {
		// 证书：先上传得到 url，再组装 JSON {alias, url, fileName}
		saving.value = true;
		try {
			const url = await doUpload();
			payload.contactInformation = JSON.stringify({
				alias: form.value.name.trim(),
				url,
				fileName: form.value.fileName
			});
			payload.fileName = form.value.fileName;
		} catch (e) {
			saving.value = false;
			uni.showToast({ icon: 'none', title: '文件上传失败，请重试' });
			return;
		}
		saving.value = false;
	}

	// 已有 pid：直接落库
	if (props.pid != null) {
		saving.value = true;
		try {
			if (isEdit.value) {
				await fetchEditDispatchContact({ id: props.item.id, pid: props.pid, type: props.type, ...payload });
			} else {
				await fetchAddDispatchContact([{ pid: props.pid, type: props.type, ...payload }]);
			}
			visible.value = false;
			emit('saved', { ...payload, id: props.item?.id, type: props.type });
		} catch (e) {
			uni.showToast({ icon: 'none', title: '保存失败' });
		} finally {
			saving.value = false;
		}
		return;
	}

	// 无 pid（新增表单未创建前）：返回给父级暂存
	visible.value = false;
	emit('saved', { ...payload, type: props.type });
}
</script>

<style lang="scss" scoped>
.form-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f6f8;
}

.form-header {
	display: flex;
	align-items: center;
	padding: 20rpx 24rpx;
	background: #ffffff;
	gap: 12rpx;
}

.form-header-left,
.form-header-right {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
}

.form-title {
	flex: 1;
	text-align: center;
	font-size: 32rpx;
	font-weight: 600;
	color: #1a1a1a;
}

.form-scroll {
	flex: 1;
	min-height: 0;
	box-sizing: border-box;
	padding: 20rpx 24rpx;
}

.basic-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 16rpx 24rpx;
	margin-bottom: 20rpx;
}

.basic-title {
	display: flex;
	align-items: center;
	gap: 12rpx;
	font-size: 30rpx;
	font-weight: 600;
	color: #1a1a1a;
	padding: 8rpx 0 16rpx;
}

.basic-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: #1677ff;
	flex-shrink: 0;
}

.editor-error {
	font-size: 24rpx;
	color: #e53e3e;
	padding: 8rpx 12rpx 0;
}

.cert-file {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 24rpx;
	margin-bottom: 16rpx;
	border-radius: 16rpx;
	border: 2rpx dashed #c1c9d6;
	background: #f8fafc;
}

.cert-file-icon {
	width: 72rpx;
	height: 72rpx;
	border-radius: 16rpx;
	background: #e6f4ff;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.cert-file-info {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
	min-width: 0;
}

.cert-file-name {
	font-size: 28rpx;
	color: #1a1a1a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.cert-file-tip {
	font-size: 22rpx;
	color: #86909c;
}

.form-footer {
	padding: 16rpx 24rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background: #ffffff;
	box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.04);
}
</style>
