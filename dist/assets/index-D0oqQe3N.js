import{_ as q}from"./twotone-add-circle-outline-LI9r31d9.js";import{d as C,o as d,b as O,t as k,Z as X,a1 as A,N as W,p as Z,a0 as j,i as H,b8 as i,c as b,w as n,f as a,h as t,$ as E,a3 as J,S as M,g as R,y as Q,a4 as Y,B as ee,E as te,F as ae,X as G,a as oe,aA as z,s as ne,b9 as re,a9 as P,e as K,x as se,bx as le}from"./index-DIyxtJcW.js";import{f as ie}from"./data_report-CXT6ma5u.js";import{u as pe,a as de}from"./table-DklkWdRv.js";import{e as me}from"./exportExcel-Bv4G4H50.js";import{_ as ce}from"./export-B09ItsIc.js";import{_ as ue}from"./round-search-BGhpS_o8.js";import{_ as _e}from"./FormItemGridItem-B9B_mJk9.js";import{_ as ye}from"./DatePicker-wDxPvaZP.js";import{_ as fe}from"./Grid-CRykCFhL.js";import{_ as he}from"./DataTable-D8ENyBVV.js";import"./Forward-r4EUSAJj.js";import"./RadioGroup-DX5jOXNE.js";const we=C({__name:"info",props:["rowData"],setup(f){const m=f;return(h,c)=>(d(),O("div",null,k(m.rowData),1))}}),ge=C({name:"AlarmSearch",__name:"search",props:{model:{required:!0},modelModifiers:{}},emits:X(["reset","search","exportData"],["update:model"]),setup(f,{emit:m}){A({1:"电场1",2:"电场2",3:"电场3"});const h=A({day:"日报",month:"月报",year:"年报"}),c=m,U=W(),{formRef:w,restoreValidation:T}=Z(),e=j(f,"model");e.value.time=H([Number(i(5,Date.now()-864e5*6)),Number(i(5,Date.now()+864e5))]),e.value.startTime=i(0,Date.now()-864e5*6),e.value.endTime=i(0,Date.now()+864e5),e.value.reportType="day";async function u(l,s){e.value.startTime=l[0],e.value.endTime=l[1]}async function r(){var l;if(!e.value.electricFieId){(l=window.$message)==null||l.warning("请选择电场后在进行查询");return}c("search")}const D=()=>{c("exportData")};return(l,s)=>{const F=Y,g=_e,v=ye,V=ue,S=ee,_=ce,$=te,B=fe,N=ae,x=G;return d(),b(x,{bordered:!1,size:"small",class:"card-wrapper"},{default:n(()=>[a(N,{ref_key:"formRef",ref:w,model:e.value,"label-placement":"left","label-width":t(U).locale=="en-US"?120:80,"show-feedback":!1,onKeyup:Q(r,["enter"])},{default:n(()=>[a(B,{"y-gap":16,responsive:"screen","item-responsive":""},{default:n(()=>[a(g,{span:"24 s:12 m:4",label:t(E)("page.datareport.reportType"),path:"level",class:"pr-24px"},{default:n(()=>[a(F,{filterable:"",placeholder:"请选择报表类型",value:e.value.reportType,"onUpdate:value":s[0]||(s[0]=o=>e.value.reportType=o),options:t(J)(t(h))},null,8,["value","options"])]),_:1},8,["label"]),a(g,{span:"24 s:12 m:6",label:"时间",path:"time",class:"pr-24px"},{default:n(()=>[e.value.reportType=="day"?(d(),b(v,{key:0,value:e.value.time,"onUpdate:value":s[1]||(s[1]=o=>e.value.time=o),type:"daterange","value-format":"yyyy-MM-dd","onUpdate:formattedValue":u},null,8,["value"])):M("",!0),e.value.reportType=="month"?(d(),b(v,{key:1,value:e.value.time,"onUpdate:value":s[2]||(s[2]=o=>e.value.time=o),type:"monthrange","value-format":"yyyy-MM",style:{width:"100%"},"onUpdate:formattedValue":u},null,8,["value"])):M("",!0),e.value.reportType=="year"?(d(),b(v,{key:2,value:e.value.time,"onUpdate:value":s[3]||(s[3]=o=>e.value.time=o),type:"yearrange","value-format":"yyyy",style:{width:"100%"},"onUpdate:formattedValue":u},null,8,["value"])):M("",!0)]),_:1}),a(g,{span:"24 s:12 m:6",class:"pr-24px"},{default:n(()=>[a($,{class:"w-full"},{default:n(()=>[a(S,{type:"primary",ghost:"",onClick:r},{icon:n(()=>[a(V,{class:"text-icon"})]),default:n(()=>[R(" "+k(t(E)("common.search")),1)]),_:1}),a(S,{onClick:D},{icon:n(()=>[a(_,{class:"text-icon"})]),default:n(()=>[R(" "+k(t(E)("common.export")),1)]),_:1})]),_:1})]),_:1})]),_:1})]),_:1},8,["model","label-width"])]),_:1})}}}),ve={class:"min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto"},xe={class:"font-size-12px"},$e=C({name:"datareport_ultrashorttermforecastreport",__name:"index",setup(f){const m=oe(()=>r.reportType=="day"?50:0),h=W(),{columns:c,columnChecks:U,data:w,getData:T,loading:e,mobilePagination:u,searchParams:r,resetSearchParams:D}=pe({apiFn:ie,apiParams:{page:1,pageSize:20,limit:20,startTime:i(0,Date.now()-864e5*6),endTime:i(0,Date.now()+864e5),reportType:"",_t:new Date().getTime()},immediate:!1,showTotal:!0,columns:()=>[{title:"",key:"index",width:50,align:"center",render:(o,p)=>`${p+1}`},{type:"expand",width:m,renderExpand:o=>z(we,{rowData:o}),expandable:()=>r.reportType=="day"},{key:"timeFrame",title:"时间范围",align:"center",width:160},{key:"describe",title:"描述",align:"center",minWidth:180},{key:"power_byte",title:"开机容量(兆瓦)",align:"center",width:160},{key:"real_power",title:"实发功率(兆瓦)",align:"center",minWidth:180},{key:"predicted_power",title:"预测功率(兆瓦)",align:"center",width:160},{key:"RMSE",title:"均方根误差",align:"center",width:160},{key:"MAE",title:"平均绝对误差",align:"center",width:160},{key:"Rs",title:"相关性系数",align:"center",minWidth:200}]}),l=[{id:"1",timeFrame:i(0,Date.now()-864e5*5),describe:"日报汇总",power_byte:"53.02",real_power:"44.8",predicted_power:"45.3",RMSE:"0.025",MAE:"0.32",Rs:"0.021"},{id:"2",timeFrame:i(0,Date.now()-864e5*6),describe:"日报汇总",power_byte:"44.21",real_power:"39.2",predicted_power:"48.5",RMSE:"0.051",MAE:"0.02",Rs:"0.04"}],s=()=>{me(l,{timeFrame:"时间范围",describe:"描述",statrttime:"开机容量",devname:"实发功率",dtype:"预测功率",subdtype:"均方根误差",reoetits:"平均绝对误差",content:"相关性系数"},"短期预测日报","sheet1")},{drawerVisible:F,operateType:g,editingData:v,handleAdd:V,handleEdit:S,checkedRowKeys:_,onBatchDeleted:$,onDeleted:B}=de(w,T),N=()=>z(a(q,null,null)),x=o=>{o.detail.key};return ne(()=>{window.addEventListener("localStorageChanged",x)}),re(()=>{window.removeEventListener("localStorageChanged",x)}),(o,p)=>{const I=he,L=G;return d(),O("div",ve,[a(ge,{model:t(r),"onUpdate:model":p[0]||(p[0]=y=>P(r)?r.value=y:null),onReset:t(D),onSearch:t(T),onExportData:s},null,8,["model","onReset","onSearch"]),a(L,{bordered:!1,size:"small",class:"sm:flex-1-hidden card-wrapper"},{header:n(()=>[K("span",null,[R("超短期预测"+k(t(r).reportType=="day"?"日报":t(r).reportType=="month"?"月报":"年报"),1),se(K("span",xe,"(点击+号加载每日报表细化数据)",512),[[le,t(r).reportType=="day"]])])]),default:n(()=>[a(I,{bordered:!1,"render-expand-icon":N,"single-line":!1,"checked-row-keys":t(_),"onUpdate:checkedRowKeys":p[1]||(p[1]=y=>P(_)?_.value=y:null),columns:t(c),data:l,size:"small","flex-height":!t(h).isMobile,"scroll-x":702,loading:t(e),remote:"","row-key":y=>y.id,pagination:t(w).length?t(u):void 0,class:"sm:h-full"},null,8,["checked-row-keys","columns","flex-height","loading","row-key","pagination"])]),_:1})])}}});export{$e as default};
