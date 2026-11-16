<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { onReady } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetUserInfoWithWechat } from '@/service/index';
import {
  fetchCustomerServiceAsk,
  fetchCustomerServiceFeedback,
  fetchCustomerServiceStatus,
  fetchCustomerServiceRefresh,
  fetchCustomerServiceUnansweredList,
  fetchCustomerServiceResolveUnanswered,
  fetchCustomerServiceAliasList,
  fetchCustomerServiceSaveAliases,
  fetchCustomerServiceDeleteAlias
} from '@/service/projectQa';
import { toRichHtml, extractImages } from './modules/chat-utils';
import { createSseStream, supportSseStream } from '@/utils/sse-stream';
import { BASE_URL } from '@/utils/request';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

// ========== 基础信息 ==========
const userId = uni.getStorageSync('userId');
const usertype = Number(uni.getStorageSync('usertype'));
// 管理面板：仅系统管理员（与 Web 端一致，后端权限键未知则用 usertype 兜底）
const isAdmin = usertype === 0;

const statusBarHeight = ref(0);
const bottomSafe = ref(0);

const userAvatar = ref('https://pms.linkqi.cn:18443/soybean.jpg');
const assistantAvatar = ref('/static/linkqi_108_108.png');

// 返回上一页（H5 走历史，App 走 navigateBack）
function handleClickLeft() {
  // #ifdef H5
  history.go(-1);
  // #endif

  // #ifndef H5
  uni.navigateBack();
  // #endif
}

// ========== 配置 ==========
// 配置键带 v2：旧版本（无流式支持时）曾把 useStream=false 持久化，需避开旧缓存让默认流式生效
const CONFIG_KEY = 'knowledge_chat_config_v2';
const showSettings = ref(false);
const config = ref<{ withContext: boolean; useStream: boolean }>({
  withContext: true,
  useStream: true
});
function loadConfig() {
  try {
    const saved = uni.getStorageSync(CONFIG_KEY);
    if (saved) {
      const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
      config.value = { withContext: true, useStream: true, ...parsed };
    }
  } catch (e) { /* ignore */ }
}
loadConfig();
watch(config, (val) => {
  try { uni.setStorageSync(CONFIG_KEY, JSON.stringify(val)); } catch (e) { /* ignore */ }
}, { deep: true });

// ========== 会话管理 ==========
const sessionId = ref('');
const messages = ref<any[]>([]);
const inputMessage = ref('');
const isStreaming = ref(false);
const clarificationInputs = ref<Record<string, string>>({});

const showHistory = ref(false);

// 计算属性：用户消息列表（用于历史记录）
const userMessages = computed(() => messages.value.filter((m: any) => m.type === 'user'));

// 手动拼 HH:MM，避免 toLocaleTimeString 在不同 JS 引擎上附带时区/GMT 后缀
function formatTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function addMessage(data: any) {
  const msg: any = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: data.type,
    content: data.content || '',
    time: formatTime(),
    loading: data.loading || false,
    feedback: data.feedback || false,
    helpful: data.helpful || false,
    messageId: data.messageId || null,
    references: data.references || [],
    mode: data.mode || null,
    confidence: data.confidence || 0,
    needHuman: data.needHuman || false,
    feedbackComment: data.feedbackComment || '',
    aborted: data.aborted || false,
    ...data
  };
  messages.value.push(msg);
  scrollToBottom();
}

// ========== 滚动 ==========
const scrollIntoView = ref('');
const scrollTop = ref(0);
const showScrollToBottom = ref(false);
let chatClientHeight = 0;

let scrollTimer: any = null;
let scrollTimer2: any = null;
function scrollToBottom() {
  // scroll-top 只在值变化时触发：先清空再赋大值，超出的部分会被平台钳制到最底，
  // 比 scroll-into-view 锚点可靠（锚点位置在答案渲染前仍是旧布局，只滚一小截）
  scrollTop.value = 0;
  nextTick(() => { scrollTop.value = 999999; });
  // 延迟兜底：答案文本/富文本/引用渲染是异步的，内容变高后旧位置失效，多级补滚
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    scrollTop.value = 0;
    nextTick(() => { scrollTop.value = 999999; });
  }, 120);
  clearTimeout(scrollTimer2);
  scrollTimer2 = setTimeout(() => {
    scrollTop.value = 0;
    nextTick(() => { scrollTop.value = 999999; });
  }, 500);
}

function onScroll(e: any) {
  const d = e.detail || {};
  const atBottom = (d.scrollTop || 0) + chatClientHeight >= (d.scrollHeight || 0) - 40;
  showScrollToBottom.value = !atBottom;
}

function scrollToMessage(id: string) {
  showHistory.value = false;
  nextTick(() => {
    scrollIntoView.value = '';
    nextTick(() => {
      scrollIntoView.value = `msg-${id}`;
    });
  });
}

// ========== 发送消息 ==========
function getValidHistory() {
  const errorPrefixes = ['❌ 请求失败', '⏹️ 请求已取消', '❌ 发生异常'];
  return messages.value
    .slice(1)
    .filter((m: any) => {
      if (m.type !== 'user' && m.type !== 'assistant') return false;
      if (m.type === 'assistant' && errorPrefixes.some((p: string) => m.content.startsWith(p))) return false;
      if (!m.content || m.content.trim() === '') return false;
      if (m.aborted === true) return false;
      return true;
    })
    .slice(-6)
    .map((m: any) => {
      let content = m.content;
      if (m.type === 'assistant') {
        content = content.replace(/<img[^>]*>/g, '');
      }
      return { role: m.type, content };
    });
}

// 当前流式请求句柄（用于“停止”按钮）
let currentStreamHandle: { abort: () => void } | null = null;
const isStreamActive = ref(false);

function stopCurrentStream() {
  if (currentStreamHandle) {
    currentStreamHandle.abort();
    currentStreamHandle = null;
  }
}

// 非流式：填充回答
function applyNonStreamAnswer(tempMsgId: string, data: any) {
  const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
  if (idx !== -1) {
    messages.value[idx] = {
      ...messages.value[idx],
      loading: false,
      content: (data && data.answer) || '抱歉，未能获取回答。',
      messageId: (data && data.messageId) || null,
      references: (data && data.references) || [],
      mode: (data && data.mode) || null,
      confidence: (data && data.confidence) || 0,
      needHuman: (data && data.needHuman) || false,
      showFeedback: !!(data && data.messageId)
    };
  }
  if (data && data.sessionId) sessionId.value = data.sessionId;
  // 回答落定后再滚一次：占位气泡时滚到的位置会因内容变高而失效
  if (!showScrollToBottom.value) scrollToBottom();
}

// 非流式接口
async function runNonStreamAsk(finalQuestion: string, tempMsgId: string, history: any[]) {
  const data = await fetchCustomerServiceAsk(
    { question: finalQuestion, sessionId: sessionId.value || undefined, history },
    { showLoading: false }
  );
  applyNonStreamAnswer(tempMsgId, data || {});
}

