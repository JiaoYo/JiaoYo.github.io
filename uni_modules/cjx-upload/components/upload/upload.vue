<!-- eslint-disable -->
<template>
  <view>
    <view
      class="cjx-upload"
      v-html="this.renderInput"
      :props="this.mergeProps"
      :change:props="ZtUpload.renderProps"
    ></view>
  </view>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { chooseMedia, chooseMessageFile, uploadFile } from '../../tools/apis'
import { deepMerge, awaitWrap, base64ToPath, isArray, base64ToFile } from '../../tools/tools'

export default defineComponent({
  name: 'upload',
  props: {
    options: {
      default: () => ({}),
      type: Object,
    },
  },
  emits: ['callback'],
  setup(props, { expose, emit }) {
    const id = ref(0) // APP上传框ID
    const renderInput = ref('') // APP上传框

    const mergeOptions = computed(() => {
      const tmpOptions = {
        name: 'file',
      }
      return deepMerge(tmpOptions, props.options)
    })

    const mergeProps = computed(() => {
      return {
        id: id.value,
        renderInput: renderInput.value,
        upload: mergeOptions.value,
      }
    })

    const upload = async (type, config = {}) => {
      // console.log(1111, type)
      let tmpResult = []
      if (['image', 'video'].includes(type)) {
        const [err, res] = await chooseMedia(type, config)
        if (err) return handleError(err)
        tmpResult = res?.tempFiles || []
      }
      // H5 || APP-PLUS || MP-WEIXIN
      if (['file'].includes(type)) {
        let tmpFiles = {}
        let tmpErr = null
        // #ifdef H5
        // ;[tmpErr, tmpFiles] = await chooseFile(config)
        id.value = Math.floor(Math.random() * 100000000 + 1)
        initInput(config)
        // #endif
        // #ifdef MP-WEIXIN
        ;[tmpErr, tmpFiles] = await chooseMessageFile(config)
        // #endif
        // #ifdef APP-PLUS
        id.value = Math.floor(Math.random() * 100000000 + 1)
        initInput(config)
        // #endif
        if (tmpErr) return handleError(tmpErr)
        tmpResult = tmpFiles?.tempFiles || []
      }
      handleUpload(tmpResult)
    }

    const initInput = (config) => {
      const { accept,  multiple } = config
      renderInput.value = `<input type="file" id="cjx-upload-${id.value}" name="cjx-upload" ${accept ? 'accept="' + accept + '"' : ''} ${ multiple ? 'multiple' : '' } />`
      // renderInput.value = `<input type="file" id="cjx-upload-${id.value}" name="cjx-upload" accept="video/mp4, image/jpg ,image/png, image/jpeg"} />`
      // renderInput.value = `<input type="file" id="cjx-upload-${id.value}" name="cjx-upload" accept="image/jpg,image/png,image/jpeg,video/mp4"} />`
      // video/*,image/*
    }

    // 文件上传（没有传入上传url时返回本地链接）
    const handleUpload = async (files = []) => {
      if (files.filter((e) => Boolean(e)).length === 0) return
      if (!mergeOptions.url) {
        return onHandleEmits({
          type: 'choose',
          data: files,
        })
      }
      const tmpUploads = files.map((e) =>
        uploadFile(
          {
            ...mergeOptions,
            filePath: e.tempFilePath,
          },
          e,
        ),
      )
      const [err, res] = await awaitWrap(Promise.all(tmpUploads))
      if (err) return handleError(err)
      onHandleEmits({
        type: 'success',
        data: res,
      })
    }

    // 处理失败事件
    const handleError = (error) => {
      onHandleEmits({
        type: 'warning',
        data: error,
      })
    }

    // 处理响应事件
    const onHandleEmits = async (e) => {
      // console.log(333, e)
      // #ifdef APP-PLUS
      if (e.type === 'choose') {
        // 将base64转为本地链接
        for (let i = 0; i < e.data.length; i += 1) {
          const item = e.data[i]
          if (!item.base64Url) {
            continue
          }
          const [parseError, parseUrl] = await awaitWrap(base64ToPath(item.base64Url, item.name))
          if (!parseError) {
            e.data[i].tempFilePath = parseUrl
          } else {
            e.data[i].tempFilePath = item.base64Url
          }
          // delete e.data[i].base64Url
        }
      }
      // #endif

      // #ifdef H5
      // 将base64转为本地链接
      for (let i = 0; i < e.data.length; i += 1) {
        const item = e.data[i]
        if (!item.base64Url) {
          continue
        }
        const { file, blob } = base64ToFile(item.base64Url, item.name)
        // console.log('file', file)
        e.data[i].file = file
        e.data[i].url = URL.createObjectURL(blob)
        // delete e.data[i].base64Url
      }
      // console.log(e)
      // #endif
      emit('callback', e.data)
    }

    expose({
      upload,
    })

    return {
      renderInput,
      mergeProps,
      onHandleEmits,
    }
  },
})
</script>

