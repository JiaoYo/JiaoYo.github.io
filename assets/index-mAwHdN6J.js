import{_ as X}from"./table-header-operation.vue_vue_type_script_setup_true_lang-BVGDdFoF.js";import{d as B,q as V,s as H,v as I,x as Z,b as J,r as Q,y as Y,K as ee,o as F,c as L,w as a,g as e,h as C,t as U,i as t,$ as D,U as $,L as te,X as z,C as ae,A as le,D as P,B as j,E as K,aa as oe,ab as ne,M as se,a9 as E,Z as ie,am as re,e as me,ac as M,ad as ce}from"./index-DE8JjPFO.js";import{u as pe,a as de}from"./table-B4bQefWT.js";import{f as ue}from"./threat-3KhHgK2d.js";import{b as _e,a as q,T as fe}from"./basicconf-dVDi0WoH.js";import{_ as A}from"./DatePicker-DZboyDqN.js";import{_ as ve}from"./round-search-GCqtZmH9.js";import{_ as ye}from"./round-refresh-CzNrhDxl.js";import{_ as he}from"./FormItemGridItem-C8_xdsl_.js";import{_ as be}from"./Grid-C3IXGS4o.js";import{_ as ge}from"./DataTable-Dhl1KVmG.js";import"./table-column-setting.vue_vue_type_script_setup_true_lang-B10xqN1V.js";import"./setting-outlined-Cbbc7pzF.js";import"./round-delete-TapkcigZ.js";import"./refresh-Bb_TgUpU.js";import"./Upload-CtjJYdv4.js";import"./Progress-CtZzoqRU.js";import"./Popconfirm-tGD_AQ1j.js";import"./TimePicker-D5jQXZqA.js";import"./defineProperty-D8KMDV5y.js";import"./Forward-zVbnYjOG.js";const we=B({name:"OperateDrawer",__name:"operate-drawer",props:V({operateType:{},rowData:{}},{visible:{type:Boolean,default:!1},visibleModifiers:{}}),emits:V(["submitted"],["update:visible"]),setup(_,{emit:T}){const u=_,r=H(_,"visible"),{formRef:b,validate:o,restoreValidation:g}=I(),{defaultRequiredRule:w}=Z(),f=J(()=>({add:"新增威胁事件",edit:"编辑威胁事件"})[u.operateType]),l=Q(i());function i(){return{ttype:0,tlevel:void 0,edesc:"",recivetime:void 0,alarmtime:void 0}}const x={ttype:w,tlevel:w};function h(){Object.assign(l,i()),u.operateType==="edit"&&u.rowData&&Object.assign(l,u.rowData)}function R(){r.value=!1}async function S(){await o()}return Y(r,()=>{r.value&&(h(),g())}),(v,s)=>{const N=z,y=ae,m=le,n=A,c=P,k=j,O=K,p=oe,G=ne,W=ee("no-space");return F(),L(G,{show:r.value,"onUpdate:show":s[5]||(s[5]=d=>r.value=d),"display-directive":"show",width:360},{default:a(()=>[e(p,{title:f.value,"native-scrollbar":!1,closable:""},{footer:a(()=>[e(O,{size:16},{default:a(()=>[e(k,{onClick:R},{default:a(()=>[C(U(t(D)("common.cancel")),1)]),_:1}),e(k,{type:"primary",onClick:S},{default:a(()=>[C(U(t(D)("common.confirm")),1)]),_:1})]),_:1})]),default:a(()=>[e(c,{ref_key:"formRef",ref:b,model:l,rules:x},{default:a(()=>[e(y,{label:"事件类型",path:"ttype"},{default:a(()=>[e(N,{filterable:"",value:l.ttype,"onUpdate:value":s[0]||(s[0]=d=>l.ttype=d),placeholder:"请选择事件类型",options:t($)(t(_e)),style:{width:"100%"}},null,8,["value","options"])]),_:1}),e(y,{label:"级别",path:"tlevel"},{default:a(()=>[e(N,{filterable:"",value:l.tlevel,"onUpdate:value":s[1]||(s[1]=d=>l.tlevel=d),placeholder:"请选择级别",options:t($)(t(q)),style:{width:"100%"}},null,8,["value","options"])]),_:1}),e(y,{label:"事件描述",path:"edesc"},{default:a(()=>[te(e(m,{type:"textarea",value:l.edesc,"onUpdate:value":s[2]||(s[2]=d=>l.edesc=d),placeholder:"请输入事件描述",clearable:""},null,8,["value"]),[[W]])]),_:1}),e(y,{label:"接收时间",path:"recivetime"},{default:a(()=>[e(n,{placeholder:"请选择接收时间","formatted-value":l.recivetime,"onUpdate:formattedValue":s[3]||(s[3]=d=>l.recivetime=d),"value-format":"yyyy-MM-dd HH:mm:ss",type:"datetime",clearable:"",style:{width:"100%"}},null,8,["formatted-value"])]),_:1}),e(y,{label:"告警时间",path:"alarmtime"},{default:a(()=>[e(n,{placeholder:"请选择告警时间","formatted-value":l.alarmtime,"onUpdate:formattedValue":s[4]||(s[4]=d=>l.alarmtime=d),"value-format":"yyyy-MM-dd HH:mm:ss",type:"datetime",clearable:"",style:{width:"100%"}},null,8,["formatted-value"])]),_:1})]),_:1},8,["model"])]),_:1},8,["title"])]),_:1},8,["show"])}}}),ke=B({name:"FormSearch",__name:"form-search",props:{model:{required:!0},modelModifiers:{}},emits:V(["reset","search"],["update:model"]),setup(_,{emit:T}){const u=T,{formRef:r,restoreValidation:b}=I(),o=H(_,"model");async function g(l,i){l?(o.value.startTime=l[0],o.value.endTime=l[1]):(o.value.startTime=null,o.value.endTime=null),u("search")}async function w(){await b(),o.value.timeRange=null,u("reset")}async function f(){u("search")}return(l,i)=>{const x=z,h=he,R=A,S=ye,v=j,s=ve,N=K,y=be,m=P,n=E;return F(),L(n,{bordered:!1,size:"small",class:"card-wrapper"},{default:a(()=>[e(m,{ref_key:"formRef",ref:r,model:o.value,"label-placement":"left","label-width":100,"show-feedback":!1,onKeyup:se(f,["enter"])},{default:a(()=>[e(y,{responsive:"screen","item-responsive":""},{default:a(()=>[e(h,{span:"24 s:12 m:6",label:"级别",path:"tlevel",class:"pr-24px"},{default:a(()=>[e(x,{filterable:"",clearable:"",value:o.value.tlevel,"onUpdate:value":[i[0]||(i[0]=c=>o.value.tlevel=c),f],placeholder:"请选择级别",options:t($)(t(q))},null,8,["value","options"])]),_:1}),e(h,{span:"24 s:12 m:8",label:"告警时间",path:"timeRange",class:"pr-24px"},{default:a(()=>[e(R,{"start-placeholder":"起始告警时间","end-placeholder":"终止告警时间","formatted-value":o.value.timeRange,"onUpdate:formattedValue":[i[1]||(i[1]=c=>o.value.timeRange=c),g],"value-format":"yyyy-MM-dd HH:mm:ss",type:"datetimerange",clearable:"",style:{width:"100%"}},null,8,["formatted-value"])]),_:1}),e(h,{span:"24 m:6",class:"pr-24px"},{default:a(()=>[e(N,{class:"w-full"},{default:a(()=>[e(v,{onClick:w},{icon:a(()=>[e(S,{class:"text-icon"})]),default:a(()=>[C(" "+U(t(D)("common.reset")),1)]),_:1}),e(v,{type:"primary",ghost:"",onClick:f},{icon:a(()=>[e(s,{class:"text-icon"})]),default:a(()=>[C(" "+U(t(D)("common.search")),1)]),_:1})]),_:1})]),_:1})]),_:1})]),_:1},8,["model"])]),_:1})}}}),xe={class:"min-h-500px flex-col-stretch gap-16px overflow-auto lt-sm:overflow-auto"};function Ne(_){return typeof _=="function"||Object.prototype.toString.call(_)==="[object Object]"&&!ce(_)}const Ae=B({name:"intelligence_threatevent",__name:"index",setup(_){const T=ie(),{columns:u,columnChecks:r,data:b,getData:o,loading:g,mobilePagination:w,searchParams:f,resetSearchParams:l}=pe({apiFn:ue,immediate:!0,apiParams:{page:1,pageSize:20,limit:20,tlevel:null,startTime:null,endTime:null,_t:new Date().getTime()},columns:()=>[{type:"selection",align:"center",width:48,fixed:"left"},{key:"ttype",title:"事件类型",align:"center",minWidth:200,ellipsis:{tooltip:!0}},{key:"tlevel",title:"事件等级",align:"center",width:120,render:m=>{(m.tlevel===void 0||m.tlevel===null)&&(m.tlevel=0);const n={0:"#8e9dff",1:"#5da8ff",2:"#fedc69",3:"#ff9874",4:"#ff0000"},c=D(fe[m.tlevel]);let k={color:n[m.tlevel],textColor:"#ffffff",borderColor:n[m.tlevel]};return e(re,{size:"small",color:k},Ne(c)?c:{default:()=>[c]})}},{key:"edesc",title:"事件描述",align:"center",minWidth:120,ellipsis:{tooltip:!0}},{key:"recivetime",title:"接收时间",align:"center",width:160},{key:"alarmtime",title:"告警时间",align:"center",width:160}]}),{drawerVisible:i,operateType:x,editingData:h,handleAdd:R,handleEdit:S,checkedRowKeys:v,onBatchDeleted:s,onDeleted:N,closeDrawer:y}=de(b,o);return(m,n)=>{const c=X,k=ge,O=E;return F(),me("div",xe,[e(ke,{model:t(f),"onUpdate:model":n[0]||(n[0]=p=>M(f)?f.value=p:null),onReset:t(l),onSearch:t(o)},null,8,["model","onReset","onSearch"]),e(O,{title:"威胁事件",bordered:!1,size:"small",class:"sm:flex-1-hidden"},{"header-extra":a(()=>[e(c,{columns:t(r),"onUpdate:columns":n[1]||(n[1]=p=>M(r)?r.value=p:null),"disabled-delete":t(v).length===0,loading:t(g),onRefresh:t(o)},null,8,["columns","disabled-delete","loading","onRefresh"])]),default:a(()=>[e(k,{"checked-row-keys":t(v),"onUpdate:checkedRowKeys":n[2]||(n[2]=p=>M(v)?v.value=p:null),columns:t(u),data:t(b),size:"small","flex-height":!t(T).isMobile,"scroll-x":962,loading:t(g),remote:"","row-key":p=>p.id,pagination:t(w),class:"sm:h-full"},null,8,["checked-row-keys","columns","data","flex-height","loading","row-key","pagination"]),e(we,{visible:t(i),"onUpdate:visible":n[3]||(n[3]=p=>M(i)?i.value=p:null),"operate-type":t(x),"row-data":t(h),onSubmitted:t(o)},null,8,["visible","operate-type","row-data","onSubmitted"])]),_:1})])}}});export{Ae as default};