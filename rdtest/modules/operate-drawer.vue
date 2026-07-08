<script setup lang="ts">
import { $t } from '@/locales';
import { localStg } from '@/utils/storage';
import { NSelect, NInput, NInputNumber, NPopconfirm, NButton, NDatePicker, type UploadFileInfo, UploadCustomRequestOptions } from 'naive-ui';
import { h, computed, reactive, watch, ref, toRaw, nextTick } from 'vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { projectStatusRecord, projectStatusOptions } from '@/constants/business';
import { translateNumberOptions, getSystemDate } from '@/utils/common';
import { fetchAddRdTest, fetchUpdateRdTest, fetchRdDemandPage, fetchRdTaskPage,fetchRdTaskById } from '@/service/api';
import usePageData from '@/hooks/common/usePageData'
import { useAuthStore } from '@/store/modules/auth'
import { debounce } from 'lodash'
import { uploadFile } from '@/utils/upload'
import { rdprjPlanStatusOptions, rdprjPlanTypeOptions } from '@/constants/rdPrj'

defineOptions({
  name: 'OperateDrawer'
});

/**
 * 初始化------------------------------------------------------------------------------------------------------------------------------------------------
 */
interface Emits {
  (e: 'submitted'): void;
}
const emit = defineEmits<Emits>();

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData: any;
}
const authStore = useAuthStore()

const props = defineProps<Props>();
const model: any = ref(createDefaultModel());
function createDefaultModel(): any {
  return {
    pid: undefined,        // 任务id
    status: 0,              // 类型
    starttime: null,       // 计划开始时间 yyyy-MM-dd
    endtime: null,         // 计划结束时间 yyyy-MM-dd
    notes: '',            // 备注
    tcreater: authStore.userInfo.id,
  }
}

const time = ref<any>(null)
async function handleDateChange(value: [string, string] | null, timestampValue: [number, number]) {
  if (timestampValue) {
    model.value.starttime = String(getSystemDate(1, timestampValue[0]));
    model.value.endtime = String(getSystemDate(1, timestampValue[1]));
  } else {
    model.value.starttime = null
    model.value.endtime = null
  }
}





// 获取需求
const { pageData: demandList, getData: getDemandList, nextPage: nextPage1 } = usePageData(fetchRdDemandPage)
const handleDemandScroll = async (e: Event) => {
  const currentTarget = e.currentTarget as HTMLElement
  const scrollTop = currentTarget.scrollTop
  if (
    currentTarget.scrollTop + currentTarget.offsetHeight+5
    >= currentTarget.scrollHeight
  ) {
    if (demandList.data.length < demandList.total) {
      await nextPage1()
      await nextTick()
      setTimeout(() => {
        currentTarget.scrollTop = scrollTop // 恢复滚动位置
      })
    }
  }
}
// 需求选择框选择事件
const handleDemandChange = async (val: number) => {
  chosen2.value = true
  model.value.demandpid = val ?? null
  getTaskList()
}
const demand_search = debounce(async (value: string) => {
  await getDemandList({ fuzzy: value, page: 1, })
}, 300)
const typing2 = ref(false)
const chosen2 = ref(false)
const handleDemandSearch = (value: string) => {
  model.value.pid = null as any
  typing2.value = true
  chosen2.value = false
  if (!value) {
    handleDemandClear()
    return
  }
  demand_search(value)
}
const handleDemandBlur = async () => {
  if (typing2.value && !chosen2.value) {
    await getDemandList({ page: 1 })
    typing2.value = false
  }
}
const handleDemandClear = async () => {
  await getDemandList({ page: 1 })
}


// 获取研发任务
const { pageData: taskList, getData: getTaskData, nextPage: nextPage2 } = usePageData(fetchRdTaskPage)
const getTaskList = async () => {
  await getTaskData({ pid: model.value.demandpid, limit: 200 })
}
const handleTaskChange = (value: number) => {
  model.value.pid = value ?? null
}