<script module="ZtUpload" lang="renderjs">
export default {
  data() {
    return {
      id: 0, // 上传框ID
      uploadOptions: {}, // 上传配置
    };
  },
  methods: {
    // 处理 XeUpload 传入 renderjs 数据，以及调起上传框
    renderProps(info) {

      const { id, renderInput, upload } = info;
      // console.log('renderInput', renderInput)
      if (!renderInput) return;
      this.id = id;
      this.uploadOptions = upload;
      this.$nextTick(() => {
        const dom = document.getElementById(`cjx-upload-${id}`);
  
        dom.addEventListener('change', () => {
          this.handleUpload();
        });
        dom?.click?.();
      });
    },
    // 处理文件上传(没有传入url时返回本地链接)
    async handleUpload() {
      const {
        url,
        name,
        header = {},
        formData = {},
      } = this.uploadOptions || {};
      const dom = document.getElementById(`cjx-upload-${this.id}`);

      if (!dom.files[0]) return;
      const tmpFileList = Array.from(dom.files);
      const tmpUploads = [];
      for (let i = 0; i < tmpFileList.length; i += 1) {
        const e = tmpFileList[i];
        let tmpType = 'file';
        if (e.type.includes('image')) {
          tmpType = 'image';
        }
        if (e.type.includes('video')) {
          tmpType = 'video';
        }
        const tmpExts = {
          size: e.size,
          name: e.name,
          type: e.type,
          fileType: tmpType,
          tempFilePath: '',
          base64Url: '',
        };

        const fileToBase64 = (file) => {
          if (!file) return
          return new Promise((r, j) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64String = reader.result
              r(base64String)
            }
            reader.onerror = () => {
              j({ mode: 'fileToBase64', data: { errMsg: 'File to base64 fail.' } })
            }
            reader.readAsDataURL(file)
          })
        }

        const awaitWrap = (promise) => promise.then((res) => [null, res]).catch((err) => [err, {}])
        // 没有传入上传url时，直接返回本地链接
        if (!url) {
          const [parseError, parseUrl] = await awaitWrap(fileToBase64(dom.files[i]));
          if (!parseError) {
            tmpExts.base64Url = parseUrl;
          }
          tmpUploads.push(tmpExts);
          continue;
        };
        const tmpData = new FormData();
        tmpData.append(name, dom.files[i], e.name);
        for (let key in formData) {
          tmpData.append(key, formData[key]);
        }
        // 上传进度
        const onprogress = (ev) => {
          if(ev.lengthComputable) {
            var result = (ev.loaded / ev.total) * 100;
            this.handleRenderEmits({
              type: 'onprogress',
              data: {
                progress: Math.floor(result),
                current: i + 1,
                total: tmpFileList.length,
              },
            });
          };
        }
        tmpUploads.push(appUploadFile({
          url,
          header,
          formData: tmpData
        }, tmpExts, onprogress ));
      }
      // 没有传入上传url时，直接返回本地链接列表
      if (!url) {
        return this.handleRenderEmits({
          type: 'choose',
          data: tmpUploads,
        });
      }
      this.handleRenderEmits({
        type: 'onprogress',
        data: {
          progress: 0,
          current: 1,
          total: tmpFileList.length,
        },
      });
      // 处理上传文件
      const [err, res] = await awaitWrap(Promise.all(tmpUploads));
      if (err) {
        return this.handleRenderEmits({
          type: 'warning',
          data: err,
        });
      }
      this.handleRenderEmits({
        type: 'success',
        data: res,
      });
    },
    // 数据传输到XeUpload组件
    handleRenderEmits(data) {
      this.$ownerInstance.callMethod('onHandleEmits', data);
    },
  },
};
</script>

<style scoped>
.cjx-upload {
  display: none;
}
</style>
