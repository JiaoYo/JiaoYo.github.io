import{bg as e}from"./index-CIkMAdTj.js";function n(t){return e({url:"/event/selectPage.do",method:"get",params:t})}function r(t){return e({url:"/securityEvent/selectNextPage.do",method:"get",params:function(){return Object.prototype.hasOwnProperty.call(t,"timeRange")&&delete t.timeRange,Object.prototype.hasOwnProperty.call(t,"startAndEndSendSourceIp")&&delete t.startAndEndSendSourceIp,Object.prototype.hasOwnProperty.call(t,"startAndEndSourceIp")&&delete t.startAndEndSourceIp,Object.prototype.hasOwnProperty.call(t,"startAndEndAimSourceIp")&&delete t.startAndEndAimSourceIp,t}()})}function i(){return e({url:"/securityEvent/selectCount.do",method:"get"})}function c(t){return e({url:"/aggregatePolicy/selectPage.do",method:"get",params:t})}function a(t){return e({url:"/aggregatePolicy/insert.do",method:"post",data:t})}function s(t){return e({url:"/aggregatePolicy/update.do",method:"post",data:t})}function u(t){return e({url:"/associatedEvent/selectPage.do",method:"get",params:function(){return Object.prototype.hasOwnProperty.call(t,"timeRange")&&delete t.timeRange,t}()})}function d(t){return e({url:"/associtionPolicy/selectPage.do",method:"get",params:t})}function l(t){return e({url:"/associtionPolicy/selectById.do",method:"get",params:{id:t}})}function f(t){return e({url:"/associtionPolicy/insert.do",method:"post",data:t})}function g(t){return e({url:"/associtionPolicy/update.do",method:"post",data:t})}function h(t){return e({url:"/associtionPolicy/delete.do",method:"get",params:{ids:t.join(",")}})}function p(t){return e({url:"/originalLog/selectNextPage.do",method:"get",params:function(){return Object.prototype.hasOwnProperty.call(t,"timeRange")&&delete t.timeRange,Object.prototype.hasOwnProperty.call(t,"startAndEndOriginIp")&&delete t.startAndEndOriginIp,Object.prototype.hasOwnProperty.call(t,"startAndEndSourceIp")&&delete t.startAndEndSourceIp,Object.prototype.hasOwnProperty.call(t,"startAndEndAimSourceIp")&&delete t.startAndEndAimSourceIp,t}()})}function y(){return e({url:"/originalLog/selectCount.do",method:"get"})}function P(t){return e({url:"/generaLog/selectNextPage.do",method:"get",params:function(){return Object.prototype.hasOwnProperty.call(t,"timeRange")&&delete t.timeRange,Object.prototype.hasOwnProperty.call(t,"startAndEndIp")&&delete t.startAndEndIp,t}()})}function m(t){return e({url:"/generaLog/selectCount.do",method:"get",params:t})}function v(t){return e({url:"/customParsing/selectPage.do",method:"get",params:t})}function I(t){return e({url:"/customParsing/insert.do",method:"post",data:t})}function A(t){return e({url:"/customParsing/update.do",method:"post",data:t})}function E(t){return e({url:"/customParsing/delete.do",method:"get",params:{ids:t.join(",")}})}function O(t){return e({url:"/eventEigenvalue/selectPage.do",method:"get",params:t})}function w(t){return e({url:"/eventEigenvalue/insert.do",method:"post",data:t})}function S(t){return e({url:"/eventEigenvalue/update.do",method:"post",data:t})}function L(t){return e({url:"/eventEigenvalue/delete.do",method:"get",params:{ids:t.join(",")}})}function j(t){return e({url:"/forwardPolicy/selectPage.do",method:"get",params:t})}function G(t){return e({url:"/forwardPolicy/insert.do",method:"post",data:t})}function b(t){return e({url:"/forwardPolicy/update.do",method:"post",data:t})}function D(t){return e({url:"/forwardPolicy/delete.do",method:"get",params:{ids:t.join(",")}})}export{b as A,D as B,j as a,a as b,s as c,c as d,h as e,r as f,n as g,d as h,u as i,l as j,f as k,g as l,I as m,A as n,v as o,E as p,p as q,i as r,w as s,S as t,O as u,L as v,P as w,m as x,y,G as z};