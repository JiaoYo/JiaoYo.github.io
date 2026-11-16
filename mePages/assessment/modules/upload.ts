// ===== 工程考核 - 文件上传辅助 =====
import { uploadFile } from '@/utils/uploadFile'
import type { UploadFileItem, UploadMethod } from '@/uni_modules/wot-design-uni/components/wd-upload/types'

// 从七牛 URL 中截取文件名（URL 形如 QINIU_URL + key + '?' + file.name）
export function getFileNameFromUrl(url: string | undefined | null): string {
    if (!url) return ''
    const query = String(url).split('?')[1]
    if (query) return decodeURIComponent(query)
    const segs = String(url).split('/')
    return decodeURIComponent(segs[segs.length - 1] || '')
}

// wd-upload 统一上传方法：选中任意文件 -> 七牛云，成功后把云端 URL 写入 file.response
export const qiniuUploadMethod: UploadMethod = (file: UploadFileItem, formData, options) => {
    const name = file.name || getFileNameFromUrl(file.url) || 'file'
    uploadFile(
        { name, url: file.url, tempFilePath: file.url },
        'qiniu',
        (res: any) => {
            options.onSuccess({ data: res.data }, file, formData)
        },
        (err: any) => {
            options.onError(err, file, formData)
        }
    )
}
