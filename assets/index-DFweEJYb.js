import{_ as k}from"./table-header-operation.vue_vue_type_script_setup_true_lang-CQRJ3Aex.js";import{d as w,Z as y,g as a,am as b,E as x,o as T,e as D,w as d,i as e,ac as c,a9 as v}from"./index-CIkMAdTj.js";import{u as N,a as R}from"./table-DYjxKyYT.js";import{h as C}from"./scheduleTask-BXy4glbC.js";import{_ as P}from"./DataTable-DUhJ-ag2.js";import"./table-column-setting.vue_vue_type_script_setup_true_lang-DyTGTkTN.js";import"./setting-outlined-BjNyCKNK.js";import"./round-delete-5y7n-Q4W.js";import"./refresh-CQAxWQOp.js";import"./Upload-D11BssPZ.js";import"./Progress-DCQkG3_f.js";import"./Popconfirm-uRFGs8ok.js";import"./Forward-BV1I61Y9.js";const S={class:"min-h-500px flex-col-stretch gap-16px overflow-auto lt-sm:overflow-auto"},te=w({name:"manage_tasklog",__name:"index",setup(z){const p=y(),{columns:u,columnChecks:n,data:l,getData:r,loading:m,mobilePagination:g,searchParams:B,resetSearchParams:E}=N({apiFn:C,apiParams:{page:1,pageSize:20,limit:20,_t:new Date().getTime()},immediate:!0,columns:()=>[{key:"jobId",title:"任务id",align:"center",width:200,ellipsis:{tooltip:!0}},{key:"beanName",title:"任务名称",align:"center",width:160},{key:"params",title:"参数",align:"center",width:160},{key:"status",title:"任务状态",align:"center",width:160,render:i=>a(x,{justify:"center"},{default:()=>[a(b,{type:i.status==0?"success":"error"},{default:()=>[i.status==0?"成功":"失败"]})]})},{key:"times",title:"耗时(ms)",align:"center",width:100},{key:"sn",title:"网关编号",align:"center",width:200,ellipsis:{tooltip:!0}},{key:"error",title:"失败信息",align:"center",width:160,ellipsis:!0}]}),{drawerVisible:j,operateType:A,editingData:K,handleAdd:O,handleEdit:U,checkedRowKeys:o,onBatchDeleted:V,onDeleted:F,closeDrawer:G}=R(l,r);return(i,s)=>{const _=k,h=P,f=v;return T(),D("div",S,[a(f,{title:"任务日志",bordered:!1,size:"small",class:"sm:flex-1-hidden"},{"header-extra":d(()=>[a(_,{columns:e(n),"onUpdate:columns":s[0]||(s[0]=t=>c(n)?n.value=t:null),"disabled-delete":e(o).length===0,loading:e(m),onRefresh:e(r)},null,8,["columns","disabled-delete","loading","onRefresh"])]),default:d(()=>[a(h,{"checked-row-keys":e(o),"onUpdate:checkedRowKeys":s[1]||(s[1]=t=>c(o)?o.value=t:null),columns:e(u),data:e(l),size:"small","flex-height":!e(p).isMobile,"scroll-x":962,loading:e(m),remote:"","row-key":t=>t.id,pagination:e(g),class:"sm:h-full"},null,8,["checked-row-keys","columns","data","flex-height","loading","row-key","pagination"])]),_:1})])}}});export{te as default};