// 流式：App 端 plus.net.XMLHttpRequest 增量读取（SSE 分块）；返回 false 表示环境不支持，调用方回退非流式
function runStreamAsk(finalQuestion: string, tempMsgId: string, history: any[]): Promise<boolean> {
  if (!supportSseStream()) return Promise.resolve(false);

  return new Promise<boolean>((resolve, reject) => {
    let streamAnswer = '';

    // 应用完整结果（result 事件 / __complete__ 整包兜底共用）
    const applyResult = (result: any) => {
      const answerText = result.answer || streamAnswer;
      const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
      if (idx !== -1) {
        messages.value[idx] = {
          ...messages.value[idx],
          loading: false,
          content: answerText,
          messageId: result.messageId || null,
          references: result.references || [],
          mode: result.mode || null,
          confidence: result.confidence || 0,
          needHuman: result.needHuman || false,
          showFeedback: !!(result.messageId)
        };
      }
      if (result.sessionId) sessionId.value = result.sessionId;
      streamAnswer = answerText;
      // 回答落定后再滚一次：占位气泡时滚到的位置会因内容变高而失效
      if (!showScrollToBottom.value) scrollToBottom();
    };

    const handle = createSseStream({
      url: BASE_URL + '/ai/customerService/askStream.do',
      data: {
        question: finalQuestion,
        sessionId: sessionId.value || undefined,
        history: history.length ? history : undefined
      },
      headers: { token: uni.getStorageSync('token') || '' },
      onEvent: (eventName, data) => {
        if (eventName === 'token') {
          streamAnswer += data;
          const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
          if (idx !== -1) {
            messages.value[idx].content = streamAnswer;
            messages.value[idx].loading = true;
            // 用户未上滑查看历史时自动跟随底部
            if (!showScrollToBottom.value) scrollToBottom();
          }
        } else if (eventName === 'result') {
          let result: any = {};
          try { result = JSON.parse(data); } catch (e) { result = {}; }
          applyResult(result);
        } else if (eventName === '__complete__') {
          // 服务端未按 SSE 增量返回：整包响应兜底，避免一直卡在“思考中”
          console.log('[AI客服] 收到整包响应，长度', data.length);
          let result: any = null;
          try { result = JSON.parse(data); } catch (e) { result = null; }
          if (result && result.answer) {
            applyResult(result);
          } else {
            // 解析不了 JSON 就展示原文，方便排查响应格式
            const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
            if (idx !== -1) {
              messages.value[idx].loading = false;
              messages.value[idx].content = data;
            }
          }
        } else if (eventName === 'error') {
          let errObj: any = {};
          try { errObj = JSON.parse(data); } catch (e) { errObj = {}; }
          reject(new Error(errObj.message || '流式处理异常'));
        }
      }
    });
    currentStreamHandle = handle;
    isStreamActive.value = true;

    handle.done
      .then(() => {
        currentStreamHandle = null;
        isStreamActive.value = false;
        resolve(true);
      })
      .catch((err: any) => {
        currentStreamHandle = null;
        isStreamActive.value = false;
        if (err && err.isAbort) {
          // 用户主动停止：保留已生成内容
          const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
          if (idx !== -1) {
            if (!messages.value[idx].content) {
              messages.value[idx].content = '⏹️ 请求已取消';
            }
            messages.value[idx].loading = false;
          }
          resolve(true);
        } else {
          reject(err);
        }
      });
  });
}

async function handleSendMessage(questionOverride?: string) {
  const rawQuestion = (questionOverride || inputMessage.value).trim();
  if (!rawQuestion || isStreaming.value) return;

  // 截断逻辑（最多 500 字符）
  const MAX_LEN = 500;
  let finalQuestion = rawQuestion;
  if (rawQuestion.length > MAX_LEN) {
    finalQuestion = rawQuestion.slice(0, MAX_LEN);
    uni.showToast({ icon: 'none', title: `内容超过${MAX_LEN}字符，已截断` });
  }

  addMessage({ type: 'user', content: rawQuestion });
  if (!questionOverride) inputMessage.value = '';

  const tempMsgId = `temp_${Date.now()}`;
  addMessage({
    id: tempMsgId,
    type: 'assistant',
    content: '',
    loading: true,
    messageId: null,
    references: [],
    mode: null,
    confidence: 0,
    needHuman: false
  });

  isStreaming.value = true;
  try {
    const history = config.value.withContext ? getValidHistory() : [];
    // 诊断日志：确认当前走流式还是非流式、plus 是否被识别
    console.log('[AI客服] 发送 useStream=', config.value.useStream, 'supportSseStream=', supportSseStream());
    if (config.value.useStream) {
      const streamed = await runStreamAsk(finalQuestion, tempMsgId, history);
      // 非 App 环境（H5/小程序）无 plus，回退非流式接口
      if (!streamed) {
        console.log('[AI客服] 无 plus 环境，回退非流式');
        await runNonStreamAsk(finalQuestion, tempMsgId, history);
      } else {
        console.log('[AI客服] 已走 plus SSE 流式');
      }
    } else {
      await runNonStreamAsk(finalQuestion, tempMsgId, history);
    }
  } catch (err: any) {
    // 出错：保留气泡并写入错误信息（对齐 Web 端行为）
    const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
    const text = typeof err === 'string' ? err : (err && err.message) || '请求失败，请稍后重试';
    if (idx !== -1) {
      messages.value[idx].content = `❌ 请求失败：${text}`;
      messages.value[idx].loading = false;
    }
  } finally {
    isStreaming.value = false;
    currentStreamHandle = null;
    isStreamActive.value = false;
  }
}

// ========== 清空会话 ==========
function handleClearChat() {
  if (messages.value.length === 0) return;
  uni.showModal({
    title: '提示',
    content: '确定要清空所有对话吗？',
    confirmColor: '#dd524d',
    success: (res) => {
      if (!res.confirm) return;
      messages.value = [];
      sessionId.value = '';
      clarificationInputs.value = {};
      showHistory.value = false;
      addMessage({ type: 'assistant', content: '您好！我是AI知识助手，有什么可以帮助您的吗？', showFeedback: false });
    }
  });
}

// ========== 模式标签 ==========
function modeLabel(mode: string | null) {
  const map: Record<string, string> = {
    knowledge_direct: '直接匹配',
    llm_grounded: '模型生成',
    no_match: '未匹配',
    ambiguous: '歧义',
    clarification: '需澄清',
    knowledge_empty: '知识库空',
    model_fallback: '降级'
  };
  return map[mode || ''] || mode || '未知';
}

// ========== 评价反馈 ==========
async function handleFeedback(messageId: number, helpful: boolean) {
  const msg = messages.value.find((m: any) => m.messageId === messageId);
  if (!msg) return;
  try {
    await fetchCustomerServiceFeedback({
      messageId,
      sessionId: sessionId.value,
      helpful
    });
    msg.feedback = true;
    msg.helpful = helpful;
    msg.showFeedback = false;
    uni.showToast({ icon: 'success', title: '感谢您的反馈！' });
  } catch {
    uni.showToast({ icon: 'none', title: '反馈提交失败' });
  }
}

const showFeedbackModal = ref(false);
const feedbackMessageId = ref<number | null>(null);
const feedbackComment = ref('');
const feedbackCorrectQaId = ref('');

function openFeedbackModal(messageId: number) {
  feedbackMessageId.value = messageId;
  feedbackComment.value = '';
  feedbackCorrectQaId.value = '';
  showFeedbackModal.value = true;
}

async function submitFeedbackWithComment() {
  if (feedbackMessageId.value == null) return;
  const msg = messages.value.find((m: any) => m.messageId === feedbackMessageId.value);
  if (!msg) return;
  try {
    await fetchCustomerServiceFeedback({
      messageId: feedbackMessageId.value,
      sessionId: sessionId.value,
      helpful: false,
      comment: feedbackComment.value || undefined,
      correctQaId: feedbackCorrectQaId.value ? Number(feedbackCorrectQaId.value) : undefined
    });
    msg.feedback = true;
    msg.helpful = false;
    msg.showFeedback = false;
    msg.feedbackComment = feedbackComment.value || '无说明';
    uni.showToast({ icon: 'success', title: '感谢您的反馈！' });
    showFeedbackModal.value = false;
  } catch {
    uni.showToast({ icon: 'none', title: '反馈提交失败' });
  }
}

// ========== 转人工 ==========
function handleTransferHuman() {
  uni.showToast({ icon: 'none', title: '正在为您转接人工客服，请稍候…' });
}

