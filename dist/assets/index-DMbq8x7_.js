import{_ as B}from"./save-outline-C8fR4kCx.js";import{_ as O}from"./round-search-BGhpS_o8.js";import{d as j,r as z,b8 as V,i as p,a2 as G,o as P,b as J,f as l,w as u,g as b,h as y,B as D,a8 as C,t as T,$ as E,c as M,S as A,aA as h,a5 as v,b_ as F,dF as I,dI as R,ab as X,E as q,X as H}from"./index-DIyxtJcW.js";import{_ as K}from"./DatePicker-wDxPvaZP.js";import{_ as L}from"./DataTable-D8ENyBVV.js";import"./Forward-r4EUSAJj.js";import"./RadioGroup-DX5jOXNE.js";const Q={class:"min-h-500px flex-col-stretch gap-16px lt-sm:overflow-auto"},re=j({name:"stationmanagement_predictionsettings",__name:"index",setup(W){const d=z({dateTime:V(0,Date.now()),type:1}),N=[{title:"时间",key:"dbtime",render:e=>{var a;return l("span",null,[(a=e[0])==null?void 0:a.dbtime])}},{title:"预测值",key:"manuPower",render(e){var a,n,t,o;return((a=e[0])==null?void 0:a.dbtime)&&h(v,{value:(n=e[0])==null?void 0:n.manuPower,max:((t=e[0])==null?void 0:t.maxValue)||void 0,min:(o=e[0])==null?void 0:o.minValue,onUpdateValue(s){e[0].manuPower=s}})}},{title:"时间",key:"dbtime",render:e=>{var a;return l("span",null,[(a=e[1])==null?void 0:a.dbtime])}},{title:"预测值",key:"manuPower",render(e){var a,n,t,o;return((a=e[1])==null?void 0:a.dbtime)&&h(v,{value:(n=e[1])==null?void 0:n.manuPower,max:((t=e[1])==null?void 0:t.maxValue)||void 0,min:(o=e[1])==null?void 0:o.minValue,onUpdateValue(s){e[1].manuPower=s}})}},{title:"时间",key:"dbtime",render:e=>{var a;return l("span",null,[(a=e[2])==null?void 0:a.dbtime])}},{title:"预测值",key:"manuPower",render(e){var a,n,t,o;return((a=e[2])==null?void 0:a.dbtime)&&h(v,{value:(n=e[2])==null?void 0:n.manuPower,max:((t=e[2])==null?void 0:t.maxValue)||void 0,min:(o=e[2])==null?void 0:o.minValue,onUpdateValue(s){e[2].manuPower=s}})}},{title:"时间",key:"dbtime",render:e=>{var a;return l("span",null,[(a=e[3])==null?void 0:a.dbtime])}},{title:"预测值",key:"manuPower",render(e){var a,n,t,o;return((a=e[3])==null?void 0:a.dbtime)&&h(v,{value:(n=e[3])==null?void 0:n.manuPower,max:((t=e[3])==null?void 0:t.maxValue)||void 0,min:(o=e[3])==null?void 0:o.minValue,onUpdateValue(s){e[3].manuPower=s}})}}],m=p(),_=p([]),c=p(!1),f=async()=>{c.value=!0,m.value=[];const{data:e,error:a}=await F({date:d.dateTime});if(!a){_.value=JSON.parse(JSON.stringify(e)),_.value.forEach(n=>{n.manuPower=n.manuPower?n.manuPower:null}),e.forEach(n=>{n.manuPower=n.manuPower?n.manuPower:null});for(let n=0;n<e.length;n+=4)m.value.push(e.slice(n,n+4));c.value=!1}};f();const U=p(0),S=e=>{d.dateTime=V(0,e),f()},$=async()=>{var w,g;let e=(w=m.value)==null?void 0:w.flat();const a=new Map;_.value.forEach(r=>{r.manuPower!==void 0&&a.set(r.id,r.manuPower)}),e=e.filter(r=>{const i=a.get(r.id);return i!==void 0&&i!==r.manuPower});const{data:n,error:t}=await I(e);if(t)return;const o={content:"",matime:d.dateTime,otype:0,optime:null};e.forEach(r=>{o.content+=r.manuPower?`${r.dbtime} 预测值${r.manuPower} 
`:""}),!(await R([o])).error&&((g=window.$message)==null||g.success("设置成功"),f())},x=p(!1);return G(()=>m.value,e=>{let a=e==null?void 0:e.flat();const n=new Map;_.value.forEach(t=>{n.set(t.id,t.manuPower)}),a=a.filter(t=>n.get(t.id)!==t.manuPower),x.value=a.length>0},{deep:!0}),(e,a)=>{const n=K,t=O,o=X,s=q,w=B,g=L,r=H;return P(),J("div",Q,[l(r,{bordered:!1,size:"small",class:"sm:flex-1-hidden card-wrapper"},{header:u(()=>[l(s,{align:"center",wrap:"",justify:"start",class:"lt-sm:w-200px"},{default:u(()=>[b(" 人工干预设置 "),l(o,null,{default:u(()=>[l(n,{"formatted-value":d.dateTime,"onUpdate:formattedValue":a[0]||(a[0]=i=>d.dateTime=i),"value-format":"yyyy-MM-dd",type:"date","onUpdate:value":S,style:{width:"200px"}},null,8,["formatted-value"]),l(y(D),{type:"primary",ghost:"",onClick:f},{icon:u(()=>[l(t,{class:C(["text-icon",{"animate-spin":c.value}])},null,8,["class"])]),default:u(()=>[b(" "+T(y(E)("common.search")),1)]),_:1})]),_:1})]),_:1})]),"header-extra":u(()=>[l(s,{align:"center",wrap:"",justify:"end",class:"lt-sm:w-200px"},{default:u(()=>{var i,k;return[(i=m.value)!=null&&i.length&&((k=m.value)==null?void 0:k.length)>0?(P(),M(y(D),{key:0,onClick:$,type:"primary",ghost:"",disabled:!x.value},{icon:u(()=>[l(w,{class:C(["text-icon",{"animate-spin":c.value}])},null,8,["class"])]),default:u(()=>[b(" "+T(y(E)("common.save")),1)]),_:1},8,["disabled"])):A("",!0)]}),_:1})]),default:u(()=>[(P(),M(g,{columns:N,data:m.value,bordered:!1,"flex-height":!0,class:"sm:h-full","row-key":i=>i.id,key:U.value,loading:c.value,"virtual-scroll":""},null,8,["data","row-key","loading"]))]),_:1})])}}});export{re as default};