// 知识库 HTML 工具：富文本答案在 app 端的清洗 / 纯文本提取 / 图片提取

// 移除 HTML 标签与常见实体，得到纯文本（用于列表摘要、编辑回填）
export function stripHtml(html: string): string {
    if (!html) return '';
    return String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

// 提取富文本中的图片地址
export function extractImages(html: string): string[] {
    if (!html) return [];
    const list: string[] = [];
    const re = /<img[^>]+src=["']([^"']+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
        if (m[1] && list.indexOf(m[1]) === -1) list.push(m[1]);
    }
    return list;
}

// 清洗富文本用于 rich-text 渲染：
// 1. 移除 script/style/iframe/object 等危险或无效节点
// 2. 移除所有 on* 事件属性
// 3. 拦截 javascript: 协议链接
// 4. 移除 <img>（rich-text 内图片不支持点击预览，统一走下方预览条）
export function sanitizeHtml(html: string): string {
    if (!html) return '';
    const s = String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
        .replace(/<object[\s\S]*?<\/object>/gi, '')
        .replace(/<embed[^>]*>/gi, '')
        .replace(/<img[^>]*>/gi, '')
        // 移除 on* 事件属性
        .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        // 拦截 javascript: 协议
        .replace(/(href|src)\s*=\s*(?:"[^"]*javascript:[^"]*"|'[^']*javascript:[^']*')/gi, '$1="#"');
    return s;
}

// 纯文本转简单 HTML（移动端编辑为纯文本，保存时转成与 Web 端一致的段落格式）
export function textToHtml(text: string): string {
    const t = (text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return t
        .split(/\r?\n/)
        .map((p: string) => `<p>${p.replace(/\s+/g, ' ')}</p>`)
        .join('');
}
