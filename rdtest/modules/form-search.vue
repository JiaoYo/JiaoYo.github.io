<script setup lang="ts">
import { $t } from '@/locales';
import { useNaiveForm } from '@/hooks/common/form';
import { ref,onMounted,nextTick,h,watch} from 'vue'
import usePageData from '@/hooks/common/usePageData'
import {useAuthStore} from '@/store/modules/auth'
import { fetchRdProjectPage, fetchRdTaskPage, fetchRdDemandPage} from '@/service/api'
import { debounce }  from 'lodash';
import { localStg } from '@/utils/storage';
import { rdprjTypeOptions,rdprjTaskStatusOptions,rdprjLevelOptions }from '@/constants/rdPrj'
import { useRouter } from 'vue-router';
defineOptions({
    name: 'FormSearch'
});

interface Emits {
    (e: 'reset'): void;
    (e: 'search'): void;
    (e: 'clearData'): void;
    (e: 'setProid', proid: number): void;
}
const emit = defineEmits<Emits>();

const { formRef, restoreValidation } = useNaiveForm();

const model = defineModel<any>('model', { required: true });
const authStore = useAuthStore()
const router = useRouter()

// 获取产品
const { pageData: rdprojectList, getData: getPrjList, nextPage: nextPage } = usePageData(fetchRdProjectPage)
const handlePrjScroll = async (e: Event) => {
  const currentTarget = e.currentTarget as HTMLElement
  const scrollTop = currentTarget.scrollTop
  if (
    currentTarget.scrollTop + currentTarget.offsetHeight+5
    >= currentTarget.scrollHeight
  ) {
    if (rdprojectList.data.length < rdprojectList.total) {
        await nextPage()
        await nextTick()
        setTimeout(()=>{
          currentTarget.scrollTop = scrollTop // 恢复滚动位置
        })
    }
  }
}
// 产品选择框选择事件
const handlePrjChange = async (pid:number) => {
  chosen1.value = true
  if (pid) {
    model.value.proid = pid
    await getDemandList({pid: model.value.proid,page:1})
    model.value.demandpid = demandList.data.length>0 ? demandList.data[0].id : null
    model.value.pid = null
    await getTaskList()
    if(taskList.data.length>0){
      model.value.pid = taskList.data[0]?.id??null
      emit('search')
    }else{
      emit('clearData')
    }
  }else{
    demandList.data = []
    taskList.data = []
    model.value.proid = null
    model.value.demandpid = null
    model.value.pid=null
    emit('clearData')
  }
  localStg.set('rdPrjInfo',{
    pid:pid,
    pname: rdprojectList.data.find((item:any) => item.id == pid)?.rdname
  })
}
const prj_search = debounce(async (value: string) => {
  await getPrjList({ fuzzy: value, page: 1})
}, 300)
const typing1 = ref(false)
const chosen1 = ref(false)
const handlePrjSearch = (value: string) => {
  model.value.proid = null as  any
  typing1.value = true
  chosen1.value = false
  if (!value) {
    handlePrjClear()
    return
  }
  prj_search(value)
}
const handlePrjBlur =async () => {
  if (typing1.value && !chosen1.value) {
    await getPrjList({page:1})
    typing1.value=false
  }
}
const handlePrjClear = async () => {
    await getPrjList({page:1})
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
        setTimeout(()=>{
          currentTarget.scrollTop = scrollTop // 恢复滚动位置
        })
    }
  }
}
// 需求选择框选择事件
const handleDemandChange = async (pid:number) => {
  chosen2.value = true
  model.value.demandpid = pid??null
  model.value.pid = null
  emit('setProid',demandList.data.find((item:any) => item.id === pid)?.pid??null)
  if (!model.value.demandpid) {
    taskList.data = []
    emit('clearData')
    return
  }
  await getTaskList()
  if(taskList.data.length>0){
    model.value.pid = taskList.data[0]?.id??null
    emit('search')
  }else{
    emit('clearData')
  }
}
const demand_search = debounce(async (value: string) => {
  await getDemandList({ fuzzy: value, page: 1,pid: model.value.proid})
}, 300)
const typing2 = ref(false)
const chosen2 = ref(false)
const handleDemandSearch = (value: string) => {
  model.value.pid = null as  any
  typing2.value = true
  chosen2.value = false
  if (!value) {
    handleDemandClear()
    return
  }
  demand_search(value)
}
const handleDemandBlur =async () => {
  if (typing2.value && !chosen2.value) {
    await getDemandList({page:1,pid: model.value.proid})
    typing2.value=false
  }
}
const handleDemandClear = async () => {
    await getDemandList({page:1,pid: model.value.proid})
}


// 获取研发任务
const { pageData: taskList, getData: getTaskData, nextPage: nextPage2 } = usePageData(fetchRdTaskPage)
const getTaskList = async () => {
  await getTaskData({ pid: model.value.demandpid,limit:200,proid: model.value.proid })
}
const handleTaskChange = (value: number) => {
  model.value.pid = value??null
  search()
}
const clearTaskchange = () => {
  model.value.pid = null
  emit('clearData');
}

const handlestatusChange = (value: number) => {
  model.value.status = value??null
  search()
}

