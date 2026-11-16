// types/element-china-area-data.d.ts
declare module 'element-china-area-data' {
	interface AreaData {
		province_list : Record<string, string>;
		city_list : Record<string, string>;
		county_list : Record<string, string>;
	}

	interface CodeToText {
		[key : string] : string;
	}

	// 主要导出
	export const regionData : Array<{
		value : string;
		label : string;
		children ?: Array<{ value : string; label : string; children ?: Array<{ value : string; label : string }> }>;
	}>;

	export const provinceAndCityData : Array<{
		value : string;
		label : string;
		children ?: Array<{ value : string; label : string }>;
	}>;

	export const codeToText : CodeToText;

	// 地区数据
	export const areaData : AreaData;

	// 原始数据
	export const province : Record<string, string>;
	export const city : Record<string, string>;
	export const area : Record<string, string>;
}