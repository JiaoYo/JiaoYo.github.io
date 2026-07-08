<script setup lang="tsx">
import { $t } from '@/locales';
import { ref, h, nextTick, onMounted } from 'vue'
import { fetchRdCasePage, fetchDeleteRdCase, fetchUpdateRdCase, fetchRdFilePage, fetchAddRdFile, fetchDeleteRdFile } from '@/service/api';
import { NButton, NPopconfirm, NTag, NInput, NTooltip, NSelect, NSpace, NEllipsis, NPopover, NBadge, NModal } from 'naive-ui';
import { useAuthStore } from '@/store/modules/auth';
import OperateDrawer from './modules/operate-drawer.vue';
import lookDrawer from './modules/lookDrawer.vue';
import { useTable, useTableOperate } from '@/hooks/common/table';
import SvgIcon from '@/components/custom/svg-icon.vue'
import { sanitizeHtml } from '@/utils/htmlSanitizer'
import { uploadFile } from '@/utils/upload'

const authStore = useAuthStore()
const props = defineProps({
  pid: { type: Number, default: 0 },
  ppid: { type: Number, default: 0 },
  proid: { type: Number, default: 0 },
  testid: { type: Number, default: 0 }
})
const emit = defineEmits(['caseData'])
const clcikName = ref('')
const clcikNameValue = ref('')

const caseStatusOptions = [
  { label: '未执行', value: 0 },
  { label: '通过', value: 1 },
  { label: '失败', value: 2 },
  { label: '阻塞', value: 3 },
  { label: '跳过', value: 4 }
]

const caseTypeOptions = [
  { label: '功能测试', value: 0 },
  { label: '性能测试', value: 1 },
  { label: '安全测试', value: 2 },
  { label: '兼容性测试', value: 3 },
  { label: '接口测试', value: 4 }
]

const caseStatusMap: any = { 0: '未执行', 1: '通过', 2: '失败', 3: '阻塞', 4: '跳过' }
const caseStatusTypeMap: any = { 0: 'default', 1: 'success', 2: 'error', 3: 'warning', 4: 'info' }
const caseTypeMap: any = { 0: '功能测试', 1: '性能测试', 2: '安全测试', 3: '兼容性测试', 4: '接口测试' }

