import{_ as X}from"./table-header-operation.vue_vue_type_script_setup_true_lang-CQRJ3Aex.js";import{d as K,q as j,s as E,v as L,x as Y,b as ee,$ as a,r as te,y as ae,K as M,o as q,c as W,w as o,g as t,h as S,t as z,i as e,L as A,A as H,C as oe,aj as ne,E as Z,D as J,B as O,aa as se,ab as le,M as re,a9 as Q,Z as ie,ar as pe,am as de,e as ce,ac as I,ad as ue}from"./index-CIkMAdTj.js";import{p as me,q as _e,f as fe,r as ye}from"./audit-events-CEe69SfR.js";import{u as ge,a as he}from"./table-DYjxKyYT.js";import{b as ve,a as be,_ as we}from"./DataTable-DUhJ-ag2.js";import{_ as De}from"./round-search-DolOrREp.js";import{_ as Ne}from"./round-refresh-Cw_OacQi.js";import{_ as ke}from"./FormItemGridItem-B-PuJtjX.js";import{_ as xe}from"./Grid-BbZ5ihyN.js";import{h as G}from"./permission-9-vwFfOY.js";import{_ as Se}from"./Popconfirm-uRFGs8ok.js";import"./table-column-setting.vue_vue_type_script_setup_true_lang-DyTGTkTN.js";import"./setting-outlined-BjNyCKNK.js";import"./round-delete-5y7n-Q4W.js";import"./refresh-CQAxWQOp.js";import"./Upload-D11BssPZ.js";import"./Progress-DCQkG3_f.js";import"./Forward-BV1I61Y9.js";const ze=K({name:"OperateDrawer",__name:"operate-drawer",props:j({operateType:{},rowData:{}},{visible:{type:Boolean,default:!1},visibleModifiers:{}}),emits:j(["submitted"],["update:visible"]),setup(f,{emit:T}){const p=f,g=T,m=E(f,"visible"),{formRef:u,validate:D,restoreValidation:C}=L(),{defaultRequiredRule:h}=Y(),F=ee(()=>({add:a("page.audit.type.addTitle"),edit:a("page.audit.type.editTitle")})[p.operateType]),n=te(N());function N(){return{atypename:"",typedesc:"",asort:0,syspara:1}}const k={atypename:h};function R(){Object.assign(n,N()),p.operateType==="edit"&&p.rowData&&Object.assign(n,p.rowData)}function v(){m.value=!1}async function _(){var b,l;if(await D(),p.operateType==="add"){const{data:w,error:d}=await me([{atypename:n.atypename,typedesc:n.typedesc,asort:n.asort,syspara:n.syspara}]);d||((b=window.$message)==null||b.success(a("common.addSuccess")),v(),g("submitted"))}else{const{data:w,error:d}=await _e([{id:p.rowData.id,atypename:n.atypename,typedesc:n.typedesc,asort:n.asort,syspara:n.syspara}]);d||((l=window.$message)==null||l.success(a("common.updateSuccess")),v(),g("submitted"))}}return ae(m,()=>{m.value&&(R(),C())}),(b,l)=>{const w=H,d=oe,$=ne,x=ve,U=Z,r=be,s=J,i=O,B=se,P=le,c=M("no-space");return q(),W(P,{show:m.value,"onUpdate:show":l[4]||(l[4]=y=>m.value=y),"display-directive":"show",width:360},{default:o(()=>[t(B,{title:F.value,"native-scrollbar":!1,closable:""},{footer:o(()=>[t(U,{size:16},{default:o(()=>[t(i,{onClick:v},{default:o(()=>[S(z(e(a)("common.cancel")),1)]),_:1}),t(i,{type:"primary",onClick:_},{default:o(()=>[S(z(e(a)("common.confirm")),1)]),_:1})]),_:1})]),default:o(()=>[t(s,{ref_key:"formRef",ref:u,model:n,rules:k},{default:o(()=>[t(d,{label:e(a)("page.audit.type.name"),path:"atypename"},{default:o(()=>[A(t(w,{clearable:"",value:n.atypename,"onUpdate:value":l[0]||(l[0]=y=>n.atypename=y),placeholder:e(a)("page.audit.type.form.name")},null,8,["value","placeholder"]),[[c]])]),_:1},8,["label"]),t(d,{label:e(a)("page.audit.type.describe"),path:"typedesc"},{default:o(()=>[A(t(w,{clearable:"",value:n.typedesc,"onUpdate:value":l[1]||(l[1]=y=>n.typedesc=y),placeholder:e(a)("page.audit.type.form.describe"),type:"textarea"},null,8,["value","placeholder"]),[[c]])]),_:1},8,["label"]),t(d,{label:e(a)("page.audit.type.sort"),path:"asort"},{default:o(()=>[t($,{min:0,value:n.asort,"onUpdate:value":l[2]||(l[2]=y=>n.asort=y),placeholder:e(a)("page.audit.type.form.sort"),style:{width:"100%"}},null,8,["value","placeholder"])]),_:1},8,["label"]),t(d,{label:e(a)("page.audit.type.systemParams"),path:"syspara"},{default:o(()=>[t(r,{value:n.syspara,"onUpdate:value":l[3]||(l[3]=y=>n.syspara=y),name:"radiogroup"},{default:o(()=>[t(U,null,{default:o(()=>[t(x,{value:0},{default:o(()=>[S(z(e(a)("common.yesOrNo.yes")),1)]),_:1}),t(x,{value:1},{default:o(()=>[S(z(e(a)("common.yesOrNo.no")),1)]),_:1})]),_:1})]),_:1},8,["value"])]),_:1},8,["label"])]),_:1},8,["model"])]),_:1},8,["title"])]),_:1},8,["show"])}}}),Te=K({name:"FormSearch",__name:"form-search",props:{model:{required:!0},modelModifiers:{}},emits:j(["reset","search"],["update:model"]),setup(f,{emit:T}){const p=T,{formRef:g,restoreValidation:m}=L(),u=E(f,"model");function D(){u.value.fuzzy="",p("search")}async function C(){await m(),p("reset")}async function h(){p("search")}return(F,n)=>{const N=H,k=ke,R=Ne,v=O,_=De,b=Z,l=xe,w=J,d=Q,$=M("no-space");return q(),W(d,{bordered:!1,size:"small",class:"card-wrapper"},{default:o(()=>[t(w,{ref_key:"formRef",ref:g,model:u.value,"label-placement":"left","label-width":100,"show-feedback":!1,onKeyup:re(h,["enter"])},{default:o(()=>[t(l,{responsive:"screen","item-responsive":""},{default:o(()=>[t(k,{span:"24 s:12 m:6",label:e(a)("page.audit.type.name"),path:"fuzzy",class:"pr-24px"},{default:o(()=>[A(t(N,{clearable:"",value:u.value.fuzzy,"onUpdate:value":n[0]||(n[0]=x=>u.value.fuzzy=x),placeholder:e(a)("page.audit.type.form.name"),onClear:D},null,8,["value","placeholder"]),[[$]])]),_:1},8,["label"]),t(k,{span:"24 m:12",class:"pr-24px"},{default:o(()=>[t(b,{class:"w-full"},{default:o(()=>[t(v,{onClick:C},{icon:o(()=>[t(R,{class:"text-icon"})]),default:o(()=>[S(" "+z(e(a)("common.reset")),1)]),_:1}),t(v,{type:"primary",ghost:"",onClick:h},{icon:o(()=>[t(_,{class:"text-icon"})]),default:o(()=>[S(" "+z(e(a)("common.search")),1)]),_:1})]),_:1})]),_:1})]),_:1})]),_:1},8,["model"])]),_:1})}}}),Ce={class:"min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto"};function V(f){return typeof f=="function"||Object.prototype.toString.call(f)==="[object Object]"&&!ue(f)}const He=K({name:"audit_type",__name:"index",setup(f){const T=ie(),{columns:p,columnChecks:g,data:m,getData:u,loading:D,mobilePagination:C,searchParams:h,resetSearchParams:F}=ge({apiFn:fe,immediate:!0,apiParams:{page:1,pageSize:20,limit:20,fuzzy:null,_t:new Date().getTime()},columns:()=>[{type:"selection",align:"center",width:48},{key:"atypename",title:a("page.audit.type.name"),align:"center",minWidth:160,ellipsis:{tooltip:!0}},{key:"typedesc",title:a("page.audit.type.describe"),align:"center",minWidth:160,ellipsis:{tooltip:!0}},{key:"asort",title:a("page.audit.type.sort"),align:"center",width:120},{key:"syspara",title:a("page.audit.type.systemParams"),align:"center",width:100,render:r=>{const s={0:"primary",1:"error"},i=a(pe[r.syspara]);return t(de,{type:s[r.syspara]},V(i)?i:{default:()=>[i]})}},{key:"operate",title:a("common.operate"),align:"center",width:130,render:r=>{let s;return r.syspara!=0?t("div",{class:"flex-center gap-8px"},[A(t(O,{type:"primary",ghost:!0,size:"small",onClick:()=>x(r.id)},V(s=a("common.edit"))?s:{default:()=>[s]}),[[M("no-auth"),"sys.audit.type.update"]]),t(Se,{onPositiveClick:()=>$(r.id)},{default:()=>a("common.confirmDelete"),trigger:()=>{let i;return A(t(O,{type:"error",ghost:!0,size:"small"},V(i=a("common.delete"))?i:{default:()=>[i]}),[[M("no-auth"),"sys.audit.type.delete"]])}})]):null}}]}),{drawerVisible:n,operateType:N,editingData:k,handleAdd:R,handleEdit:v,checkedRowKeys:_,onBatchDeleted:b,onDeleted:l,closeDrawer:w}=he(m,u);async function d(){console.log(_.value),U(_.value,r=>{b()})}function $(r){console.log(r),U([r],s=>{l()})}function x(r){v(r)}async function U(r,s){const{data:i,error:B}=await ye(r);if(!B)s&&s(i);else return!1}return(r,s)=>{const i=X,B=we,P=Q;return q(),ce("div",Ce,[t(Te,{model:e(h),"onUpdate:model":s[0]||(s[0]=c=>I(h)?h.value=c:null),onReset:e(F),onSearch:e(u)},null,8,["model","onReset","onSearch"]),t(P,{title:e(a)("page.audit.type.title"),bordered:!1,size:"small",class:"sm:flex-1-hidden card-wrapper"},{"header-extra":o(()=>[t(i,{columns:e(g),"onUpdate:columns":s[1]||(s[1]=c=>I(g)?g.value=c:null),"disabled-delete":e(_).length===0,loading:e(D),onAdd:e(R),onDelete:d,onRefresh:e(u),"is-view-delete-button":e(G)("sys.audit.type.delete"),"is-view-add-button":e(G)("sys.audit.type.insert")},null,8,["columns","disabled-delete","loading","onAdd","onRefresh","is-view-delete-button","is-view-add-button"])]),default:o(()=>[t(B,{"checked-row-keys":e(_),"onUpdate:checkedRowKeys":s[2]||(s[2]=c=>I(_)?_.value=c:null),columns:e(p),data:e(m),size:"small","flex-height":!e(T).isMobile,"scroll-x":962,loading:e(D),remote:"","row-key":c=>c.id,pagination:e(C),class:"sm:h-full"},null,8,["checked-row-keys","columns","data","flex-height","loading","row-key","pagination"]),t(ze,{visible:e(n),"onUpdate:visible":s[3]||(s[3]=c=>I(n)?n.value=c:null),"operate-type":e(N),"row-data":e(k),onSubmitted:e(u)},null,8,["visible","operate-type","row-data","onSubmitted"])]),_:1},8,["title"])])}}});export{He as default};