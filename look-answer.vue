<script setup lang="tsx">
import { ref, onMounted, nextTick, watch } from 'vue'
import { getSystemDate } from '@/utils/common'
import { useAuthStore } from '@/store/modules/auth/index'
import { NCard, NSelect, NButton, NAvatar, NTag, NInput, NScrollbar, NEmpty, NText, type UploadCustomRequestOptions } from 'naive-ui'
import { debounce, forEach } from 'lodash';
import { uploadFile } from '@/utils/upload'
import usePageData from '@/hooks/common/usePageData'
import { fetchGetProjectProblemListByPage, fetchGetProjectProblemAnswerDataListByPage, fetchUpdateProjectProblemInfo, fetchGetUserList } from '@/service/api'
const dialogVisible = defineModel<boolean>('visible', {
    default: false,
})
const authStore = useAuthStore();
const usertype = authStore.userInfo?.usertype;
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

const formModel = ref<any>({
    id: undefined,
    pid: undefined,
    creater: undefined,
    titleAnswerArr: [{
        aid: '',
        title: '',
        answer: '',
        rating: undefined,
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

const { pageData: userData, getData, nextPage: nextPage1 } = usePageData(fetchGetUserList)
const handleUserScroll = async (e: Event) => {
    const currentTarget = e.currentTarget as HTMLElement
    const scrollTop = currentTarget.scrollTop
    if (
        currentTarget.scrollTop + currentTarget.offsetHeight
        >= currentTarget.scrollHeight
    ) {
        if (userData.data.length < userData.total) {
            await nextPage1()
            await nextTick()
            setTimeout(() => {
                currentTarget.scrollTop = scrollTop // 恢复滚动位置
            })
        }
    }
}
// 用户选择框选择事件
const handleUserChange = async (value: number) => {
    formModel.value.creater = value
    getProblemTitleDataList();
}

// 初始化
const handleInit = async () => {
    getData({ usertypes: '3' });
    setTimeout(() => {
        getProblemTitleDataList();
    }, 500)
}

// 获取问题列表
const getProblemTitleDataList = async () => {
    try {
        const { data } = await fetchGetProjectProblemListByPage({ page: 1, limit: 100, pid: 1 });
        if (data) {
            console.log('data', data);
            formModel.value.storeTitleAnswerArr = data.list.map((item: any) => {
                return {
                    aid: item.id,
                    title: item.aproblem,
                    answer: '',
                    rating: undefined,
                    pfile1: '',
                    pfile2: '',
                    pfile3: '',
                    fileList: [
                        {
                            sort: 1,
                            name: '',
                            url: '',
                            file: undefined
                        }, {
                            sort: 2,
                            name: '',
                            url: '',
                            file: undefined
                        }, {
                            sort: 3,
                            name: '',
                            url: '',
                            file: undefined
                        },
                    ]
                }
            })
            formModel.value.titleAnswerArr = JSON.parse(JSON.stringify(formModel.value.storeTitleAnswerArr));
            getProblemAnswerDataList();
        }
    } catch (error) {
        console.log('获取问题列表失败', error);
    }
}

// 获取答案
const getProblemAnswerDataList = async () => {
    if (!formModel.value.creater && userData.data.length > 0) {
        formModel.value.creater = userData.data[0].id;
    }
    try {
        const { data } = await fetchGetProjectProblemAnswerDataListByPage({ page: 1, limit: 100, pid: 1, creater: formModel.value.creater });
        if (data) {
            console.log('data', data);
            if (data.list.length > 0) {
                data.list.forEach((item: any) => {
                    formModel.value.titleAnswerArr.forEach((titleAnswerItem: any) => {
                        if (item.aid === titleAnswerItem.aid) {
                            titleAnswerItem.answer = item.answer;
                            titleAnswerItem.rating = item.rating || undefined;
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
                            ].filter(fileItem => fileItem.url);
                        }
                    })
                })
            } else {
                formModel.value.titleAnswerArr = JSON.parse(JSON.stringify(formModel.value.storeTitleAnswerArr));
                formModel.value.titleAnswerArr = formModel.value.titleAnswerArr.map((item: any) => {
                    return {
                        ...item,
                        fileList: item.fileList.filter((fileItem: any) => fileItem.url)
                    }
                })
            }
        }
    } catch (error) {
        console.log('获取问题列表失败', error);
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
async function handleCustomRequestChage({ file }: UploadCustomRequestOptions, index: any, fileIndex: any) {
    formModel.value.titleAnswerArr[index].fileList[fileIndex].file = file;
    formModel.value.titleAnswerArr[index].fileList[fileIndex].name = file.name;
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

        let params = JSON.parse(JSON.stringify(formModel.value.titleAnswerArr.map((item: any) => {
            return {
                id: item.aid,
                pid: formModel.value.pid,
                // pid: 1,
                aid: item.aid,
                answer: item.answer,
                rating: item.rating,
                pfile1: item.fileList[0].url || item.pfile1,
                pfile2: item.fileList[1].url || item.pfile2,
                pfile3: item.fileList[2].url || item.pfile3,
            }
        })));

        for (let index = 0; index < params.length; index++) {
            const rating = params[index].rating;
            if (rating === undefined || rating === null || rating === '' || Number.isNaN(rating)) {
                valid = false;
                break;
            }
        }
        if (!valid) {
            window.$message?.destroyAll();
            window.$message?.error('评分不能为空');
            return
        }
        console.log('params', params);
        const { data, error } = await fetchUpdateProjectProblemInfo(params)
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
    <NModal v-model:show="dialogVisible" title="查看详情" preset="card" class="w-90%" :mask-closable="false"
        :draggable="true">
        <NForm ref="formRef" :model="formModel" label-placement="left" label-width="60px">
            <NFormItem label="用户" path="creater">
                <NSelect :clearable="false" filterable v-model:value="formModel.creater" placeholder="请选择"
                    label-field="username" value-field="id" :options="userData.data" @scroll="handleUserScroll"
                    @update:value="handleUserChange"></NSelect>
            </NFormItem>

            <hr>

            <NScrollbar style="height: calc(70vh);">
                <div v-for="(item, index) in formModel.titleAnswerArr" :key="String(formModel.creater)"
                    style="margin: 24px 0;">
                    <NGrid responsive="screen" item-responsive x-gap="15">
                        <!-- 第一行：问题 -->
                        <NFormItemGi span="24" :label="'问题' + (index + 1) + ':'">
                            <NInput readonly v-model:value="item.title" placeholder="问题内容" />
                        </NFormItemGi>

                        <!-- 第二行：答案 -->
                        <NFormItemGi span="24" label="答案:">
                            <NInput readonly clearable v-model:value="item.answer" placeholder="请输入答案" type="textarea"
                                :rows="4" />
                        </NFormItemGi>

                        <!-- 第三行：附件 -->
                        <NFormItemGi span="24 m:24" label="" path="notes" :show-feedback="false"
                            v-for="(fileItem, fileIndex) in item.fileList" :key='fileIndex'>
                            <NGrid responsive="screen" item-responsive>
                                <NFormItemGi span="24 m:12" :label="`附件${fileItem.sort}:`">
                                    <NInput readonly v-model:value="fileItem.name" placeholder=""
                                        style="width: 100%;" />
                                </NFormItemGi>
                                <NFormItemGi span="24 m:12" label="" path="notes">
                                    <span v-if="fileItem.url?.split('?')[1] || fileItem.file?.name" ref=""
                                        style="margin-left: 20px;">
                                        <span v-if="fileItem.url" class="cursor-pointer c-#1890ff  ml-5px inline-block"
                                            @click="handleDownload(fileItem.url)">下载</span>
                                    </span>
                                </NFormItemGi>
                            </NGrid>
                        </NFormItemGi>

                        <!-- 第四行：评分 -->
                        <NFormItemGi span="24" label="评分: ">
                            <NInputNumber v-model:value="item.rating" clearable placeholder="请输入评分"
                                style="width: 100%;" />
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