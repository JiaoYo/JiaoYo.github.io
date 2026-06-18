import{m as f,aa as x,l as $,ab as o,ad as H,cp as O,d as z,n,p as D,s as W,a as N,bM as q,q as _,eS as L,ag as k,r as K,ai as G,a9 as J,ap as P,cn as Q,I as X,eT as Y,bL as F,dN as Z,dv as A,eU as ee,eV as ae,cm as re,C as te,an as le,bT as T,am as oe,dV as se}from"./index-Ur4Xn0nS.js";import{C as ne}from"./ChevronLeft-DQrIZoJE.js";const ie=f("collapse","width: 100%;",[f("collapse-item",`
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition:
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 margin: var(--n-item-margin);
 `,[x("disabled",[o("header","cursor: not-allowed;",[o("header-main",`
 color: var(--n-title-text-color-disabled);
 `),f("collapse-item-arrow",`
 color: var(--n-arrow-color-disabled);
 `)])]),f("collapse-item","margin-left: 32px;"),$("&:first-child","margin-top: 0;"),$("&:first-child >",[o("header","padding-top: 0;")]),x("left-arrow-placement",[o("header",[f("collapse-item-arrow","margin-right: 4px;")])]),x("right-arrow-placement",[o("header",[f("collapse-item-arrow","margin-left: 4px;")])]),o("content-wrapper",[o("content-inner","padding-top: 16px;"),O({duration:"0.15s"})]),x("active",[o("header",[x("active",[f("collapse-item-arrow","transform: rotate(90deg);")])])]),$("&:not(:first-child)","border-top: 1px solid var(--n-divider-color);"),H("disabled",[x("trigger-area-main",[o("header",[o("header-main","cursor: pointer;"),f("collapse-item-arrow","cursor: default;")])]),x("trigger-area-arrow",[o("header",[f("collapse-item-arrow","cursor: pointer;")])]),x("trigger-area-extra",[o("header",[o("header-extra","cursor: pointer;")])])]),o("header",`
 font-size: var(--n-title-font-size);
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition: color .3s var(--n-bezier);
 position: relative;
 padding: var(--n-title-padding);
 color: var(--n-title-text-color);
 `,[o("header-main",`
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 font-weight: var(--n-title-font-weight);
 transition: color .3s var(--n-bezier);
 flex: 1;
 color: var(--n-title-text-color);
 `),o("header-extra",`
 display: flex;
 align-items: center;
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 `),f("collapse-item-arrow",`
 display: flex;
 transition:
 transform .15s var(--n-bezier),
 color .3s var(--n-bezier);
 font-size: 18px;
 color: var(--n-arrow-color);
 `)])])]),de=Object.assign(Object.assign({},_.props),{defaultExpandedNames:{type:[Array,String],default:null},expandedNames:[Array,String],arrowPlacement:{type:String,default:"left"},accordion:{type:Boolean,default:!1},displayDirective:{type:String,default:"if"},triggerAreas:{type:Array,default:()=>["main","extra","arrow"]},onItemHeaderClick:[Function,Array],"onUpdate:expandedNames":[Function,Array],onUpdateExpandedNames:[Function,Array],onExpandedNamesChange:{type:[Function,Array],validator:()=>!0,default:void 0}}),U=G("n-collapse"),ue=z({name:"Collapse",props:de,slots:Object,setup(e,{slots:i}){const{mergedClsPrefixRef:s,inlineThemeDisabled:l,mergedRtlRef:d}=D(e),r=W(e.defaultExpandedNames),h=N(()=>e.expandedNames),v=q(h,r),w=_("Collapse","-collapse",ie,L,e,s);function c(p){const{"onUpdate:expandedNames":t,onUpdateExpandedNames:m,onExpandedNamesChange:y}=e;m&&P(m,p),t&&P(t,p),y&&P(y,p),r.value=p}function g(p){const{onItemHeaderClick:t}=e;t&&P(t,p)}function a(p,t,m){const{accordion:y}=e,{value:E}=v;if(y)p?(c([t]),g({name:t,expanded:!0,event:m})):(c([]),g({name:t,expanded:!1,event:m}));else if(!Array.isArray(E))c([t]),g({name:t,expanded:!0,event:m});else{const C=E.slice(),I=C.findIndex(S=>t===S);~I?(C.splice(I,1),c(C),g({name:t,expanded:!1,event:m})):(C.push(t),c(C),g({name:t,expanded:!0,event:m}))}}J(U,{props:e,mergedClsPrefixRef:s,expandedNamesRef:v,slots:i,toggleItem:a});const u=k("Collapse",d,s),R=N(()=>{const{common:{cubicBezierEaseInOut:p},self:{titleFontWeight:t,dividerColor:m,titlePadding:y,titleTextColor:E,titleTextColorDisabled:C,textColor:I,arrowColor:S,fontSize:j,titleFontSize:B,arrowColorDisabled:M,itemMargin:V}}=w.value;return{"--n-font-size":j,"--n-bezier":p,"--n-text-color":I,"--n-divider-color":m,"--n-title-padding":y,"--n-title-font-size":B,"--n-title-text-color":E,"--n-title-text-color-disabled":C,"--n-title-font-weight":t,"--n-arrow-color":S,"--n-arrow-color-disabled":M,"--n-item-margin":V}}),b=l?K("collapse",void 0,R,e):void 0;return{rtlEnabled:u,mergedTheme:w,mergedClsPrefix:s,cssVars:l?void 0:R,themeClass:b==null?void 0:b.themeClass,onRender:b==null?void 0:b.onRender}},render(){var e;return(e=this.onRender)===null||e===void 0||e.call(this),n("div",{class:[`${this.mergedClsPrefix}-collapse`,this.rtlEnabled&&`${this.mergedClsPrefix}-collapse--rtl`,this.themeClass],style:this.cssVars},this.$slots)}}),ce=z({name:"CollapseItemContent",props:{displayDirective:{type:String,required:!0},show:Boolean,clsPrefix:{type:String,required:!0}},setup(e){return{onceTrue:Y(F(e,"show"))}},render(){return n(Q,null,{default:()=>{const{show:e,displayDirective:i,onceTrue:s,clsPrefix:l}=this,d=i==="show"&&s,r=n("div",{class:`${l}-collapse-item__content-wrapper`},n("div",{class:`${l}-collapse-item__content-inner`},this.$slots));return d?X(r,[[Z,e]]):e?r:null}})}}),pe={title:String,name:[String,Number],disabled:Boolean,displayDirective:String},he=z({name:"CollapseItem",props:pe,setup(e){const{mergedRtlRef:i}=D(e),s=ae(),l=re(()=>{var a;return(a=e.name)!==null&&a!==void 0?a:s}),d=te(U);d||le("collapse-item","`n-collapse-item` must be placed inside `n-collapse`.");const{expandedNamesRef:r,props:h,mergedClsPrefixRef:v,slots:w}=d,c=N(()=>{const{value:a}=r;if(Array.isArray(a)){const{value:u}=l;return!~a.findIndex(R=>R===u)}else if(a){const{value:u}=l;return u!==a}return!0});return{rtlEnabled:k("Collapse",i,v),collapseSlots:w,randomName:s,mergedClsPrefix:v,collapsed:c,triggerAreas:F(h,"triggerAreas"),mergedDisplayDirective:N(()=>{const{displayDirective:a}=e;return a||h.displayDirective}),arrowPlacement:N(()=>h.arrowPlacement),handleClick(a){let u="main";T(a,"arrow")&&(u="arrow"),T(a,"extra")&&(u="extra"),h.triggerAreas.includes(u)&&d&&!e.disabled&&d.toggleItem(c.value,l.value,a)}}},render(){const{collapseSlots:e,$slots:i,arrowPlacement:s,collapsed:l,mergedDisplayDirective:d,mergedClsPrefix:r,disabled:h,triggerAreas:v}=this,w=A(i.header,{collapsed:l},()=>[this.title]),c=i["header-extra"]||e["header-extra"],g=i.arrow||e.arrow;return n("div",{class:[`${r}-collapse-item`,`${r}-collapse-item--${s}-arrow-placement`,h&&`${r}-collapse-item--disabled`,!l&&`${r}-collapse-item--active`,v.map(a=>`${r}-collapse-item--trigger-area-${a}`)]},n("div",{class:[`${r}-collapse-item__header`,!l&&`${r}-collapse-item__header--active`]},n("div",{class:`${r}-collapse-item__header-main`,onClick:this.handleClick},s==="right"&&w,n("div",{class:`${r}-collapse-item-arrow`,key:this.rtlEnabled?0:1,"data-arrow":!0},A(g,{collapsed:l},()=>[n(oe,{clsPrefix:r},{default:()=>this.rtlEnabled?n(ne,null):n(se,null)})])),s==="left"&&w),ee(c,{collapsed:l},a=>n("div",{class:`${r}-collapse-item__header-extra`,onClick:this.handleClick,"data-extra":!0},a))),n(ce,{clsPrefix:r,displayDirective:d,show:!l},i))}});export{ue as N,he as a};
