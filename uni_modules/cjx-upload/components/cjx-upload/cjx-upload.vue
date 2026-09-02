<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { uploadFileProps, UploadUserFile } from './interface'
import upload from '../upload/upload.vue'

defineOptions({
    name: 'cjx-upload',
})

const emit = defineEmits(['update:modelValue', 'change', 'remove', 'passMaximumChange'])

const props = defineProps(uploadFileProps())

const FILE_ICON_URL = '/uni_modules/cjx-upload/static/'

function formatBytes(bytes: any, decimals = 2) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const fileList = ref<UploadUserFile[]>([])

watch(
    () => props.modelValue,
    () => {
        if (!props.modelValue) return
        fileList.value = props.modelValue
        // getFileList(props.modelValue).then((res) => {
        //   fileList.value = res.data || []
        // })
    },
    { immediate: true },
)



const uploadRef = ref()

const onClick = () => {
    uploadRef.value?.upload('file', {
        accept: props.accept,
        multiple: props.multiple
    })
}

const handleUploadCallback = (res: UploadUserFile[]) => {
    console.log(res)
    const arr = fileList.value.concat(res)
    if (props.limit < arr.length) {
        emit('passMaximumChange')
        return
    }
    if (res?.length) {
        fileList.value = arr
        emit('update:modelValue', fileList.value)
        emit('change', fileList.value)
        // res.data.forEach((item) => {
        // console.log(item.tempFilePath)
        // fileList.value.push({ ...item, id: res.data })
        // fileUpload({ filePath: item.tempFilePath, name: 'file', formData: { name: item.name } }).then(
        //   (res) => {
        //     // console.log('res', res)

        //     fileList.value.push({ ...item, id: res.data })
        //     const data: string = res.data
        //     if (data.length > 0) {
        //       const arr: string[] = fileList.value.map((item) => item.id)
        //       // arr.push(data)
        //       emit('update:modelValue', arr.join(','))
        //     }
        //   },
        // )
        // })
    }
}

const removeChange = (index: number) => {
    fileList.value.splice(index, 1)
    emit('update:modelValue', fileList.value)
    emit('remove', fileList.value[index])
}

const previewFilesChange = (row: any) => {
    console.log(row)
    // const arr = row.name.split('.')
    // if (fileTypeIconMap[arr[arr.length - 1]] === 'img.png') {
    //   uni.previewImage({
    //     urls: [row.tempFilePath || row.url],
    //   })
    //   return
    // }

    // if (fileTypeIconMap[arr[arr.length - 1]] === 'pdf.png') {
    //   const fileUrl = row.tempFilePath || row.url
    //   uni.navigateTo({
    //     url: `/pages/pdfView/pdfView?fileUrl=${encodeURIComponent(fileUrl + `?fileName=${row.name}`)}`,
    //   })

    //   return
    // }

    // uni.showModal({
    //   title: '提示',
    //   content: '暂不支持预览该文件类型',
    //   showCancel: false,
    // })
}
</script>

<template>
    <view class="cjx-upload-file">
        <view class="cjx-slot-upload" @click="onClick">
            <slot></slot>
        </view>

        <upload ref="uploadRef" @callback="handleUploadCallback"></upload>

    </view>
</template>

<style scoped lang="scss">
.cjx-upload-file {
    // position: relative;
    // box-sizing: border-box;
    // width: calc(100vw - 60rpx);

    .upload-box {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24rpx 0;
        font-size: 20rpx;
        color: #133eb7;
        background: #f5f7fc;
        border-radius: 12rpx;
        margin-bottom: 16rpx;
    }

    .cjx-files-list {
        .files_item {
            display: flex;
            align-items: center;
            width: 100%;
            // margin-bottom: 20rpx;


            .label {
                // width: calc(100% - 56rpx);
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                font-size: 24rpx;
                color: #212121;

                .name {
                    width: 100%;
                    height: 36rpx;
                    // line-height: 36rpx;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    .ellipsis {
                        width: calc(100% - 60rpx);
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                }

                .size {
                    font-size: 20rpx;
                    color: #757777;
                }
            }
        }
    }
}

.m-r-24rpx {
    margin-right: 24rpx;
}

.m-r-6rpx {
    margin-right: 6rpx;
}
</style>
