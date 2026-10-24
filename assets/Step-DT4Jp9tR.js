import{m as n,cJ as b,l as f,a_ as g,da as z,a$ as D,d as I,n as t,d3 as K,d4 as V,p as R,db as L,q as k,dc as M,cp as q,aa as J,ct as $,cD as S,dd as G,cL as y,C as Q,cI as X,a as v,bc as c,r as Y,cR as w,de as Z,df as ee}from"./index-CKNDbQIr.js";const te=n("steps",`
 width: 100%;
 display: flex;
`,[n("step",`
 position: relative;
 display: flex;
 flex: 1;
 `,[b("disabled","cursor: not-allowed"),b("clickable",`
 cursor: pointer;
 `),f("&:last-child",[n("step-splitor","display: none;")])]),n("step-splitor",`
 background-color: var(--n-splitor-color);
 margin-top: calc(var(--n-step-header-font-size) / 2);
 height: 1px;
 flex: 1;
 align-self: flex-start;
 margin-left: 12px;
 margin-right: 12px;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `),n("step-content","flex: 1;",[n("step-content-header",`
 color: var(--n-header-text-color);
 margin-top: calc(var(--n-indicator-size) / 2 - var(--n-step-header-font-size) / 2);
 line-height: var(--n-step-header-font-size);
 font-size: var(--n-step-header-font-size);
 position: relative;
 display: flex;
 font-weight: var(--n-step-header-font-weight);
 margin-left: 9px;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `,[g("title",`
 white-space: nowrap;
 flex: 0;
 `)]),g("description",`
 color: var(--n-description-text-color);
 margin-top: 12px;
 margin-left: 9px;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `)]),n("step-indicator",`
 background-color: var(--n-indicator-color);
 box-shadow: 0 0 0 1px var(--n-indicator-border-color);
 height: var(--n-indicator-size);
 width: var(--n-indicator-size);
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 `,[n("step-indicator-slot",`
 position: relative;
 width: var(--n-indicator-icon-size);
 height: var(--n-indicator-icon-size);
 font-size: var(--n-indicator-icon-size);
 line-height: var(--n-indicator-icon-size);
 `,[g("index",`
 display: inline-block;
 text-align: center;
 position: absolute;
 left: 0;
 top: 0;
 white-space: nowrap;
 font-size: var(--n-indicator-index-font-size);
 width: var(--n-indicator-icon-size);
 height: var(--n-indicator-icon-size);
 line-height: var(--n-indicator-icon-size);
 color: var(--n-indicator-text-color);
 transition: color .3s var(--n-bezier);
 `,[z()]),n("icon",`
 color: var(--n-indicator-text-color);
 transition: color .3s var(--n-bezier);
 `,[z()]),n("base-icon",`
 color: var(--n-indicator-text-color);
 transition: color .3s var(--n-bezier);
 `,[z()])])]),b("vertical","flex-direction: column;",[D("show-description",[f(">",[n("step","padding-bottom: 8px;")])]),f(">",[n("step","margin-bottom: 16px;",[f("&:last-child","margin-bottom: 0;"),f(">",[n("step-indicator",[f(">",[n("step-splitor",`
 position: absolute;
 bottom: -8px;
 width: 1px;
 margin: 0 !important;
 left: calc(var(--n-indicator-size) / 2);
 height: calc(100% - var(--n-indicator-size));
 `)])]),n("step-content",[g("description","margin-top: 8px;")])])])])])]);function ie(e,s){return typeof e!="object"||e===null||Array.isArray(e)?null:(e.props||(e.props={}),e.props.internalIndex=s+1,e)}function ne(e){return e.map((s,o)=>ie(s,o))}const re=Object.assign(Object.assign({},k.props),{current:Number,status:{type:String,default:"process"},size:{type:String,default:"medium"},vertical:Boolean,"onUpdate:current":[Function,Array],onUpdateCurrent:[Function,Array]}),T=q("n-steps"),ae=I({name:"Steps",props:re,slots:Object,setup(e,{slots:s}){const{mergedClsPrefixRef:o,mergedRtlRef:a}=R(e),p=L("Steps",a,o),d=k("Steps","-steps",te,M,e,o);return J(T,{props:e,mergedThemeRef:d,mergedClsPrefixRef:o,stepsSlots:s}),{mergedClsPrefix:o,rtlEnabled:p}},render(){const{mergedClsPrefix:e}=this;return t("div",{class:[`${e}-steps`,this.rtlEnabled&&`${e}-steps--rtl`,this.vertical&&`${e}-steps--vertical`]},ne(K(V(this))))}}),se={status:String,title:String,description:String,disabled:Boolean,internalIndex:{type:Number,default:0}},ce=I({name:"Step",props:se,slots:Object,setup(e){const s=Q(T,null);s||X("step","`n-step` must be placed inside `n-steps`.");const{inlineThemeDisabled:o}=R(),{props:a,mergedThemeRef:p,mergedClsPrefixRef:d,stepsSlots:l}=s,x=v(()=>a.vertical),m=v(()=>{const{status:i}=e;if(i)return i;{const{internalIndex:r}=e,{current:h}=a;if(h===void 0)return"process";if(r<h)return"finish";if(r===h)return a.status||"process";if(r>h)return"wait"}return"process"}),C=v(()=>{const{value:i}=m,{size:r}=a,{common:{cubicBezierEaseInOut:h},self:{stepHeaderFontWeight:N,[c("stepHeaderFontSize",r)]:j,[c("indicatorIndexFontSize",r)]:F,[c("indicatorSize",r)]:_,[c("indicatorIconSize",r)]:B,[c("indicatorTextColor",i)]:E,[c("indicatorBorderColor",i)]:O,[c("headerTextColor",i)]:U,[c("splitorColor",i)]:A,[c("indicatorColor",i)]:H,[c("descriptionTextColor",i)]:W}}=p.value;return{"--n-bezier":h,"--n-description-text-color":W,"--n-header-text-color":U,"--n-indicator-border-color":O,"--n-indicator-color":H,"--n-indicator-icon-size":B,"--n-indicator-index-font-size":F,"--n-indicator-size":_,"--n-indicator-text-color":E,"--n-splitor-color":A,"--n-step-header-font-size":j,"--n-step-header-font-weight":N}}),u=o?Y("step",v(()=>{const{value:i}=m,{size:r}=a;return`${i[0]}${r[0]}`}),C,a):void 0,P=v(()=>{if(e.disabled)return;const{onUpdateCurrent:i,"onUpdate:current":r}=a;return i||r?()=>{i&&w(i,e.internalIndex),r&&w(r,e.internalIndex)}:void 0});return{stepsSlots:l,mergedClsPrefix:d,vertical:x,mergedStatus:m,handleStepClick:P,cssVars:o?void 0:C,themeClass:u==null?void 0:u.themeClass,onRender:u==null?void 0:u.onRender}},render(){const{mergedClsPrefix:e,onRender:s,handleStepClick:o,disabled:a}=this,p=$(this.$slots.default,d=>{const l=d||this.description;return l?t("div",{class:`${e}-step-content__description`},l):null});return s==null||s(),t("div",{class:[`${e}-step`,a&&`${e}-step--disabled`,!a&&o&&`${e}-step--clickable`,this.themeClass,p&&`${e}-step--show-description`,`${e}-step--${this.mergedStatus}-status`],style:this.cssVars,onClick:o},t("div",{class:`${e}-step-indicator`},t("div",{class:`${e}-step-indicator-slot`},t(G,null,{default:()=>$(this.$slots.icon,d=>{const{mergedStatus:l,stepsSlots:x}=this;return l==="finish"||l==="error"?l==="finish"?t(y,{clsPrefix:e,key:"finish"},{default:()=>S(x["finish-icon"],()=>[t(Z,null)])}):l==="error"?t(y,{clsPrefix:e,key:"error"},{default:()=>S(x["error-icon"],()=>[t(ee,null)])}):null:d||t("div",{key:this.internalIndex,class:`${e}-step-indicator-slot__index`},this.internalIndex)})})),this.vertical?t("div",{class:`${e}-step-splitor`}):null),t("div",{class:`${e}-step-content`},t("div",{class:`${e}-step-content-header`},t("div",{class:`${e}-step-content-header__title`},S(this.$slots.title,()=>[this.title])),this.vertical?null:t("div",{class:`${e}-step-splitor`})),p))}});export{ae as N,ce as a};