async function handleInitModel() {
  await getDemandList({ page: 1 }) // 初始化需求列表

  Object.assign(model.value, createDefaultModel());
  showprogress.value = false
  fileList.value = [{
    name: '',
    url: '',
    file: undefined
  }, {
    name: '',
    url: '',
    file: undefined
  }, {
    name: '',
    url: '',
    file: undefined
  }, {
    name: '',
    url: '',
    file: undefined
  }]
  time.value = null
  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, props.rowData);
    time.value = [model.value.starttime, model.value.endtime]
    const { data, error } =await fetchRdTaskById(model.value.pid)
    if(!error){
      model.value.demandpid = (data as any).pid
      getTaskList()
    }
    fileList.value = []
    for (let i = 1; i <= 4; i++) {
      const url = (model as any).value[`re${i}`]
      fileList.value.push({
        url: url || '',
        status: url ? 'finished' : 'pending' // 没有url就是待上传
      })
    }
  }
}
const { formRef, validate, restoreValidation } = useNaiveForm();

const rules: any = {
  pid: {
    type: 'number',
    required: true,
    trigger: ['change'],
    message: '请选择任务'
  },

  status: {
    type: 'number',
    required: true,
    trigger: ['change'],
    message: '请选择测试状态'
  },
  starttime: {
    required: true,
    trigger: ['change'],
    message: '请选择计划开始时间'
  },

  endtime: {
    required: true,
    trigger: ['change'],
    validator: (_: any, value: string) => {
      if (!value) return new Error('请选择计划结束时间')
      if (model.starttime && value < model.starttime) {
        return new Error('结束时间不能早于开始时间')
      }
      return true
    }
  },

  githash: {
    trigger: ['blur'],
    validator: (_: any, value: string) => {
      if (!value) return true
      if (value.length > 64) {
        return new Error('git哈希长度不能超过64位')
      }
      return true
    }
  },
}

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: '新增测试',
    edit: '修改测试'
  };
  return titles[props.operateType];
});
const visible = defineModel<boolean>('visible', {
  default: false,
});
// 下载
async function handleDownload(url: string) {
  if (!url) return
  try {
    const response = await fetch(url?.split('?')[0], { mode: 'cors' }) // 尝试跨域拉取
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = url?.split('?')[1]
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error('下载失败:', err)
  }
}
watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    setTimeout(() => {
      const e = document.querySelector('.n-scrollbar-content')
      e?.scrollTo(0, 0)
    }, 300)
    restoreValidation();
  } else {

  }
});
const showprogress = ref(false)
const currentUploadIndex = ref<number>(0)
const fileList = ref<any>([{
  name: '',
  url: '',
  file: undefined
}, {
  name: '',
  url: '',
  file: undefined
}, {
  name: '',
  url: '',
  file: undefined
}, {
  name: '',
  url: '',
  file: undefined
}])
async function handleCustomRequestChage({ file }: UploadCustomRequestOptions, index: any) {
  fileList.value[index].file = file
  fileList.value[index].name = file.name
}
function closeDrawer() {
  visible.value = false;
};
async function beforeUpload(data: any) {
  // if (data.file.file.size > 100 * 1024 * 1024) {
  //   window.$message?.error('文件大小不能超过100M');
  //   return false
  // }
  return true
}
/**
 * 提交
 */
