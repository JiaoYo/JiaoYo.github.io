import{_ as De}from"./table-header-operation.vue_vue_type_script_setup_true_lang-CQRJ3Aex.js";import{d as Y,q as Q,s as ie,v as ce,x as Ne,b as Ue,r as le,j as de,y as oe,K,o as g,c as h,w as l,g as e,h as S,t as L,i as o,$ as y,L as H,U as W,N as R,M as ue,as as Ae,a$ as Re,A as pe,X as me,E as X,D as fe,B as Z,F as Pe,f as Te,e as _e,ai as ze,a9 as ve,Z as $e,am as Fe,ac as I,ad as Oe}from"./index-CIkMAdTj.js";import{u as je,a as Be}from"./table-DYjxKyYT.js";import{a as Me,h as Ve,k as qe,l as Ge,m as Ee,n as Ie,o as Ke}from"./Collection-DOLuVfZ8.js";import{C as Le,c as ge,d as He,e as We}from"./collection-C4l2YWcy.js";import{r as Xe}from"./asset-DLVp5pDE.js";import{u as ne}from"./usePageData-BiqXe7A3.js";import{_ as be}from"./FormItemGridItem-B-PuJtjX.js";import{_ as Ze}from"./Cascader-Bbw2Uyx7.js";import{b as Je,a as Qe,_ as Ye}from"./DataTable-DUhJ-ag2.js";import{_ as he}from"./Grid-BbZ5ihyN.js";import{_ as ea,a as aa}from"./arrow-open-up-C4FwuMLW.js";import{_ as ta}from"./round-search-DolOrREp.js";import{_ as la}from"./round-refresh-Cw_OacQi.js";import{h as se}from"./permission-9-vwFfOY.js";import{_ as oa}from"./Popconfirm-uRFGs8ok.js";import"./table-column-setting.vue_vue_type_script_setup_true_lang-DyTGTkTN.js";import"./setting-outlined-BjNyCKNK.js";import"./round-delete-5y7n-Q4W.js";import"./refresh-CQAxWQOp.js";import"./Upload-D11BssPZ.js";import"./Progress-DCQkG3_f.js";import"./Forward-BV1I61Y9.js";const na=Y({name:"CollectorModal",__name:"collector_modal",props:Q({operateType:{},rowData:{}},{visible:{type:Boolean,default:!1},visibleModifiers:{}}),emits:Q(["submitted"],["update:visible"]),setup(w,{emit:F}){const u=w,D=F,b=ie(w,"visible"),{formRef:c,validate:k,restoreValidation:O}=ce(),{createConfirmPwdRule:P,defaultRequiredRule:N,patternRules:T}=Ne(),j=Ue(()=>({add:"新增采集器",edit:"编辑采集器"})[u.operateType]),a=le(x());function x(){return{id:void 0,cname:"",cencode:0,accmed:1,proser:void 0,caddr:"",logsoudev:void 0,filterpro:void 0,cdesc:"",proper:0,enable:0,rev:void 0,port:void 0,uname:void 0,pswd:void 0,fpath:void 0}}const f={cname:N,caddr:[{required:!0,message:"请输入采集器地址",trigger:["blur","input"]},{required:!0,validator:Ae,trigger:["blur","input"]}],rev:N,port:{required:!0,trigger:["blur","input"],validator:(p,t,m)=>t?Re(t)?!0:new Error("请输入在0-65535之间的数字"):new Error("请输入端口号")},uname:N,pswd:N,cencode:{type:"number",required:!0,trigger:["blur","change"],message:"请选择编码格式"},accmed:{type:"number",required:!0,trigger:["blur","change"],message:"请选择接入方式"},logsoudev:{type:"number",required:!0,trigger:["blur","change"],message:"请选择日志源设备"}},{pageData:_,getData:C,nextPage:B}=ne(Me),M=async p=>{const t=p.currentTarget;t.scrollTop+t.offsetHeight>=t.scrollHeight&&_.data.length<_.total&&B()},{pageData:U,getData:V,nextPage:q}=ne(Ve),z=async p=>{const t=p.currentTarget;t.scrollTop+t.offsetHeight>=t.scrollHeight&&U.data.length<U.total&&q()},i=de(),r=async()=>{const{data:p,error:t}=await Ee();i.value=p.map(m=>({...m,id:"-"+m.id,type:m.cname}))};function v(){C(),r(),V(),Object.assign(a,x()),u.operateType==="edit"&&u.rowData&&(Object.assign(a,u.rowData),$.clickNums=1)}function A(){b.value=!1}const $=le({clickNums:0,isLoading:!1});async function s(){var p,t;if(await k(),u.operateType==="add"){const{data:m,error:d}=await qe([a]);d||((p=window.$message)==null||p.success(y("common.addSuccess")),A(),D("submitted"),a.proper==0&&await Xe([{aname:a.cname,aip:a.caddr,tid:36,cid:m}]))}else{const{data:m,error:d}=await Ge([a]);d||((t=window.$message)==null||t.success(y("common.updateSuccess")),A(),D("submitted"))}}const J=p=>{Object.assign(a,{logsoudev:void 0,rev:void 0,port:void 0,uname:void 0,pswd:void 0}),p==4&&(a.logsoudev=53)};return oe(b,()=>{b.value&&(v(),O())}),oe(()=>a.caddr,()=>{$.clickNums=0}),(p,t)=>{const m=pe,d=be,G=me,ye=Ze,E=Je,ee=X,ae=Qe,we=he,ke=fe,te=Z,xe=X,Ce=Pe,Se=K("no-space");return g(),h(Ce,{show:b.value,"onUpdate:show":t[14]||(t[14]=n=>b.value=n),title:j.value,preset:"card",class:"w-850px"},{footer:l(()=>[e(xe,{size:16,justify:"end"},{default:l(()=>[e(te,{onClick:A},{default:l(()=>[S(L(o(y)("common.cancel")),1)]),_:1}),e(te,{type:"primary",onClick:s},{default:l(()=>[S(L(o(y)("common.confirm")),1)]),_:1})]),_:1})]),default:l(()=>[e(ke,{ref_key:"formRef",ref:c,model:a,rules:f,"label-placement":"left","label-width":120,onKeyup:ue(s,["enter"])},{default:l(()=>[e(we,{responsive:"screen","item-responsive":"","x-gap":20},{default:l(()=>[e(d,{span:"24 s:12 m:12",label:"采集器名称",path:"cname"},{default:l(()=>[H(e(m,{value:a.cname,"onUpdate:value":t[0]||(t[0]=n=>a.cname=n),placeholder:"请输入采集器名称",clearable:""},null,8,["value"]),[[Se]])]),_:1}),e(d,{span:"24 s:12 m:12",label:"编码格式",path:"cencode"},{default:l(()=>[e(G,{value:a.cencode,"onUpdate:value":t[1]||(t[1]=n=>a.cencode=n),placeholder:"请选择编码格式",filterable:"",clearable:"",options:o(W)(o(Le))},null,8,["value","options"])]),_:1}),e(d,{span:"24 s:12 m:12",label:"接入方式",path:"accmed"},{default:l(()=>[e(G,{value:a.accmed,"onUpdate:value":[t[2]||(t[2]=n=>a.accmed=n),J],placeholder:"请选择接入方式",filterable:"",clearable:"",disabled:p.operateType==="edit",options:o(W)(o(ge))},null,8,["value","disabled","options"])]),_:1}),e(d,{span:"24 s:12 m:12",label:"代理服务器",path:"proser"},{default:l(()=>[e(G,{value:a.proser,"onUpdate:value":t[3]||(t[3]=n=>a.proser=n),placeholder:"请选择代理服务器",clearable:"",filterable:"","value-field":"id","label-field":"pip",options:o(_).data,"reset-menu-on-options-change":!1,onScroll:M},null,8,["value","options"])]),_:1}),e(d,{span:"24 s:12 m:12",label:"采集地址",path:"caddr"},{default:l(()=>[e(m,{value:a.caddr,"onUpdate:value":t[4]||(t[4]=n=>a.caddr=n),placeholder:"请输入采集地址",clearable:""},null,8,["value"])]),_:1}),[0,1,4,5,7,8].includes(a.accmed)?(g(),h(d,{key:0,span:"24 s:12 m:12",label:"日志源设备",path:"logsoudev"},{default:l(()=>[e(ye,{value:a.logsoudev,"onUpdate:value":t[5]||(t[5]=n=>a.logsoudev=n),placeholder:"请选择日志源设备",options:i.value,"check-strategy":"child","children-field":"data","value-field":"id","label-field":"type",clearable:"","show-path":!1},null,8,["value","options"])]),_:1})):R("",!0),e(d,{span:"24 s:12 m:12",label:"过滤策略",path:"filterpro"},{default:l(()=>[e(G,{clearable:"",filterable:"",value:a.filterpro,"onUpdate:value":t[6]||(t[6]=n=>a.filterpro=n),placeholder:"请选择过滤策略",options:o(U).data,"value-field":"id","label-field":"pname","reset-menu-on-options-change":!1,onScroll:z},null,8,["value","options"])]),_:1}),[3,7,8].includes(a.accmed)?(g(),h(d,{key:1,span:"24 s:12 m:12",label:a.accmed==3?"数据库名称":a.accmed==4?"域名":(a.accmed==7,"目录"),path:"rev"},{default:l(()=>[e(m,{value:a.rev,"onUpdate:value":t[7]||(t[7]=n=>a.rev=n),placeholder:"请输入",clearable:""},null,8,["value"])]),_:1},8,["label"])):R("",!0),[3,4,7,8].includes(a.accmed)?(g(),h(d,{key:2,span:"24 s:12 m:12",label:"端口",path:"port"},{default:l(()=>[e(m,{value:a.port,"onUpdate:value":t[8]||(t[8]=n=>a.port=n),placeholder:"请输入端口",clearable:""},null,8,["value"])]),_:1})):R("",!0),[3,4,7,8,9].includes(a.accmed)?(g(),h(d,{key:3,span:"24 s:12 m:12",label:"用户名",path:"uname"},{default:l(()=>[e(m,{value:a.uname,"onUpdate:value":t[9]||(t[9]=n=>a.uname=n),placeholder:"请输入用户名",clearable:""},null,8,["value"])]),_:1})):R("",!0),[3,4,7,8,9].includes(a.accmed)?(g(),h(d,{key:4,span:"24 s:12 m:12",label:"密码",path:"pswd"},{default:l(()=>[e(m,{value:a.pswd,"onUpdate:value":t[10]||(t[10]=n=>a.pswd=n),placeholder:"请输入密码",clearable:""},null,8,["value"])]),_:1})):R("",!0),p.operateType=="add"?(g(),h(d,{key:5,span:"24 s:12 m:12",label:"生成资产",path:"proper"},{default:l(()=>[e(ae,{value:a.proper,"onUpdate:value":t[11]||(t[11]=n=>a.proper=n),name:"radiogroup"},{default:l(()=>[e(ee,null,{default:l(()=>[e(E,{value:0},{default:l(()=>[S("是")]),_:1}),e(E,{value:1},{default:l(()=>[S("否")]),_:1})]),_:1})]),_:1},8,["value"])]),_:1})):R("",!0),e(d,{span:"24 s:12 m:12",label:"是否启用",path:"enable"},{default:l(()=>[e(ae,{value:a.enable,"onUpdate:value":t[12]||(t[12]=n=>a.enable=n),name:"radiogroup"},{default:l(()=>[e(ee,null,{default:l(()=>[e(E,{value:0},{default:l(()=>[S("是")]),_:1}),e(E,{value:1},{default:l(()=>[S("否")]),_:1})]),_:1})]),_:1},8,["value"])]),_:1}),e(d,{span:"24 s:24 m:24",label:"描述",path:"cdesc"},{default:l(()=>[e(m,{type:"textarea",value:a.cdesc,"onUpdate:value":t[13]||(t[13]=n=>a.cdesc=n),placeholder:"请输入描述",clearable:""},null,8,["value"])]),_:1})]),_:1})]),_:1},8,["model"])]),_:1},8,["show","title"])}}}),sa=Y({name:"FormSearch",__name:"form-search",props:{model:{required:!0},modelModifiers:{}},emits:Q(["reset","search"],["update:model"]),setup(w,{emit:F}){const u=F,{formRef:D,restoreValidation:b}=ce(),c=ie(w,"model"),k=de(!1);function O(x){c.value.enable=x,u("search")}function P(x){c.value.accmed=x,u("search")}function N(){c.value.fuzzy=void 0,u("search")}function T(){c.value.caddr=void 0,u("search")}async function j(){await b(),u("reset")}async function a(){u("search")}return(x,f)=>{const _=pe,C=be,B=la,M=Z,U=ta,V=ea,q=aa,z=X,i=me,r=he,v=fe,A=ve,$=K("no-space");return g(),h(A,{bordered:!1,size:"small",class:"card-wrapper"},{default:l(()=>[e(v,{ref_key:"formRef",ref:D,model:c.value,"label-placement":"left","label-width":100,"show-feedback":!1,onKeyup:ue(a,["enter"])},{default:l(()=>[e(r,{responsive:"screen","item-responsive":""},{default:l(()=>[e(C,{span:"24 s:12 m:6",label:"采集器名称",path:"fuzzy",class:"pr-24px"},{default:l(()=>[H(e(_,{clearable:"",value:c.value.fuzzy,"onUpdate:value":f[0]||(f[0]=s=>c.value.fuzzy=s),placeholder:"请输入采集器名称",onClear:N},null,8,["value"]),[[$]])]),_:1}),e(C,{span:"24 s:12 m:6",label:"采集地址",path:"caddr",class:"pr-24px"},{default:l(()=>[e(_,{clearable:"",value:c.value.caddr,"onUpdate:value":f[1]||(f[1]=s=>c.value.caddr=s),onClear:T,placeholder:"请输入采集地址"},null,8,["value"])]),_:1}),e(C,{span:"24 m:12",class:"pr-24px"},{default:l(()=>[e(z,{class:"w-full",align:"center"},{default:l(()=>[e(M,{onClick:j},{icon:l(()=>[e(B,{class:"text-icon"})]),default:l(()=>[S(" "+L(o(y)("common.reset")),1)]),_:1}),e(M,{type:"primary",ghost:"",onClick:a},{icon:l(()=>[e(U,{class:"text-icon"})]),default:l(()=>[S(" "+L(o(y)("common.search")),1)]),_:1}),Te("div",{class:"cursor-pointer",title:"精准查询",onClick:f[2]||(f[2]=s=>k.value=!k.value)},[k.value?(g(),h(V,{key:0,class:"text-icon"})):(g(),h(q,{key:1,class:"text-icon"}))])]),_:1})]),_:1}),k.value?(g(),_e(ze,{key:0},[e(C,{span:"24 s:12 m:6",label:"接入方式",path:"accmed",class:"pr-24px mt-20px"},{default:l(()=>[e(i,{clearable:"",filterable:"",value:c.value.accmed,"onUpdate:value":f[3]||(f[3]=s=>c.value.accmed=s),placeholder:"请选择接入方式",options:o(W)(o(ge)),onUpdateValue:P,style:{width:"100%"}},null,8,["value","options"])]),_:1}),e(C,{span:"24 s:12 m:6",label:"状态",path:"enable",class:"pr-24px mt-20px"},{default:l(()=>[e(i,{clearable:"",filterable:"",value:c.value.enable,"onUpdate:value":f[4]||(f[4]=s=>c.value.enable=s),placeholder:"请选择状态",options:o(W)(o(He)),onUpdateValue:O,style:{width:"100%"}},null,8,["value","options"])]),_:1})],64)):R("",!0)]),_:1})]),_:1},8,["model"])]),_:1})}}}),ra={class:"min-h-500px flex-col-stretch gap-16px overflow-auto lt-sm:overflow-auto"};function re(w){return typeof w=="function"||Object.prototype.toString.call(w)==="[object Object]"&&!Oe(w)}const Pa=Y({name:"collectionmanagement_collector",__name:"index",setup(w){const F=$e(),{columns:u,columnChecks:D,data:b,getData:c,loading:k,mobilePagination:O,searchParams:P,resetSearchParams:N}=je({apiFn:Ie,apiParams:{page:1,pageSize:20,limit:20,fuzzy:null,caddr:null,enable:null,accmed:null,_t:new Date().getTime()},immediate:!0,columns:()=>[{type:"selection",align:"center",width:48},{key:"cname",title:"采集器名称",align:"center",width:200},{key:"caddr",title:"采集地址",align:"center",width:200},{key:"accmed",title:"接入方式",align:"center",width:160,render:i=>{const r=We;return e("span",null,[S(" "),r[i.accmed]])}},{key:"pname",title:"过滤策略",align:"center",width:200},{key:"pip",title:"代理服务器",align:"center",width:200},{key:"type",title:"日志源设备",align:"center",width:200},{key:"enable",title:"状态",align:"center",width:160,render:i=>e(X,{justify:"center"},{default:()=>[e(Fe,{type:i.enable==0?"success":"error"},{default:()=>[i.enable==0?"启用":"禁用"]})]})},{key:"operate",title:y("common.operate"),align:"center",width:130,fixed:"right",render:i=>{let r;return e("div",{class:"flex-center gap-8px"},[H(e(Z,{type:"primary",ghost:!0,size:"small",onClick:()=>q(i.id)},re(r=y("common.edit"))?r:{default:()=>[r]}),[[K("no-auth"),"sys.collection.mengement.update"]]),e(oa,{onPositiveClick:()=>V(i.id)},{default:()=>y("common.confirmDelete"),trigger:()=>{let v;return H(e(Z,{type:"error",ghost:!0,size:"small"},re(v=y("common.delete"))?v:{default:()=>[v]}),[[K("no-auth"),"sys.collection.mengement.delete"]])}})])}}]}),{drawerVisible:T,operateType:j,editingData:a,handleAdd:x,handleEdit:f,checkedRowKeys:_,onBatchDeleted:C,onDeleted:B,closeDrawer:M}=Be(b,c);async function U(){console.log(_.value),z(_.value.join(","),i=>{C()})}function V(i){z(i,r=>{B()})}function q(i){f(i)}async function z(i,r){const v=await Ke(i);console.log("data",v),r&&r(v)}return(i,r)=>{const v=De,A=Ye,$=ve;return g(),_e("div",ra,[e(sa,{model:o(P),"onUpdate:model":r[0]||(r[0]=s=>I(P)?P.value=s:null),onReset:o(N),onSearch:o(c)},null,8,["model","onReset","onSearch"]),e($,{title:"采集器管理",bordered:!1,size:"small",class:"sm:flex-1-hidden"},{"header-extra":l(()=>[e(v,{columns:o(D),"onUpdate:columns":r[1]||(r[1]=s=>I(D)?D.value=s:null),"disabled-delete":o(_).length===0,"is-view-add-button":o(se)("sys.collection.mengement.insert"),"is-view-delete-button":o(se)("sys.collection.mengement.delete"),loading:o(k),onAdd:o(x),onDelete:U,onRefresh:o(c)},null,8,["columns","disabled-delete","is-view-add-button","is-view-delete-button","loading","onAdd","onRefresh"])]),default:l(()=>[e(A,{"checked-row-keys":o(_),"onUpdate:checkedRowKeys":r[2]||(r[2]=s=>I(_)?_.value=s:null),columns:o(u),data:o(b),size:"small","flex-height":!o(F).isMobile,"scroll-x":o(u).reduce((s,J)=>s+J.width,0),loading:o(k),remote:"","row-key":s=>s.id,pagination:o(O),class:"sm:h-full"},null,8,["checked-row-keys","columns","data","flex-height","scroll-x","loading","row-key","pagination"]),e(na,{visible:o(T),"onUpdate:visible":r[3]||(r[3]=s=>I(T)?T.value=s:null),"operate-type":o(j),"row-data":o(a),onSubmitted:o(c)},null,8,["visible","operate-type","row-data","onSubmitted"])]),_:1})])}}});export{Pa as default};