<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import { useForm, useFormRules } from '@/hooks/common/form';
import { fetchAddRdCase, fetchUpdateRdCase, fetchRdFilePage, fetchAddRdFile, fetchDeleteRdFile } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { NButton, NSpace, NSelect, NInput, NGrid, NFormItemGi, NForm, NModal, NScrollbar } from 'naive-ui';
import { uploadFile } from '@/utils/upload';

export interface Props {
  visible: boolean;
  operateType: 'add' | 'edit';
  rowData?: any;
  pid?: number;
  ppid?: number;
  testid?: number;
  proid?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'submitted'): void;
}>();

const authStore = useAuthStore();
const { formRef, validated, handleValidate } = useForm();
const { defaultRequiredRule } = useFormRules();
const title = computed(() => operateType.value === 'add' ? '新建用例' : '编辑用例');

const model = ref<any>({
  title: '',
  casetype: 0,
  precondition: '',
  steps: '',
  expected: '',
  actual: '',
  status: 0,
  pid: null,
  ppid: null,
  testid: null,
  id: ''
});

const operateType = ref<'add' | 'edit'>('add');

const caseTypeOptions = [
  { label: '功能测试', value: 0 },
  { label: '性能测试', value: 1 },
  { label: '安全测试', value: 2 },
  { label: '兼容性测试', value: 3 },
  { label: '接口测试', value: 4 }
];

const caseStatusOptions = [
  { label: '未执行', value: 0 },
  { label: '通过', value: 1 },
  { label: '失败', value: 2 },
  { label: '阻塞', value: 3 },
  { label: '跳过', value: 4 }
];

const rules: any = {
  title: defaultRequiredRule,
  casetype: {
    type: 'number',
    required: true,
    trigger: ['blur', 'change'],
    message: '请选择用例类型',
  }
};

const visible = ref(false);
const showprogress = ref(false);
const currentUploadIndex = ref<number>(0);
const fileList = ref<any>([]);
const oldFileList = ref<any[]>([]);

// 获取文件列表
const getFileList = async () => {
  if (!model.value.id || !props.proid) return;
  const { data, error } = await fetchRdFilePage({ proid: props.proid, pid: model.value.id, page: 1, limit: 100, ftype: 3 });
  if (error) return;
  fileList.value = (data as any).list.map((item: any) => {
    return {
      id: item.id,
      url: item.furl,
      fname: item.fname,
      name: item.furl.split('?')[1],
      status: 'finished'
    };
  });
  oldFileList.value = JSON.parse(JSON.stringify(fileList.value));
};

function handleSubmit() {
  if (submitBtnloading.value) return;
  handleValidate().then(async () => {
    submitBtnloading.value = true;
    showprogress.value = true;

    // 上传文件
    const uploadList = fileList.value.filter((item: any) => item.file);
    const total = uploadList.length;
    for (let index = 0; index < total; index++) {
      currentUploadIndex.value = index;
      const item = uploadList[index];
      item.indexText = `${index + 1}/${total}`;
      item.progress = 0;
      item.status = 'uploading';
      try {
        item.url = await uploadFile(
          item.file.file,
          item.name || item.file.name,
          '',
          (val) => {
            item.progress = val;
          }
        );
        item.progress = 100;
        item.status = 'done';
      } catch {
        item.status = 'error';
      }
    }
    showprogress.value = false;

    const params = { ...model.value, creater: authStore.userInfo.id, pid: props?.pid || null, ppid: props?.ppid || null, testid: props?.testid || null };

    if (operateType.value === 'edit') {
      // 添加文件
      if (uploadList.length > 0) {
        const { error: error1 } = await fetchAddRdFile(uploadList.map((item: any) => {
          return {
            furl: item.url,
            fname: item.fname,
            pid: model.value.id,
            proid: props.proid,
            ftype: 3
          };
        }));
        if (!error1) { }
      }

      // 删除文件
      const deletedIds = oldFileList.value
        .filter(
          (oldItem: any) =>
            !fileList.value.some(
              (newItem: any) =>
                newItem.id === oldItem.id
            )
        )
        .map((item: any) => item.id);
      if (deletedIds.length > 0) {
        const { error: error2 } = await fetchDeleteRdFile(deletedIds.join(','));
        if (!error2) { }
      }

      const { error } = await fetchUpdateRdCase([params]);
      if (!error) {
        window.$message?.success('用例更新成功');
        closeDrawer();
        emit('submitted');
      }
    } else {
      const { data, error } = await fetchAddRdCase(params);
      if (!error) {
        // 添加文件
        if (fileList.value.length > 0) {
          const { error: error1 } = await fetchAddRdFile(uploadList.map((item: any) => {
            return {
              furl: item.url,
              fname: item.fname,
              pid: data,
              ftype: 3,
              proid: props.proid
            };
          }));
          if (!error1) {
            closeDrawer();
            emit('submitted');
            window.$message?.success('用例创建成功');
          }
        } else {
          closeDrawer();
          emit('submitted');
          window.$message?.success('用例创建成功');
        }
      }
    }
    submitBtnloading.value = false;
  }).catch(() => {
    submitBtnloading.value = false;
  });
}

