<script setup lang="tsx">
import { ref, onMounted, nextTick, watch } from 'vue'
import { getSystemDate } from '@/utils/common'
import { useAuthStore } from '@/store/modules/auth/index'
import { NCard, NSelect, NButton, NAvatar, NTag, NInput, NScrollbar, NEmpty, NText, type UploadCustomRequestOptions } from 'naive-ui'
import { debounce } from 'lodash';
import { uploadFile } from '@/utils/upload'
import { fetchGetProjectProblemListByPage, fetchGetProjectProblemAnswerDataListByPage, fetchSaveProjectProblemInfo, fetchUpdateProjectProblemInfo } from '@/service/api'
const dialogVisible = defineModel<boolean>('visible', {
    default: false,
})
const authStore = useAuthStore();
const userId = authStore.userInfo?.id;
const usertype = authStore.userInfo?.usertype;
const isEdit = ref<boolean>(false); // 是否编辑
interface Props {
    operateType: any;
    rowData?: any;
}
const props = defineProps<Props>();
const emit = defineEmits(['submitted']);

watch(() => dialogVisible.value, async (newVal) => {
    if (newVal) {
        handleInit()
    }
})

onMounted(() => {
    handleInit()
})

const formRef = ref<any>(null)
// 添加编辑会议
const formModel = ref<any>({
    id: undefined,
    pid: undefined,
    titleAnswerArr: [{
        aid: '',
        title: '',
        answer: '',
        fileList: [
            {
                name: '',
                url: '',
                file: undefined
            }, {
                name: '',
                url: '',
                file: undefined
            }, {
                name: '',
                url: '',
                file: undefined
            },
        ],
    }],
    storeTitleAnswerArr: []
})

const rules: any = {

}

// 初始化
const handleInit = async () => {
    getProblemTitleDataList();
}

// 获取问题列表
const getProblemTitleDataList = async () => {
    try {
        const { data } = await fetchGetProjectProblemAnswerDataListByPage({ page: 1, limit: 100, pid: 1 });
        if (data) {
            console.log('data', data);
            formModel.value.storeTitleAnswerArr = data.list.map((item: any) => {
                return {
                    aid: item.id,
                    title: item.aproblem,
                    answer: '',
                    pfile1: '',
                    pfile2: '',
                    pfile3: '',
                    fileList: [
                        {
                            name: '',
                            url: '',
                            file: undefined
                        }, {
                            name: '',
                            url: '',
                            file: undefined
                        }, {
                            name: '',
                            url: '',
                            file: undefined
                        },
                    ]
                }
            });
            getProblemAnswerDataList();
        }
    } catch (error) {
        console.log('获取问题列表失败', error);
    }
}

// 获取答案
const getProblemAnswerDataList = async () => {
    try {
        const { data } = await fetchGetProjectProblemAnswerDataListByPage({ page: 1, limit: 100, pid: 1, creater: userId });
        if (data) {
            console.log('data', data);
            if (data.list.length > 0) {
                isEdit.value = true;
                data.list.forEach((item: any) => {
                    formModel.value.titleAnswerArr.forEach((titleAnswerItem: any) => {
                        if (item.aid === titleAnswerItem.aid) {
                            titleAnswerItem.answer = item.answer;
                            titleAnswerItem.pfile1 = item.pfile1;
                            titleAnswerItem.pfile2 = item.pfile2;
                            titleAnswerItem.pfile3 = item.pfile3;
                            titleAnswerItem.fileList = [
                                {
                                    sort: 1,
                                    name: item.pfile1?.split('?')[1] || undefined,
                                    url: item.pfile1 || undefined,
                                    file: undefined
                                }, {
                                    sort: 2,
                                    name: item.pfile2?.split('?')[1] || undefined,
                                    url: item.pfile2 || undefined,
                                    file: undefined
                                }, {
                                    sort: 3,
                                    name: item.pfile3?.split('?')[1] || undefined,
                                    url: item.pfile3 || undefined,
                                    file: undefined
                                }
                            ];
                        }
                    })
                })
            } else {
                isEdit.value = false;
                formModel.value.titleAnswerArr = JSON.parse(JSON.stringify(formModel.value.storeTitleAnswerArr));
            }
        }
    } catch (error) {
        console.log('获取问题列表失败', error);
    }
}

