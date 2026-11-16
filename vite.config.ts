// vite.config.ts
import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

import Components from '@uni-helper/vite-plugin-uni-components'
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'


export default defineConfig({
	plugins: [
		// make sure put it before `Uni()`
		Components({
			resolvers: [WotResolver()]
		}), uni()],
	// H5 开发调试：同源代理后端接口，规避浏览器 CORS（仅 dev server 生效，App 构建不受影响）
	server: {
		host: '0.0.0.0',
		proxy: {
			'^/project(?!Pages)': {
				// 代理目标二选一：连内网调试服 http://172.20.1.104:18905；连线上 https://pms.linkqi.cn:18905（自签证书需 secure:false 忽略校验）
				target: 'https://pms.linkqi.cn:18905',
				secure: false,
				changeOrigin: true,
				ws: true,
				// 代理键必须用正则 ^/project(?!Pages)：字符串键 '/project' 是前缀匹配，会把 /projectPages/** 的页面静态资源也代理到后端，Tomcat 对该路径返回 404（H5 页面打不开）
// 后端是 Spring CORS 白名单：请求带 Origin 且不在白名单直接 403「Invalid CORS request」。
				// 代理转发前移除 Origin/Referer，后端即按非跨域请求放行（同源代理下浏览器也不做 CORS 校验）
				configure: (proxy) => {
					proxy.on('proxyReq', (proxyReq) => {
						proxyReq.removeHeader('origin');
						proxyReq.removeHeader('referer');
					});
				}
			}
		}
	}
});