// ========== 补充/歧义问题 ==========
function sendClarification(messageId: string) {
  const input = clarificationInputs.value[messageId];
  if (!input || !input.trim()) return;
  const question = input.trim();
  clarificationInputs.value[messageId] = '';
  handleSendMessage(question);
}

function extractCandidateQuestions(msg: any): string[] {
  if (msg.references && msg.references.length > 0) {
    return msg.references.map((ref: any) => ref.problem).filter(Boolean);
  }
  const lines = String(msg.content || '').split('\n').filter((line: string) => /^\d+[、.．]/.test(line.trim()));
  return lines.map((line: string) => line.replace(/^\d+[、.．]\s*/, '').trim()).filter(Boolean);
}

function sendClarificationQuestion(q: string) {
  if (!q.trim()) return;
  handleSendMessage(q.trim());
}

// ========== 快捷问题 ==========
const quickQuestions = [
  '领祺主要产品有哪些？',
  '网关添加不成功？',
  '光伏项目的四可做吗？',
  '协议采集 和转发 设备使用教程有吗？'
];

function useQuickQuestion(q: string) {
  inputMessage.value = q;
  handleSendMessage();
}

// ========== 系统状态（管理） ==========
const showManage = ref(false);
const systemStatus = ref<any>({
  knowledgeCount: 0,
  aliasCount: 0,
  embeddedDocumentCount: 0,
  pendingEmbeddingCount: 0,
  lastRefreshTime: null,
  chatEnabled: false,
  embeddingDimensions: 0,
  refreshError: null,
  embeddingError: null
});
const refreshing = ref(false);

async function openManage() {
  showManage.value = true;
  getSystemStatus();
  getUnansweredList();
}

async function getSystemStatus() {
  try {
    const data = await fetchCustomerServiceStatus();
    if (data) systemStatus.value = data;
  } catch (e) { /* ignore */ }
}

async function handleRefreshKnowledge() {
  refreshing.value = true;
  try {
    await fetchCustomerServiceRefresh();
    uni.showToast({ icon: 'success', title: '知识库刷新成功' });
    getSystemStatus();
  } catch {
    uni.showToast({ icon: 'none', title: '知识库刷新失败' });
  } finally {
    refreshing.value = false;
  }
}

// ========== 未命中问题 ==========
const unansweredList = ref<any[]>([]);
const unansweredLoading = ref(false);

async function getUnansweredList() {
  unansweredLoading.value = true;
  try {
    const data = await fetchCustomerServiceUnansweredList({ limit: 100 });
    unansweredList.value = Array.isArray(data) ? data : [];
  } catch (e) { /* ignore */ } finally {
    unansweredLoading.value = false;
  }
}

function statusLabel(status: number) {
  const map: Record<number, string> = { 0: '待处理', 1: '已处理', 2: '已忽略' };
  return map[status] || '未知';
}

// ========== 处理未命中问题 ==========
const showResolve = ref(false);
const resolveForm = ref<any>({ id: 0, status: '1', qaId: '', addAsAlias: true });
const resolving = ref(false);

function openResolveModal(item: any) {
  resolveForm.value = { id: item.id, status: '1', qaId: '', addAsAlias: true };
  showResolve.value = true;
}

async function handleSubmitResolve() {
  if (resolveForm.value.status === '1' && !resolveForm.value.qaId) {
    uni.showToast({ icon: 'none', title: '请填写关联的问答ID' });
    return;
  }
  resolving.value = true;
  try {
    await fetchCustomerServiceResolveUnanswered({
      id: resolveForm.value.id,
      status: Number(resolveForm.value.status),
      qaId: resolveForm.value.qaId ? Number(resolveForm.value.qaId) : undefined,
      addAsAlias: resolveForm.value.addAsAlias
    });
    uni.showToast({ icon: 'success', title: '处理成功' });
    showResolve.value = false;
    getUnansweredList();
  } catch {
    uni.showToast({ icon: 'none', title: '处理失败' });
  } finally {
    resolving.value = false;
  }
}

// ========== 别名管理 ==========
const showAlias = ref(false);
const aliasQaId = ref<number | null>(null);
const aliasProblem = ref('');
const aliasList = ref<any[]>([]);
const showAliasInput = ref(false);
const newAliasText = ref('');
const savingAlias = ref(false);

function openAliasDrawer(qaId: number, problem?: string) {
  if(!qaId) return;
  aliasQaId.value = qaId;
  aliasProblem.value = problem || '未知问题';
  showAliasInput.value = false;
  newAliasText.value = '';
  fetchAliasList(qaId);
  showAlias.value = true;
}

async function fetchAliasList(qaId: number) {
  try {
    if (!qaId) return;
    const data = await fetchCustomerServiceAliasList(qaId);
    aliasList.value = Array.isArray(data) ? data : [];
  } catch (e) { /* ignore */ }
}

function canDeleteAlias(item: any): boolean {
  return item && item.creater != null && String(item.creater) === String(userId);
}

async function deleteAlias(id: number) {
  try {
    await fetchCustomerServiceDeleteAlias(id);
    uni.showToast({ icon: 'success', title: '删除成功' });
    if (aliasQaId.value != null) fetchAliasList(aliasQaId.value);
  } catch {
    uni.showToast({ icon: 'none', title: '删除失败' });
  }
}

async function saveNewAlias() {
  const text = newAliasText.value.trim();
  if (!text || aliasQaId.value == null) return;
  const aliases = text.split('\n').map((s: string) => s.trim()).filter(Boolean);
  if (aliases.length === 0) {
    uni.showToast({ icon: 'none', title: '请输入至少一个别名' });
    return;
  }
  savingAlias.value = true;
  try {
    await fetchCustomerServiceSaveAliases({ qaId: aliasQaId.value, aliases });
    uni.showToast({ icon: 'success', title: `成功添加 ${aliases.length} 个别名` });
    showAliasInput.value = false;
    newAliasText.value = '';
    fetchAliasList(aliasQaId.value);
  } catch {
    uni.showToast({ icon: 'none', title: '添加别名失败' });
  } finally {
    savingAlias.value = false;
  }
}

// ========== 图片预览 ==========
function previewImages(urls: string[], index: number) {
  uni.previewImage({ current: urls[index], urls });
}

// ========== 生命周期 ==========
async function loadUserInfo() {
  try {
    const data = await fetchGetUserInfoWithWechat();
    if (data && data.userimage) userAvatar.value = data.userimage;
    if (data && data.usertype != null) uni.setStorageSync('usertype', data.usertype);
  } catch (e) { /* ignore */ }
}

function addWelcome() {
  if (messages.value.length > 0) return;
  addMessage({ type: 'assistant', content: '您好！我是AI知识助手，有什么可以帮助您的吗？', showFeedback: false });
}

onMounted(() => {
  try {
    const info = uni.getSystemInfoSync();
    statusBarHeight.value = info.statusBarHeight || 0;
    bottomSafe.value = (info.safeAreaInsets && info.safeAreaInsets.bottom) || 0;
  } catch (e) { /* ignore */ }
  loadUserInfo();
  addWelcome();
});

onReady(() => {
  nextTick(() => {
    setTimeout(() => {
      try {
        uni.createSelectorQuery()
          .select('.chat-scroll')
          .boundingClientRect((rect: any) => {
            if (rect && rect.height) chatClientHeight = rect.height;
          })
          .exec();
      } catch (e) { /* ignore */ }
    }, 100);
  });
});
</script>