// 滚动到输入框
async function scrollToInput(id: string) {
    await nextTick()
    const el = document.getElementById(id)
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const input = el.querySelector('input, textarea') as HTMLInputElement
        input?.focus()
    }
}

async function beforeUpload(data: any) {
    // if (data.file.file.size > 100 * 1024 * 1024) {
    //   window.$message?.error('文件大小不能超过100M');
    //   return false
    // }
    return true
}

// 上传文件
// const progress = ref(0)
// const moduleNmae = ref('')
// async function handleCustomRequestChage({ file }: UploadCustomRequestOptions, name: string) {
//     moduleNmae.value = name
//     const data = await uploadFile(file.file as any, file.name, '', (val) => {
//         progress.value = val
//     });
//     if (data) {
//         if (name == 'fl1') {
//             formModel.value.fl1 = data
//         } else if (name == 'fl2') {
//             formModel.value.fl2 = data
//         } else if (name == 'fl3') {
//             formModel.value.fl3 = data
//         }
//         progress.value = 0
//     }
// }

// 上传文件
async function handleCustomRequestChage({ file }: UploadCustomRequestOptions, index: number, fileIndex: number) {
    formModel.value.titleAnswerArr[index].fileList[fileIndex].file=file;
    formModel.value.titleAnswerArr[index].fileList[fileIndex].name=file.name;
}

// 下载
async function handleDownload(url: string) {
    if (!url) return
    try {
        const response = await fetch(url?.split('?')[0], { mode: 'cors' }) // 尝试跨域拉取
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = url?.split('?')[1]
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
    } catch (err) {
        console.error('下载失败:', err)
    }
}

// 取消
const handleProjectSummaryClose = () => {
    dialogVisible.value = false
    formModel.value = {
        id: undefined,
        pid: '',
        titleAnswerArr: []
    }
}

