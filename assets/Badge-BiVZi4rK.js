import{d as O,z as g,f as y,ag as I,al as Y,bC as C,c as x,o as l,a4 as m,g as P,a6 as d,bW as s,cR as F,a1 as b,cS as D,bY as f,a2 as L,bB as q,h as _,a as k,cT as U,cU as Z,cV as G,bX as T,a3 as W,T as K,R as E,a7 as j,cW as J,n as Q,cl as H,a9 as ee,aa as ae,cX as te,cY as ne,bO as oe,cZ as re}from"./index-_WY453Y6.js";var A=O({name:"SlotMachineNumber",props:{clsPrefix:{type:String,required:!0},value:{type:[Number,String],required:!0},oldOriginalNumber:{type:Number,default:void 0},newOriginalNumber:{type:Number,default:void 0}},setup(e){const r=g(null),o=g(e.value),i=g(e.value),t=g("up"),a=g(!1),p=y(()=>a.value?`${e.clsPrefix}-base-slot-machine-current-number--${t.value}-scroll`:null),w=y(()=>a.value?`${e.clsPrefix}-base-slot-machine-old-number--${t.value}-scroll`:null);I(C(e,"value"),(n,u)=>{o.value=u,i.value=n,Y(z)});function z(){const n=e.newOriginalNumber,u=e.oldOriginalNumber;u===void 0||n===void 0||(n>u?S("up"):u>n&&S("down"))}function S(n){t.value=n,a.value=!1,Y(()=>{var u;(u=r.value)==null||u.offsetWidth,a.value=!0})}return()=>{const{clsPrefix:n}=e;return l(),x("span",{ref:r,class:d(`${n}-base-slot-machine-number`)},[o.value!==null?(l(),x("span",{key:0,class:d([`${n}-base-slot-machine-old-number ${n}-base-slot-machine-old-number--top`,w.value])},[m(()=>o.value)],2)):m(()=>null),P("span",{class:d([`${n}-base-slot-machine-current-number`,p.value])},[P("span",{ref:"numberWrapper",class:d([`${n}-base-slot-machine-current-number__inner`,typeof e.value!="number"&&`${n}-base-slot-machine-current-number__inner--not-number`])},[m(()=>i.value)],2)],2),o.value!==null?(l(),x("span",{key:2,class:d([`${n}-base-slot-machine-old-number ${n}-base-slot-machine-old-number--bottom`,w.value])},[m(()=>o.value)],2)):m(()=>null)],2)}}});const{cubicBezierEaseOut:N}=F;function ie({duration:e=".2s"}={}){return[s("&.fade-up-width-expand-transition-leave-active",{transition:`
 opacity ${e} ${N},
 max-width ${e} ${N},
 transform ${e} ${N}
 `}),s("&.fade-up-width-expand-transition-enter-active",{transition:`
 opacity ${e} ${N},
 max-width ${e} ${N},
 transform ${e} ${N}
 `}),s("&.fade-up-width-expand-transition-enter-to",{opacity:1,transform:"translateX(0) translateY(0)"}),s("&.fade-up-width-expand-transition-enter-from",{maxWidth:"0 !important",opacity:0,transform:"translateY(60%)"}),s("&.fade-up-width-expand-transition-leave-from",{opacity:1,transform:"translateY(0)"}),s("&.fade-up-width-expand-transition-leave-to",{maxWidth:"0 !important",opacity:0,transform:"translateY(60%)"})]}var se=s([s("@keyframes n-base-slot-machine-fade-up-in",`
 from {
 transform: translateY(60%);
 opacity: 0;
 }
 to {
 transform: translateY(0);
 opacity: 1;
 }
 `),s("@keyframes n-base-slot-machine-fade-down-in",`
 from {
 transform: translateY(-60%);
 opacity: 0;
 }
 to {
 transform: translateY(0);
 opacity: 1;
 }
 `),s("@keyframes n-base-slot-machine-fade-up-out",`
 from {
 transform: translateY(0%);
 opacity: 1;
 }
 to {
 transform: translateY(-60%);
 opacity: 0;
 }
 `),s("@keyframes n-base-slot-machine-fade-down-out",`
 from {
 transform: translateY(0%);
 opacity: 1;
 }
 to {
 transform: translateY(60%);
 opacity: 0;
 }
 `),b("base-slot-machine",`
 overflow: hidden;
 white-space: nowrap;
 display: inline-block;
 height: 18px;
 line-height: 18px;
 `,[b("base-slot-machine-number",`
 display: inline-block;
 position: relative;
 height: 18px;
 width: .6em;
 max-width: .6em;
 `,[ie({duration:".2s"}),D({duration:".2s",delay:"0s"}),b("base-slot-machine-old-number",`
 display: inline-block;
 opacity: 0;
 position: absolute;
 left: 0;
 right: 0;
 `,[f("top",{transform:"translateY(-100%)"}),f("bottom",{transform:"translateY(100%)"}),f("down-scroll",{animation:"n-base-slot-machine-fade-down-out .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),f("up-scroll",{animation:"n-base-slot-machine-fade-up-out .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1})]),b("base-slot-machine-current-number",`
 display: inline-block;
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 1;
 transform: translateY(0);
 width: .6em;
 `,[f("down-scroll",{animation:"n-base-slot-machine-fade-down-in .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),f("up-scroll",{animation:"n-base-slot-machine-fade-up-in .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),L("inner",`
 display: inline-block;
 position: absolute;
 right: 0;
 top: 0;
 width: .6em;
 `,[f("not-number",`
 right: unset;
 left: 0;
 `)])])])])]),le=O({name:"BaseSlotMachine",props:{clsPrefix:{type:String,required:!0},value:{type:[Number,String],default:0},max:{type:Number,default:void 0},appeared:{type:Boolean,required:!0}},setup(e){q("-base-slot-machine",se,C(e,"clsPrefix"));const r=g(),o=g(),i=y(()=>{if(typeof e.value=="string")return[];if(e.value<1)return[0];const t=[];let a=e.value;for(e.max!==void 0&&(a=Math.min(e.max,a));a>=1;)t.push(a%10),a/=10,a=Math.floor(a);return t.reverse(),t});return I(C(e,"value"),(t,a)=>{typeof t=="string"?(o.value=void 0,r.value=void 0):typeof a=="string"?(o.value=t,r.value=void 0):(o.value=t,r.value=a)}),()=>{const{value:t,clsPrefix:a}=e;return typeof t=="number"?(l(),x("span",{key:1,class:d(`${a}-base-slot-machine`)},[_(U,{name:"fade-up-width-expand-transition",tag:"span"},{default:()=>i.value.map((p,w)=>(l(),k(A,{clsPrefix:a,key:i.value.length-w-1,oldOriginalNumber:r.value,newOriginalNumber:o.value,value:p},null,8,["clsPrefix","oldOriginalNumber","newOriginalNumber","value"])))},1024),_(Z,{key:"+",width:!0},{default:()=>e.max!==void 0&&e.max<t?(l(),k(A,{key:2,clsPrefix:a,value:"+"},null,8,["clsPrefix"])):null},1024)],2)):(l(),x("span",{key:3,class:d(`${a}-base-slot-machine`)},[m(()=>t)],2))}}});function ue(e){const{errorColor:r,infoColor:o,successColor:i,warningColor:t,fontFamily:a}=e;return{color:r,colorInfo:o,colorSuccess:i,colorError:r,colorWarning:t,fontSize:"12px",fontFamily:a}}const ce={common:G,self:ue};var fe=s([s("@keyframes badge-wave-spread",{from:{boxShadow:"0 0 0.5px 0px var(--n-ripple-color)",opacity:.6},to:{boxShadow:"0 0 0.5px 4.5px var(--n-ripple-color)",opacity:0}}),b("badge",`
 display: inline-flex;
 position: relative;
 vertical-align: middle;
 font-family: var(--n-font-family);
 `,[f("as-is",[b("badge-sup",{position:"static",transform:"translateX(0)"},[T({transformOrigin:"left bottom",originalTransform:"translateX(0)"})])]),f("dot",[b("badge-sup",`
 height: 8px;
 width: 8px;
 padding: 0;
 min-width: 8px;
 left: 100%;
 bottom: calc(100% - 4px);
 `,[s("::before","border-radius: 4px;")])]),b("badge-sup",`
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
 z-index: 2;
 display: flex;
 align-items: center;
 `,[T({transformOrigin:"left bottom",originalTransform:"translateX(-50%)"}),b("base-wave",{zIndex:1,animationDuration:"2s",animationIterationCount:"infinite",animationDelay:"1s",animationTimingFunction:"var(--n-ripple-bezier)",animationName:"badge-wave-spread"}),s("&::before",`
 opacity: 0;
 transform: scale(1);
 border-radius: 9px;
 content: "";
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 `)])])]);const me=["title"],de={...W.props,value:[String,Number],max:Number,dot:Boolean,type:{type:String,default:"default"},show:{type:Boolean,default:!0},showZero:Boolean,processing:Boolean,color:String,offset:Array};var pe=O({name:"Badge",props:de,setup(e,{slots:r}){const{mergedClsPrefixRef:o,inlineThemeDisabled:i,mergedRtlRef:t}=j(e),a=W("Badge","-badge",fe,ce,e,o),p=g(!1),w=()=>{p.value=!0},z=()=>{p.value=!1},S=y(()=>e.show&&(e.dot||e.value!==void 0&&!(!e.showZero&&Number(e.value)<=0)||!J(r.value)));Q(()=>{S.value&&(p.value=!0)});const n=H("Badge",t,o),u=y(()=>{const{type:h,color:c}=e,{common:{cubicBezierEaseInOut:v,cubicBezierEaseOut:R},self:{[ee("color",h)]:B,fontFamily:V,fontSize:X}}=a.value;return{"--n-font-size":X,"--n-font-family":V,"--n-color":c||B,"--n-ripple-color":c||B,"--n-bezier":v,"--n-ripple-bezier":R}}),$=i?ae("badge",y(()=>{let h="";const{type:c,color:v}=e;return c&&(h+=c[0]),v&&(h+=te(v)),h}),u,e):void 0,M=y(()=>{const{offset:h}=e;if(!h)return;const[c,v]=h,R=typeof c=="number"?`${c}px`:c,B=typeof v=="number"?`${v}px`:v;return{transform:`translate(calc(${n!=null&&n.value?"50%":"-50%"} + ${R}), ${B})`}});return{rtlEnabled:n,mergedClsPrefix:o,appeared:p,showBadge:S,handleAfterEnter:w,handleAfterLeave:z,cssVars:i?void 0:u,themeClass:$==null?void 0:$.themeClass,onRender:$==null?void 0:$.onRender,offsetStyle:M}},render(){var a;const{mergedClsPrefix:e,onRender:r,themeClass:o,$slots:i}=this;r==null||r();const t=(a=i.default)==null?void 0:a.call(i);return l(),x("div",{class:d([`${e}-badge`,this.rtlEnabled&&`${e}-badge--rtl`,o,{[`${e}-badge--dot`]:this.dot,[`${e}-badge--as-is`]:!t}]),style:E(this.cssVars)},[m(()=>t),(l(),k(K,{name:"fade-in-scale-up-transition",onAfterEnter:this.handleAfterEnter,onAfterLeave:this.handleAfterLeave},{default:()=>this.showBadge?(l(),x("sup",{key:1,class:d(`${e}-badge-sup`),title:ne(this.value),style:E(this.offsetStyle)},[m(()=>oe(i.value,()=>[this.dot?null:(l(),k(le,{key:2,clsPrefix:e,appeared:this.appeared,max:this.max,value:this.value},null,8,["clsPrefix","appeared","max","value"]))])),this.processing?(l(),k(re,{key:0,clsPrefix:e},null,8,["clsPrefix"])):m(()=>null)],14,me)):null},1032,["onAfterEnter","onAfterLeave"]))],6)}});export{pe as B};