<template>
  <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1a1a1a;' : 'min-height: 100vh;'" :theme="theme">
    <view class="chat-page" :class="{ 'chat-page-dark': isDark }">
      <!-- ========== 头部 ========== -->
      <view class="chat-header" :class="{ 'chat-header-dark': isDark }" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="header-left" @click="handleClickLeft">
          <wd-icon name="arrow-left" size="22px" :color="isDark ? '#ffffff' : '#1a2332'"></wd-icon>
        </view>
        <view class="header-title">
          <text class="title-name" :class="{ 'title-name-dark': isDark }">AI 知识问答</text>
          <text class="title-version">v2.0</text>
        </view>
        <view class="header-actions">
          <view class="header-btn" @click="showHistory = true">
            <wd-icon name="history" size="20px" :color="isDark ? '#cfd3dc' : '#64748b'"></wd-icon>
          </view>
          <view class="header-btn" @click="showSettings = true">
            <wd-icon name="setting" size="20px" :color="isDark ? '#cfd3dc' : '#64748b'"></wd-icon>
          </view>
          <view v-if="isAdmin" class="header-btn" @click="openManage">
            <wd-icon name="filter" size="20px" color="#f59e0b"></wd-icon>
          </view>
          <view class="header-btn" @click="handleClearChat">
            <wd-icon name="delete1" size="20px" color="#dd524d"></wd-icon>
          </view>
        </view>
      </view>

      <!-- ========== 消息区 ========== -->
      <scroll-view
        class="chat-scroll"
        scroll-y
        :scroll-into-view="scrollIntoView"
        :scroll-top="scrollTop"
        :scroll-with-animation="true"
        @scroll="onScroll"
      >
        <!-- 空状态 -->
        <view v-if="messages.length === 0" class="empty-state">
          <view class="empty-icon">💬</view>
          <text class="empty-text">您好！我是AI知识助手，可以回答您关于产品、技术等方面的问题。</text>
          <view class="empty-quick">
            <text class="empty-hint">快速开始：</text>
            <view v-for="q in quickQuestions" :key="q" class="quick-chip" @click="useQuickQuestion(q)">{{ q }}</view>
          </view>
        </view>

        <!-- 消息列表 -->
        <view
          v-for="message in messages"
          :key="message.id"
          :id="'msg-' + message.id"
          :class="['message', 'message-' + message.type]"
        >
          <!-- 用户消息 -->
          <view v-if="message.type === 'user'" class="message-content user-message">
            <image class="avatar user-avatar" :src="userAvatar" mode="aspectFill"></image>
            <view class="message-bubble user-bubble">
              <text class="bubble-text">{{ message.content }}</text>
            </view>
          </view>

          <!-- 系统消息 -->
          <view v-else-if="message.type === 'system'" class="system-message">
            <text class="system-text">{{ message.content }}</text>
          </view>

          <!-- 助手消息 -->
          <view v-else class="message-content assistant-message">
            <image class="avatar assistant-avatar" :src="assistantAvatar" mode="aspectFill"></image>
            <view class="message-wrapper">
              <!-- 思考中占位 -->
              <view v-if="message.loading && !message.content" class="message-bubble assistant-bubble loading-bubble">
                <text class="thinking-text">思考中</text>
                <view class="typing-dots">
                  <view class="dot"></view><view class="dot"></view><view class="dot"></view>
                </view>
              </view>
              <!-- 正常内容 -->
              <view v-else class="message-bubble assistant-bubble">
                <rich-text v-if="toRichHtml(message.content)" class="bubble-html" :nodes="toRichHtml(message.content)"></rich-text>
                <!-- 图片预览条 -->
                <view v-if="extractImages(message.content).length" class="img-strip">
                  <image
                    v-for="(img, idx) in extractImages(message.content)"
                    :key="idx"
                    class="img-thumb"
                    :src="img"
                    mode="aspectFill"
                    @click="previewImages(extractImages(message.content), idx)"
                  ></image>
                </view>
              </view>

              <!-- 知识来源 / 匹配信息 -->
              <view v-if="message.references && message.references.length" class="message-meta">
                <wd-tag size="small" :type="message.mode === 'knowledge_direct' ? 'success' : 'info'" custom-style="margin-right: 8rpx;">
                  {{ modeLabel(message.mode) }}
                </wd-tag>
                <wd-tag size="small" plain custom-style="margin-right: 8rpx;">
                  置信度 {{ (message.confidence * 100).toFixed(1) }}%
                </wd-tag>
                <view
                  v-for="ref in message.references"
                  :key="ref.id"
                  class="ref-tag"
                  :class="{ 'ref-tag-active': isAdmin }"
                  @click="isAdmin && openAliasDrawer(ref.id, ref.problem)"
                >
                  <text class="ref-text">#{{ ref.id }} {{ ref.problem }}</text>
                </view>
              </view>

              <!-- 底部操作栏 -->
              <view class="message-footer">
                <text class="message-time">{{ message.time }}</text>

                <!-- 评价按钮 -->
                <view
                  v-if="message.messageId && !message.feedback && !['knowledge_empty', 'no_match', 'ambiguous', 'clarification'].includes(message.mode || '')"
                  class="feedback-actions"
                >
                  <text class="feedback-btn good" @click="handleFeedback(message.messageId, true)">有帮助</text>
                  <text class="feedback-btn bad" @click="openFeedbackModal(message.messageId)">无帮助</text>
                </view>
                <view v-else-if="message.feedback" class="feedback-result">
                  <text class="feedback-result-text">{{ message.helpful ? '已感谢' : '已记录' }}</text>
                  <text v-if="message.feedbackComment" class="feedback-comment">{{ message.feedbackComment }}</text>
                </view>

                <!-- 转人工入口 -->
                <text
                  v-if="message.needHuman || message.mode === 'knowledge_empty' || message.mode === 'no_match'"
                  class="transfer-btn"
                  @click="handleTransferHuman"
                >转人工客服</text>
              </view>

              <!-- 歧义/澄清/无匹配/知识空：交互区域 -->
              <view v-if="['ambiguous', 'clarification', 'no_match', 'knowledge_empty'].includes(message.mode || '')" class="clarification-area">
                <view class="clarify-tip">
                  <text v-if="message.mode === 'ambiguous'">检测到多个可能相关的问题，请点击选择您想咨询的：</text>
                  <text v-else-if="message.mode === 'clarification'">信息不足，请补充更多细节（如设备型号、操作步骤等）</text>
                  <text v-else-if="message.mode === 'no_match'">未找到匹配答案，请尝试重新描述您的问题</text>
                  <text v-else>知识库暂无相关内容，请转人工或补充信息</text>
                </view>
                <view v-if="message.mode === 'ambiguous'" class="candidate-wrap">
                  <view
                    v-for="(q, idx) in extractCandidateQuestions(message)"
                    :key="idx"
                    class="candidate-chip"
                    @click="sendClarificationQuestion(q)"
                  >{{ q }}</view>
                </view>
                <view class="clarify-input-row">
                  <input
                    v-model="clarificationInputs[message.id]"
                    class="clarify-input"
                    placeholder="或输入您的问题…"
                    :maxlength="200"
                    :disabled="isStreaming"
                    confirm-type="send"
                    @confirm="sendClarification(message.id)"
                  />
                  <wd-button size="small" type="primary" @click="sendClarification(message.id)">发送补充</wd-button>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view id="anchor-bottom" class="anchor-bottom"></view>
      </scroll-view>

      <!-- ========== 快捷问题 ========== -->
      <view v-if="messages.length > 0" class="quick-bar">
        <scroll-view class="quick-scroll" scroll-x :show-scrollbar="false">
          <view class="quick-inner">
            <view v-for="q in quickQuestions" :key="q" class="quick-chip" @click="useQuickQuestion(q)">{{ q }}</view>
          </view>
        </scroll-view>
      </view>

      <!-- 回到底部 -->
      <view v-if="showScrollToBottom" class="scroll-bottom-btn" @click="scrollToBottom">
        <wd-icon name="arrow-down" size="18px" color="#1677ff"></wd-icon>
      </view>

      <!-- ========== 输入区 ========== -->
      <view class="chat-input" :style="{ paddingBottom: (12 + bottomSafe) + 'px' }">
        <view class="input-row">
          <textarea
            v-model="inputMessage"
            class="chat-textarea"
            placeholder="请输入您的问题…（回车发送，最多500字符）"
            :maxlength="500"
            :disabled="isStreaming"
            auto-height
            confirm-type="send"
            @confirm="handleSendMessage()"
          ></textarea>
          <view
            v-if="isStreamActive"
            class="stop-btn"
            @click="stopCurrentStream"
          >
            <text class="stop-text">停止</text>
          </view>
          <view
            class="send-btn"
            :class="{ 'send-btn-disabled': !inputMessage.trim() || isStreaming }"
            @click="handleSendMessage()"
          >
            <text v-if="isStreaming" class="send-loading">思考中</text>
            <wd-icon v-else name="enter" size="20px" color="#ffffff"></wd-icon>
          </view>
        </view>
        <view class="input-tip">
          <text>回车发送，最多500字符</text>
        </view>
      </view>

      <!-- ========== 对话记录弹层 ========== -->
      <wd-popup v-model="showHistory" position="right" :lock-scroll="false" :custom-style="'width: 76vw; height: 100vh; background: #ffffff;'">
        <view class="history-page">
          <view class="history-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <text class="history-title">📜 对话记录</text>
            <wd-icon name="close" size="20px" color="#86909c" @click="showHistory = false"></wd-icon>
          </view>
          <scroll-view scroll-y class="history-body">
            <view v-if="userMessages.length === 0" class="empty-text">暂无用户消息</view>
            <view v-for="(msg, index) in userMessages" :key="msg.id" class="history-item" @click="scrollToMessage(msg.id)">
              <text class="history-index">#{{ index + 1 }}</text>
              <text class="history-text">{{ msg.content }}</text>
              <text class="history-time">{{ msg.time || '--:--' }}</text>
            </view>
          </scroll-view>
        </view>
      </wd-popup>

      <!-- ========== 设置弹层 ========== -->
      <wd-popup v-model="showSettings" position="center" :custom-style="'width: 80%; border-radius: 20rpx; padding: 32rpx;'">
        <view class="settings-form">
          <text class="form-title">⚙️ 设置</text>
          <view class="setting-item">
            <view class="setting-info">
              <text class="setting-label">携带上下文</text>
              <text class="setting-desc">发送历史对话记录，支持多轮对话</text>
            </view>
            <wd-switch v-model="config.withContext" size="24px"></wd-switch>
          </view>
          <view class="setting-item">
            <view class="setting-info">
              <text class="setting-label">流式请求</text>
              <text class="setting-desc">AI回复实时流式输出，体验更流畅</text>
            </view>
            <wd-switch v-model="config.useStream" size="24px"></wd-switch>
          </view>
          <view class="form-actions">
            <wd-button type="primary" @click="showSettings = false">关闭</wd-button>
          </view>
        </view>
      </wd-popup>

      <!-- ========== 管理弹层 ========== -->
      <wd-popup v-model="showManage" position="right" :lock-scroll="false" :custom-style="'width: 100vw; height: 100vh; background: #f5f6f8;'">
        <view class="manage-page">
          <view class="manage-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="manage-header-left" @click="showManage = false">
              <wd-icon name="arrow-left" size="20px" color="#1a1a1a"></wd-icon>
            </view>
            <text class="manage-header-title">管理面板</text>
            <view class="manage-header-right"></view>
          </view>
          <scroll-view scroll-y class="manage-body">
            <!-- 系统状态 -->
            <view class="manage-card">
              <view class="card-header">
                <text class="card-title">系统状态</text>
                <wd-button size="small" type="primary" :loading="refreshing" @click="handleRefreshKnowledge">刷新知识库</wd-button>
              </view>
              <view class="status-grid">
                <view class="status-item">
                  <text class="s-label">聊天状态</text>
                  <text class="s-value" :class="{ 's-value-on': systemStatus.chatEnabled }">{{ systemStatus.chatEnabled ? '已启用' : '未启用' }}</text>
                </view>
                <view class="status-item">
                  <text class="s-label">知识库数量</text>
                  <text class="s-value">{{ systemStatus.knowledgeCount ?? 0 }} 条</text>
                </view>
                <view class="status-item">
                  <text class="s-label">别名数量</text>
                  <text class="s-value">{{ systemStatus.aliasCount ?? 0 }} 条</text>
                </view>
                <view class="status-item">
                  <text class="s-label">嵌入文档</text>
                  <text class="s-value">{{ systemStatus.embeddedDocumentCount ?? 0 }} / {{ systemStatus.pendingEmbeddingCount ?? 0 }} 待处理</text>
                </view>
                <view class="status-item">
                  <text class="s-label">嵌入维度</text>
                  <text class="s-value">{{ systemStatus.embeddingDimensions || '未知' }}</text>
                </view>
                <view class="status-item">
                  <text class="s-label">最后刷新</text>
                  <text class="s-value">{{ systemStatus.lastRefreshTime }}</text>
                </view>
              </view>
              <view v-if="systemStatus.refreshError" class="status-error">刷新错误: {{ systemStatus.refreshError }}</view>
              <view v-if="systemStatus.embeddingError" class="status-error">嵌入错误: {{ systemStatus.embeddingError }}</view>
            </view>

            <!-- 未命中问题 -->
            <view class="manage-card">
              <view class="card-header">
                <text class="card-title">未命中问题</text>
                <wd-button size="small" type="info" @click="getUnansweredList">刷新</wd-button>
              </view>
              <view v-if="unansweredLoading" class="list-hint">加载中…</view>
              <view v-else-if="unansweredList.length === 0" class="list-hint">暂无未命中问题</view>
              <view v-else class="unanswered-list">
                <view v-for="item in unansweredList" :key="item.id" class="unanswered-item">
                  <view class="un-item-main">
                    <text class="un-question">{{ item.sampleQuestion }}</text>
                    <view class="un-meta">
                      <text>未命中 {{ item.hitCount }} 次</text>
                      <text>最高 {{ ((item.maxScore || 0) * 100).toFixed(0) }}%</text>
                      <text class="un-status" :class="'st-' + (item.status || 0)">{{ statusLabel(item.status) }}</text>
                    </view>
                  </view>
                  <wd-button v-if="item.status === 0" size="small" type="primary" @click="openResolveModal(item)">处理</wd-button>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>
      </wd-popup>

      <!-- ========== 处理未命中问题弹层 ========== -->
      <wd-popup v-model="showResolve" position="center" :custom-style="'width: 85%; border-radius: 20rpx; padding: 32rpx;'">
        <view class="resolve-form">
          <text class="form-title">处理未命中问题</text>
          <wd-radio-group v-model="resolveForm.status" shape="button" custom-class="resolve-radio">
            <wd-radio value="1">关联已有知识</wd-radio>
            <wd-radio value="2">忽略</wd-radio>
          </wd-radio-group>
          <view v-if="resolveForm.status === '1'" class="form-field">
            <text class="form-label">关联问答 ID（必填）</text>
            <input v-model="resolveForm.qaId" type="number" class="form-input" placeholder="请输入标准问答 ID" />
          </view>
          <view v-if="resolveForm.status === '1'" class="setting-item">
            <view class="setting-info">
              <text class="setting-label">自动添加别名</text>
              <text class="setting-desc">将用户问法加入该问答的别名</text>
            </view>
            <wd-switch v-model="resolveForm.addAsAlias" size="24px"></wd-switch>
          </view>
          <view class="form-actions">
            <wd-button @click="showResolve = false">取消</wd-button>
            <wd-button type="primary" :loading="resolving" @click="handleSubmitResolve">确定</wd-button>
          </view>
        </view>
      </wd-popup>

      <!-- ========== 评价反馈弹层 ========== -->
      <wd-popup v-model="showFeedbackModal" position="center" :custom-style="'width: 85%; border-radius: 20rpx; padding: 32rpx;'">
        <view class="feedback-form">
          <text class="form-title">反馈评价</text>
          <textarea
            v-model="feedbackComment"
            class="form-textarea"
            placeholder="请描述为什么不满意，或提供正确知识ID（可选）"
            :maxlength="500"
            auto-height
          ></textarea>
          <view class="form-field">
            <text class="form-label">正确问答 ID（可选）</text>
            <input v-model="feedbackCorrectQaId" type="number" class="form-input" placeholder="如您知道正确的问答ID，可填写" />
          </view>
          <view class="form-actions">
            <wd-button @click="showFeedbackModal = false">取消</wd-button>
            <wd-button type="primary" @click="submitFeedbackWithComment">提交反馈</wd-button>
          </view>
        </view>
      </wd-popup>

      <!-- ========== 别名管理弹层 ========== -->
      <wd-popup v-model="showAlias" position="bottom" :custom-style="'max-height: 72vh; border-radius: 24rpx 24rpx 0 0;'">
        <view class="alias-sheet">
          <view class="sheet-header">
            <text class="sheet-title">别名管理</text>
            <text class="sheet-sub">问答 ID: {{ aliasQaId }}</text>
            <wd-icon name="close" size="20px" color="#86909c" @click="showAlias = false"></wd-icon>
          </view>
          <view class="sheet-stats">
            <text>共 <text class="strong">{{ aliasList.length }}</text> 个别名</text>
            <text class="sheet-problem">来源：{{ aliasProblem }}</text>
          </view>
          <view class="sheet-add">
            <view class="add-header">
              <text>新增别名（每行一个）</text>
              <wd-button size="small" type="primary" plain @click="showAliasInput = !showAliasInput">添加</wd-button>
            </view>
            <view v-if="showAliasInput" class="add-input-wrap">
              <textarea
                v-model="newAliasText"
                class="alias-textarea"
                placeholder="输入新别名，每行一个，如：&#10;网关掉线怎么办&#10;设备网关显示离线"
                :maxlength="500"
                auto-height
              ></textarea>
              <view class="add-actions">
                <wd-button size="small" @click="showAliasInput = false">取消</wd-button>
                <wd-button size="small" type="primary" :loading="savingAlias" :disabled="!newAliasText.trim()" @click="saveNewAlias">批量保存</wd-button>
              </view>
            </view>
          </view>
          <scroll-view scroll-y class="sheet-list">
            <view v-if="aliasList.length === 0" class="list-hint">暂无别名，点击上方「添加」按钮新增</view>
            <view v-for="item in aliasList" :key="item.id" class="alias-item">
              <view class="alias-item-main">
                <text class="alias-item-text">{{ item.alias }}</text>
                <wd-tag size="small" :type="item.enabled ? 'success' : 'info'" plain>{{ item.enabled ? '已启用' : '已禁用' }}</wd-tag>
              </view>
              <text class="alias-item-time">{{ item.dbtime }}</text>
              <view v-if="canDeleteAlias(item)" class="alias-item-del" @click="deleteAlias(item.id)">
                <wd-icon name="delete1" size="18px" color="#dd524d"></wd-icon>
              </view>
            </view>
          </scroll-view>
        </view>
      </wd-popup>
    </view>
  </wd-config-provider>