// 提交
const submitBtnloading = ref(false);
const handleSubmitChange = debounce(async () => {
    try {
        if (submitBtnloading.value) return
        await formRef.value?.validate();
        submitBtnloading.value = true;
        let valid = true;

        // 2. 检查是否有文件需要上传
        let uploadTasks: any = [];
        formModel.value.titleAnswerArr.forEach((item: any, index: number) => {
            item.fileList.forEach((file: any, fileIndex: number) => {
                if (file.file && !file.url.startsWith("https://pictures.linkqi.cn")) {
                    const uploadPromise = uploadFile(file.file.file, file.name, '').then((res: any) => {
                        console.log('res', res);
                        // 上传成功后，将返回的文件名保存到对应位置
                        const fileName = res; // 根据实际返回结构调整
                        item[`pfile${fileIndex + 1}`] = fileName;
                        item.fileList[fileIndex].url = res;
                    });
                    uploadTasks.push(uploadPromise);
                }
            });
        });

        // 3. 等待所有文件上传完成
        if (uploadTasks.length > 0) {
            await Promise.all(uploadTasks);
        }

        let params = isEdit.value ? JSON.parse(JSON.stringify(formModel.value.titleAnswerArr.map((item: any) => {
            return {
                id: item.aid,
                pid: formModel.value.pid,
                // pid: 1,
                aid: item.aid,
                answer: item.answer,
                pfile1: item.fileList[0].url || item.pfile1,
                pfile2: item.fileList[1].url || item.pfile2,
                pfile3: item.fileList[2].url || item.pfile3,
            }
        }))) : JSON.parse(JSON.stringify(formModel.value.titleAnswerArr.map((item: any) => {
            return {
                pid: formModel.value.pid,
                // pid: 1,
                aid: item.aid,
                answer: item.answer,
                pfile1: item.fileList[0].url || item.pfile1,
                pfile2: item.fileList[1].url || item.pfile2,
                pfile3: item.fileList[2].url || item.pfile3,
            }
        })));

        for (let index = 0; index < params.length; index++) {
            if (!params[index].answer) {
                valid = false;
                break;
            }
        }
        if (!valid) {
            window.$message?.destroyAll();
            window.$message?.error('答案不能为空');
            return
        }
        console.log('params', params);
        const { data, error } = isEdit.value ? await fetchUpdateProjectProblemInfo(params) : await fetchSaveProjectProblemInfo(params)
        if (data) {
            window.$message?.success('提交成功');
            submitBtnloading.value = false;
            handleProjectSummaryClose()
            emit('submitted')
        }
    } catch (error) {
        console.log('提交失败', error);
        submitBtnloading.value = false;
    }
}, 1000, { leading: true, trailing: false })
</script>
<template>
    <NModal v-model:show="dialogVisible" title="答题" preset="card" class="w-90%" :mask-closable="false"
        :draggable="true">
        <NForm ref="formRef" :model="formModel" :rules="rules" label-placement="left">
            <NScrollbar style="height: calc(70vh);">
                <div v-for="(item, index) in formModel.titleAnswerArr" :key="index" style="margin-bottom: 24px;">
                    <NGrid responsive="screen" item-responsive x-gap="15">
                        <!-- 第一行：问题 -->
                        <NFormItemGi span="24" :label="'问题' + (index + 1) + ':'">
                            <NInput disabled v-model:value="item.title" placeholder="问题内容" />
                        </NFormItemGi>

                        <!-- 第二行：答案 -->
                        <NFormItemGi span="24" label="答案:">
                            <NInput clearable v-model:value="item.answer" placeholder="请输入答案" type="textarea" :rows="4" />
                        </NFormItemGi>

                        <!-- <NFormItemGi span="24 m:24" label="附件1" path="notes">
                            <span v-if="item.pfile1?.split('?')[1]" style="margin-left: 20px;">{{ item.pfile1?.split('?')[1]
                                }} <span class="cursor-pointer c-#c92a2a"
                                    @click="item.url = ''; item.pfile1 = undefined;">删除</span>
                                <span v-if="item.pfile1" class="cursor-pointer c-#1890ff  ml-5px inline-block"
                                    @click="handleDownload(item.pfile1)">下载</span>
                            </span>
                            <n-upload v-else style="width: auto;margin-left: 20px;" ref="uploadRef" action="#"
                                :custom-request="(options) => handleCustomRequestChage(options, index)"
                                :show-file-list=false @before-upload="beforeUpload">
                                <n-button size="small" ghost type="primary">{{ '选择文件' }}</n-button>
                            </n-upload>
                        </NFormItemGi> -->
                        <NFormItemGi span="24 m:24" label="" path="notes" :show-feedback="false"
                            v-for="(fileItem, fileIndex) in item.fileList" :key='fileIndex'>
                            <NGrid responsive="screen" item-responsive>
                                <NFormItemGi span="24 m:12" :label="`附件${fileIndex as number + 1}`">
                                    <NInput v-model:value="fileItem.name" placeholder="请输入" style="width: 100%;" />
                                </NFormItemGi>
                                <NFormItemGi span="24 m:12" label="" path="notes">
                                    <span v-if="fileItem.url?.split('?')[1] || fileItem.file?.name"
                                        style="margin-left: 20px;">{{ fileItem.url?.split('?')[1] || fileItem.file.name }}
                                        <span class="cursor-pointer c-#c92a2a"
                                            @click="fileItem.url = ''; fileItem.file = undefined; fileItem.name = '';">删除</span>
                                        <span v-if="fileItem.url" class="cursor-pointer c-#1890ff  ml-5px inline-block"
                                            @click="handleDownload(fileItem.url)">下载</span>
                                    </span>
                                    <n-upload v-else style="width: auto;margin-left: 20px;" ref="uploadRef" action="#"
                                        :custom-request="(options) => handleCustomRequestChage(options, index, fileIndex)"
                                        :show-file-list=false @before-upload="beforeUpload">
                                        <n-button size="small" ghost type="primary">{{ '选择文件' }}</n-button>
                                    </n-upload>
                                </NFormItemGi>
                            </NGrid>
                        </NFormItemGi>
                    </NGrid>
                </div>
            </NScrollbar>
        </NForm>
        <template #footer>
            <div class="flex justify-end">
                <n-button @click="handleProjectSummaryClose">取消</n-button>
                <n-button type="primary" @click="handleSubmitChange" style="margin-left: 10px;">保存</n-button>
            </div>
        </template>
    </NModal>
</template>