const { columns, columnChecks, data, getData, loading, pagination, mobilePagination, searchParams } = useTable({
  showTotal: true,
  immediate: false,
  apiFn: fetchRdCasePage,
  apiParams: {
    page: 1, pageSize: 20, limit: 20,
    pid: undefined, ppid: undefined, testid: undefined,
    fuzzy: '', _t: new Date().getTime(),
  },
  columns: () => [
    {
      title: '用例编号',
      key: 'id',
      width: 120,
      align: 'center',
      render: (row: any) => (
        <div class="cursor-pointer c-blue" onClick={() => handleRowClick(row)}>
          {row.id || '-'}
        </div>
      )
    },
    {
      title: '用例标题',
      key: 'title',
      width: 200,
      align: 'center',
      render: (row: any) => {
        if (row.setoneStatus && clcikName.value === 'title') {
          return (
            <NInput
              value={row.title}
              ref={(el: any) => { if (el) nextTick(() => el.focus?.()) }}
              onUpdateValue={(val: string) => { row.title = val }}
              onBlur={() => handleOneEditParams(row, 'title')}
              onKeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') handleOneEditParams(row, 'title') }}
            />
          )
        }
        return (
          <NEllipsis style={{ maxWidth: '200px', cursor: 'pointer' }} >
            {{
              default: () => row.title || '',
              tooltip: () => <div onClick={() => handleRowClick(row)} style={{ padding: '8px' }}>{row.title || ''}</div>
            }}
          </NEllipsis>
        )
      }
    },
    {
      title: '用例类型',
      key: 'casetype',
      width: 120,
      align: 'center',
      render: (row: any) => {
        if (row.setoneStatus && clcikName.value === 'casetype') {
          return (
            <NSelect
              value={row.casetype}
              options={caseTypeOptions}
              ref={(el: any) => { if (el) nextTick(() => el.focus?.()) }}
              onUpdateValue={(val: any) => { row.casetype = val }}
              onBlur={() => handleOneEditParams(row, 'casetype')}
            />
          )
        }
        return h(NTag, {
          type: 'info', round: true, size: 'small',
          style: { cursor: 'pointer' },
          onClick: () => {
            if (row?.creater == authStore.userInfo.id || authStore.userInfo.usertype == 0) {
              row.setoneStatus = true
              clcikName.value = 'casetype'
              clcikNameValue.value = JSON.parse(JSON.stringify(row.casetype))
            }
          }
        }, () => caseTypeMap[row.casetype])
      }
    },
    {
      title: '执行状态',
      key: 'status',
      width: 100,
      align: 'center',
      render: (row: any) => {
        if (row.setoneStatus && clcikName.value === 'status') {
          return (
            <NSelect
              value={row.status}
              options={caseStatusOptions}
              ref={(el: any) => { if (el) nextTick(() => el.focus?.()) }}
              onUpdateValue={(val: any) => { row.status = val }}
              onBlur={() => handleOneEditParams(row, 'status')}
            />
          )
        }
        return h(NTag, {
          type: caseStatusTypeMap[row.status], round: true,
          style: { cursor: 'pointer' },
          onClick: () => {
            row.setoneStatus = true
            clcikName.value = 'status'
            clcikNameValue.value = JSON.parse(JSON.stringify(row.status))
          }
        }, () => caseStatusMap[row.status])
      }
    },
    {
      title: '前置条件',
      key: 'precondition',
      width: 200,
      align: 'center',
      render: (row: any) => (
        <NPopover trigger="hover" placement="top" style={{ maxWidth: '500px' }}>
          {{
            trigger: () => (
              <div class="text-left" style={{ display: '-webkit-box', overflow: 'hidden', textOverflow: 'ellipsis', WebkitBoxOrient: 'vertical', height: '40px', WebkitLineClamp: 2, cursor: 'pointer' }}>
                {row.precondition || '-'}
              </div>
            ),
            default: () => (
              <div style={{ maxWidth: '500px', maxHeight: '300px', overflow: 'auto' }}>
                {row.precondition || '-'}
              </div>
            )
          }}
        </NPopover>
      )
    },
    {
      title: '测试步骤',
      key: 'steps',
      width: 200,
      align: 'center',
      render: (row: any) => (
        <NPopover trigger="hover" placement="top" style={{ maxWidth: '500px' }}>
          {{
            trigger: () => (
              <div class="text-left" style={{ display: '-webkit-box', overflow: 'hidden', textOverflow: 'ellipsis', WebkitBoxOrient: 'vertical', height: '40px', WebkitLineClamp: 2, cursor: 'pointer' }} innerHTML={sanitizeHtml(row.steps) || ''} />
            ),
            default: () => (
              <div style={{ maxWidth: '500px', maxHeight: '300px', overflow: 'auto' }} innerHTML={sanitizeHtml(row.steps) || ''} />
            )
          }}
        </NPopover>
      )
    },
    {
      title: '预期结果',
      key: 'expected',
      width: 200,
      align: 'center',
      render: (row: any) => (
        <NPopover trigger="hover" placement="top" style={{ maxWidth: '500px' }}>
          {{
            trigger: () => (
              <div class="text-left" style={{ display: '-webkit-box', overflow: 'hidden', textOverflow: 'ellipsis', WebkitBoxOrient: 'vertical', height: '40px', WebkitLineClamp: 2, cursor: 'pointer' }} innerHTML={sanitizeHtml(row.expected) || ''} />
            ),
            default: () => (
              <div style={{ maxWidth: '500px', maxHeight: '300px', overflow: 'auto' }} innerHTML={sanitizeHtml(row.expected) || ''} />
            )
          }}
        </NPopover>
      )
    },
    {
      title: '实际结果',
      key: 'actual',
      width: 200,
      align: 'center',
      render: (row: any) => (
        <NPopover trigger="hover" placement="top" style={{ maxWidth: '500px' }}>
          {{
            trigger: () => (
              <div class="text-left" style={{ display: '-webkit-box', overflow: 'hidden', textOverflow: 'ellipsis', WebkitBoxOrient: 'vertical', height: '40px', WebkitLineClamp: 2, cursor: 'pointer' }} innerHTML={sanitizeHtml(row.actual) || ''} />
            ),
            default: () => (
              <div style={{ maxWidth: '500px', maxHeight: '300px', overflow: 'auto' }} innerHTML={sanitizeHtml(row.actual) || '-'} />
            )
          }}
        </NPopover>
      )
    },
    {
      key: 're1',
      align: 'center',
      width: 80,
      title: () => (
        <div class={'flex items-center justify-center'}>
          <div>文件</div>
          <SvgIcon local-icon={'edit'} class="font-size-16px ml-5px" />
        </div>
      ),
      render: (row: any, index: number) => {
        if (row?.creater == authStore.userInfo.id || (authStore.userInfo.usertype == 0)) {
          return <NBadge
            value={(row.rdFilePojoList?.length ?? 0) === 0 ? (row.filenum ?? null) : row.rdFilePojoList.length}
            max={9}
          >
            <NButton
              text
              type="primary"
              style={{ color: ((row.rdFilePojoList?.length ?? 0) > 0 ? row.rdFilePojoList.length : (row.filenum ?? 0)) > 0 ? '#ff8c00' : '#999' }}
              onClick={() => { handleUploadFiles(row, index) }}
            >
              <SvgIcon local-icon="files" class="font-size-30px ml-5px" />
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
              style={{ color: row.filenum > 0 ? '#ff8c00' : '#999' }}
              onClick={() => { handleRowClick(row) }}
            >
              <SvgIcon local-icon="files" class="font-size-30px ml-5px" />
            </NButton>
          </NBadge>
        )
      }
    },
    {
      title: '创建人', key: 'username', width: 100, align: 'center'
    },
    {
      title: '创建时间', key: 'dbtime', width: 160, align: 'center'
    },
    {
      key: 'operate', title: $t('common.operate'), align: 'center', width: 150, fixed: 'right',
      render: (row: any) => (
        <div class="flex-center gap-8px">
          <NTooltip trigger="hover">
            {{ trigger: () => <div onClick={() => handleRowClick(row)}><SvgIcon local-icon="xiangqing" class={"c-#1890ff font-size-24px cursor-pointer"} /></div>, default: () => '详情' }}
          </NTooltip>
          <NTooltip trigger="hover">
            {{ trigger: () => <div onClick={() => edit(row)}><SvgIcon local-icon="edit" class={"c-#f39c12 font-size-24px cursor-pointer"} /></div>, default: () => '编辑' }}
          </NTooltip>
          <NTooltip trigger="hover">
            {{ trigger: () => <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>{{ default: () => `$t('common.confirmDelete')`, trigger: () => <div><SvgIcon local-icon="delete" class={"c-#e74c3c font-size-24px cursor-pointer"} /></div> }}</NPopconfirm>, default: () => '删除' }}
          </NTooltip>
        </div>
      )
    }
  ] as any
})

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys } = useTableOperate(data as any, getData)