const submitBtnloading = ref(false);
async function handleSubmit() {
  if (submitBtnloading.value) return
  try {
    await validate();
    submitBtnloading.value = true;
    const uploadList = fileList.value.filter((item: any) => item.file)
    const total = uploadList.length
    if (total.length > 0) {
      showprogress.value = true
    }
    for (let index = 0; index < total; index++) {
      currentUploadIndex.value = index
      const item = uploadList[index]
      item.indexText = `${index + 1}/${total}`
      item.progress = 0
      item.status = 'uploading'

      try {
        item.url = await uploadFile(
          item.file.file,
          item.file.name,
          '',
          val => {
            item.progress = val
          }
        )
        item.progress = 100
        item.status = 'done'
      } catch {
        item.status = 'error'
      }
    }

    fileList.value.forEach((item: any, index: number) => {
      (model as any).value[`re${index + 1}`] = item.url || '';
      // (model as any).value[`fl${index + 1}`] = item.url || ''
    })
    if (props.operateType === 'edit') {
      const { data, error } = await fetchUpdateRdTest([model.value]);
      if (!error) {
        closeDrawer();
        emit('submitted');
        window.$message?.success('修改成功');
      }
    } else {
      const { data, error } = await fetchAddRdTest([{ ...model.value }]);
      if (!error) {
        closeDrawer();
        emit('submitted');
        window.$message?.success('添加成功');
      }
    }
  } catch (error) {

  } finally {
    submitBtnloading.value = false;
  }
}
</script>
<template>
  <NModal v-model:show="visible" :title="title" preset="card" class="w-45%" :mask-closable="false" :draggable="true">
    <NScrollbar class="pr-20px">
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="120">
        <NGrid responsive="screen" item-responsive>
          <NFormItemGi span="24 s:12 m:12" label="需求" path="demandpid">
            <NSelect filterable v-model:value="model.demandpid" placeholder="请选择需求" clearable label-field="dname"
              value-field="id" @scroll="handleDemandScroll" @blur="handleDemandBlur" @clear="handleDemandClear"
              :options="demandList.data" @search="handleDemandSearch" @update:value="handleDemandChange" :render-label="(option: any) => {
                return h('div', { style: 'display:flex;justify-content:space-between;width:100%', class: 'items-center' }, [
                  h('div', option.dname),
                  h('div', { style: 'color:#999;font-size:12px;margin-left:10px' }, option.rdname || '')
                ])
              }"></NSelect>
          </NFormItemGi>
          <NFormItemGi span="24 s:12 m:12" label="任务" path="pid" label-width="60">
            <NSelect filterable clearable v-model:value="model.pid" placeholder="请选择任务" label-field="tname"
              value-field="id" :options="taskList.data" @update:value="handleTaskChange"></NSelect>
          </NFormItemGi>
          <NFormItemGi span="24 m:24" label="开始结束时间" path="selectTime">
            <NDatePicker v-model:value="time" type="datetimerange" clearable class="w-100%"
              @update:formatted-value="handleDateChange" />
          </NFormItemGi>
          <NFormItemGi span="24 m:24" label="备注" path="notes">
            <NInput type="textarea" v-model:value="model.notes" placeholder="请输入" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="" path="notes" :show-feedback="false" v-for="(item, index) in fileList"
            :key='index'>
            <NGrid responsive="screen" item-responsive>
              <NFormItemGi span="24 m:24" :label="`附件${index as number + 1}`" path="notes">
                <span v-if="item.url?.split('?')[1] || item.file?.name" style="margin-left: 20px;">{{
                  item.url?.split('?')[1] || item.file.name }} <span class="cursor-pointer c-#c92a2a"
                    @click="item.url = ''; item.file = undefined; item.name = ''">删除</span>
                  <span v-if="item.url" class="cursor-pointer c-#1890ff  ml-5px inline-block"
                    @click="handleDownload(item.url)">下载</span>
                </span>
                <n-upload v-else style="width: auto;margin-left: 20px;" ref="uploadRef" action="#"
                  :custom-request="(options) => handleCustomRequestChage(options, index)" :show-file-list=false
                  @before-upload="beforeUpload">
                  <n-button size="small" ghost type="primary">{{ '选择文件' }}</n-button>
                </n-upload>
              </NFormItemGi>
            </NGrid>
          </NFormItemGi>
        </NGrid>
      </NForm>
      <div v-if="fileList[currentUploadIndex] && showprogress">
        <div style="display:flex; justify-content:space-between">
          <span>
            {{ fileList[currentUploadIndex].filename || fileList[currentUploadIndex].name }}
          </span>
          <span>
            {{ fileList[currentUploadIndex].indexText }}
          </span>
        </div>
        <n-progress :percentage="fileList[currentUploadIndex].progress"
          :status="fileList[currentUploadIndex].status === 'error' ? 'error' : 'success'" show-indicator />
      </div>
    </NScrollbar>
    <template #footer>
      <NSpace justify="end" :size="16">
        <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit" :loading="submitBtnloading">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style>
.amap-logo {
  display: none !important;
}

.amap-copyright {
  display: none !important;
}
</style>