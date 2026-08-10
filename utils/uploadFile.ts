// utils/uploadUtils.js
import { v4 as uuidv4 } from "uuid";
import { BASE_URL, QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import { fetchGetUploadFileTokenInfo } from '@/service/index';

/**
 * 统一上传方法
 * @param file 文件对象
 * @param type 上传类型：'server' | 'qiniu'
 * @param onSuccess 成功回调
 * @param onFail 失败回调
 */
export async function uploadFile(
    file: any,
    type: 'server' | 'qiniu' | '' = 'qiniu',
    onSuccess?: (response: any, file: any) => void,
    onFail?: (error: any, file: any) => void
) {
    try {
        if (type === 'server') {
            await uploadToServer(file, onSuccess, onFail);
        } else {
            await uploadToQiniu(file, onSuccess, onFail);
        }
    } catch (error) {
        onFail?.(error, file);
    }
}

// 上传到服务器
async function uploadToServer(
    file: any,
    onSuccess?: (response: any, file: any) => void,
    onFail?: (error: any, file: any) => void
) {
    return new Promise((resolve, reject) => {
        const uploadOptions: any = {
            url: BASE_URL + '/projectFile/uploadFile.do',
            header: { token: uni.getStorageSync('token') },
            name: 'multipartFile',
            success: (res: any) => {
                const result = JSON.parse(res.data);
                if (result.code === 0) {
                    const response = { data: result.data, fileName: file.name };
                    onSuccess?.(response, file);
                    resolve(response);
                } else {
                    reject(new Error(result.message));
                }
            },
            fail: reject
        };

        // #ifdef H5
        uploadOptions.file = file.file;
        // #endif
        // #ifdef APP || APP-PLUS
        uploadOptions.filePath = file.tempFilePath;
        // #endif

        uni.uploadFile(uploadOptions);
    });
}

// 上传到七牛云
async function uploadToQiniu(
    file: any,
    onSuccess?: (response: any, file: any) => void,
    onFail?: (error: any, file: any) => void,
) {
    return new Promise(async (resolve, reject) => {
        try {
            const tokenInfo = await fetchGetUploadFileTokenInfo();
            const fileName = 'work-project/image/' + uuidv4() + '/' + file.name;

            const uploadOptions: any = {
                url: QINIU_UPLOAD_URL,
                name: 'file',
                formData: { token: tokenInfo, key: fileName },
                success: (res: any) => {
                    let data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
                    if (data.key) {
                        const dataRes = QINIU_URL + data.key + '?' + file.name;
                        const response = { data: dataRes, fileName: file.name };
                        onSuccess?.(response, file);
                        resolve(response);
                    } else {
                        reject(new Error('七牛云上传失败'));
                    }
                },
                fail: reject
            };

            // #ifdef H5
            uploadOptions.filePath = file.url;
            // #endif
            // #ifdef APP || APP-PLUS
			uploadOptions.filePath = file.tempFilePath;
            // #endif

            uni.uploadFile(uploadOptions);
        } catch (error) {
            reject(error);
        }
    });
}