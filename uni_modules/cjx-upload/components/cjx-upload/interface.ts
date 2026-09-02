import type { ExtractPropTypes, PropType } from 'vue'

export function arrayType<T extends any[]>(defaultVal?: T) {
  return { type: Array as unknown as PropType<T>, default: defaultVal as T }
}

export function stringType<T extends string = string>(defaultVal?: T) {
  return { type: String as unknown as PropType<T | string>, default: defaultVal as T }
}

export function numberType<T extends number = number>(defaultVal?: T) {
  return { type: Number as unknown as PropType<T>, default: defaultVal as T }
}

export function booleanType(defaultVal?: boolean) {
  return { type: Boolean, default: defaultVal as boolean }
}


export type UploadUserFile = {
	name: string
	file: File
	[key: string]: any
}

export const uploadFileProps = () => {
  return {
    modelValue: arrayType<UploadUserFile[]>(),
    /** 是否支持多选文件 */
    multiple: booleanType(false),
    /** 是否禁用 */
    disabled: booleanType(),
    /** 最大允许上传个数 */
    limit: {
			type: Number,
			default: 9
		},
    /** 限制上传个数的情况下，是否展示当前上传的个数 */
    showLimitNum: booleanType(),
    /** 文件大小限制，单位为byte */
    maxSize: numberType(),
    /** 上传的地址 */
    action: stringType(''),
    /** 接受的文件类型 具体请参考https://developer.mozilla.org/zh-CN/docs/Web/HTML/Reference/Elements/input/file  */
    accept: stringType(''),
  }
}

export type UploadFileProps = ExtractPropTypes<ReturnType<typeof uploadFileProps>>