// watch(() => router.currentRoute.value.query,async () => {
//   if(JSON.stringify(router.currentRoute.value.query)=='{}'){
//     return
//   }
//   await getDemandList({page:1})
//   if(router.currentRoute.value.query.demandpid&&router.currentRoute.value.query.proid){
//     model.value.demandpid = Number(router.currentRoute.value.query.demandpid) as any
//     emit('setProid',demandList.data.find((item:any) => item.id === model.value.demandpid )?.pid??null)
//   }else{
//     model.value.demandpid = demandList.data[0]?.id??null
//     emit('setProid',demandList.data[0]?.pid??null)
//   }
//   await getTaskList()
//   if(router.currentRoute.value.query.taskid){
//     model.value.pid = Number(router.currentRoute.value.query.taskid) as any
//   }else{
//     model.value.pid = taskList.data[0]?.id??null
//   }
//   if(model.value.pid){
//     emit('search');
//   }
// })
onMounted(async() => {
  // if(router.currentRoute.value.query.demandpid&&router.currentRoute.value.query.proid&&router.currentRoute.value.query.taskid){
  //   await getPrjList({page:1})
  //   model.value.proid = Number(router.currentRoute.value.query.proid) as any
  //   await getDemandList({page:1,pid: model.value.proid})
  //   model.value.demandpid = Number(router.currentRoute.value.query.demandpid) as any
  //   emit('setProid',demandList.data.find((item:any) => item.id === model.value.demandpid )?.pid??null)
  //   await getTaskList()
  //   model.value.pid = Number(router.currentRoute.value.query.taskid) as any
  // }else if(localStg.get('rdPrjInfo')!=undefined){
  //   await getPrjList({page:1,fuzzy: localStg.get('rdPrjInfo')?.pname??''})
  //   model.value.proid = localStg.get('rdPrjInfo')?.pid??null
  //   await getDemandList({page:1,pid: model.value.proid})
  //   model.value.demandpid = demandList.data[0]?.id??null
  //   emit('setProid',demandList.data[0]?.pid??null)
  //   await getTaskList()
  //   model.value.pid = taskList.data[0]?.id??null
  // }else{
    await getPrjList({page:1})
    // model.value.proid = rdprojectList.data[0]?.id??null
    // await getDemandList({page:1,pid: model.value.proid})
    // model.value.demandpid = demandList.data[0]?.id??null
    // emit('setProid',demandList.data[0]?.pid??null)
    // await getTaskList()
    // model.value.pid = taskList.data[0]?.id??null
  // }
  const query = router.currentRoute.value.query
  if (query.status!==undefined&&query.status!==null) {
    model.value.status = Number(query.status)
  }
  await router.replace({
    path: router.currentRoute.value.path,
    query: {}
  })
  emit('search');
})
async function search() {
  // if(model.value.pid){
    emit('search');
  // }else{
  //   window.$message?.warning('请选择任务后在查询')
  // }
}

const reset = () => {
  model.value.proid = null
  model.value.demandpid = null
  model.value.pid = null
  model.value.status = null
  emit('clearData');
  emit('search');
}
</script>

<template>
    <NCard :bordered="false" size="small" class="card-wrapper">
        <NForm ref="formRef" :model="model"  label-placement="left" :label-width="50" :show-feedback="false"
            @keyup.enter="search">
            <NGrid responsive="screen" item-responsive :x-gap="16" :y-gap="16">
                <NFormItemGi span="24 s:12 m:5" label="研发产品" path="proid" :label-width="80" > 
                    <NSelect  filterable clearable v-model:value="model.proid" placeholder="请选择产品"
                    label-field="rdname"  value-field="id" @scroll="handlePrjScroll" @blur="handlePrjBlur" @clear="handlePrjClear"
                    :options="rdprojectList.data"  @search="handlePrjSearch" @update:value="handlePrjChange"></NSelect>
                </NFormItemGi>
                <NFormItemGi span="24 s:12 m:5" label="需求" path="demandpid">
                    <NSelect  filterable v-model:value="model.demandpid" placeholder="请选择需求" clearable
                    label-field="dname"  value-field="id"  @scroll="handleDemandScroll" @blur="handleDemandBlur" @clear="handleDemandClear" 
                    :options="demandList.data"  @search="handleDemandSearch"  @update:value="handleDemandChange"></NSelect>
                </NFormItemGi>
                <NFormItemGi span="24 s:12 m:5" label="任务" path="pid" label-width="60">
                    <NSelect  filterable clearable v-model:value="model.pid" placeholder="请选择任务"
                    label-field="tname"  value-field="id" @clear="clearTaskchange"
                    :options="taskList.data" @update:value="handleTaskChange"></NSelect>
                </NFormItemGi>
                <NFormItemGi span="24 s:12 m:4" label="状态" path="status">
                  <NSelect  filterable clearable v-model:value="model.status" placeholder="请选择状态"
                  :options="[
                    {label:'待测试',value:0},
                    {label:'测试中',value:1},
                    {label:'未通过',value:3},
                    {label:'已通过',value:4},
                  ]"  @update:value="handlestatusChange"></NSelect>
                </NFormItemGi>
                <NFormItemGi span="24 s:12 m:4"  label="" label-width="60">
                    <NSpace class="w-full">
                        <NButton type="default" @click="reset">
                            <template #icon>
                                <icon-ic-round-refresh class="text-icon" />
                            </template>
                            {{ $t('common.reset') }}
                        </NButton>
                        <NButton type="primary" ghost @click="search">
                            <template #icon>
                                <icon-ic-round-search class="text-icon" />
                            </template>
                            {{ $t('common.search') }}
                        </NButton>
                    </NSpace>
                </NFormItemGi>
            </NGrid>
        </NForm>
    </NCard>
</template>

<style scoped></style>
