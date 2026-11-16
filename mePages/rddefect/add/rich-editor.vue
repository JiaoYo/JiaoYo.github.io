<template>
    <view class="rich-editor" :style="{ borderColor: isDark ? '#3a3a3a' : '#e5e6eb' }">
        <scroll-view scroll-x class="toolbar" :style="{ background: isDark ? '#333333' : '#f7f8fa' }">
            <view class="toolbar-row">
                <text v-for="b in buttons" :key="b.key" class="tb-btn" :class="{ active: isActive(b) }" :style="btnStyle(b)" @click.stop="run(b)">{{ b.label }}</text>
            </view>
        </scroll-view>
        <editor :id="editorId" class="content" :placeholder="placeholder" :style="{ height: height, background: isDark ? '#2a2a2a' : '#ffffff', color: isDark ? '#e8e8e8' : '#323233' }" @ready="onReady" @input="onInput" @statuschange="onStatusChange" />
    </view>
</template>
<script lang="ts" setup>
import { ref, computed, watch, getCurrentInstance } from "vue";
import { useTheme } from "@/composables/theme/theme";
import { uploadFile } from "@/utils/uploadFile";
import { isRichEmpty } from "../constants";

// 富文本编辑器：封装 uni-app 内置 editor 组件，v-model 双向绑定 html 字符串
// - 初始值/编辑回显：ready 或外部值变化（≠内部 emit 回流值）时 setContents 覆盖
// - 工具栏：撤销/重做/加粗/斜体/下划线/删除线/有序无序列表/对齐/插图（七牛上传）/清除格式
const props = withDefaults(defineProps<{
    modelValue?: string;
    placeholder?: string;
    height?: string;
}>(), {
    modelValue: '',
    placeholder: '请输入内容，支持图片',
    height: '200px'
});
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const { theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

const editorId = 'rich-editor-' + Date.now() + '-' + Math.floor(Math.random() * 100000);

let ctx: any = null;
const instance = getCurrentInstance();
// internalHtml：本组件最近一次 emit 的值；watch 外部 modelValue 时与它比较，避免自己触发的更新又回灌 setContents
const internalHtml = ref(props.modelValue || '');
const st = ref<any>({});
const uploading = ref(false);

const buttons = [
    { key: 'undo', label: '↶' },
    { key: 'redo', label: '↷' },
    { key: 'bold', label: 'B' },
    { key: 'italic', label: 'I' },
    { key: 'underline', label: 'U' },
    { key: 'strike', label: 'S' },
    { key: 'listOrdered', label: '1.' },
    { key: 'listBullet', label: '•' },
    { key: 'alignLeft', label: '左' },
    { key: 'alignCenter', label: '中' },
    { key: 'alignRight', label: '右' },
    { key: 'image', label: '图片' },
    { key: 'clear', label: '清除' }
];

function btnStyle(b: any) {
    const active = isActive(b);
    return {
        color: active ? '#1677ff' : (isDark.value ? '#c9cdd4' : '#4e5969'),
        fontWeight: active ? '700' : '400',
        background: active ? (isDark.value ? 'rgba(22,119,255,0.25)' : '#e6f4ff') : 'transparent'
    };
}
function isActive(b: any): boolean {
    switch (b.key) {
        case 'bold': return !!st.value.bold;
        case 'italic': return !!st.value.italic;
        case 'underline': return !!st.value.underline;
        case 'strike': return !!st.value.strike;
        case 'listOrdered': return st.value.list === 'ordered';
        case 'listBullet': return st.value.list === 'bullet';
        case 'alignLeft': return (st.value.align || 'left') === 'left';
        case 'alignCenter': return st.value.align === 'center';
        case 'alignRight': return st.value.align === 'right';
        default: return false;
    }
}
function run(b: any) {
    if (!ctx) return;
    switch (b.key) {
        case 'undo': ctx.undo(); break;
        case 'redo': ctx.redo(); break;
        case 'bold': ctx.format('bold'); break;
        case 'italic': ctx.format('italic'); break;
        case 'underline': ctx.format('underline'); break;
        case 'strike': ctx.format('strike'); break;
        case 'listOrdered': ctx.format('list', 'ordered'); break;
        case 'listBullet': ctx.format('list', 'bullet'); break;
        case 'alignLeft': ctx.format('align', 'left'); break;
        case 'alignCenter': ctx.format('align', 'center'); break;
        case 'alignRight': ctx.format('align', 'right'); break;
        case 'image': chooseAndInsert(); break;
        case 'clear': ctx.removeFormat(); break;
    }
}

function onReady() {
    // .in(instance.proxy) 限定在本组件节点内查找，同页多实例互不串扰
    uni.createSelectorQuery().in(instance?.proxy as any).select('#' + editorId).context((res: any) => {
        ctx = res?.context || null;
        if (ctx && !isRichEmpty(props.modelValue)) {
            ctx.setContents({ html: props.modelValue, fail: () => { internalHtml.value = ''; } });
        }
    }).exec();
}
function onInput(e: any) {
    internalHtml.value = normalizeHtml(e?.detail?.html || '');
    emit('update:modelValue', internalHtml.value);
}
function onStatusChange(e: any) { st.value = e?.detail || {}; }

/**
 * 导出归一化：对齐 web 端 WangEditor 的解析习惯
 * - editor 组件（Quill 内核）把对齐/缩进存成 ql-* class（如 <p class="ql-align-center">），
 *   WangEditor 不识别该 class、对齐会丢 → 统一转成内联 style="text-align:*"，两边通用
 * - 段落/加粗/斜体/下划线/删除线/列表/图片两边标签一致（p/strong/em/u/s/ol/ul/li/img），无需转换
 * - 空内容两侧同为 "<p><br></p>"，isRichEmpty 已兼容
 * 单遍扫描所有开标签：ql-* class 并入已有 style（或新建），避免出现重复 style 属性
 */
function normalizeHtml(html: string): string {
    let s = String(html || '');
    s = s.replace(/<([a-z][a-z0-9]*)((?:\s+[^<>]*?)?)(\sclass="([^"]*)")/gi, (m: string, tag: string, attrs: string, clsAttr: string, cls: string) => {
        if (!cls.split(/\s+/).some((c: string) => c.indexOf('ql-') === 0)) return m;
        let style = '';
        const rest: string[] = [];
        cls.split(/\s+/).forEach((c: string) => {
            const am: RegExpMatchArray | null = c.match(/^ql-align-([\w-]+)$/);
            if (am) { style += `text-align:${am[1]};`; return; }
            const im: RegExpMatchArray | null = c.match(/^ql-indent-(\d+)$/);
            if (im) { style += `padding-left:${Number(im[1]) * 2}em;`; return; }
            rest.push(c);
        });
        if (!style) return m;
        const styleM: RegExpMatchArray | null = attrs.match(/\sstyle="([^"]*)"/);
        const newAttrs: string = styleM ? attrs.replace(styleM[0], ` style="${styleM[1]}${style}"`) : `${attrs} style="${style}"`;
        const remainCls: string = rest.length ? ` class="${rest.join(' ')}"` : '';
        return `<${tag}${newAttrs}${remainCls}`;
    });
    return s;
}

