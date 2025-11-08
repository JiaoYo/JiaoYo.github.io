import{_ as k}from"./save-outline-B64yylVN.js";import{af as G,ag as L,d as z,W as w,ah as V,ai as $,aj as C,ak as F,a as N,al as y,am as T,q,r as P,s as j,i as E,b as O,o as A,f as n,w as t,e as x,an as H,F as U,ao as D,ap as K,g as M,N as W,B as J,U as Q,aq as X,ar as Y}from"./index-CXGXpIU7.js";import{_ as Z}from"./FormItemGridItem-D31qr53-.js";import{_ as ee}from"./Grid-CSuTco9f.js";const oe=G("input-group-label",`
 position: relative;
 user-select: none;
 -webkit-user-select: none;
 box-sizing: border-box;
 padding: 0 12px;
 display: inline-block;
 border-radius: var(--n-border-radius);
 background-color: var(--n-group-label-color);
 color: var(--n-group-label-text-color);
 font-size: var(--n-font-size);
 line-height: var(--n-height);
 height: var(--n-height);
 flex-shrink: 0;
 white-space: nowrap;
 transition: 
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
`,[L("border",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 border: var(--n-group-label-border);
 transition: border-color .3s var(--n-bezier);
 `)]),ne=Object.assign(Object.assign({},C.props),{size:String,bordered:{type:Boolean,default:void 0}}),te=z({name:"InputGroupLabel",props:ne,setup(r){const{mergedBorderedRef:i,mergedClsPrefixRef:s,inlineThemeDisabled:l}=V(r),p=$(r),{mergedSizeRef:a}=p,m=C("Input","-input-group-label",oe,F,r,s),c=N(()=>{const{value:e}=a,{common:{cubicBezierEaseInOut:u},self:{groupLabelColor:d,borderRadius:_,groupLabelTextColor:f,lineHeight:g,groupLabelBorder:b,[y("fontSize",e)]:h,[y("height",e)]:v}}=m.value;return{"--n-bezier":u,"--n-group-label-color":d,"--n-group-label-border":b,"--n-border-radius":_,"--n-group-label-text-color":f,"--n-font-size":h,"--n-line-height":g,"--n-height":v}}),o=l?T("input-group-label",N(()=>{const{value:e}=a;return e[0]}),c,r):void 0;return{mergedClsPrefix:s,mergedBordered:i,cssVars:l?void 0:c,themeClass:o==null?void 0:o.themeClass,onRender:o==null?void 0:o.onRender}},render(){var r,i,s;const{mergedClsPrefix:l}=this;return(r=this.onRender)===null||r===void 0||r.call(this),w("div",{class:[`${l}-input-group-label`,this.themeClass],style:this.cssVars},(s=(i=this.$slots).default)===null||s===void 0?void 0:s.call(i),this.mergedBordered?w("div",{class:`${l}-input-group-label__border`}):null)}}),re={class:"min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto"},se={style:{"margin-top":"30px"}},de=z({name:"manage_authorization",__name:"index",setup(r){const{formRef:i,validate:s}=q(),l={performance:[{type:"number",required:!0,trigger:["input","change","blur","password-input"],message:"不能为空"},{validator:(o,e)=>e>=0&&e<=1,message:"必须在0到1之间",trigger:["input","blur"]}]},p=P(!1),a=j({performance:.75});async function m(){const{data:o,error:e}=await X();e||(a.performance=o)}async function c(){var u,d;await s();const{data:o,error:e}=await Y({performance:a.performance});e||((u=window.$message)==null||u.destroyAll(),(d=window.$message)==null||d.success("保存成功"))}return E(()=>{m()}),(o,e)=>{const u=H,d=K,_=te,f=D,g=Z,b=ee,h=U,v=k,B=J,I=W,S=Q;return A(),O("div",re,[n(S,{bordered:p.value,size:"small",class:"sm:flex-1-hidden card-wrapper"},{default:t(()=>[n(u,{title:"注意",type:"info",bordered:p.value},{default:t(()=>e[1]||(e[1]=[x("div",null,"修改绩效百分比可能会影响工作人员调试绩效考核，请谨慎修改！！！",-1)])),_:1,__:[1]},8,["bordered"]),x("div",se,[n(h,{ref_key:"formRef",ref:i,model:a,rules:l,"label-placement":"left","label-width":120,"require-mark-placement":"left"},{default:t(()=>[n(b,{responsive:"screen","item-responsive":""},{default:t(()=>[n(g,{span:"24 m:24",label:"绩效百分比(%)",path:"performance",class:"pr-24px"},{default:t(()=>[n(f,null,{default:t(()=>[n(d,{clearable:"","show-button":!1,min:0,max:1,step:.01,precision:2,value:a.performance,"onUpdate:value":e[0]||(e[0]=R=>a.performance=R),placeholder:"请输入绩效百分比(%)",style:{width:"100%"}},null,8,["value"]),n(_,null,{default:t(()=>e[2]||(e[2]=[M("%")])),_:1,__:[2]})]),_:1})]),_:1})]),_:1})]),_:1},8,["model"]),n(I,null,{default:t(()=>[n(B,{type:"primary",onClick:c},{icon:t(()=>[n(v,{class:"text-icon"})]),default:t(()=>e[3]||(e[3]=[x("span",null,"保存",-1)])),_:1})]),_:1})])]),_:1},8,["bordered"])])}}});export{de as default};
