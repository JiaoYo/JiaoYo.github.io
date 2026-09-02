/**
 * 节流函数（无论成功失败，都需要等待 delay 才能再次触发）
 */
export function throttle<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    delay = 1000
) {
    let isCooling = false;

    return async (...args: Parameters<T>): Promise<ReturnType<T> | void> => {
        if (isCooling) return;

        isCooling = true;

        try {
            return await fn(...args);
        } finally {
            // 无论成功还是失败，都在 delay 后允许下次调用
            setTimeout(() => {
                isCooling = false;
            }, delay);
        }
    };
}
