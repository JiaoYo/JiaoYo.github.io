import{bg as t}from"./index-CIkMAdTj.js";function r(e){return t({url:"/proxyServer/selectPage.do",method:"get",params:e})}function n(e){return t({url:"/proxyServer/selectById.do",method:"get",params:{id:e}})}function c(){return t({url:"/proxyServer/selectCentreIp.do",method:"get"})}function l(e){return t({url:"/proxyServer/insertCentreIp.do",method:"post",params:{ip:e}})}function u(){return t({url:"/proxyServer/detection.do",method:"post"})}function i(e){return t({url:"/collectionPolicy/selectPage.do",method:"get",params:e})}function d(e){return t({url:"/collectionPolicy/insert.do",method:"post",data:e})}function a(e){return t({url:"/collectionPolicy/update.do",method:"post",data:e})}function s(e){return t({url:"/collectionPolicy/delete.do",method:"get",params:{ids:e}})}function g(){return t({url:"/eventType/selectTypeList.do",method:"get"})}function f(e){return t({url:"/collectionMengement/selectPage.do",method:"get",params:e})}function m(e){return t({url:"/collectionMengement/update.do",method:"post",data:e})}function h(e){return t({url:"/collectionMengement/insert.do",method:"post",data:e})}function p(e){return t({url:"/collectionMengement/delete.do",method:"get",params:{ids:e}})}function S(){return t({url:"/logSourceDevice/selectList.do",method:"get"})}function C(e){return t({url:"/logSourceDevice/selectPage.do",method:"get",params:e})}function y(e){return t({url:"/logSourceDevice/insert.do",method:"post",data:e})}function A(e){return t({url:"/logSourceDevice/update.do",method:"post",data:e})}function v(e){return t({url:"/logSourceDevice/delete.do",method:"get",params:{ids:e}})}function P(e){return t({url:"/logSourceCategory/selectPage.do",method:"get",params:e})}function G(e){return t({url:"/manu/selectPage.do",method:"get",params:e})}export{r as a,c as b,l as c,u as d,d as e,n as f,a as g,i as h,s as i,g as j,h as k,m as l,S as m,f as n,p as o,P as p,G as q,y as r,A as s,C as t,v as u};