import{cW as N,k as O,cX as V,m as t,cJ as d,l as g,a_ as l,d as S,p as y,q as $,n as s,cp as E,aa as H,ct as v,cD as z,C as K,cI as M,a as x,bc as p,cY as D,r as L}from"./index-CKNDbQIr.js";let b=!1;function q(){if(N&&window.CSS&&!b&&(b=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function J(e){const{textColor3:n,infoColor:o,errorColor:r,successColor:i,warningColor:c,textColor1:a,textColor2:m,railColor:h,fontWeightStrong:f,fontSize:u}=e;return Object.assign(Object.assign({},V),{contentFontSize:u,titleFontWeight:f,circleBorder:`2px solid ${n}`,circleBorderInfo:`2px solid ${o}`,circleBorderError:`2px solid ${r}`,circleBorderSuccess:`2px solid ${i}`,circleBorderWarning:`2px solid ${c}`,iconColor:n,iconColorInfo:o,iconColorError:r,iconColorSuccess:i,iconColorWarning:c,titleTextColor:a,contentTextColor:m,metaTextColor:n,lineColor:h})}const X={common:O,self:J},C=1.25,Y=t("timeline",`
 position: relative;
 width: 100%;
 display: flex;
 flex-direction: column;
 line-height: ${C};
`,[d("horizontal",`
 flex-direction: row;
 `,[g(">",[t("timeline-item",`
 flex-shrink: 0;
 padding-right: 40px;
 `,[d("dashed-line-type",[g(">",[t("timeline-item-timeline",[l("line",`
 background-image: linear-gradient(90deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 10px 1px;
 `)])])]),g(">",[t("timeline-item-content",`
 margin-top: calc(var(--n-icon-size) + 12px);
 `,[g(">",[l("meta",`
 margin-top: 6px;
 margin-bottom: unset;
 `)])]),t("timeline-item-timeline",`
 width: 100%;
 height: calc(var(--n-icon-size) + 12px);
 `,[l("line",`
 left: var(--n-icon-size);
 top: calc(var(--n-icon-size) / 2 - 1px);
 right: 0px;
 width: unset;
 height: 2px;
 `)])])])])]),d("right-placement",[t("timeline-item",[t("timeline-item-content",`
 text-align: right;
 margin-right: calc(var(--n-icon-size) + 12px);
 `),t("timeline-item-timeline",`
 width: var(--n-icon-size);
 right: 0;
 `)])]),d("left-placement",[t("timeline-item",[t("timeline-item-content",`
 margin-left: calc(var(--n-icon-size) + 12px);
 `),t("timeline-item-timeline",`
 left: 0;
 `)])]),t("timeline-item",`
 position: relative;
 `,[g("&:last-child",[t("timeline-item-timeline",[l("line",`
 display: none;
 `)]),t("timeline-item-content",[l("meta",`
 margin-bottom: 0;
 `)])]),t("timeline-item-content",[l("title",`
 margin: var(--n-title-margin);
 font-size: var(--n-title-font-size);
 transition: color .3s var(--n-bezier);
 font-weight: var(--n-title-font-weight);
 color: var(--n-title-text-color);
 `),l("content",`
 transition: color .3s var(--n-bezier);
 font-size: var(--n-content-font-size);
 color: var(--n-content-text-color);
 `),l("meta",`
 transition: color .3s var(--n-bezier);
 font-size: 12px;
 margin-top: 6px;
 margin-bottom: 20px;
 color: var(--n-meta-text-color);
 `)]),d("dashed-line-type",[t("timeline-item-timeline",[l("line",`
 --n-color-start: var(--n-line-color);
 transition: --n-color-start .3s var(--n-bezier);
 background-color: transparent;
 background-image: linear-gradient(180deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 1px 10px;
 `)])]),t("timeline-item-timeline",`
 width: calc(var(--n-icon-size) + 12px);
 position: absolute;
 top: calc(var(--n-title-font-size) * ${C} / 2 - var(--n-icon-size) / 2);
 height: 100%;
 `,[l("circle",`
 border: var(--n-circle-border);
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 border-radius: var(--n-icon-size);
 box-sizing: border-box;
 `),l("icon",`
 color: var(--n-icon-color);
 font-size: var(--n-icon-size);
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 display: flex;
 align-items: center;
 justify-content: center;
 `),l("line",`
 transition: background-color .3s var(--n-bezier);
 position: absolute;
 top: var(--n-icon-size);
 left: calc(var(--n-icon-size) / 2 - 1px);
 bottom: 0px;
 width: 2px;
 background-color: var(--n-line-color);
 `)])])]),A=Object.assign(Object.assign({},$.props),{horizontal:Boolean,itemPlacement:{type:String,default:"left"},size:{type:String,default:"medium"},iconSize:Number}),w=E("n-timeline"),U=S({name:"Timeline",props:A,setup(e,{slots:n}){const{mergedClsPrefixRef:o}=y(e),r=$("Timeline","-timeline",Y,X,e,o);return H(w,{props:e,mergedThemeRef:r,mergedClsPrefixRef:o}),()=>{const{value:i}=o;return s("div",{class:[`${i}-timeline`,e.horizontal&&`${i}-timeline--horizontal`,`${i}-timeline--${e.size}-size`,!e.horizontal&&`${i}-timeline--${e.itemPlacement}-placement`]},n)}}}),G={time:[String,Number],title:String,content:String,color:String,lineType:{type:String,default:"default"},type:{type:String,default:"default"}},Z=S({name:"TimelineItem",props:G,slots:Object,setup(e){const n=K(w);n||M("timeline-item","`n-timeline-item` must be placed inside `n-timeline`."),q();const{inlineThemeDisabled:o}=y(),r=x(()=>{const{props:{size:c,iconSize:a},mergedThemeRef:m}=n,{type:h}=e,{self:{titleTextColor:f,contentTextColor:u,metaTextColor:T,lineColor:P,titleFontWeight:_,contentFontSize:B,[p("iconSize",c)]:k,[p("titleMargin",c)]:R,[p("titleFontSize",c)]:j,[p("circleBorder",h)]:I,[p("iconColor",h)]:W},common:{cubicBezierEaseInOut:F}}=m.value;return{"--n-bezier":F,"--n-circle-border":I,"--n-icon-color":W,"--n-content-font-size":B,"--n-content-text-color":u,"--n-line-color":P,"--n-meta-text-color":T,"--n-title-font-size":j,"--n-title-font-weight":_,"--n-title-margin":R,"--n-title-text-color":f,"--n-icon-size":D(a)||k}}),i=o?L("timeline-item",x(()=>{const{props:{size:c,iconSize:a}}=n,{type:m}=e;return`${c[0]}${a||"a"}${m[0]}`}),r,n.props):void 0;return{mergedClsPrefix:n.mergedClsPrefixRef,cssVars:o?void 0:r,themeClass:i==null?void 0:i.themeClass,onRender:i==null?void 0:i.onRender}},render(){const{mergedClsPrefix:e,color:n,onRender:o,$slots:r}=this;return o==null||o(),s("div",{class:[`${e}-timeline-item`,this.themeClass,`${e}-timeline-item--${this.type}-type`,`${e}-timeline-item--${this.lineType}-line-type`],style:this.cssVars},s("div",{class:`${e}-timeline-item-timeline`},s("div",{class:`${e}-timeline-item-timeline__line`}),v(r.icon,i=>i?s("div",{class:`${e}-timeline-item-timeline__icon`,style:{color:n}},i):s("div",{class:`${e}-timeline-item-timeline__circle`,style:{borderColor:n}}))),s("div",{class:`${e}-timeline-item-content`},v(r.header,i=>i||this.title?s("div",{class:`${e}-timeline-item-content__title`},i||this.title):null),s("div",{class:`${e}-timeline-item-content__content`},z(r.default,()=>[this.content])),s("div",{class:`${e}-timeline-item-content__meta`},z(r.footer,()=>[this.time]))))}});export{U as N,Z as a};