const handleOneEditParams = async (row: any, label: string) => {
  if (row[label] == clcikNameValue.value) return row.setoneStatus = false
  const { error } = await fetchUpdateRdCase([{ id: row.id, [label]: row[label], pid: row.pid }])
  if (!error) {
    window.$message?.success('修改成功')
    row.setoneStatus = false
    getCaseData()
  } else {
    row[label] = clcikNameValue.value
    row.setoneStatus = false
  }
}

const handleDelete = async (id: number) => {
  const { error } = await fetchDeleteRdCase(String(id))
  if (!error) {
    window.$message?.success('删除成功')
    getCaseData()
  }
}

const edit = (row: any) => handleEdit(row.id)

// 文件上传
const uploadFilesVisiable = ref(false)
const activeIndex = ref(0)
const activeRow = ref()
const fileList = ref([])

const handleUploadFiles = async (row: any, index: number) => {
  uploadFilesVisiable.value = true
  activeIndex.value = index
  activeRow.value = row
  if (row.id) {
    await getFileList(row)
    return
  }
  fileList.value = []
}

const getFileList = async (row: any) => {
  const { data, error } = await fetchRdFilePage({ proid: props.proid, pid: row.id, page: 1, limit: 100, ftype: 3 })
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

const handleSaveFiles = async () => {
  if (activeRow.value.id) {
    // 先上传文件
    const uploadList: any = fileList.value.filter((item: any) => item.file && !item.furl)

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
      const { error: error1 } = await fetchAddRdFile(uploadList.map((item: any) => {
        return {
          furl: item.furl,
          fname: item.fname,
          pid: activeRow.value.id,
          proid: props.proid,
          ftype: 3
        }
      }))
      if (!error1) { }
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
      const { error: error2 } = await fetchDeleteRdFile(deletedIds.join(','))
      if (!error2) { }
    }
    window.$message?.success('保存成功')
    uploadFilesVisiable.value = false
    getCaseData()
  }
}