</template>

<style lang="scss" scoped>
// ============================================================
// 页面布局
// ============================================================
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
  overflow: hidden;
}

.chat-page-dark {
  background: linear-gradient(180deg, #141414 0%, #1a1a1a 100%);
}

// ============================================================
// 头部
// ============================================================
.chat-header {
  display: flex;
  align-items: center;
  padding: 0 20rpx 16rpx;
  padding-bottom: 16rpx;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1rpx solid #eef0f4;
  flex-shrink: 0;
  box-sizing: content-box;
}

.chat-header-dark {
  background: rgba(20, 20, 20, 0.92);
  border-bottom: 1rpx solid #2a2a2a;
}

.header-left {
  width: 60rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.header-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  overflow: hidden;

  .title-name {
    font-size: 34rpx;
    font-weight: 700;
    color: #1a2332;
  }

  .title-name-dark {
    color: #ffffff;
  }

  .title-version {
    font-size: 20rpx;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 4rpx 14rpx;
    border-radius: 20rpx;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;

  .header-btn {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12rpx;
    background: #f5f7fa;

    &:active {
      opacity: 0.7;
    }
  }
}

// ============================================================
// 消息滚动区
// ============================================================
.chat-scroll {
  flex: 1;
  min-height: 0;
  padding: 20rpx 24rpx 8rpx;
  box-sizing: border-box;
}

.anchor-bottom {
  height: 4rpx;
}

// ============================================================
// 空状态
// ============================================================
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 30rpx 20rpx;
  text-align: center;

  .empty-icon {
    font-size: 72rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #64748b;
    line-height: 1.6;
    max-width: 520rpx;
  }

  .empty-quick {
    margin-top: 32rpx;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14rpx;

    .empty-hint {
      width: 100%;
      font-size: 24rpx;
      color: #94a3b8;
      margin-bottom: 4rpx;
    }
  }
}

// ============================================================
// 消息样式
// ============================================================
.message {
  display: flex;
  animation: fadeInUp 0.3s ease-out;
  scroll-margin: 16rpx;
  margin-bottom: 24rpx;

  &.message-user {
    justify-content: flex-end;

    .message-content {
      flex-direction: row-reverse;
    }

    .user-bubble {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
      border-radius: 20rpx 20rpx 4rpx 20rpx;
      box-shadow: 0 6rpx 20rpx rgba(99, 102, 241, 0.22);
    }
  }

  &.message-assistant {
    justify-content: flex-start;

    .assistant-bubble {
      background: #ffffff;
      color: #1a2332;
      border-radius: 20rpx 20rpx 20rpx 4rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
      border: 1rpx solid rgba(255, 255, 255, 0.6);
    }
  }

  &.message-system {
    justify-content: center;

    .system-message {
      background: rgba(0, 0, 0, 0.04);
      padding: 12rpx 24rpx;
      border-radius: 20rpx;
      font-size: 24rpx;
      color: #666666;
      max-width: 72%;
      text-align: center;
    }
  }
}

.chat-page-dark .message {
  &.message-assistant .assistant-bubble {
    background: #242424;
    color: #e5e7eb;
    border: 1rpx solid #303030;
  }

  &.message-user .user-bubble {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }

  &.message-system .system-message {
    background: rgba(255, 255, 255, 0.06);
    color: #9ca3af;
  }
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  max-width: 84%;

  &.user-message {
    flex-direction: row-reverse;
  }

  &.assistant-message {
    flex-direction: row;
  }
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  flex-shrink: 0;
  background: #e2e8f0;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.message-bubble {
  padding: 18rpx 22rpx;
  font-size: 28rpx;
  line-height: 1.7;
  word-break: break-word;
  min-width: 60rpx;
}

.bubble-text {
  word-break: break-all;
}

.bubble-html {
  font-size: 28rpx;
  line-height: 1.7;
  word-break: break-word;
}

.loading-bubble {
  display: flex;
  align-items: center;
  gap: 12rpx;

  .thinking-text {
    font-size: 26rpx;
    color: #94a3b8;
    font-weight: 500;
  }
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .dot {
    width: 12rpx;
    height: 12rpx;
    background: #94a3b8;
    border-radius: 50%;
    animation: bounce 1.4s infinite;
  }

  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10rpx); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12rpx); }
  to { opacity: 1; transform: translateY(0); }
}