// 外部值变化（编辑回显异步到达/提交前归一）：与内部值不同才覆盖编辑器内容
watch(() => props.modelValue, (val: any) => {
    const v = val || '';
    if (v === internalHtml.value) return;
    internalHtml.value = v;
    if (ctx) ctx.setContents({ html: v, fail: () => {} });
});

function chooseAndInsert() {
    if (uploading.value) return;
    uni.chooseImage({
        count: 3,
        success: (res: any) => {
            const paths: string[] = res.tempFilePaths || [];
            const raws: any[] = res.tempFiles || [];
            paths.forEach((fp: string, i: number) => {
                // 适配 uploadFile 的文件对象：App 端取 tempFilePath，H5 端取原生 File
                const file: any = {
                    name: raws[i]?.name || String(fp).split('/').pop() || 'image.jpg',
                    tempFilePath: fp,
                    url: fp,
                    file: raws[i] && typeof File !== 'undefined' && raws[i] instanceof File ? raws[i] : undefined
                };
                uploading.value = true;
                uploadFile(file, '', (response: any) => {
                    uploading.value = false;
                    if (response?.data && ctx) ctx.insertImage({ src: response.data, width: '100%' });
                }, (err: any) => {
                    uploading.value = false;
                    console.error('图片上传失败', err);
                    uni.showToast({ title: '图片上传失败', icon: 'none' });
                });
            });
        }
    });
}
</script>
<style lang="scss" scoped>
.rich-editor { border: 1rpx solid #e5e6eb; border-radius: 12rpx; overflow: hidden; width: 100%; }
.toolbar { width: 100%; white-space: nowrap; }
.toolbar-row { display: inline-flex; align-items: center; gap: 8rpx; padding: 8rpx 12rpx; }
.tb-btn { display: inline-block; padding: 8rpx 18rpx; font-size: 26rpx; line-height: 36rpx; border-radius: 8rpx; }
.content { width: 100%; font-size: 26rpx; padding: 16rpx; box-sizing: border-box; }
</style>