function closeDrawer() {
  visible.value = false;
  emit('update:visible', false);
}

const submitBtnloading = ref(false);

watch(() => props?.visible, async (val) => {
  visible.value = val;
  if (val) {
    showprogress.value = false;
    fileList.value = [];
    oldFileList.value = [];
    if (props.operateType === 'edit' && props.rowData) {
      operateType.value = 'edit';
      model.value = { ...props.rowData };
      await getFileList();
    } else {
      operateType.value = 'add';
      model.value = {
        title: '',
        casetype: 0,
        precondition: '',
        steps: '',
        expected: '',
        actual: '',
        status: 0,
        pid: props?.pid || null,
        ppid: props?.ppid || null,
        testid: props?.testid || null,
        id: ''
      };
    }
    setTimeout(() => {
      const e = document.querySelector('.n-scrollbar-content');
      e?.scrollTo(0, 0);
    }, 300);
  }
});
</script>

<template>
  <NModal v-model:show="visible" :title="title" preset="card" class="w-60%" :mask-closable="false" :draggable="true">
    <NScrollbar class="pr-20px">
      <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="100">
        <NGrid responsive="screen" item-responsive>
          <NFormItemGi span="24 m:12" label="用例标题" path="title">
            <NInput v-model:value="model.title" placeholder="请输入用例标题" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="用例类型" path="casetype">
            <NSelect v-model:value="model.casetype" :options="caseTypeOptions" placeholder="请选择用例类型" />
          </NFormItemGi>
          <NFormItemGi span="24 m:12" label="执行状态" path="status">
            <NSelect v-model:value="model.status" :options="caseStatusOptions" placeholder="请选择执行状态" />
          </NFormItemGi>
          <NFormItemGi span="24" label="前置条件">
            <NInput v-model:value="model.precondition" type="textarea" placeholder="请输入前置条件" :autosize="{ minRows: 2, maxRows: 5 }" />
          </NFormItemGi>
          <NFormItemGi span="24" label="测试步骤" path="steps">
            <NInput v-model:value="model.steps" type="textarea" placeholder="请输入测试步骤" :autosize="{ minRows: 3, maxRows: 10 }" />
          </NFormItemGi>
          <NFormItemGi span="24" label="预期结果" path="expected">
            <NInput v-model:value="model.expected" type="textarea" placeholder="请输入预期结果" :autosize="{ minRows: 2, maxRows: 5 }" />
          </NFormItemGi>
          <NFormItemGi span="24" label="实际结果">
            <NInput v-model:value="model.actual" type="textarea" placeholder="请输入实际结果" :autosize="{ minRows: 2, maxRows: 5 }" />
          </NFormItemGi>
          <NFormItemGi span="24" label="附件">
            <template #label>
              附件
              <icon-material-symbols:attach-file />
            </template>
            <uploadList v-model:fileList="fileList" :max-size="50" />
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
        <n-progress
          :percentage="fileList[currentUploadIndex].progress"
          :status="fileList[currentUploadIndex].status === 'error' ? 'error' : 'success'"
          show-indicator
        />
      </div>
    </NScrollbar>
    <template #footer>
      <NSpace justify="end" :size="16">
        <NButton type="default" @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit" :loading="submitBtnloading">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.amap-logo {
  display: none !important;
}

.amap-copyright {
  display: none !important;
}
</style>

