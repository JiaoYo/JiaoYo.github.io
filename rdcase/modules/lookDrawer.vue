<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { NDescriptions, NDescriptionsItem, NTag, NSpace, NModal, NScrollbar, NEmpty, NTimeline, NTimelineItem } from 'naive-ui';
import { fetchRdFilePage } from '@/service/api';
import { sanitizeHtml } from '@/utils/htmlSanitizer';

export interface Props {
  visible: boolean;
  data?: any;
  proid?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const visible = computed({
  get() {
    return props.visible;
  },
  set(val) {
    emit('update:visible', val);
  }
});

const caseData = ref<any>({});
const fileList = ref<any[]>([]);

const caseStatusMap: any = { 0: '未执行', 1: '通过', 2: '失败', 3: '阻塞', 4: '跳过' };
const caseStatusTypeMap: any = { 0: 'default', 1: 'success', 2: 'error', 3: 'warning', 4: 'info' };
const caseTypeMap: any = { 0: '功能测试', 1: '性能测试', 2: '安全测试', 3: '兼容性测试', 4: '接口测试' };

// 获取文件列表
const getFileList = async () => {
  if (!props.data?.id || !props.proid) return;
  const { data, error } = await fetchRdFilePage({ proid: props.proid, pid: props.data.id, page: 1, limit: 100, ftype: 3 });
  if (error) return;
  fileList.value = (data as any).list.map((item: any) => {
    return {
      id: item.id,
      url: item.furl,
      fname: item.fname,
      name: item.fname,
      status: 'finished'
    };
  });
};

watch(
  () => props?.visible,
  async (val) => {
    if (val) {
      caseData.value = props.data || {};
      await getFileList();
    }
  }
);
</script>

<template>
  <NModal v-model:show="visible" title="用例详情" preset="card" class="w-700px">
    <NScrollbar style="max-height: 70vh">
      <div class="p-4">
        <!-- 基础信息 -->
        <div class="section mb-4">
          <div class="section-title mb-3 font-weight-bold">基础信息</div>
          <NDescriptions bordered label-placement="left" :column="2">
            <NDescriptionsItem label="用例编号">
              {{ caseData.caseno || `CASE-${String(caseData.id).padStart(6, '0')}` }}
            </NDescriptionsItem>
            <NDescriptionsItem label="用例标题">
              {{ caseData.title }}
            </NDescriptionsItem>
            <NDescriptionsItem label="用例类型">
              <NTag type="info" round size="small">{{ caseTypeMap[caseData.casetype] }}</NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="执行状态">
              <NTag :type="caseStatusTypeMap[caseData.status]" round>{{ caseStatusMap[caseData.status] }}</NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="创建人">
              {{ caseData.username }}
            </NDescriptionsItem>
            <NDescriptionsItem label="创建时间">
              {{ caseData.dbtime }}
            </NDescriptionsItem>
          </NDescriptions>
        </div>

        <!-- 前置条件 -->
        <div class="section mb-4">
          <div class="section-title mb-3 font-weight-bold">前置条件</div>
          <div class="rich-content" v-html="sanitizeHtml(caseData.precondition) || '<span>暂无</span>'" />
        </div>

        <!-- 测试步骤 -->
        <div class="section mb-4">
          <div class="section-title mb-3 font-weight-bold">测试步骤</div>
          <div class="rich-content" v-html="sanitizeHtml(caseData.steps) || '<span>暂无</span>'" />
        </div>

        <!-- 预期结果 -->
        <div class="section mb-4">
          <div class="section-title mb-3 font-weight-bold">预期结果</div>
          <div class="rich-content" v-html="sanitizeHtml(caseData.expected) || '<span>暂无</span>'" />
        </div>

        <!-- 实际结果 -->
        <div class="section mb-4">
          <div class="section-title mb-3 font-weight-bold">实际结果</div>
          <div class="rich-content" v-html="sanitizeHtml(caseData.actual) || '<span>暂无</span>'" />
        </div>

        <!-- 附件列表 -->
        <div class="section mb-4">
          <div class="section-title mb-3 font-weight-bold">附件列表</div>
          <lookFileList v-if="fileList.length" :files="fileList" />
          <NEmpty v-else size="small" description="暂无附件" />
        </div>

        <!-- 流程记录 -->
        <div class="section">
          <div class="section-title mb-3 font-weight-bold">流程记录</div>
          <NTimeline size="large">
            <NTimelineItem type="success">
              <template #header>
                创建用例
              </template>
              <template #default>
                {{ caseData.username || '--' }} 创建用例
              </template>
              <template #footer>
                {{ caseData.dbtime || '--' }}
              </template>
            </NTimelineItem>
            <NTimelineItem v-if="caseData.status === 1" type="success">
              <template #header>
                执行通过
              </template>
            </NTimelineItem>
            <NTimelineItem v-if="caseData.status === 2" type="error">
              <template #header>
                执行失败
              </template>
            </NTimelineItem>
            <NTimelineItem v-if="caseData.status === 3" type="warning">
              <template #header>
                执行阻塞
              </template>
            </NTimelineItem>
            <NTimelineItem v-if="caseData.status === 4" type="info">
              <template #header>
                跳过执行
              </template>
            </NTimelineItem>
          </NTimeline>
        </div>
      </div>
    </NScrollbar>
    <template #footer>
      <NSpace justify="end">
        <NButton type="default" @click="visible = false">关闭</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.section {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eef2f7;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.rich-content {
  padding: 12px;
  background: #f8fafc;
  border-radius: 4px;
  min-height: 60px;
}

:deep(.n-timeline-item-content__header) {
  font-size: 14px;
  font-weight: 600;
}

:deep(.n-timeline-item-content__description),
:deep(.n-timeline-item-content__footer) {
  font-size: 13px;
}
</style>
