import{bg as t}from"./index-Cu8e7n-j.js";function n(e){return t({url:"/proxyServer/selectPage.do",method:"get",params:e})}function r(e){return t({url:"/proxyServer/selectById.do",method:"get",params:{id:e}})}function c(){return t({url:"/proxyServer/selectCentreIp.do",method:"get"})}function l(e){return t({url:"/proxyServer/insertCentreIp.do",method:"post",params:{ip:e}})}function u(){return t({url:"/proxyServer/detection.do",method:"post"})}function i(e){return t({url:"/collectionPolicy/selectPage.do",method:"get",params:e})}function d(e){return t({url:"/collectionPolicy/insert.do",method:"post",data:e})}function a(e){return t({url:"/collectionPolicy/update.do",method:"post",data:e})}function s(e){return t({url:"/collectionPolicy/delete.do",method:"get",params:{ids:e}})}function g(){return t({url:"/eventType/selectTypeList.do",method:"get"})}function f(e){return t({url:"/collectionMengement/selectPage.do",method:"get",params:e})}function h(e){return t({url:"/collectionMengement/update.do",method:"post",data:e})}function m(e){return t({url:"/collectionMengement/insert.do",method:"post",data:e})}function p(e){return t({url:"/collectionMengement/delete.do",method:"get",params:{ids:e}})}function S(e){return t({url:"/collectionMengement/enable.do",method:"post",params:e})}function C(){return t({url:"/logSourceDevice/selectList.do",method:"get"})}function y(e){return t({url:"/logSourceDevice/selectPage.do",method:"get",params:e})}function v(e){return t({url:"/logSourceDevice/insert.do",method:"post",data:e})}function A(e){return t({url:"/logSourceDevice/update.do",method:"post",data:e})}function P(e){return t({url:"/logSourceDevice/delete.do",method:"get",params:{ids:e}})}function G(e){return t({url:"/logSourceCategory/selectPage.do",method:"get",params:e})}function D(e){return t({url:"/manu/selectPage.do",method:"get",params:e})}export{n as a,c as b,l as c,u as d,d as e,r as f,a as g,i as h,s as i,g as j,m as k,h as l,C as m,f as n,S as o,p,G as q,D as r,v as s,A as t,y as u,P as v};