<script setup lang="tsx">
import { $t } from '@/locales';
import { ref, reactive, onMounted, nextTick, h, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchRdTestPage, fetchDeleteRdTest, fetchRdFilePage, fetchAddRdFile, fetchDeleteRdFile, fetchUpdateRdTest } from '@/service/api';
import formSearch from './modules/form-search.vue';
import { NButton, NPopconfirm, NTag, NInput, NBadge, NTooltip,NEllipsis,NDatePicker, NSpace,NSelect } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import { useAuthStore } from '@/store/modules/auth';
import OperateDrawer from './modules/operate-drawer.vue';
import { useTable, useTableOperate } from '@/hooks/common/table';
import SvgIcon from '@/components/custom/svg-icon.vue'
import { uploadFile } from '@/utils/upload'
import lookDrawer from './modules/lookDrawer.vue';
import { sanitizeHtml } from '@/utils/htmlSanitizer'

const appStore = useAppStore()
const authStore = useAuthStore()
// 路由
const proid = ref(0)

const clcikName=ref('')
const clcikNameValue=ref('')
const { columns, columnChecks, data, getData, loading, pagination, mobilePagination, searchParams, resetSearchParams } = useTable({
  showTotal: true,
  immediate: false,
  apiFn: fetchRdTestPage,
  apiParams: {
    page: 1,
    pageSize: 20,
    limit: 20,
    pid: undefined,
    demandpid: undefined,
    fuzzy: '',
    _t: new Date().getTime(),
  },
  columns: () => [
    {
        title:()=>(
            <div class={'flex items-center justify-center'}>
              <div>测试计划名称</div>
              <SvgIcon local-icon={'edit'} 
                class="font-size-16px ml-5px" 
              />
            </div>
          ),
      key: 'tname',
      width: 150,
      align: 'center',
      render(row: any) {
        if(row.setStatus){
          return <NInput v-model:value={row.tname} onUpdateValue={async (val: any) => {
            row.tname = val
          }}/>
        }else{
        if(row.setoneStatus&&clcikName.value=='tname'){
          return (
              <NInput
                value={row.tname}
                ref={(el: any) => {
                  if (el) {
                    nextTick(() => {
                      el.focus?.()
                    })
                  }
                }}
                onUpdateValue={(val: string) => {
                  row.tname = val
                }}
                onBlur={() => {
                  handleOneEditParams(row, 'tname')

                }}
                onKeydown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    handleOneEditParams(row, 'tname')
                  }
                }}
              />
            )
        }else{
        return (
      <div
        onClick={() => {
          if(row?.tcreater==authStore.userInfo.id){
            row.setoneStatus = true
            clcikName.value='tname'
            clcikNameValue.value=JSON.parse(JSON.stringify(row.tname))
          }
        }}
      >
        <NEllipsis
          style={{ maxWidth: '180px' }}
        >
          {{
            default: () => row.tname || '',
            tooltip: () => (
              <div
                style={{
                  textAlign: 'center',
                  padding: '8px',
                  maxWidth: '400px'
                }}
              >
                {row.tname || ''}
              </div>
            )
          }}
        </NEllipsis>
      </div>
    )
        }
        }
      }
    },
    {
  key: 'status',
  title: () => (
    <div class={'flex items-center justify-center'}>
      <div>测试状态</div>
      <SvgIcon
        local-icon={'edit'}
        class="font-size-16px ml-5px"
      />
    </div>
  ),
  width: 100,
  align: 'center',

  render: (row: any) => {
    const statusOptions = [
      {
        label: '待测试',
        value: 0
      },
      {
        label: '测试中',
        value: 1
      },
      {
        label: '未通过',
        value: 3
      },
      {
        label: '通过',
        value: 4
      }
    ]

    const textMap: any = {
      0: '待测试',
      1: '测试中',
      3: '未通过',
      4: '通过'
    }

    const typeMap: any = {
      0: 'default',
      1: 'info',
      3: 'error',
      4: 'success'
    }

    // 全部编辑
    if (row.setStatus) {
      return (
        <NSelect
          value={row.status}
          options={statusOptions}
          disabled={!row?.id}
          onUpdateValue={(val: any) => {
            row.status = val
          }}
        />
      )
    }

    // 单元格编辑
    if (
      row.setoneStatus &&
      clcikName.value === 'status'
    ) {
      return (
        <NSelect
          value={row.status}
          options={statusOptions}
          ref={(el: any) => {
            if (el) {
              nextTick(() => {
                el.focus?.()
              })
            }
          }}
          onUpdateValue={(val: any) => {
            row.status = val
            {/* handleOneEditParams(
              row,
              'status'
            ) */}
          }}
          onBlur={() => {
            handleOneEditParams(
              row,
              'status'
            )
          }}
        />
      )
    }
    return h(
            NTag,
            {
              type: typeMap[row.status],
              round: true,
              style: {
                cursor: 'pointer'
              },
              onClick: () => {
                if(row?.tcreater==authStore.userInfo.id){
                  row.setoneStatus = true
                  clcikName.value='status'
                  clcikNameValue.value=JSON.parse(JSON.stringify(row.status))
                }
              }
            },
            () => textMap[row.status]
          )
  }
},
    {
      // title: '测试描述',
        title:()=>(
            <div class={'flex items-center justify-center'}>
              <div>测试描述</div>
              <SvgIcon local-icon={'edit'} 
                class="font-size-16px ml-5px" 
              />
            </div>
          ),
      key: 'notes',
      width: 180,
      align: 'center',
      render: (row: any, index: number) => {
        return (
          <div class="flex items-center justify-center">
            <NTooltip
              trigger="hover"
              placement="top"
              style={{
                maxWidth: '500px'
              }}
            >
              {{
                trigger: () => (
                  <div
                    class="text-left"
                    style={{
                      display: '-webkit-box',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      WebkitBoxOrient: 'vertical',
                      height: '40px',
                      WebkitLineClamp: 2
                    }}
                    v-html={sanitizeHtml(row.notes) || ''}
                  />
                ),
                default: () => (
                  <div
                    style={{
                      maxWidth: '500px',
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}
                    v-html={sanitizeHtml(row.notes) || ''}
                  />
                )
              }}
            </NTooltip>

            { row?.tcreater==authStore.userInfo.id&&<div
              onClick={() => handleSetpnotes(row, index)}
            >
              <SvgIcon
                local-icon="edit"
                class="font-size-20px ml-5px"
                style={{
                  cursor: 'pointer',
                  color: '#1890ff'
                }}
              />
            </div>}
          </div>
        )
      }
    },
    {
  // title: '开始时间',
  key: 'starttime',
  width: 220,
  align: 'center',
title:()=>(
            <div class={'flex items-center justify-center'}>
              <div>开始时间</div>
              <SvgIcon local-icon={'edit'} 
                class="font-size-16px ml-5px" 
              />
            </div>
          ),
  render(row: any) {
    if (row.setStatus) {
      return (
        <NDatePicker
          type="datetime"
          clearable
          valueFormat="yyyy-MM-dd HH:mm:ss"
          formattedValue={row.starttime}
          onUpdateFormattedValue={(val: string) => {
            row.starttime = val
          }}
        />
      )
    }

    if (
      row.setoneStatus &&
      clcikName.value === 'starttime'
    ) {
      return (
        <NDatePicker
          type="datetime"
          valueFormat="yyyy-MM-dd HH:mm:ss"
          formattedValue={row.starttime}
          onUpdateFormattedValue={(val: any) => {
            row.starttime = val
          }}
          ref={(el: any) => {
                  if (el) {
                    nextTick(() => {
                      el.focus?.()
                    })
                  }
                }}
          onBlur={() => {
            handleOneEditParams(
              row,
              'starttime'
            )
          }}
        />
      )
    }

    return (
      <div
        onClick={() => {
          if(row?.tcreater==authStore.userInfo.id){
            row.setoneStatus = true
            clcikName.value = 'starttime'
            clcikNameValue.value =row.starttime
          }
        }}
      >
        {row.starttime || '-'}
      </div>
    )
  }
},
    {
  // title: '结束时间',
  key: 'endtime',
  width: 200,
  align: 'center',
title:()=>(
            <div class={'flex items-center justify-center'}>
              <div>结束时间</div>
              <SvgIcon local-icon={'edit'} 
                class="font-size-16px ml-5px" 
              />
            </div>
          ),
  render(row: any) {
    if (row.setStatus) {
      return (
        <NDatePicker
          type="datetime"
          valueFormat="yyyy-MM-dd HH:mm:ss"
          formattedValue={row.endtime}
          is-date-disabled={(ts:any) => {
            if (!row.starttime) return false
            return (
              ts <
              new Date(
                row.starttime
              ).getTime()
            )
          }}
          onUpdateFormattedValue={(val: any) => {
            row.endtime = val
          }}
        />
      )
    }

    if (
      row.setoneStatus &&
      clcikName.value === 'endtime'
    ) {
      return (
        <NDatePicker
          type="datetime"
          valueFormat="yyyy-MM-dd HH:mm:ss"
          formattedValue={row.endtime}
          ref={(el: any) => {
                  if (el) {
                    nextTick(() => {
                      el.focus?.()
                    })
                  }
                }}
          is-date-disabled={(ts:any) => {
            if (!row.starttime) return false

            return (
              ts <
              new Date(
                row.starttime
              ).getTime()
            )
          }}
          onUpdateFormattedValue={(val: any) => {
            row.endtime = val
          }}
          onBlur={() => {

            // 校验结束时间
            if (
              row.starttime &&
              row.endtime &&
              new Date(
                row.endtime
              ).getTime() <
                new Date(
                  row.starttime
                ).getTime()
            ) {
              window.$message?.warning(
                '结束时间不能早于开始时间'
              )

              row.endtime =
                clcikNameValue.value

              return
            }

            handleOneEditParams(
              row,
              'endtime'
            )
          }}
        />
      )
    }

    return (
      <div
        onClick={() => {
          if(row?.tcreater==authStore.userInfo.id){
            row.setoneStatus = true
            clcikName.value = 'endtime'
            clcikNameValue.value = row.endtime
          }
        }}
      >
        {row.endtime || '-'}
      </div>
    )
  }
},
      {
      key: 're1',
      // title: '文件',
      align: 'center',
      width: 120,
      title:()=>(
            <div class={'flex items-center justify-center'}>
              <div>文件</div>
              <SvgIcon local-icon={'edit'} 
                class="font-size-16px ml-5px" 
              />
            </div>
          ),
      render: (row: any,index:number) => {
        if(row.setStatus|| row?.tcreater==authStore.userInfo.id){
          return  <NBadge
          value={
  (row.rdFilePojoList?.length ?? 0) === 0
    ? (row.filenum ?? null)
    : row.rdFilePojoList.length
}
            max={9}
          >
            <NButton
              text
              type="primary"
              style={{
              color:
  (
    (row.rdFilePojoList?.length ?? 0) > 0
      ? row.rdFilePojoList.length
      : (row.filenum ?? 0)
  ) > 0
    ? '#ff8c00'
    : '#999'
              }}
              onClick={() => {
                handleUploadFiles(row,index)
              }}
            >
              <SvgIcon
                local-icon="files"
                class="font-size-30px ml-5px"
              />
            </NButton>
          </NBadge>
        }
        return (
          <NBadge
            value={row.filenum ? row.filenum : null as any}
            max={9}
          >
            <NButton
              text
              type="primary"
              style={{
                color: row.filenum > 0 ? '#ff8c00' : '#999',
              }}
              onClick={() => {
                handleRowClick(row)
              }}
            >
              <SvgIcon
                local-icon="files"
                class="font-size-30px ml-5px"
              />
            </NButton>
          </NBadge>
        )
      }
    },
    // {
    //   title: '测试员',
    //   key: 'tusername',
    //   width: 150,
    //   align: 'center'
    // },
    {
      title: '测试员',
      key: 'username',
      width: 150,
      align: 'center'
    },
    {
      title: '创建时间',
      key: 'dbtime',
      width: 150,
      align: 'center'
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 180,
      fixed: 'right',
      render: (row: any) => (
        <div class="flex-center gap-8px">
          <NTooltip trigger="hover">
            {{
              trigger: () => (
                <div onClick={() => handleRowClick(row)} v-no-auth="rd:test:select">
                  <SvgIcon local-icon="xiangqing" class={'c-#1890ff font-size-24px cursor-pointer'} />
                </div>
              ),
              default: () => '详情',
            }}
          </NTooltip>
          {/* {row.status == 0 && authStore.userInfo.id == row.tcreater && <NButton type="primary" ghost size="small" onClick={() => startTest(row)} v-no-auth="rd:test:update">
            开始测试
          </NButton>}
          {row.status == 1 && authStore.userInfo.id == row.tcreater && <NButton type="primary" ghost size="small" onClick={() => endTest(row, 4)} v-no-auth="rd:test:update">
            通过测试
          </NButton>}
          {row.status == 1 && authStore.userInfo.id == row.tcreater && <NButton type="primary" ghost size="small" onClick={() => endTest(row, 3)} v-no-auth="rd:test:update">
            未通过测试
          </NButton>}

          <NButton type="primary" ghost size="small" onClick={() => edit(row.id)} v-no-auth="rd:test:update">
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" ghost size="small" v-no-auth="rd:test:delete">
                  {$t('common.delete')}
                </NButton>
              ),
            }}
          </NPopconfirm> */}
        </div>
      )
    }
  ] as any
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted, closeDrawer } = useTableOperate(data as any, getData);
const submitBtnloading = ref(false)
const handleDelete = async (id: number) => {
  const { data, error } = await fetchDeleteRdTest(id as any)
  if (!error) {
    getData()
    window.$message?.success('删除成功')
  }
}