// ============================================================
// 图片预览条
// ============================================================
.img-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 12rpx;

  .img-thumb {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    background: #f2f3f5;
  }
}

// ============================================================
// 消息元数据 / 知识来源
// ============================================================
.message-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10rpx;
}

.ref-tag {
  background: #fff7e6;
  border: 1rpx solid #ffe7ba;
  border-radius: 10rpx;
  padding: 4rpx 12rpx;
  max-width: 320rpx;

  .ref-text {
    font-size: 22rpx;
    color: #b45309;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
}

.ref-tag-active:active {
  opacity: 0.6;
}

// ============================================================
// 底部操作栏
// ============================================================
.message-footer {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex-wrap: wrap;
  font-size: 22rpx;
  color: #b0b0b0;
  padding: 0 4rpx;

  .message-time {
    font-size: 22rpx;
    color: #b0b0b0;
  }

  .feedback-actions {
    display: flex;
    gap: 8rpx;

    .feedback-btn {
      font-size: 22rpx;
      padding: 6rpx 18rpx;
      border-radius: 20rpx;
      border: 1rpx solid #d9d9d9;

      &.good { color: #52c41a; }
      &.bad { color: #ff4d4f; }
    }
  }

  .feedback-result {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .feedback-result-text {
      color: #909399;
    }

    .feedback-comment {
      font-size: 22rpx;
      color: #999999;
      max-width: 320rpx;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .transfer-btn {
    font-size: 22rpx;
    color: #fa8c16;
    border: 1rpx solid #ffd591;
    border-radius: 20rpx;
    padding: 6rpx 18rpx;
  }
}

// ============================================================
// 澄清/歧义区域
// ============================================================
.clarification-area {
  margin-top: 8rpx;
  padding: 12rpx;
  background: #f0f7ff;
  border-radius: 12rpx;

  .clarify-tip {
    font-size: 24rpx;
    color: #1677ff;
    line-height: 1.5;
  }

  .candidate-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 12rpx;

    .candidate-chip {
      background: #ffffff;
      border: 1rpx solid #91caff;
      color: #1677ff;
      font-size: 24rpx;
      padding: 8rpx 20rpx;
      border-radius: 24rpx;

      &:active {
        opacity: 0.7;
      }
    }
  }

  .clarify-input-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-top: 14rpx;

    .clarify-input {
      flex: 1;
      min-width: 0;
      height: 64rpx;
      background: #ffffff;
      border-radius: 12rpx;
      padding: 0 16rpx;
      font-size: 26rpx;
      border: 1rpx solid #e0e0e0;
    }
  }
}

// ============================================================
// 快捷问题
// ============================================================
.quick-bar {
  flex-shrink: 0;
  padding: 10rpx 24rpx 4rpx;
}

.quick-scroll {
  width: 100%;
  white-space: nowrap;
}

.quick-inner {
  display: inline-flex;
  gap: 14rpx;
  padding: 4rpx 4rpx 8rpx;
}

.quick-chip {
  flex-shrink: 0;
  background: #ffffff;
  border: 1rpx solid #e4e7ed;
  color: #5f6b7a;
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  border-radius: 28rpx;
  display: inline-flex;
  align-items: center;

  &:active {
    opacity: 0.7;
  }
}

.chat-page-dark .quick-chip {
  background: #242424;
  border-color: #333333;
  color: #c0c4cc;
}

// ============================================================
// 回到底部按钮
// ============================================================
.scroll-bottom-btn {
  position: absolute;
  right: 30rpx;
  bottom: 300rpx;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #ffffff;
  border: 1rpx solid #e2e8f0;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

// ============================================================
// 输入区
// ============================================================
.chat-input {
  flex-shrink: 0;
  padding: 10rpx 24rpx 12rpx;
  padding-top: 10rpx;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1rpx solid #eef0f4;
  box-sizing: content-box;
}

.chat-page-dark .chat-input {
  background: rgba(20, 20, 20, 0.95);
  border-top: 1rpx solid #2a2a2a;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 14rpx;
  background: #f5f7fa;
  border-radius: 24rpx;
  padding: 10rpx 12rpx;
  border: 1rpx solid #e4e7ed;

  &:focus-within {
    border-color: #6366f1;
  }
}

.chat-textarea {
  flex: 1;
  min-height: 44rpx;
  max-height: 180rpx;
  font-size: 28rpx;
  line-height: 1.5;
  padding: 4rpx 8rpx;
  color: #0f172a;
  width: 100%;
}

.chat-page-dark .chat-textarea {
  color: #e5e7eb;
}

.send-btn {
  flex-shrink: 0;
  width: 88rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 16rpx rgba(99, 102, 241, 0.25);
  color: #ffffff;

  &:active {
    opacity: 0.9;
    transform: scale(0.96);
  }

  .send-loading {
    font-size: 22rpx;
    color: #ffffff;
  }
}

.send-btn-disabled {
  opacity: 0.4;
  box-shadow: none;
}

.stop-btn {
  flex-shrink: 0;
  height: 72rpx;
  padding: 0 26rpx;
  border-radius: 36rpx;
  background: #ef4444;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 16rpx rgba(239, 68, 68, 0.25);

  &:active {
    opacity: 0.9;
    transform: scale(0.96);
  }

  .stop-text {
    font-size: 24rpx;
    color: #ffffff;
  }
}

.input-tip {
  text-align: right;
  font-size: 20rpx;
  color: #94a3b8;
  padding: 8rpx 8rpx 0;
}

// ============================================================
// 弹层通用
// ============================================================
.form-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24rpx;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 28rpx;
}

.form-field {
  margin-top: 20rpx;

  .form-label {
    display: block;
    font-size: 26rpx;
    color: #4e5969;
    margin-bottom: 10rpx;
  }

  .form-input {
    width: 100%;
    box-sizing: border-box;
    height: 72rpx;
    background: #f5f7fa;
    border: 1rpx solid #e4e7ed;
    border-radius: 12rpx;
    padding: 0 16rpx;
    font-size: 26rpx;
  }
}

.form-textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 120rpx;
  background: #f5f7fa;
  border: 1rpx solid #e4e7ed;
  border-radius: 12rpx;
  padding: 16rpx;
  font-size: 26rpx;
  line-height: 1.5;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .setting-label {
      font-size: 28rpx;
      font-weight: 500;
      color: #1a2332;
    }

    .setting-desc {
      font-size: 22rpx;
      color: #94a3b8;
      line-height: 1.4;
    }
  }
}

.empty-text {
  font-size: 26rpx;
  color: #b0b0b0;
  text-align: center;
  padding: 60rpx 0;
}

// ============================================================
// 对话记录
// ============================================================
.history-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
  box-sizing: content-box;

  .history-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1a1a1a;
  }
}

