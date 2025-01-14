import{_ as Ye}from"./round-plus-DPqTlDXU.js";import{d as G,j as g,b as B,y as _e,ax as de,aH as ne,aL as h,aD as _,aY as je,aA as C,aZ as Le,aB as $,aC as ye,a_ as we,a$ as Ue,b0 as Fe,aE as We,b1 as pe,aF as xe,aG as ke,b2 as Ge,K as $e,b3 as Se,b4 as Ke,aK as Xe,b5 as He,a5 as Ze,b6 as Je,aM as Qe,b7 as et,b8 as tt,b9 as ee,ba as nt,bb as Z,bc as at,bd as st,be as lt,o as O,e as ae,f as j,a1 as rt,r as ot,g as a,A as H,Y as fe,B as A,$ as se,ao as F,h as P,L as me,w as i,i as x,t as le,N as it,M as re,aj as ut,ah as ct,c as te,ae as dt,bf as pt,E as ft,aa as mt,C as bt,D as vt,ab as ht,ac as gt,F as _t,ay as yt,az as wt,a7 as xt,as as be,_ as kt,av as $t}from"./index-De3doW-I.js";import{l as ve}from"./lodash-sX-Sa5u6.js";import{d as St,e as he,g as Nt}from"./basic-config-xOXh-VLs.js";import{_ as Ct}from"./DataTable-igK3_np4.js";import{_ as It}from"./FormItemGridItem-D9ymTlC3.js";import{_ as Rt}from"./Grid--J-WRE4U.js";import"./Forward-CYpjZEFa.js";const ge=G({name:"SlotMachineNumber",props:{clsPrefix:{type:String,required:!0},value:{type:[Number,String],required:!0},oldOriginalNumber:{type:Number,default:void 0},newOriginalNumber:{type:Number,default:void 0}},setup(e){const s=g(null),r=g(e.value),l=g(e.value),c=g("up"),o=g(!1),d=B(()=>o.value?`${e.clsPrefix}-base-slot-machine-current-number--${c.value}-scroll`:null),I=B(()=>o.value?`${e.clsPrefix}-base-slot-machine-old-number--${c.value}-scroll`:null);_e(ne(e,"value"),(f,w)=>{r.value=w,l.value=f,de(V)});function V(){const f=e.newOriginalNumber,w=e.oldOriginalNumber;w===void 0||f===void 0||(f>w?k("up"):w>f&&k("down"))}function k(f){c.value=f,o.value=!1,de(()=>{var w;(w=s.value)===null||w===void 0||w.offsetWidth,o.value=!0})}return()=>{const{clsPrefix:f}=e;return h("span",{ref:s,class:`${f}-base-slot-machine-number`},r.value!==null?h("span",{class:[`${f}-base-slot-machine-old-number ${f}-base-slot-machine-old-number--top`,I.value]},r.value):null,h("span",{class:[`${f}-base-slot-machine-current-number`,d.value]},h("span",{ref:"numberWrapper",class:[`${f}-base-slot-machine-current-number__inner`,typeof e.value!="number"&&`${f}-base-slot-machine-current-number__inner--not-number`]},l.value)),r.value!==null?h("span",{class:[`${f}-base-slot-machine-old-number ${f}-base-slot-machine-old-number--bottom`,I.value]},r.value):null)}}}),{cubicBezierEaseOut:W}=je;function Pt({duration:e=".2s"}={}){return[_("&.fade-up-width-expand-transition-leave-active",{transition:`
 opacity ${e} ${W},
 max-width ${e} ${W},
 transform ${e} ${W}
 `}),_("&.fade-up-width-expand-transition-enter-active",{transition:`
 opacity ${e} ${W},
 max-width ${e} ${W},
 transform ${e} ${W}
 `}),_("&.fade-up-width-expand-transition-enter-to",{opacity:1,transform:"translateX(0) translateY(0)"}),_("&.fade-up-width-expand-transition-enter-from",{maxWidth:"0 !important",opacity:0,transform:"translateY(60%)"}),_("&.fade-up-width-expand-transition-leave-from",{opacity:1,transform:"translateY(0)"}),_("&.fade-up-width-expand-transition-leave-to",{maxWidth:"0 !important",opacity:0,transform:"translateY(60%)"})]}const zt=_([_("@keyframes n-base-slot-machine-fade-up-in",`
 from {
 transform: translateY(60%);
 opacity: 0;
 }
 to {
 transform: translateY(0);
 opacity: 1;
 }
 `),_("@keyframes n-base-slot-machine-fade-down-in",`
 from {
 transform: translateY(-60%);
 opacity: 0;
 }
 to {
 transform: translateY(0);
 opacity: 1;
 }
 `),_("@keyframes n-base-slot-machine-fade-up-out",`
 from {
 transform: translateY(0%);
 opacity: 1;
 }
 to {
 transform: translateY(-60%);
 opacity: 0;
 }
 `),_("@keyframes n-base-slot-machine-fade-down-out",`
 from {
 transform: translateY(0%);
 opacity: 1;
 }
 to {
 transform: translateY(60%);
 opacity: 0;
 }
 `),C("base-slot-machine",`
 overflow: hidden;
 white-space: nowrap;
 display: inline-block;
 height: 18px;
 line-height: 18px;
 `,[C("base-slot-machine-number",`
 display: inline-block;
 position: relative;
 height: 18px;
 width: .6em;
 max-width: .6em;
 `,[Pt({duration:".2s"}),Le({duration:".2s",delay:"0s"}),C("base-slot-machine-old-number",`
 display: inline-block;
 opacity: 0;
 position: absolute;
 left: 0;
 right: 0;
 `,[$("top",{transform:"translateY(-100%)"}),$("bottom",{transform:"translateY(100%)"}),$("down-scroll",{animation:"n-base-slot-machine-fade-down-out .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),$("up-scroll",{animation:"n-base-slot-machine-fade-up-out .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1})]),C("base-slot-machine-current-number",`
 display: inline-block;
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 1;
 transform: translateY(0);
 width: .6em;
 `,[$("down-scroll",{animation:"n-base-slot-machine-fade-down-in .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),$("up-scroll",{animation:"n-base-slot-machine-fade-up-in .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),ye("inner",`
 display: inline-block;
 position: absolute;
 right: 0;
 top: 0;
 width: .6em;
 `,[$("not-number",`
 right: unset;
 left: 0;
 `)])])])])]),Tt=G({name:"BaseSlotMachine",props:{clsPrefix:{type:String,required:!0},value:{type:[Number,String],default:0},max:{type:Number,default:void 0},appeared:{type:Boolean,required:!0}},setup(e){we("-base-slot-machine",zt,ne(e,"clsPrefix"));const s=g(),r=g(),l=B(()=>{if(typeof e.value=="string")return[];if(e.value<1)return[0];const c=[];let o=e.value;for(e.max!==void 0&&(o=Math.min(e.max,o));o>=1;)c.push(o%10),o/=10,o=Math.floor(o);return c.reverse(),c});return _e(ne(e,"value"),(c,o)=>{typeof c=="string"?(r.value=void 0,s.value=void 0):typeof o=="string"?(r.value=c,s.value=void 0):(r.value=c,s.value=o)}),()=>{const{value:c,clsPrefix:o}=e;return typeof c=="number"?h("span",{class:`${o}-base-slot-machine`},h(Fe,{name:"fade-up-width-expand-transition",tag:"span"},{default:()=>l.value.map((d,I)=>h(ge,{clsPrefix:o,key:l.value.length-I-1,oldOriginalNumber:s.value,newOriginalNumber:r.value,value:d}))}),h(Ue,{key:"+",width:!0},{default:()=>e.max!==void 0&&e.max<c?h(ge,{clsPrefix:o,value:"+"}):null})):h("span",{class:`${o}-base-slot-machine`},c)}}}),Bt=e=>{const{errorColor:s,infoColor:r,successColor:l,warningColor:c,fontFamily:o}=e;return{color:s,colorInfo:r,colorSuccess:l,colorError:s,colorWarning:c,fontSize:"12px",fontFamily:o}},Mt={name:"Badge",common:We,self:Bt},Dt=_([_("@keyframes badge-wave-spread",{from:{boxShadow:"0 0 0.5px 0px var(--n-ripple-color)",opacity:.6},to:{boxShadow:"0 0 0.5px 4.5px var(--n-ripple-color)",opacity:0}}),C("badge",`
 display: inline-flex;
 position: relative;
 vertical-align: middle;
 font-family: var(--n-font-family);
 `,[$("as-is",[C("badge-sup",{position:"static",transform:"translateX(0)"},[pe({transformOrigin:"left bottom",originalTransform:"translateX(0)"})])]),$("dot",[C("badge-sup",`
 height: 8px;
 width: 8px;
 padding: 0;
 min-width: 8px;
 left: 100%;
 bottom: calc(100% - 4px);
 `,[_("::before","border-radius: 4px;")])]),C("badge-sup",`
 background: var(--n-color);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 color: #FFF;
 position: absolute;
 height: 18px;
 line-height: 18px;
 border-radius: 9px;
 padding: 0 6px;
 text-align: center;
 font-size: var(--n-font-size);
 transform: translateX(-50%);
 left: 100%;
 bottom: calc(100% - 9px);
 font-variant-numeric: tabular-nums;
 z-index: 1;
 display: flex;
 align-items: center;
 `,[pe({transformOrigin:"left bottom",originalTransform:"translateX(-50%)"}),C("base-wave",{zIndex:1,animationDuration:"2s",animationIterationCount:"infinite",animationDelay:"1s",animationTimingFunction:"var(--n-ripple-bezier)",animationName:"badge-wave-spread"}),_("&::before",`
 opacity: 0;
 transform: scale(1);
 border-radius: 9px;
 content: "";
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 `)])])]),qt=Object.assign(Object.assign({},ke.props),{value:[String,Number],max:Number,dot:Boolean,type:{type:String,default:"default"},show:{type:Boolean,default:!0},showZero:Boolean,processing:Boolean,color:String,offset:Array}),Et=G({name:"Badge",props:qt,setup(e,{slots:s}){const{mergedClsPrefixRef:r,inlineThemeDisabled:l,mergedRtlRef:c}=xe(e),o=ke("Badge","-badge",Dt,Mt,e,r),d=g(!1),I=()=>{d.value=!0},V=()=>{d.value=!1},k=B(()=>e.show&&(e.dot||e.value!==void 0&&!(!e.showZero&&Number(e.value)<=0)||!Ge(s.value)));$e(()=>{k.value&&(d.value=!0)});const f=Se("Badge",c,r),w=B(()=>{const{type:S,color:N}=e,{common:{cubicBezierEaseInOut:R,cubicBezierEaseOut:K},self:{[Ke("color",S)]:T,fontFamily:L,fontSize:M}}=o.value;return{"--n-font-size":M,"--n-font-family":L,"--n-color":N||T,"--n-ripple-color":N||T,"--n-bezier":R,"--n-ripple-bezier":K}}),z=l?Xe("badge",B(()=>{let S="";const{type:N,color:R}=e;return N&&(S+=N[0]),R&&(S+=He(R)),S}),w,e):void 0,J=B(()=>{const{offset:S}=e;if(!S)return;const[N,R]=S,K=typeof N=="number"?`${N}px`:N,T=typeof R=="number"?`${R}px`:R;return{transform:`translate(calc(${f!=null&&f.value?"50%":"-50%"} + ${K}), ${T})`}});return{rtlEnabled:f,mergedClsPrefix:r,appeared:d,showBadge:k,handleAfterEnter:I,handleAfterLeave:V,cssVars:l?void 0:w,themeClass:z==null?void 0:z.themeClass,onRender:z==null?void 0:z.onRender,offsetStyle:J}},render(){var e;const{mergedClsPrefix:s,onRender:r,themeClass:l,$slots:c}=this;r==null||r();const o=(e=c.default)===null||e===void 0?void 0:e.call(c);return h("div",{class:[`${s}-badge`,this.rtlEnabled&&`${s}-badge--rtl`,l,{[`${s}-badge--dot`]:this.dot,[`${s}-badge--as-is`]:!o}],style:this.cssVars},o,h(Ze,{name:"fade-in-scale-up-transition",onAfterEnter:this.handleAfterEnter,onAfterLeave:this.handleAfterLeave},{default:()=>this.showBadge?h("sup",{class:`${s}-badge-sup`,title:Je(this.value),style:this.offsetStyle},Qe(c.value,()=>[this.dot?null:h(Tt,{clsPrefix:s,appeared:this.appeared,max:this.max,value:this.value})]),this.processing?h(et,{clsPrefix:s}):null):null}))}}),At=tt(24,null).map((e,s)=>{const r=s+1,l=`calc(100% / 24 * ${r})`;return[$(`${r}-span`,{width:l}),$(`${r}-offset`,{marginLeft:l}),$(`${r}-push`,{left:l}),$(`${r}-pull`,{right:l})]}),Ot=_([C("row",{width:"100%",display:"flex",flexWrap:"wrap"}),C("col",{verticalAlign:"top",boxSizing:"border-box",display:"inline-block",position:"relative",zIndex:"auto"},[ye("box",{position:"relative",zIndex:"auto",width:"100%",height:"100%"}),At])]),Ne=at("n-row"),Vt={gutter:{type:[Array,Number,String],default:0},alignItems:String,justifyContent:String},Yt=G({name:"Row",props:Vt,setup(e){const{mergedClsPrefixRef:s,mergedRtlRef:r}=xe(e);we("-legacy-grid",Ot,s);const l=Se("Row",r,s),c=ee(()=>{const{gutter:d}=e;return Array.isArray(d)&&d[1]||0}),o=ee(()=>{const{gutter:d}=e;return Array.isArray(d)?d[0]:Number(d)});return nt(Ne,{mergedClsPrefixRef:s,gutterRef:ne(e,"gutter"),verticalGutterRef:c,horizontalGutterRef:o}),{mergedClsPrefix:s,rtlEnabled:l,styleMargin:ee(()=>`-${Z(c.value,{c:.5})} -${Z(o.value,{c:.5})}`),styleWidth:ee(()=>`calc(100% + ${Z(o.value)})`)}},render(){return h("div",{class:[`${this.mergedClsPrefix}-row`,this.rtlEnabled&&`${this.mergedClsPrefix}-row--rtl`],style:{margin:this.styleMargin,width:this.styleWidth,alignItems:this.alignItems,justifyContent:this.justifyContent}},this.$slots)}}),jt={span:{type:[String,Number],default:1},push:{type:[String,Number],default:0},pull:{type:[String,Number],default:0},offset:{type:[String,Number],default:0}},Lt=G({name:"Col",props:jt,setup(e){const s=st(Ne,null);return s||lt("col","`n-col` must be placed inside `n-row`."),{mergedClsPrefix:s.mergedClsPrefixRef,gutter:s.gutterRef,stylePadding:B(()=>`${Z(s.verticalGutterRef.value,{c:.5})} ${Z(s.horizontalGutterRef.value,{c:.5})}`),mergedPush:B(()=>Number(e.push)-Number(e.pull))}},render(){const{$slots:e,span:s,mergedPush:r,offset:l,stylePadding:c,gutter:o,mergedClsPrefix:d}=this;return h("div",{class:[`${d}-col`,{[`${d}-col--${s}-span`]:!0,[`${d}-col--${r}-push`]:r>0,[`${d}-col--${-r}-pull`]:r<0,[`${d}-col--${l}-offset`]:l}],style:{padding:c}},o?h("div",null,e):e)}}),Ut={class:"inline-block",viewBox:"0 0 24 24",width:"1em",height:"1em"},Ft=j("path",{fill:"currentColor",d:"M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h11.175q.4 0 .763.15t.637.425l2.85 2.85q.275.275.425.638t.15.762V19q0 .825-.587 1.413T19 21zM19 7.85L16.15 5H5v14h14zM12 18q1.25 0 2.125-.875T15 15t-.875-2.125T12 12t-2.125.875T9 15t.875 2.125T12 18m-5-8h7q.425 0 .713-.288T15 9V7q0-.425-.288-.712T14 6H7q-.425 0-.712.288T6 7v2q0 .425.288.713T7 10M5 7.85V19V5z"},null,-1),Wt=[Ft];function Gt(e,s){return O(),ae("svg",Ut,[...Wt])}const Kt={name:"material-symbols-save-outline-rounded",render:Gt},Xt={class:"inline-block",viewBox:"0 0 24 24",width:"1em",height:"1em"},Ht=j("path",{fill:"currentColor",d:"m9.25 22l-.4-3.2q-.325-.125-.612-.3t-.563-.375L4.7 19.375l-2.75-4.75l2.575-1.95Q4.5 12.5 4.5 12.338v-.675q0-.163.025-.338L1.95 9.375l2.75-4.75l2.975 1.25q.275-.2.575-.375t.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3t.562.375l2.975-1.25l2.75 4.75l-2.575 1.95q.025.175.025.338v.674q0 .163-.05.338l2.575 1.95l-2.75 4.75l-2.95-1.25q-.275.2-.575.375t-.6.3l-.4 3.2zm2.8-6.5q1.45 0 2.475-1.025T15.55 12t-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12t1.013 2.475T12.05 15.5"},null,-1),Zt=[Ht];function Jt(e,s){return O(),ae("svg",Xt,[...Zt])}const Qt={name:"material-symbols-settings",render:Jt},Ce=e=>(yt("data-v-5b5a6bb9"),e=e(),wt(),e),en={class:"min-h-500px flex-col-stretch gap-16px overflow-auto lt-sm:overflow-auto"},tn={class:"lan-network"},nn=Ce(()=>j("span",{class:"font-size-16px font-700"},"系统网络配置",-1)),an=Ce(()=>j("span",{style:{width:"3px",height:"15px",background:"#1980ff",display:"inline-block","margin-right":"5px","border-radius":"20px"}},null,-1)),sn={class:"w-100% h-100% flex-col"};function ln(e){return typeof e=="function"||Object.prototype.toString.call(e)==="[object Object]"&&!dt(e)}const rn=G({name:"basicconfig_network-manage",__name:"index",setup(e){const s=rt(),r=()=>{let t=[];for(let n=1;n<=32;n++)t.push({label:n+"",value:n,name:pt(n)});return t},l=g([{id:1,nname:"eno1",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:2,nname:"eno2",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:3,nname:"eno3",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:4,nname:"eno4",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:5,nname:"eno5",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:6,nname:"eno6",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:7,nname:"eno7",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:8,nname:"eno8",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]}]),c=ot([{key:"ip",title:"目标",width:240,align:"center",render:t=>a(H,{value:t.ip,clearable:!0,"onUpdate:value":n=>t.ip=n,status:t.inputStatus?"error":"success",onBlur:()=>z(t,t.ip),onInput:n=>z(t,n)},null)},{key:"netMask",title:"掩码",align:"center",width:240,render:t=>a(fe,{renderLabel:ue,value:t.netMask,clearable:!0,status:t.selectStatus?"error":"success",onBlur:()=>S(t,t.netMask),"onUpdate:value":n=>S(t,n),options:r()},null)},{key:"nextip",title:"下一跳",align:"center",width:240,render:t=>a(H,{value:t.nextip,"onUpdate:value":n=>t.nextip=n,clearable:!0,status:t.inputStatus1?"error":"success",onBlur:()=>J(t,t.nextip),onInput:n=>J(t,n)},null)},{key:"operate",title:"操作",align:"center",width:130,fixed:"right",render:(t,n)=>{let p;return a("div",{class:"flex-center gap-8px"},[a(A,{type:"error",ghost:!0,size:"small",onClick:()=>o(n)},ln(p=se("common.delete"))?p:{default:()=>[p]})])}}]),o=t=>{M.value.splice(t,1)},d=g(0),I=g(""),V=async()=>{var p;const{data:t,error:n}=await St();if(t){const u=JSON.parse(JSON.stringify(t));d.value=u.findIndex(b=>b.curr),I.value=(p=u.find(b=>b.curr))==null?void 0:p.nip,l.value.forEach((b,D)=>{const q=u.find(Y=>Y.nname.charAt(Y.nname.length-1)==b.id);q&&(l.value[D]={...q,id:D+1})})}},k=g(),f={nip:[{required:!0,message:"请输入IP地址",trigger:["input","change","blur","password-input"]},{validator:be,trigger:["input","change","blur","password-input"]}],nmaskbits:{required:!0,validator:(t,n)=>new Promise((p,u)=>{n==0||n==null?u(new Error("请选择掩码")):p()}),trigger:["input","change","blur"]}},w={nip:[{required:!0,message:"请输入IP地址",trigger:["input"]},{validator:be,trigger:["input"]}],nmaskbits:{required:!0,validator:(t,n)=>new Promise((p,u)=>{n==0||n==null?u(new Error("请选择掩码")):p()}),trigger:["change"]}},z=(t,n)=>{t.inputStatus=!F(n)},J=(t,n)=>{t.inputStatus1=!F(n)},S=(t,n)=>{t.netMask=n,t.selectStatus=n==null},N=async()=>{var u,b,D,q,Y;const t=l.value.findIndex(v=>!v.nip&&v.nmaskbits||v.nip&&!v.nmaskbits);t!=-1&&await k.value[t].validate(),k.value[d.value].validate();const n=l.value.filter((v,E)=>{if(v.nip&&v.nmaskbits)return v.nip&&v.nmaskbits;!v.nip&&!v.nmaskbits&&k.value[E].restoreValidation()});if(n.length==0)return(u=window.$message)==null?void 0:u.warning("请至少设置一个网口的配置");const p=(b=l.value.find(v=>v.curr))==null?void 0:b.nip;if(p!=I.value)(D=window.$dialog)==null||D.warning({title:"提示",content:"检测到您要修改当前网关的IP地址，确认要修改吗？",positiveText:"确认",negativeText:"取消",positiveButtonProps:{type:"info",ghost:!0},onPositiveClick:async()=>{const v=window.location.href.replace(new RegExp(I.value,"g"),p);setTimeout(()=>{window.location.href=v},3e3);try{const{data:E,error:Q}=await he(n)}catch{}}});else try{const{data:v,error:E}=await he(n);E||((q=window.$message)==null||q.destroyAll(),(Y=window.$message)==null||Y.success("配置成功"),V())}catch(v){console.error(v)}},R=t=>{l.value[t].nmaskbits||setTimeout(()=>{k.value[t].restoreValidation()},100)},K=t=>{l.value[t].nip||setTimeout(()=>{k.value[t].restoreValidation()},100)},T=g(!1),L=g(0),M=g(),Ie=async t=>{await k.value[t].validate(),T.value=!0,L.value=t,M.value=ve.cloneDeep(l.value[t].list2)?ve.cloneDeep(l.value[t].list2).map((n,p)=>{const[u,b]=n.ip.split("/");return{...n,id:p+1,ip:u,netMask:Number(b)}}):[]},Re=()=>{var p;if(!(u=>{for(const b of u){if(!F(b.ip))return b.inputStatus=!0,!1;if(b.netMask==null||b.netMask==0)return b.selectStatus=!0,!1;if(!F(b.nextip))return b.inputStatus1=!0,!1}return!0})(M.value))return(p=window.$message)==null?void 0:p.warning("网关IP和掩码不能为空或IP格式错误，请检查后重试");l.value[L.value].list2=M.value.map(u=>(u.ip=u.ip+"/"+u.netMask,u.netMask=null,u.id=void 0,u.inputStatus=void 0,u.inputStatus1=void 0,u.selectStatus=void 0,u)),T.value=!1},y=g({visible:!1,dns1:"",dns2:""}),Pe={dns1:{required:!0,trigger:["blur","input","change"],validator:(t,n)=>n?F(n)?!0:new Error("请输入正确的DNS"):new Error("请输入DNS")},dns2:{required:!1,trigger:["blur","input","change"],validator:(t,n)=>n?F(n)?!0:new Error("请输入正确的DNS"):new Error("请输入DNS")}},ze=()=>{y.value.visible=!0,y.value.dns1=l.value[d.value].predns,y.value.dns2=l.value[d.value].bakdns},oe=async()=>{var p,u;const{data:t,error:n}=await Nt({dns1:y.value.dns1,dns2:y.value.dns2});n||((p=window.$message)==null||p.destroyAll(),(u=window.$message)==null||u.success("配置成功"),V(),ie())},ie=()=>{y.value.visible=!1,y.value.dns1="",y.value.dns2=""},ue=t=>a("div",{style:{display:"flex",alignItems:"center"}},[a("span",null,[t.label]),a("span",{style:{fontSize:"12px",marginLeft:"20px"}},[P("("),t.name,P(")")])]);return $e(()=>{V()}),(t,n)=>{const p=Qt,u=ft,b=mt,D=bt,q=vt,Y=ht,v=gt,E=kt,Q=It,Te=Et,Be=Rt,Me=Lt,De=Yt,qe=Kt,Ee=Ye,Ae=Ct,Oe=_t,ce=me("no-space"),Ve=me("no-auth");return O(),ae("div",en,[j("div",tn,[a(b,{bordered:!0,size:"small"},{default:i(()=>[a(u,{justify:"space-between",align:"center",class:"w-100%"},{default:i(()=>[nn,a(x(A),{type:"info",ghost:"",onClick:ze},{icon:i(()=>[a(p,{class:"text-icon"})]),default:i(()=>[P(" DNS配置 ")]),_:1})]),_:1})]),_:1}),a(v,{show:y.value.visible,"onUpdate:show":n[2]||(n[2]=m=>y.value.visible=m),"display-directive":"show",width:300},{default:i(()=>[a(Y,{title:"设置DNS","native-scrollbar":!1,closable:""},{footer:i(()=>[a(u,{size:16},{default:i(()=>[a(x(A),{onClick:ie},{default:i(()=>[P(le(x(se)("common.cancel")),1)]),_:1}),a(x(A),{type:"primary",onClick:oe},{default:i(()=>[P(le(x(se)("common.confirm")),1)]),_:1})]),_:1})]),default:i(()=>[a(q,{ref:"formRef",model:y.value,rules:Pe,onKeyup:it(oe,["enter"])},{default:i(()=>[a(D,{label:"DNS(首选)",path:"dns1"},{default:i(()=>[re(a(x(H),{clearable:"",value:y.value.dns1,"onUpdate:value":n[0]||(n[0]=m=>y.value.dns1=m),placeholder:"请输入IP"},null,8,["value"]),[[ce]])]),_:1}),a(D,{label:"DNS(备用)",path:"dns2"},{default:i(()=>[re(a(x(H),{clearable:"",value:y.value.dns2,"onUpdate:value":n[1]||(n[1]=m=>y.value.dns2=m),placeholder:"请输入IP"},null,8,["value"]),[[ce]])]),_:1})]),_:1},8,["model"])]),_:1})]),_:1},8,["show"])]),a(De,{gutter:[12,12]},{default:i(()=>[(O(!0),ae(ut,null,ct(l.value,(m,X)=>(O(),te(Me,{span:12,key:m.nname},{default:i(()=>[a(b,{bordered:!0,size:"small"},{header:i(()=>[j("div",{style:xt({color:x(s).themeScheme==="dark"?"#fff":"#000",fontWeight:"bolder",padding:"5px",fontSize:"18px",marginBottom:"10px",display:"flex",alignItems:"center"})},[an,P(" "+le(m.nname)+"网络配置   ",1),Number(m.nname.charAt(m.nname.length-1)||m.nname.replace("eno",""))==d.value+1?(O(),te(E,{key:0,"local-icon":"lan-active",style:{"font-size":"24px"},class:"animation"})):(O(),te(E,{key:1,"local-icon":"lan-default",style:{"font-size":"24px"}}))],4)]),default:i(()=>[a(q,{ref_for:!0,ref_key:"IpformRef",ref:k,model:m,rules:d.value==X?f:w,"label-placement":"left","label-width":90,"show-require-mark":d.value==X,"require-mark-placement":"left"},{default:i(()=>[a(Be,{responsive:"screen","item-responsive":""},{default:i(()=>[a(Q,{span:"24 s:12 m:10",label:"IP地址",path:"nip"},{default:i(()=>[a(x(H),{clearable:"",placeholder:"请输入IP地址",value:m.nip,"onUpdate:value":U=>m.nip=U,onClear:U=>R(X)},null,8,["value","onUpdate:value","onClear"])]),_:2},1024),a(Q,{span:"24 s:12 m:10",label:"掩码",path:"nmaskbits"},{default:i(()=>[a(x(fe),{"render-label":ue,clearable:"",options:r(),placeholder:"请选择掩码位数",value:m.nmaskbits,"onUpdate:value":U=>m.nmaskbits=U,onClear:U=>K(X)},null,8,["options","value","onUpdate:value","onClear"])]),_:2},1024),a(Q,{span:"24 s:12 m:2",label:""},{default:i(()=>[a(Te,{value:m.list2.length,max:100,type:"info"},{default:i(()=>[a(x(A),{type:"info",ghost:"",onClick:U=>Ie(X),class:"ml-20px"},{icon:i(()=>[a(p,{class:"text-icon"})]),default:i(()=>[P(" 网关路由 ")]),_:2},1032,["onClick"])]),_:2},1032,["value"])]),_:2},1024)]),_:2},1024)]),_:2},1032,["model","rules","show-require-mark"])]),_:2},1024)]),_:2},1024))),128))]),_:1}),a(u,{justify:"center",class:"w-100%"},{default:i(()=>[re((O(),te(x(A),{type:"info",ghost:"",onClick:N,"icon-placement":"left"},{icon:i(()=>[a(qe)]),default:i(()=>[P(" 应用配置 ")]),_:1})),[[Ve,"sys.network.update"]])]),_:1}),a(Oe,{show:T.value,"onUpdate:show":n[4]||(n[4]=m=>T.value=m),title:l.value[L.value].nname+"网关路由配置",preset:"card","mask-closable":!1,class:"w-900px h-500px"},{footer:i(()=>[a(u,{size:16,justify:"end"},{default:i(()=>[a(x(A),{type:"primary",onClick:Re},{default:i(()=>[P("保存")]),_:1})]),_:1})]),default:i(()=>[j("div",sn,[a(u,{justify:"end",align:"center",class:"w-100% mb-10px"},{default:i(()=>[a(x(A),{size:"small",ghost:"",type:"primary",onClick:n[3]||(n[3]=m=>M.value.push({id:l.value[L.value].list2.length+1,ip:"",nextip:"",netMask:null}))},{icon:i(()=>[a(Ee,{class:"text-icon"})]),default:i(()=>[P(" 添加")]),_:1})]),_:1}),a(Ae,{columns:c,data:M.value,size:"small",remote:"","row-key":m=>m.id,class:"sm:h-full","max-height":280},null,8,["columns","data","row-key"])])]),_:1},8,["show","title"])])}}}),vn=$t(rn,[["__scopeId","data-v-5b5a6bb9"]]);export{vn as default};
