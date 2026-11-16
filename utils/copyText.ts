// utils/copyText.ts
export function copyText(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!text) {
            reject(new Error('复制内容为空'));
            return;
        }

        uni.setClipboardData({
            data: text,
            success: () => {
                uni.getClipboardData({
                    success: () => {
                        resolve();
                    },
                    fail: (err) => {
                        reject(new Error(err.errMsg || '读取剪贴板失败'));
                    },
                });
            },
            fail: (err) => {
                reject(new Error(err.errMsg || '复制失败'));
            },
        });
    });
}