// 修改单个字段
const handleOneEditParams =async (row:any,label:string)=>{
  if(label=='starttime'&& new Date(row.starttime).getTime() > new Date(row.endtime).getTime()){
    window.$message?.error('开始时间不能大于结束时间')
    row[label] = clcikNameValue.value
    row.setoneStatus = false
    return
  }
  if(label=='endtime'&& new Date(row.starttime).getTime() > new Date(row.endtime).getTime()){
    window.$message?.error('结束时间不能小于开始时间')
    row[label] = clcikNameValue.value
    row.setoneStatus = false
    return
  }
  if(row[label]==clcikNameValue.value) return row.setoneStatus = false
  const { data, error } = await fetchUpdateRdTest([{
    id: row.id,
    [label]: row[label],
    pid:row.pid,
  }])
  if (!error) {
    window.$message?.success('修改成功')
    row.setoneStatus = false
  }else{
    row[label] = clcikNameValue.value
    row.setoneStatus = false
  }
}


// 设置规划描述
const pnotesVisiable = ref(false)
const rowpnotesObj = ref()
const rowIndex = ref()
const handleSetpnotes = async (row: any,index:number) => {
  pnotesVisiable.value = true
  rowIndex.value = index
  rowpnotesObj.value = JSON.parse(JSON.stringify(row))
}
const handleSavePnotes = async () => {
  if(rowpnotesObj.value.id&&!rowpnotesObj.value.setStatus){
    const { data, error } = await fetchUpdateRdTest([{
      id: rowpnotesObj.value.id,
      notes: rowpnotesObj.value.notes,
      pid: rowpnotesObj.value.pid,
    }])
    if (!error) {
      pnotesVisiable.value = false
      search()
      window.$message?.success('保存成功')
    }
  }else{
    console.log(rowpnotesObj.value.notes);
    (data.value[rowIndex.value]as any).notes = rowpnotesObj.value.notes
    pnotesVisiable.value = false
  }
}




