import{m as q,ab as V,d as N,n as w,p as L,bc as G,q as C,bd as $,a as z,ao as y,r as F,R as H,b as B,o as R,e as m,A as M,s as P,D as A,i as E,f as n,w as r,be as O,M as j,S as D,bf as J,g as K,J as U,B as Q,a2 as W,bg as X,bh as Y}from"./index-01hyoC1y.js";import{_ as Z}from"./Grid-PO4pV7Qi.js";import{_ as ee}from"./FormItemGridItem-Ddu3CU7K.js";const oe=q("input-group-label",`
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
`,[V("border",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 border: var(--n-group-label-border);
 transition: border-color .3s var(--n-bezier);
 `)]),ne=Object.assign(Object.assign({},C.props),{size:String,bordered:{type:Boolean,default:void 0}}),te=N({name:"InputGroupLabel",props:ne,setup(t){const{mergedBorderedRef:s,mergedClsPrefixRef:a,inlineThemeDisabled:i}=L(t),c=G(t),{mergedSizeRef:l}=c,_=C("Input","-input-group-label",oe,$,t,a),p=z(()=>{const{value:e}=l,{common:{cubicBezierEaseInOut:u},self:{groupLabelColor:d,borderRadius:b,groupLabelTextColor:f,lineHeight:g,groupLabelBorder:h,[y("fontSize",e)]:v,[y("height",e)]:x}}=_.value;return{"--n-bezier":u,"--n-group-label-color":d,"--n-group-label-border":h,"--n-border-radius":b,"--n-group-label-text-color":f,"--n-font-size":v,"--n-line-height":g,"--n-height":x}}),o=i?F("input-group-label",z(()=>{const{value:e}=l;return e[0]}),p,t):void 0;return{mergedClsPrefix:a,mergedBordered:s,cssVars:i?void 0:p,themeClass:o==null?void 0:o.themeClass,onRender:o==null?void 0:o.onRender}},render(){var t,s,a;const{mergedClsPrefix:i}=this;return(t=this.onRender)===null||t===void 0||t.call(this),w("div",{class:[`${i}-input-group-label`,this.themeClass],style:this.cssVars},(a=(s=this.$slots).default)===null||a===void 0?void 0:a.call(s),this.mergedBordered?w("div",{class:`${i}-input-group-label__border`}):null)}}),re={class:"inline-block",viewBox:"0 0 24 24",width:"1em",height:"1em"};function se(t,s){return R(),B("svg",re,s[0]||(s[0]=[m("path",{fill:"currentColor",d:"M20 7.423v10.962q0 .69-.462 1.153T18.384 20H5.616q-.691 0-1.153-.462T4 18.384V5.616q0-.691.463-1.153T5.616 4h10.961zm-1 .427L16.15 5H5.616q-.27 0-.443.173T5 5.616v12.769q0 .269.173.442t.443.173h12.769q.269 0 .442-.173t.173-.443zm-7 8.688q.827 0 1.414-.586T14 14.538t-.587-1.413T12 12.539t-1.413.586T10 14.538t.587 1.414t1.413.586M6.77 9.77h7.422v-3H6.77zM5 7.85V19V5z"},null,-1)]))}const ae=H({name:"material-symbols-light-save-outline",render:se}),le={class:"min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto"},ie={style:{"margin-top":"30px"}},pe=N({name:"manage_authorization",__name:"index",setup(t){const{formRef:s,validate:a}=M(),i={performance:[{type:"number",required:!0,trigger:["input","change","blur","password-input"],message:"不能为空"},{validator:(o,e)=>e>=0&&e<=1,message:"必须在0到1之间",trigger:["input","blur"]}]},c=P(!1),l=A({performance:.75});async function _(){const{data:o,error:e}=await X();e||(l.performance=o)}async function p(){var u,d;await a();const{data:o,error:e}=await Y({performance:l.performance});e||((u=window.$message)==null||u.destroyAll(),(d=window.$message)==null||d.success("保存成功"))}return E(()=>{_()}),(o,e)=>{const u=O,d=J,b=te,f=D,g=ee,h=Z,v=j,x=ae,I=Q,S=U,k=W;return R(),B("div",le,[n(k,{bordered:c.value,size:"small",class:"sm:flex-1-hidden card-wrapper"},{default:r(()=>[n(u,{title:"注意",type:"info",bordered:c.value},{default:r(()=>e[1]||(e[1]=[m("div",null,"修改绩效百分比可能会影响工作人员调试绩效考核，请谨慎修改！！！",-1)])),_:1,__:[1]},8,["bordered"]),m("div",ie,[n(v,{ref_key:"formRef",ref:s,model:l,rules:i,"label-placement":"left","label-width":120,"require-mark-placement":"left"},{default:r(()=>[n(h,{responsive:"screen","item-responsive":""},{default:r(()=>[n(g,{span:"24 m:24",label:"绩效百分比(%)",path:"performance",class:"pr-24px"},{default:r(()=>[n(f,null,{default:r(()=>[n(d,{clearable:"","show-button":!1,min:0,max:1,step:.01,precision:2,value:l.performance,"onUpdate:value":e[0]||(e[0]=T=>l.performance=T),placeholder:"请输入绩效百分比(%)",style:{width:"100%"}},null,8,["value"]),n(b,null,{default:r(()=>e[2]||(e[2]=[K("%")])),_:1,__:[2]})]),_:1})]),_:1})]),_:1})]),_:1},8,["model"]),n(S,null,{default:r(()=>[n(I,{type:"primary",onClick:p},{icon:r(()=>[n(x,{class:"text-icon"})]),default:r(()=>e[3]||(e[3]=[m("span",null,"保存",-1)])),_:1})]),_:1})])]),_:1},8,["bordered"])])}}});export{pe as default};
