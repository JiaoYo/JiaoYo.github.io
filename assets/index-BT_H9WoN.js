import{a8 as q,ab as V,d as N,ae as w,ah as G,b5 as L,aj as C,b6 as $,a as z,at as y,au as H,G as F,b as B,o as I,e as m,n as M,H as P,r as j,i as E,f as o,w as r,b7 as O,C as A,I as D,b8 as K,g as U,N as Z,B as J,Z as Q,b9 as W,ba as X}from"./index-JAJtFREg.js";import{_ as Y}from"./Grid-2TTZqiUQ.js";import{_ as ee}from"./FormItemGridItem-B9mm_V6-.js";const ne=q("input-group-label",`
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
 `)]),oe=Object.assign(Object.assign({},C.props),{size:String,bordered:{type:Boolean,default:void 0}}),te=N({name:"InputGroupLabel",props:oe,setup(t){const{mergedBorderedRef:s,mergedClsPrefixRef:a,inlineThemeDisabled:i}=G(t),c=L(t),{mergedSizeRef:l}=c,_=C("Input","-input-group-label",ne,$,t,a),p=z(()=>{const{value:e}=l,{common:{cubicBezierEaseInOut:u},self:{groupLabelColor:d,borderRadius:b,groupLabelTextColor:f,lineHeight:g,groupLabelBorder:h,[y("fontSize",e)]:v,[y("height",e)]:x}}=_.value;return{"--n-bezier":u,"--n-group-label-color":d,"--n-group-label-border":h,"--n-border-radius":b,"--n-group-label-text-color":f,"--n-font-size":v,"--n-line-height":g,"--n-height":x}}),n=i?H("input-group-label",z(()=>{const{value:e}=l;return e[0]}),p,t):void 0;return{mergedClsPrefix:a,mergedBordered:s,cssVars:i?void 0:p,themeClass:n==null?void 0:n.themeClass,onRender:n==null?void 0:n.onRender}},render(){var t,s,a;const{mergedClsPrefix:i}=this;return(t=this.onRender)===null||t===void 0||t.call(this),w("div",{class:[`${i}-input-group-label`,this.themeClass],style:this.cssVars},(a=(s=this.$slots).default)===null||a===void 0?void 0:a.call(s),this.mergedBordered?w("div",{class:`${i}-input-group-label__border`}):null)}}),re={class:"inline-block",viewBox:"0 0 24 24",width:"1em",height:"1em"};function se(t,s){return I(),B("svg",re,s[0]||(s[0]=[m("path",{fill:"currentColor",d:"M20 7.423v10.962q0 .69-.462 1.153T18.384 20H5.616q-.691 0-1.153-.462T4 18.384V5.616q0-.691.463-1.153T5.616 4h10.961zm-1 .427L16.15 5H5.616q-.27 0-.443.173T5 5.616v12.769q0 .269.173.442t.443.173h12.769q.269 0 .442-.173t.173-.443zm-7 8.688q.827 0 1.414-.586T14 14.538t-.587-1.413T12 12.539t-1.413.586T10 14.538t.587 1.414t1.413.586M6.77 9.77h7.422v-3H6.77zM5 7.85V19V5z"},null,-1)]))}const ae=F({name:"material-symbols-light-save-outline",render:se}),le={class:"min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto"},ie={style:{"margin-top":"30px"}},pe=N({name:"manage_authorization",__name:"index",setup(t){const{formRef:s,validate:a}=M(),i={performance:[{type:"number",required:!0,trigger:["input","change","blur","password-input"],message:"不能为空"},{validator:(n,e)=>e>=0&&e<=1,message:"必须在0到1之间",trigger:["input","blur"]}]},c=P(!1),l=j({performance:.75});async function _(){const{data:n,error:e}=await W();e||(l.performance=n)}async function p(){var u,d;await a();const{data:n,error:e}=await X({performance:l.performance});e||((u=window.$message)==null||u.destroyAll(),(d=window.$message)==null||d.success("保存成功"))}return E(()=>{_()}),(n,e)=>{const u=O,d=K,b=te,f=D,g=ee,h=Y,v=A,x=ae,R=J,S=Z,k=Q;return I(),B("div",le,[o(k,{bordered:c.value,size:"small",class:"sm:flex-1-hidden card-wrapper"},{default:r(()=>[o(u,{title:"注意",type:"info",bordered:c.value},{default:r(()=>e[1]||(e[1]=[m("div",null,"修改绩效百分比可能会影响工作人员调试绩效考核，请谨慎修改！！！",-1)])),_:1,__:[1]},8,["bordered"]),m("div",ie,[o(v,{ref_key:"formRef",ref:s,model:l,rules:i,"label-placement":"left","label-width":120,"require-mark-placement":"left"},{default:r(()=>[o(h,{responsive:"screen","item-responsive":""},{default:r(()=>[o(g,{span:"24 m:24",label:"绩效百分比(%)",path:"performance",class:"pr-24px"},{default:r(()=>[o(f,null,{default:r(()=>[o(d,{clearable:"","show-button":!1,min:0,max:1,step:.01,precision:2,value:l.performance,"onUpdate:value":e[0]||(e[0]=T=>l.performance=T),placeholder:"请输入绩效百分比(%)",style:{width:"100%"}},null,8,["value"]),o(b,null,{default:r(()=>e[2]||(e[2]=[U("%")])),_:1,__:[2]})]),_:1})]),_:1})]),_:1})]),_:1},8,["model"]),o(S,null,{default:r(()=>[o(R,{type:"primary",onClick:p},{icon:r(()=>[o(x,{class:"text-icon"})]),default:r(()=>e[3]||(e[3]=[m("span",null,"保存",-1)])),_:1})]),_:1})])]),_:1},8,["bordered"])])}}});export{pe as default};