// 文件
const uploadFilesVisiable =  ref(false)
const activeIndex = ref(0)
const activeRow = ref()
const handleUploadFiles = async (row:any,index: number) => {
  uploadFilesVisiable.value = true
  activeIndex.value = index
  activeRow.value = row
  // if(row.filenum>0){
  if(row.id){
    await getFileList(row)
    console.log(row);
    // fileList.value = row.oldFileList
    return
  }
  fileList.value = (data.value[index] as any).rdFilePojoList || []
}
const fileList = ref([])
const handleSaveFiles = async () => {
  if(activeRow.value.id){
    // 编辑文件
    console.log(fileList.value);
    console.log(activeRow.value.oldFileList);
    // 先上传文件
    const uploadList:any = fileList.value.filter(
        (item: any) => item.file && !item.furl
      )

      for (const fileItem of uploadList) {
        try {
          fileItem.furl = await uploadFile(
            fileItem.file.file,
            fileItem.name || fileItem.file.name,
            '',
            (val: number) => {
              fileItem.progress = val
            }
          )
        } catch (e) {
          console.error('上传失败', e)
          throw e
        }
      }
       // 添加文件
      if (uploadList.length > 0) {
        const { data: data1, error: error1 } = await fetchAddRdFile(uploadList.map((item: any) => {
          return {
            furl: item.furl,
            fname: item.fname,
            pid: activeRow.value.id,
            proid: searchParams.proid,
            ftype: 3
          }
        }))
        if (!error1) {}
      }
      const deletedIds = activeRow.value?.oldFileList
        .filter(
          (oldItem: any) =>
            !fileList.value.some(
              (newItem: any) =>
                newItem.id === oldItem.id
            )
        )
        .map((item: any) => item.id)
        // 删除文件
      if (deletedIds?.length > 0) {
        const { data: data2, error: error2 } = await fetchDeleteRdFile(deletedIds.join(','))
        if (!error2) {}
      }
      window.$message?.success('保存成功')
      // getFileList(activeRow.value)
      uploadFilesVisiable.value = false
      search()
  }else{
    (data.value[activeIndex.value] as any).rdFilePojoList = fileList.value
    uploadFilesVisiable.value = false
  }
}