const lookVisiable = ref(false)
const lookData = ref()
const handleRowClick = (row: any) => {
  lookVisiable.value = true
  lookData.value = row
}

const getCaseData = async () => {
  // if (props.pid || props.ppid || props.testid) {
    // await getData()
    data.value = [
      {
        id: 1,
        caseno: 'CASE-001',
        title: '用户登录功能测试',
        casetype: 0,
        status: 0,
        precondition: '系统已启动，存在测试账号',
        steps: '1.输入用户名<br/>2.输入密码<br/>3.点击登录',
        expected: '登录成功，跳转首页',
        actual: '',
        filenum: 0,
        username: '张三',
        creater: 1,
        dbtime: '2026-07-03 15:30:12',
        rdFilePojoList: [],
        setoneStatus: false
      }
    ] as any
    emit('caseData', data.value)
  // }
}
onMounted(() => {
  getCaseData()
})
defineExpose({ getCaseData })
const search = () => getData()
</script>

<template>
  <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <n-spin :show="loading">
      <div class="flex justify-end mb-10px">
        <NButton type="info" ghost size="small" @click="handleAdd">
          <template #icon><icon-ic-round-add class="text-icon" /></template>
          建用例
        </NButton>
      </div>
      <NDataTable v-model:checked-row-keys="checkedRowKeys" :columns="columns" :data="data" size="small"
        :flex-height="false" :loading="loading" remote :row-key="(row: any) => row.id"
        :scroll-x="columns.reduce((sum: any, col) => sum + (col?.width || 100), 0)" class="sm:h-full" />
    </n-spin>
    <OperateDrawer v-model:visible="drawerVisible" @submitted="getCaseData" :pid="props.pid" :ppid="props.ppid"
      :testid="props.testid" :proid="props.proid" :operate-type="operateType" :row-data="editingData" />
    <lookDrawer v-model:visible="lookVisiable" :data="lookData" :proid="props.proid" />
    <NModal v-model:show="uploadFilesVisiable" title="文件列表" preset="card" class="w-700px">
      <uploadList v-model:fileList="fileList" :max-size="50" />
      <template #footer>
        <NSpace justify="end" :size="16">
          <NButton type="default" @click="uploadFilesVisiable = false;">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSaveFiles">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
:deep(.n-data-table-empty) {
  .n-empty__icon {
    display: none;
  }

  padding: 5px 0 !important;
}
</style>
