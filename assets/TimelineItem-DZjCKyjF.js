import{cn as V,k as W,dK as E,m as t,aa as d,l as g,ab as l,d as S,p as y,q as $,n as s,ai as K,a9 as H,aj as v,ak as z,C as L,an as M,a as x,ao as p,dL as N,r as q}from"./index-AKIKKC6U.js";let b=!1;function D(){if(V&&window.CSS&&!b&&(b=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function A(e){const{textColor3:n,infoColor:o,errorColor:r,successColor:i,warningColor:a,textColor1:c,textColor2:m,railColor:h,fontWeightStrong:u,fontSize:f}=e;return Object.assign(Object.assign({},E),{contentFontSize:f,titleFontWeight:u,circleBorder:`2px solid ${n}`,circleBorderInfo:`2px solid ${o}`,circleBorderError:`2px solid ${r}`,circleBorderSuccess:`2px solid ${i}`,circleBorderWarning:`2px solid ${a}`,iconColor:n,iconColorInfo:o,iconColorError:r,iconColorSuccess:i,iconColorWarning:a,titleTextColor:c,contentTextColor:m,metaTextColor:n,lineColor:h})}const G={common:W,self:A},C=1.25,J=t("timeline",`
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
 `)])])]),Q=Object.assign(Object.assign({},$.props),{horizontal:Boolean,itemPlacement:{type:String,default:"left"},size:{type:String,default:"medium"},iconSize:Number}),w=K("n-timeline"),Y=S({name:"Timeline",props:Q,setup(e,{slots:n}){const{mergedClsPrefixRef:o}=y(e),r=$("Timeline","-timeline",J,G,e,o);return H(w,{props:e,mergedThemeRef:r,mergedClsPrefixRef:o}),()=>{const{value:i}=o;return s("div",{class:[`${i}-timeline`,e.horizontal&&`${i}-timeline--horizontal`,`${i}-timeline--${e.size}-size`,!e.horizontal&&`${i}-timeline--${e.itemPlacement}-placement`]},n)}}}),U={time:[String,Number],title:String,content:String,color:String,lineType:{type:String,default:"default"},type:{type:String,default:"default"}},Z=S({name:"TimelineItem",props:U,slots:Object,setup(e){const n=L(w);n||M("timeline-item","`n-timeline-item` must be placed inside `n-timeline`."),D();const{inlineThemeDisabled:o}=y(),r=x(()=>{const{props:{size:a,iconSize:c},mergedThemeRef:m}=n,{type:h}=e,{self:{titleTextColor:u,contentTextColor:f,metaTextColor:_,lineColor:T,titleFontWeight:P,contentFontSize:k,[p("iconSize",a)]:B,[p("titleMargin",a)]:j,[p("titleFontSize",a)]:R,[p("circleBorder",h)]:I,[p("iconColor",h)]:F},common:{cubicBezierEaseInOut:O}}=m.value;return{"--n-bezier":O,"--n-circle-border":I,"--n-icon-color":F,"--n-content-font-size":k,"--n-content-text-color":f,"--n-line-color":T,"--n-meta-text-color":_,"--n-title-font-size":R,"--n-title-font-weight":P,"--n-title-margin":j,"--n-title-text-color":u,"--n-icon-size":N(c)||B}}),i=o?q("timeline-item",x(()=>{const{props:{size:a,iconSize:c}}=n,{type:m}=e;return`${a[0]}${c||"a"}${m[0]}`}),r,n.props):void 0;return{mergedClsPrefix:n.mergedClsPrefixRef,cssVars:o?void 0:r,themeClass:i==null?void 0:i.themeClass,onRender:i==null?void 0:i.onRender}},render(){const{mergedClsPrefix:e,color:n,onRender:o,$slots:r}=this;return o==null||o(),s("div",{class:[`${e}-timeline-item`,this.themeClass,`${e}-timeline-item--${this.type}-type`,`${e}-timeline-item--${this.lineType}-line-type`],style:this.cssVars},s("div",{class:`${e}-timeline-item-timeline`},s("div",{class:`${e}-timeline-item-timeline__line`}),v(r.icon,i=>i?s("div",{class:`${e}-timeline-item-timeline__icon`,style:{color:n}},i):s("div",{class:`${e}-timeline-item-timeline__circle`,style:{borderColor:n}}))),s("div",{class:`${e}-timeline-item-content`},v(r.header,i=>i||this.title?s("div",{class:`${e}-timeline-item-content__title`},i||this.title):null),s("div",{class:`${e}-timeline-item-content__content`},z(r.default,()=>[this.content])),s("div",{class:`${e}-timeline-item-content__meta`},z(r.footer,()=>[this.time]))))}});export{Y as _,Z as a};
