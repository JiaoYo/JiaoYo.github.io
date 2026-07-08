<template>
  <NDrawer
    v-model:show="show"
    :width="500"
    placement="right"
    :trap-focus="false"
    display-directive="show"
  >
    <NDrawerContent
      closable
      body-content-style="padding:0;"
      title="测试详情"
    >
      <!-- 顶部 -->
      <div class="header">
        <div class="title">
          {{ data?.tname || '--' }}
        </div>

        <div class="header-meta">
          <div class="meta-item">
            <icon-mdi-account-outline class="icon" />
            <span>{{ data?.username || '--' }}</span>
          </div>

          <div class="meta-item">
            <icon-mdi-clock-outline class="icon" />
            <span>{{ data?.dbtime || '--' }}</span>
          </div>
        </div>
      </div>

      <NScrollbar style="height: calc(100vh - 160px)">
        <div class="content">
          <!-- 基础信息 -->
          <div class="section">
            <div class="section-title">
              基础信息
            </div>

            <div class="info-grid">

              <div class="info-item">
                <span class="label">测试状态</span>
                <span class="value">
                  <NTag
                    size="small"
                    round
                    :bordered="false"
                    :type="data?.status==0 ? 'default' : data?.status==1 ? 'info' : data?.status==3 ? 'error' :data?.status==4?'success':'default'"
                  >
                    {{ data?.status ==0 ? '待测试' : data?.status==1 ? '测试中' :data?.status==3 ? '未通过' :data?.status==4 ? '通过' :'未知' }}
                  </NTag>
                </span>
              </div>
              <div class="info-item">
                <span class="label">开始时间</span>
                <span class="value">
                  {{ data?.starttime || '--' }}
                </span>
              </div>

              <div class="info-item">
                <span class="endtime">结束时间</span>
                <span class="value">
                  {{ data?.endtime || '--' }}
                </span>
              </div>
            </div>
          </div>
            <!-- 描述 -->
          <div class="section">
            <div class="section-title">
              测试描述
            </div>

            <div
              class="rich-content"
              @click="handleRichContentClick"
              v-html="sanitizeHtml(data?.notes) || '<span>暂无描述</span>'"
            />
          </div>
          <!-- 附件 -->
          <div class="section">
            <div class="section-title">
              附件列表
            </div>
            <lookFileList :files="fileList" v-if="fileList.length"/>
            <NEmpty
              v-else
              size="small"
              description="暂无附件"
            />
          </div>

          <!-- 流程 -->
          <div class="section">
            <div class="section-title">
              流程记录
            </div>

            <NTimeline size="large">
              <NTimelineItem type="success">
                <template #header>
                  创建测试用例
                </template>

                <template #default>
                  {{ data?.username || '--' }}
                </template>

                <template #footer>
                  {{ data?.dbtime || '--' }}
                </template>
              </NTimelineItem>

            </NTimeline>
          </div>
        </div>
      </NScrollbar>
    </NDrawerContent>
  </NDrawer>
    <img-preview v-model:show="previewVisible" :src="previewUrl" />
</template>

<script setup lang="ts">
import { fetchRdFilePage } from '@/service/api';
import { computed,ref, watch } from 'vue'
import { sanitizeHtml } from '@/utils/htmlSanitizer'

interface Props {
  visible: boolean
  data: any
  proid: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const show = computed({
  get() {
    return props.visible
  },
  set(val) {
    emit('update:visible', val)
  }
})

/**
 * 状态
 */
const statusTextMap: any = {
  0: '待确认',
  2: '待审核规划',
  3: '审核拒绝',
  4: '审核通过',
  5: '开发中',
  6: '待测试',
  7: '测试中',
  8: '已结项'
}

const statusTypeMap: any = {
  0: 'warning',
  2: 'info',
  3: 'error',
  4: 'success',
  5: 'primary',
  6: 'warning',
  7: 'info',
  8: 'success'
}
watch(() => props.visible, (val) => {
  if (val) {
    getFileList()
  }
})
// 获取文件列表
const fileList = ref<any[]>([])
const getFileList = async () => {
  const { data, error } = await fetchRdFilePage({ proid: props.proid, pid: props.data.id, page: 1, limit: 100, ftype: 3 })
  if (error) return
  fileList.value = (data as any).list.map((item: any) => {
    return {
      id: item.id,
      url: item.furl,
      fname: item.fname,
      name: item.fname,
      status: 'finished'
    }
  })
}

const previewVisible = ref(false)
const previewUrl = ref('')
const handleRichContentClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'IMG') {
    previewUrl.value = (target as HTMLImageElement).src
    previewVisible.value = true
  }
}
</script>

<style scoped lang="scss">
.header {
  padding: 18px 22px 16px;

  border-bottom: 1px solid #eef2f7;

  background: #fff;
}

.title {
  font-size: 20px;

  font-weight: 700;

  color: #0f172a;

  line-height: 1.5;
}

.header-meta {
  margin-top: 10px;

  display: flex;

  align-items: center;

  gap: 14px;

  flex-wrap: wrap;
}

.meta-item {
  display: flex;

  align-items: center;

  gap: 4px;

  font-size: 12px;

  color: #94a3b8;
}

.icon {
  font-size: 14px;
}

.content {
  padding: 18px;
}

.section {
  margin-bottom: 16px;

  background: #fff;

  border-radius: 12px;

  border: 1px solid #eef2f7;

  padding: 16px;
}

.section-title {
  font-size: 15px;

  font-weight: 600;

  color: #111827;

  margin-bottom: 16px;
}

.info-grid {
  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 14px 18px;
}

.info-item {
  display: flex;

  flex-direction: column;

  gap: 6px;

  min-width: 0;

  &.full {
    grid-column: 1 / -1;
  }
}

.label {
  font-size: 12px;

  color: #94a3b8;
}

.value {
  font-size: 14px;

  color: #0f172a;

  word-break: break-word;
}

:deep(.n-drawer-body-content-wrapper) {
  background: #f8fafc;
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