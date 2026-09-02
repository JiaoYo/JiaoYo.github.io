import type { ExtractPropTypes, PropType } from 'vue'

export function stringType<T extends string = string>(defaultVal?: T) {
  return { type: String as unknown as PropType<T | string>, default: defaultVal as T }
}

export function booleanType(defaultVal?: boolean) {
  return { type: Boolean, default: defaultVal as boolean }
}


export type FileType = 'word' | 'excel' | 'pdf' | 'txt'

export const previewOfficeProps = () => {
  return {
    value: stringType(''),
		name: stringType(''),
		type: stringType<FileType>('word'),
		zIndex: {
			type: Number,
			default: 990
		},
		/** 点击遮罩是否关闭 默认true */
		closeOnClickModal: booleanType(true)
  }
}

export type UploadFileProps = ExtractPropTypes<ReturnType<typeof previewOfficeProps>>