.history-body {
  flex: 1;
  min-height: 0;
  padding: 12rpx 20rpx;
  box-sizing: border-box;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 18rpx 10rpx;
  border-bottom: 1rpx solid #f5f6f8;

  &:active {
    background: #f5f7fa;
  }

  .history-index {
    font-size: 22rpx;
    color: #b0b0b0;
    font-weight: 500;
    flex-shrink: 0;
  }

  .history-text {
    flex: 1;
    font-size: 26rpx;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-time {
    font-size: 20rpx;
    color: #c0c4cc;
    flex-shrink: 0;
  }
}

// ============================================================
// 管理面板
// ============================================================
.manage-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.manage-header {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  padding-bottom: 16rpx;
  background: #ffffff;
  flex-shrink: 0;
  box-sizing: content-box;

  .manage-header-left {
    width: 80rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .manage-header-title {
    flex: 1;
    text-align: center;
    font-size: 32rpx;
    font-weight: 600;
    color: #1a1a1a;
  }

  .manage-header-right {
    width: 80rpx;
  }
}

.manage-body {
  flex: 1;
  min-height: 0;
  padding: 20rpx 24rpx 40rpx;
  box-sizing: border-box;
}

.manage-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

    .card-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #1a2332;
    }
  }
}

.status-grid {
  display: flex;
  flex-direction: column;

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14rpx 0;
    border-bottom: 1rpx solid #f5f7fa;

    .s-label {
      font-size: 26rpx;
      color: #8a94a6;
    }

    .s-value {
      font-size: 26rpx;
      color: #1a2332;
      font-weight: 500;
    }

    .s-value-on {
      color: #52c41a;
    }
  }
}