// 获取文件列表
const getFileList = async (row: any) => {
  const { data, error } = await fetchRdFilePage({ proid:searchParams.proid, pid: row.id, page: 1, limit: 100, ftype: 3 })// proid: model.pid,
  if (error) return
  fileList.value = (data as any).list.map((item: any) => {
    return {
      id: item.id,
      url: item.furl,
      fname: item.fname,
      name: item.furl.split('?')[1],
      status: 'finished'
    }
  })
  row.oldFileList = JSON.parse(JSON.stringify(fileList.value))
}


onMounted(async () => {
  await getData()
})
// 开始测试
const startTest = async (row: any) => {
  const { data, error } = await fetchUpdateRdTest([{ id: row.id, pid: row.pid, status: 1 }])
  if (!error) {
    getData()
    window.$message?.success('开始测试')
  }
}
// 测试结束
const endTest = async (row: any, status: number) => {
  const { data, error } = await fetchUpdateRdTest([{ id: row.id, pid: row.pid, status }])
  if (!error) {
    getData()
    window.$message?.success('设置成功')
  }
}
// 编辑
function edit(id: number) {
  handleEdit(id);
}
const search = () => {
  getData()
}


/**
 * 查看
 */
const lookVisiable = ref(false)
const lookData = ref()
const handleRowClick = (row: any) => {
  lookVisiable.value = true
  lookData.value = row
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <formSearch v-model:model="searchParams" @search="search" v-model:proid="proid"
      @clear-data="data = []; pagination.itemCount = 0" />
    <NCard :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header>
        <n-space justify="space-between">
          <div>测试列表</div>
          <!-- <NButton type="info" size="small" ghost @click="handleAdd" v-no-auth="'rd:test:insert'"  class="ml-20px">添加测试</NButton> -->
        </n-space>
      </template>
      <NDataTable v-model:checked-row-keys="checkedRowKeys" :columns="columns" :data="data" size="small"
        :flex-height="!appStore.isMobile" :loading="loading" remote :row-key="(row: any) => row.id"
        :scroll-x="columns.reduce((sum: any, col) => sum + (col?.width || 100), 0)" :pagination="mobilePagination"
        class="sm:h-full" />
    </NCard>
    <OperateDrawer v-model:visible="drawerVisible" @submitted="getData" :pid="searchParams.pid"
      :operate-type="operateType" :row-data="editingData">
    </OperateDrawer>
      <NModal v-model:show="uploadFilesVisiable" title="文件列表" preset="card" class="w-700px">
      <uploadList v-model:fileList="fileList" :max-size="50" />
      <template #footer>
        <NSpace justify="end" :size="16">
          <NButton type="default" @click="uploadFilesVisiable = false;">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSaveFiles">{{
            $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>
    <NModal v-model:show="pnotesVisiable" title="测试描述" preset="card" class="w-880px">
      <WangEditor v-model:model-value="rowpnotesObj.notes" style="height: 360px;" />
      <template #footer>
        <NSpace justify="end" :size="16">
          <NButton type="default" @click="pnotesVisiable = false;">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSavePnotes">{{
            $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>
    <lookDrawer v-model:visible="lookVisiable" :data="lookData" :proid="searchParams.proid" />
  </div>
</template>

<style scoped></style>
