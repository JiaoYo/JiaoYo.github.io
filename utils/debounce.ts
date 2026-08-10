/**
 * 节流函数（领先执行，只执行第一次。无论成功失败，都需要等待 delay 才能再次触发）
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

/**
 * 防抖函数（只执行最后一次）
 * 多次触发会重置计时器，delay 后才真正执行
 */
export function debounce<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    delay = 1000
) {
    let timer: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
        return new Promise((resolve, reject) => {
            if (timer) clearTimeout(timer);

            timer = setTimeout(async () => {
                try {
                    const result = await fn(...args);
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            }, delay);
        });
    };
}

/**
 * 扩展方法
 * 节流函数（首次立即执行 + 冷却结束补最后一次）
 */
export function throttleWithTrailing<T extends (...args: any[]) => Promise<any>>(fn: T, delay = 1000) {
    let isCooling = false;
    let lastArgs: Parameters<T> | null = null;

    const run = async (args: Parameters<T>) => {
        isCooling = true;
        try {
            await fn(...args);
        } finally {
            setTimeout(async () => {
                isCooling = false;
                if (lastArgs) {
                    const argsToRun = lastArgs;
                    lastArgs = null;
                    run(argsToRun);
                }
            }, delay);
        }
    };

    return async (...args: Parameters<T>) => {
        if (!isCooling) {
            run(args);
        } else {
            lastArgs = args; // 只保留最后一次参数
        }
    };
}