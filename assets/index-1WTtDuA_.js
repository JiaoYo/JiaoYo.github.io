import{_ as W}from"./table-header-operation.vue_vue_type_script_setup_true_lang-BVGDdFoF.js";import{d as z,q as I,j as q,v as X,s as Z,o as D,c as C,w as l,g as a,i as e,$ as k,U as J,e as A,ai as Q,N as Y,h as V,t as H,f as ee,M as te,X as ae,B as ne,E as le,D as oe,a9 as F,Z as se,am as ie,ac as P,ad as re}from"./index-DE8JjPFO.js";import{u as ce,a as me}from"./table-B4bQefWT.js";import{_ as pe,a as de}from"./arrow-open-up-C1xpBspI.js";import{_ as ue}from"./round-search-GCqtZmH9.js";import{_ as _e}from"./round-refresh-CzNrhDxl.js";import{u as $}from"./usePageData-4x1EOEcn.js";import{g as fe,h as ge,i as he}from"./events-nB1fHkKT.js";import{a as ve,T as ye}from"./basicconf-dVDi0WoH.js";import{_ as be}from"./FormItemGridItem-C8_xdsl_.js";import{_ as xe}from"./DatePicker-DZboyDqN.js";import{_ as De}from"./Grid-C3IXGS4o.js";import{_ as ke}from"./DataTable-Dhl1KVmG.js";import"./table-column-setting.vue_vue_type_script_setup_true_lang-B10xqN1V.js";import"./setting-outlined-Cbbc7pzF.js";import"./round-delete-TapkcigZ.js";import"./refresh-Bb_TgUpU.js";import"./Upload-CtjJYdv4.js";import"./Progress-CtZzoqRU.js";import"./Popconfirm-tGD_AQ1j.js";import"./TimePicker-D5jQXZqA.js";import"./defineProperty-D8KMDV5y.js";import"./Forward-zVbnYjOG.js";const we=z({name:"FormSearch",__name:"form-search",props:{model:{required:!0},modelModifiers:{}},emits:I(["reset","search"],["update:model"]),setup(_,{emit:S}){const g=S,c=q(!1),{formRef:w,restoreValidation:h}=X(),n=Z(_,"model"),{pageData:v,getData:y,nextPage:N}=$(fe),B=async i=>{const t=i.currentTarget;t.scrollTop+t.offsetHeight>=t.scrollHeight&&v.data.length<v.total&&N()},{pageData:T,getData:E,nextPage:L}=$(ge),M=async i=>{const t=i.currentTarget;t.scrollTop+t.offsetHeight>=t.scrollHeight&&T.data.length<T.total&&L()};async function m(i,t){i?(n.value.startTime=i[0],n.value.endTime=i[1]):(n.value.startTime=null,n.value.endTime=null),g("search")}async function U(){await h(),n.value.timeRange=null,g("reset")}async function f(){g("search")}return y(),E(),(i,t)=>{const b=ae,u=be,s=xe,o=_e,p=ne,x=ue,R=pe,r=de,O=le,G=De,j=oe,K=F;return D(),C(K,{bordered:!1,size:"small",class:"card-wrapper"},{default:l(()=>[a(j,{ref_key:"formRef",ref:w,model:n.value,"label-placement":"left","label-width":100,"show-feedback":!1,onKeyup:te(f,["enter"])},{default:l(()=>[a(G,{responsive:"screen","item-responsive":"","y-gap":20},{default:l(()=>[a(u,{span:"24 s:24 m:6",label:"事件名称",path:"enameid",class:"pr-24px"},{default:l(()=>[a(b,{value:n.value.enameid,"onUpdate:value":[t[0]||(t[0]=d=>n.value.enameid=d),f],placeholder:"请选择事件名称",clearable:"",filterable:"","value-field":"id","label-field":"ename",options:e(v).data,"reset-menu-on-options-change":!1,onScroll:B},null,8,["value","options"])]),_:1}),a(u,{span:"24 s:24 m:6",label:e(k)("page.manage.alarm.level"),path:"elevel",class:"pr-24px"},{default:l(()=>[a(b,{filterable:"",clearable:"",placeholder:e(k)("page.manage.alarm.form.level"),value:n.value.elevel,"onUpdate:value":[t[1]||(t[1]=d=>n.value.elevel=d),f],options:e(J)(e(ve))},null,8,["placeholder","value","options"])]),_:1},8,["label"]),c.value?(D(),A(Q,{key:0},[a(u,{span:"24 s:24 m:12",label:"时间",path:"timeRange",class:"pr-24px"},{default:l(()=>[a(s,{clearable:"",value:n.value.timeRange,"onUpdate:value":t[2]||(t[2]=d=>n.value.timeRange=d),type:"datetimerange","value-format":"yyyy-MM-dd HH:mm:ss",style:{width:"100%"},"onUpdate:formattedValue":m},null,8,["value"])]),_:1}),a(u,{span:"24 s:12 m:6",label:"策略名称",path:"pnameid",class:"pr-24px"},{default:l(()=>[a(b,{value:n.value.pnameid,"onUpdate:value":[t[3]||(t[3]=d=>n.value.pnameid=d),f],placeholder:"请选择策略名称",clearable:"",filterable:"","value-field":"id","label-field":"aname",options:e(T).data,"reset-menu-on-options-change":!1,onScroll:M},null,8,["value","options"])]),_:1})],64)):Y("",!0),a(u,{span:"24 m:6",class:"pr-24px",label:" "},{default:l(()=>[a(O,{class:"w-full",align:"center"},{default:l(()=>[a(p,{onClick:U},{icon:l(()=>[a(o,{class:"text-icon"})]),default:l(()=>[V(" "+H(e(k)("common.reset")),1)]),_:1}),a(p,{type:"primary",ghost:"",onClick:f},{icon:l(()=>[a(x,{class:"text-icon"})]),default:l(()=>[V(" "+H(e(k)("common.search")),1)]),_:1}),ee("div",{class:"cursor-pointer",title:"精准查询",onClick:t[4]||(t[4]=d=>c.value=!c.value)},[c.value?(D(),C(R,{key:0,class:"text-icon"})):(D(),C(r,{key:1,class:"text-icon"}))])]),_:1})]),_:1})]),_:1})]),_:1},8,["model"])]),_:1})}}}),Te={class:"min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto"};function Se(_){return typeof _=="function"||Object.prototype.toString.call(_)==="[object Object]"&&!re(_)}const Ze=z({name:"eventalarm_associatedevents",__name:"index",setup(_){const S=se(),{columns:g,columnChecks:c,data:w,getData:h,loading:n,mobilePagination:v,searchParams:y,resetSearchParams:N}=ce({apiFn:he,immediate:!0,apiParams:{page:1,pageSize:20,limit:20,pnameid:null,enameid:null,elevel:null,startTime:null,endTime:null,fuzzy:null,_t:new Date().getTime()},columns:()=>[{type:"selection",align:"center",width:48,fixed:"left"},{key:"pname",title:"事件类型",align:"center",minWidth:160,ellipsis:{tooltip:!0}},{key:"ename",title:"事件名称",align:"center",minWidth:160,ellipsis:{tooltip:!0}},{key:"aname",title:"策略名称",align:"center",minWidth:160,ellipsis:{tooltip:!0}},{key:"elevel",title:"事件等级",align:"center",minWidth:120,render:s=>{(s.elevel===void 0||s.elevel===null)&&(s.elevel=1);const o={0:"#8e9dff",1:"#5da8ff",2:"#fedc69",3:"#ff9874",4:"#ff0000"},p=k(ye[s.elevel]);let x={color:o[s.elevel],textColor:"#ffffff",borderColor:o[s.elevel]};return a(ie,{size:"small",color:x},Se(p)?p:{default:()=>[p]})}},{key:"num",title:"次数",align:"center",width:180},{key:"gnrtime",title:"产生时间",align:"center",width:180},{key:"dbtime",title:"更新时间",align:"center",width:180}]}),{drawerVisible:B,operateType:T,editingData:E,handleAdd:L,handleEdit:M,checkedRowKeys:m,onBatchDeleted:U,onDeleted:f,closeDrawer:i}=me(w,h);async function t(){console.log(m.value),b(m.value)}async function b(s,o){}async function u(){}return(s,o)=>{const p=W,x=ke,R=F;return D(),A("div",Te,[a(we,{model:e(y),"onUpdate:model":o[0]||(o[0]=r=>P(y)?y.value=r:null),onReset:e(N),onSearch:e(h)},null,8,["model","onReset","onSearch"]),a(R,{title:"关联事件",bordered:!1,size:"small",class:"sm:flex-1-hidden card-wrapper"},{"header-extra":l(()=>[a(p,{columns:e(c),"onUpdate:columns":o[1]||(o[1]=r=>P(c)?c.value=r:null),"disabled-delete":e(m).length===0,loading:e(n),onAdd:e(L),onDelete:t,onRefresh:e(h),"is-view-export-button":!0,onExportHandler:u},null,8,["columns","disabled-delete","loading","onAdd","onRefresh"])]),default:l(()=>[a(x,{"checked-row-keys":e(m),"onUpdate:checkedRowKeys":o[2]||(o[2]=r=>P(m)?m.value=r:null),columns:e(g),data:e(w),size:"small","flex-height":!e(S).isMobile,"scroll-x":962,loading:e(n),remote:"","row-key":r=>r.id,pagination:e(v),class:"sm:h-full"},null,8,["checked-row-keys","columns","data","flex-height","loading","row-key","pagination"])]),_:1})])}}});export{Ze as default};