.status-error {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #dd524d;
  line-height: 1.5;
}

.list-hint {
  font-size: 26rpx;
  color: #b0b0b0;
  text-align: center;
  padding: 40rpx 0;
}

.unanswered-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f7fa;

  .un-item-main {
    flex: 1;
    min-width: 0;

    .un-question {
      display: block;
      font-size: 26rpx;
      color: #1a2332;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .un-meta {
      display: flex;
      gap: 14rpx;
      margin-top: 8rpx;
      font-size: 22rpx;
      color: #c0c4cc;
      flex-wrap: wrap;

      .un-status {
        color: #fa8c16;
      }

      .st-1 { color: #52c41a; }
      .st-2 { color: #b0b0b0; }
    }
  }
}

// ============================================================
// 别名管理
// ============================================================
.alias-sheet {
  padding: 24rpx 28rpx 40rpx;
  box-sizing: border-box;
}

.sheet-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .sheet-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1a1a1a;
  }

  .sheet-sub {
    flex: 1;
    font-size: 24rpx;
    color: #999999;
  }
}

.sheet-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 0;
  font-size: 24rpx;
  color: #666666;

  .strong {
    color: #1a1a1a;
    font-weight: 600;
  }

  .sheet-problem {
    font-size: 22rpx;
    color: #b0b0b0;
    max-width: 320rpx;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.sheet-add {
  background: #f7f9fc;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;

  .add-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 26rpx;
    font-weight: 500;
    color: #1a1a1a;
  }

  .add-input-wrap {
    margin-top: 14rpx;

    .alias-textarea {
      width: 100%;
      box-sizing: border-box;
      min-height: 100rpx;
      background: #ffffff;
      border-radius: 10rpx;
      padding: 14rpx 16rpx;
      font-size: 26rpx;
      line-height: 1.5;
    }

    .add-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12rpx;
      margin-top: 14rpx;
    }
  }
}

.sheet-list {
  max-height: 440rpx;
  margin-top: 16rpx;
  box-sizing: border-box;
}

.alias-item {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 14rpx 6rpx;
  border-bottom: 1rpx solid #f5f5f5;

  .alias-item-main {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12rpx;

    .alias-item-text {
      font-size: 26rpx;
      color: #1a1a1a;
      word-break: break-all;
      line-height: 1.4;
      flex: 1;
      min-width: 0;
    }
  }

  .alias-item-time {
    font-size: 20rpx;
    color: #c0c4cc;
    flex-shrink: 0;
  }

  .alias-item-del {
    flex-shrink: 0;
    padding: 4rpx;
  }
}

/* 暗黑模式适配 */
.wot-theme-dark {
  /* 输入区 */
  .input-row {
    background: #1f1f1f !important;
    border-color: rgba(255,255,255,0.12) !important;
  }
  .chat-textarea { color: #e5e7eb !important; }
  .input-tip { color: #6A7590 !important; }

  /* 对话记录弹层 */
  .history-page { background: #1b1b1b; }
  .history-header {
    background: #1b1b1b !important;
    border-bottom-color: rgba(255,255,255,0.08) !important;
    .history-title { color: #e8e8e8 !important; }
    :deep(.wd-icon) { color: #8a9099 !important; }
  }
  .history-body { background: #1b1b1b; }
  .history-item {
    border-bottom-color: rgba(255,255,255,0.08) !important;
    &:active { background: rgba(255,255,255,0.06) !important; }
    .history-index { color: #6A7590 !important; }
    .history-text { color: #e8e8e8 !important; }
    .history-time { color: #6A7590 !important; }
  }
  .empty-text { color: #6A7590 !important; }

  /* 设置弹层 */
  .form-title { color: #e8e8e8 !important; }
  .setting-item .setting-label { color: #e8e8e8 !important; }
  .setting-item .setting-desc { color: #6A7590 !important; }

  /* 管理弹层 */
  .manage-page { background: #1a1a1a; }
  .manage-header {
    background: #1b1b1b !important;
    .manage-header-title { color: #e8e8e8 !important; }
    .manage-header-left :deep(.wd-icon) { color: #e8e8e8 !important; }
  }
  .manage-body { background: #1a1a1a !important; }
  .manage-card {
    background: #242424 !important;
    .card-title { color: #e8e8e8 !important; }
  }
  .status-grid .status-item {
    border-bottom-color: rgba(255,255,255,0.08) !important;
    .s-label { color: #8a9099 !important; }
    .s-value { color: #e8e8e8 !important; }
  }
  .unanswered-item { border-bottom-color: rgba(255,255,255,0.08) !important; }
  .un-question { color: #e8e8e8 !important; }
  .list-hint { color: #6A7590 !important; }

  /* 评价反馈弹层 */
  .form-label { color: #8a9099 !important; }
  .form-input { background: #2a2a2a !important; border-color: rgba(255,255,255,0.12) !important; color: #e8e8e8 !important; }
  .form-textarea { background: #2a2a2a !important; border-color: rgba(255,255,255,0.12) !important; color: #e8e8e8 !important; }

  /* 别名管理弹层 */
  .alias-sheet { background: #1b1b1b; }
  .sheet-header {
    border-bottom-color: rgba(255,255,255,0.08) !important;
    .sheet-title { color: #e8e8e8 !important; }
    .sheet-sub { color: #6A7590 !important; }
    :deep(.wd-icon) { color: #8a9099 !important; }
  }
  .sheet-stats { color: #8a9099 !important; .strong { color: #e8e8e8 !important; } .sheet-problem { color: #6A7590 !important; } }
  .sheet-add { background: #242424 !important; color: #e8e8e8 !important; .add-header { color: #e8e8e8 !important; } }
  .alias-textarea { background: #1f1f1f !important; border-color: rgba(255,255,255,0.12) !important; color: #e8e8e8 !important; }
  .alias-item { border-bottom-color: rgba(255,255,255,0.08) !important; .alias-item-text { color: #e8e8e8 !important; } .alias-item-time { color: #6A7590 !important; } }
  .alias-item-main .alias-item-text { color: #e8e8e8 !important; }

  /* 澄清区域 */
  .clarification-area { background: rgba(24,144,255,0.12) !important; }
  .clarify-tip { color: #69b1ff !important; }
  .candidate-chip { background: #1f1f1f !important; border-color: rgba(24,144,255,0.3) !important; color: #69b1ff !important; }
  .clarify-input { background: #1f1f1f !important; border-color: rgba(255,255,255,0.12) !important; color: #e8e8e8 !important; }

  /* 标题版本徽章 */
  .title-version { background: #2a2a2a !important; color: #8a9099 !important; }

  /* header btn 背景暗化 */
  .header-btn { background: #2a2a2a !important; }

  /* 引用标签暗化 */
  .ref-tag { background: rgba(255,247,230,0.12) !important; border-color: rgba(255,231,186,0.2) !important; .ref-text { color: #e8c87d !important; } }

  /* 底部按钮暗化 */
  .feedback-btn { border-color: rgba(255,255,255,0.12) !important; }
  .feedback-btn.good { color: #52c41a !important; }
  .feedback-btn.bad { color: #ff6b6b !important; }
  .transfer-btn { color: #f59e0b !important; border-color: rgba(245,158,11,0.3) !important; }

  /* 回到底部按钮暗化 */
  .scroll-bottom-btn { background: #242424 !important; border-color: rgba(255,255,255,0.12) !important; }
}
</style>
