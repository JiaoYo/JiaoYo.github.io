import{d as ne,E as w,a as g,ag as ee,ac as H,b3 as ae,ab as d,b4 as v,b5 as ta,b6 as r,b7 as na,b8 as m,b9 as _,ba as oa,bb as ra,bc as ia,bd as Ce,be as te,bf as Se,bg as la,bh as $e,bi as sa,bj as ze,bk as oe,bl as da,q as ca,bm as ua,bn as fa,bo as ue,bp as ha,bq as ma,br as va,bs as ba,bt as pa,bu as ga,bv as xa,bw as wa,bx as fe,by as ya,bz as ka,bA as Ra,bB as Ca,bC as G,bD as J,bE as Q,m as Sa,b as $a,o as za,e as Ba}from"./index-DCQCvkiC.js";const ye=ne({name:"SlotMachineNumber",props:{clsPrefix:{type:String,required:!0},value:{type:[Number,String],required:!0},oldOriginalNumber:{type:Number,default:void 0},newOriginalNumber:{type:Number,default:void 0}},setup(e){const o=w(null),c=w(e.value),u=w(e.value),i=w("up"),l=w(!1),y=g(()=>l.value?`${e.clsPrefix}-base-slot-machine-current-number--${i.value}-scroll`:null),C=g(()=>l.value?`${e.clsPrefix}-base-slot-machine-old-number--${i.value}-scroll`:null);ee(ae(e,"value"),(f,b)=>{c.value=b,u.value=f,H(V)});function V(){const f=e.newOriginalNumber,b=e.oldOriginalNumber;b===void 0||f===void 0||(f>b?M("up"):b>f&&M("down"))}function M(f){i.value=f,l.value=!1,H(()=>{var b;(b=o.value)===null||b===void 0||b.offsetWidth,l.value=!0})}return()=>{const{clsPrefix:f}=e;return d("span",{ref:o,class:`${f}-base-slot-machine-number`},c.value!==null?d("span",{class:[`${f}-base-slot-machine-old-number ${f}-base-slot-machine-old-number--top`,C.value]},c.value):null,d("span",{class:[`${f}-base-slot-machine-current-number`,y.value]},d("span",{ref:"numberWrapper",class:[`${f}-base-slot-machine-current-number__inner`,typeof e.value!="number"&&`${f}-base-slot-machine-current-number__inner--not-number`]},u.value)),c.value!==null?d("span",{class:[`${f}-base-slot-machine-old-number ${f}-base-slot-machine-old-number--bottom`,C.value]},c.value):null)}}}),{cubicBezierEaseOut:O}=ta;function Ta({duration:e=".2s"}={}){return[v("&.fade-up-width-expand-transition-leave-active",{transition:`
 opacity ${e} ${O},
 max-width ${e} ${O},
 transform ${e} ${O}
 `}),v("&.fade-up-width-expand-transition-enter-active",{transition:`
 opacity ${e} ${O},
 max-width ${e} ${O},
 transform ${e} ${O}
 `}),v("&.fade-up-width-expand-transition-enter-to",{opacity:1,transform:"translateX(0) translateY(0)"}),v("&.fade-up-width-expand-transition-enter-from",{maxWidth:"0 !important",opacity:0,transform:"translateY(60%)"}),v("&.fade-up-width-expand-transition-leave-from",{opacity:1,transform:"translateY(0)"}),v("&.fade-up-width-expand-transition-leave-to",{maxWidth:"0 !important",opacity:0,transform:"translateY(60%)"})]}const Na=v([v("@keyframes n-base-slot-machine-fade-up-in",`
 from {
 transform: translateY(60%);
 opacity: 0;
 }
 to {
 transform: translateY(0);
 opacity: 1;
 }
 `),v("@keyframes n-base-slot-machine-fade-down-in",`
 from {
 transform: translateY(-60%);
 opacity: 0;
 }
 to {
 transform: translateY(0);
 opacity: 1;
 }
 `),v("@keyframes n-base-slot-machine-fade-up-out",`
 from {
 transform: translateY(0%);
 opacity: 1;
 }
 to {
 transform: translateY(-60%);
 opacity: 0;
 }
 `),v("@keyframes n-base-slot-machine-fade-down-out",`
 from {
 transform: translateY(0%);
 opacity: 1;
 }
 to {
 transform: translateY(60%);
 opacity: 0;
 }
 `),r("base-slot-machine",`
 overflow: hidden;
 white-space: nowrap;
 display: inline-block;
 height: 18px;
 line-height: 18px;
 `,[r("base-slot-machine-number",`
 display: inline-block;
 position: relative;
 height: 18px;
 width: .6em;
 max-width: .6em;
 `,[Ta({duration:".2s"}),na({duration:".2s",delay:"0s"}),r("base-slot-machine-old-number",`
 display: inline-block;
 opacity: 0;
 position: absolute;
 left: 0;
 right: 0;
 `,[m("top",{transform:"translateY(-100%)"}),m("bottom",{transform:"translateY(100%)"}),m("down-scroll",{animation:"n-base-slot-machine-fade-down-out .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),m("up-scroll",{animation:"n-base-slot-machine-fade-up-out .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1})]),r("base-slot-machine-current-number",`
 display: inline-block;
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 1;
 transform: translateY(0);
 width: .6em;
 `,[m("down-scroll",{animation:"n-base-slot-machine-fade-down-in .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),m("up-scroll",{animation:"n-base-slot-machine-fade-up-in .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),_("inner",`
 display: inline-block;
 position: absolute;
 right: 0;
 top: 0;
 width: .6em;
 `,[m("not-number",`
 right: unset;
 left: 0;
 `)])])])])]),Ma=ne({name:"BaseSlotMachine",props:{clsPrefix:{type:String,required:!0},value:{type:[Number,String],default:0},max:{type:Number,default:void 0},appeared:{type:Boolean,required:!0}},setup(e){oa("-base-slot-machine",Na,ae(e,"clsPrefix"));const o=w(),c=w(),u=g(()=>{if(typeof e.value=="string")return[];if(e.value<1)return[0];const i=[];let l=e.value;for(e.max!==void 0&&(l=Math.min(e.max,l));l>=1;)i.push(l%10),l/=10,l=Math.floor(l);return i.reverse(),i});return ee(ae(e,"value"),(i,l)=>{typeof i=="string"?(c.value=void 0,o.value=void 0):typeof l=="string"?(c.value=i,o.value=void 0):(c.value=i,o.value=l)}),()=>{const{value:i,clsPrefix:l}=e;return typeof i=="number"?d("span",{class:`${l}-base-slot-machine`},d(ra,{name:"fade-up-width-expand-transition",tag:"span"},{default:()=>u.value.map((y,C)=>d(ye,{clsPrefix:l,key:u.value.length-C-1,oldOriginalNumber:o.value,newOriginalNumber:c.value,value:y}))}),d(ia,{key:"+",width:!0},{default:()=>e.max!==void 0&&e.max<i?d(ye,{clsPrefix:l,value:"+"}):null})):d("span",{class:`${l}-base-slot-machine`},i)}}});function Da(e){const{errorColor:o,infoColor:c,successColor:u,warningColor:i,fontFamily:l}=e;return{color:o,colorInfo:c,colorSuccess:u,colorError:o,colorWarning:i,fontSize:"12px",fontFamily:l}}const Va={common:Ce,self:Da},Ea=v([v("@keyframes badge-wave-spread",{from:{boxShadow:"0 0 0.5px 0px var(--n-ripple-color)",opacity:.6},to:{boxShadow:"0 0 0.5px 4.5px var(--n-ripple-color)",opacity:0}}),r("badge",`
 display: inline-flex;
 position: relative;
 vertical-align: middle;
 font-family: var(--n-font-family);
 `,[m("as-is",[r("badge-sup",{position:"static",transform:"translateX(0)"},[te({transformOrigin:"left bottom",originalTransform:"translateX(0)"})])]),m("dot",[r("badge-sup",`
 height: 8px;
 width: 8px;
 padding: 0;
 min-width: 8px;
 left: 100%;
 bottom: calc(100% - 4px);
 `,[v("::before","border-radius: 4px;")])]),r("badge-sup",`
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
 `,[te({transformOrigin:"left bottom",originalTransform:"translateX(-50%)"}),r("base-wave",{zIndex:1,animationDuration:"2s",animationIterationCount:"infinite",animationDelay:"1s",animationTimingFunction:"var(--n-ripple-bezier)",animationName:"badge-wave-spread"}),v("&::before",`
 opacity: 0;
 transform: scale(1);
 border-radius: 9px;
 content: "";
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 `)])])]),Fa=Object.assign(Object.assign({},oe.props),{value:[String,Number],max:Number,dot:Boolean,type:{type:String,default:"default"},show:{type:Boolean,default:!0},showZero:Boolean,processing:Boolean,color:String,offset:Array}),La=ne({name:"Badge",props:Fa,setup(e,{slots:o}){const{mergedClsPrefixRef:c,inlineThemeDisabled:u,mergedRtlRef:i}=ze(e),l=oe("Badge","-badge",Ea,Va,e,c),y=w(!1),C=()=>{y.value=!0},V=()=>{y.value=!1},M=g(()=>e.show&&(e.dot||e.value!==void 0&&!(!e.showZero&&Number(e.value)<=0)||!da(o.value)));ca(()=>{M.value&&(y.value=!0)});const f=ua("Badge",i,c),b=g(()=>{const{type:S,color:B}=e,{common:{cubicBezierEaseInOut:$,cubicBezierEaseOut:k},self:{[fa("color",S)]:E,fontFamily:re,fontSize:j}}=l.value;return{"--n-font-size":j,"--n-font-family":re,"--n-color":B||E,"--n-ripple-color":B||E,"--n-bezier":$,"--n-ripple-bezier":k}}),z=u?ue("badge",g(()=>{let S="";const{type:B,color:$}=e;return B&&(S+=B[0]),$&&(S+=ha($)),S}),b,e):void 0,Y=g(()=>{const{offset:S}=e;if(!S)return;const[B,$]=S,k=typeof B=="number"?`${B}px`:B,E=typeof $=="number"?`${$}px`:$;return{transform:`translate(calc(${f!=null&&f.value?"50%":"-50%"} + ${k}), ${E})`}});return{rtlEnabled:f,mergedClsPrefix:c,appeared:y,showBadge:M,handleAfterEnter:C,handleAfterLeave:V,cssVars:u?void 0:b,themeClass:z==null?void 0:z.themeClass,onRender:z==null?void 0:z.onRender,offsetStyle:Y}},render(){var e;const{mergedClsPrefix:o,onRender:c,themeClass:u,$slots:i}=this;c==null||c();const l=(e=i.default)===null||e===void 0?void 0:e.call(i);return d("div",{class:[`${o}-badge`,this.rtlEnabled&&`${o}-badge--rtl`,u,{[`${o}-badge--dot`]:this.dot,[`${o}-badge--as-is`]:!l}],style:this.cssVars},l,d(Se,{name:"fade-in-scale-up-transition",onAfterEnter:this.handleAfterEnter,onAfterLeave:this.handleAfterLeave},{default:()=>this.showBadge?d("sup",{class:`${o}-badge-sup`,title:la(this.value),style:this.offsetStyle},$e(i.value,()=>[this.dot?null:d(Ma,{clsPrefix:o,appeared:this.appeared,max:this.max,value:this.value})]),this.processing?d(sa,{clsPrefix:o}):null):null}))}});function Ia(e){const o="rgba(0, 0, 0, .85)",c="0 2px 8px 0 rgba(0, 0, 0, 0.12)",{railColor:u,primaryColor:i,baseColor:l,cardColor:y,modalColor:C,popoverColor:V,borderRadius:M,fontSize:f,opacityDisabled:b}=e;return Object.assign(Object.assign({},ma),{fontSize:f,markFontSize:f,railColor:u,railColorHover:u,fillColor:i,fillColorHover:i,opacityDisabled:b,handleColor:"#FFF",dotColor:y,dotColorModal:C,dotColorPopover:V,handleBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",handleBoxShadowHover:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",handleBoxShadowActive:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",handleBoxShadowFocus:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",indicatorColor:o,indicatorBoxShadow:c,indicatorTextColor:l,indicatorBorderRadius:M,dotBorder:`2px solid ${u}`,dotBorderActive:`2px solid ${i}`,dotBoxShadow:""})}const Aa={common:Ce,self:Ia},Pa=v([r("slider",`
 display: block;
 padding: calc((var(--n-handle-size) - var(--n-rail-height)) / 2) 0;
 position: relative;
 z-index: 0;
 width: 100%;
 cursor: pointer;
 user-select: none;
 -webkit-user-select: none;
 `,[m("reverse",[r("slider-handles",[r("slider-handle-wrapper",`
 transform: translate(50%, -50%);
 `)]),r("slider-dots",[r("slider-dot",`
 transform: translateX(50%, -50%);
 `)]),m("vertical",[r("slider-handles",[r("slider-handle-wrapper",`
 transform: translate(-50%, -50%);
 `)]),r("slider-marks",[r("slider-mark",`
 transform: translateY(calc(-50% + var(--n-dot-height) / 2));
 `)]),r("slider-dots",[r("slider-dot",`
 transform: translateX(-50%) translateY(0);
 `)])])]),m("vertical",`
 box-sizing: content-box;
 padding: 0 calc((var(--n-handle-size) - var(--n-rail-height)) / 2);
 width: var(--n-rail-width-vertical);
 height: 100%;
 `,[r("slider-handles",`
 top: calc(var(--n-handle-size) / 2);
 right: 0;
 bottom: calc(var(--n-handle-size) / 2);
 left: 0;
 `,[r("slider-handle-wrapper",`
 top: unset;
 left: 50%;
 transform: translate(-50%, 50%);
 `)]),r("slider-rail",`
 height: 100%;
 `,[_("fill",`
 top: unset;
 right: 0;
 bottom: unset;
 left: 0;
 `)]),m("with-mark",`
 width: var(--n-rail-width-vertical);
 margin: 0 32px 0 8px;
 `),r("slider-marks",`
 top: calc(var(--n-handle-size) / 2);
 right: unset;
 bottom: calc(var(--n-handle-size) / 2);
 left: 22px;
 font-size: var(--n-mark-font-size);
 `,[r("slider-mark",`
 transform: translateY(50%);
 white-space: nowrap;
 `)]),r("slider-dots",`
 top: calc(var(--n-handle-size) / 2);
 right: unset;
 bottom: calc(var(--n-handle-size) / 2);
 left: 50%;
 `,[r("slider-dot",`
 transform: translateX(-50%) translateY(50%);
 `)])]),m("disabled",`
 cursor: not-allowed;
 opacity: var(--n-opacity-disabled);
 `,[r("slider-handle",`
 cursor: not-allowed;
 `)]),m("with-mark",`
 width: 100%;
 margin: 8px 0 32px 0;
 `),v("&:hover",[r("slider-rail",{backgroundColor:"var(--n-rail-color-hover)"},[_("fill",{backgroundColor:"var(--n-fill-color-hover)"})]),r("slider-handle",{boxShadow:"var(--n-handle-box-shadow-hover)"})]),m("active",[r("slider-rail",{backgroundColor:"var(--n-rail-color-hover)"},[_("fill",{backgroundColor:"var(--n-fill-color-hover)"})]),r("slider-handle",{boxShadow:"var(--n-handle-box-shadow-hover)"})]),r("slider-marks",`
 position: absolute;
 top: 18px;
 left: calc(var(--n-handle-size) / 2);
 right: calc(var(--n-handle-size) / 2);
 `,[r("slider-mark",`
 position: absolute;
 transform: translateX(-50%);
 white-space: nowrap;
 `)]),r("slider-rail",`
 width: 100%;
 position: relative;
 height: var(--n-rail-height);
 background-color: var(--n-rail-color);
 transition: background-color .3s var(--n-bezier);
 border-radius: calc(var(--n-rail-height) / 2);
 `,[_("fill",`
 position: absolute;
 top: 0;
 bottom: 0;
 border-radius: calc(var(--n-rail-height) / 2);
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-fill-color);
 `)]),r("slider-handles",`
 position: absolute;
 top: 0;
 right: calc(var(--n-handle-size) / 2);
 bottom: 0;
 left: calc(var(--n-handle-size) / 2);
 `,[r("slider-handle-wrapper",`
 outline: none;
 position: absolute;
 top: 50%;
 transform: translate(-50%, -50%);
 cursor: pointer;
 display: flex;
 `,[r("slider-handle",`
 height: var(--n-handle-size);
 width: var(--n-handle-size);
 border-radius: 50%;
 overflow: hidden;
 transition: box-shadow .2s var(--n-bezier), background-color .3s var(--n-bezier);
 background-color: var(--n-handle-color);
 box-shadow: var(--n-handle-box-shadow);
 `,[v("&:hover",`
 box-shadow: var(--n-handle-box-shadow-hover);
 `)]),v("&:focus",[r("slider-handle",`
 box-shadow: var(--n-handle-box-shadow-focus);
 `,[v("&:hover",`
 box-shadow: var(--n-handle-box-shadow-active);
 `)])])])]),r("slider-dots",`
 position: absolute;
 top: 50%;
 left: calc(var(--n-handle-size) / 2);
 right: calc(var(--n-handle-size) / 2);
 `,[m("transition-disabled",[r("slider-dot","transition: none;")]),r("slider-dot",`
 transition:
 border-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 position: absolute;
 transform: translate(-50%, -50%);
 height: var(--n-dot-height);
 width: var(--n-dot-width);
 border-radius: var(--n-dot-border-radius);
 overflow: hidden;
 box-sizing: border-box;
 border: var(--n-dot-border);
 background-color: var(--n-dot-color);
 `,[m("active","border: var(--n-dot-border-active);")])])]),r("slider-handle-indicator",`
 font-size: var(--n-font-size);
 padding: 6px 10px;
 border-radius: var(--n-indicator-border-radius);
 color: var(--n-indicator-text-color);
 background-color: var(--n-indicator-color);
 box-shadow: var(--n-indicator-box-shadow);
 `,[te()]),r("slider-handle-indicator",`
 font-size: var(--n-font-size);
 padding: 6px 10px;
 border-radius: var(--n-indicator-border-radius);
 color: var(--n-indicator-text-color);
 background-color: var(--n-indicator-color);
 box-shadow: var(--n-indicator-box-shadow);
 `,[m("top",`
 margin-bottom: 12px;
 `),m("right",`
 margin-left: 12px;
 `),m("bottom",`
 margin-top: 12px;
 `),m("left",`
 margin-right: 12px;
 `),te()]),va(r("slider",[r("slider-dot","background-color: var(--n-dot-color-modal);")])),ba(r("slider",[r("slider-dot","background-color: var(--n-dot-color-popover);")]))]);function ke(e){return window.TouchEvent&&e instanceof window.TouchEvent}function Re(){const e=new Map,o=c=>u=>{e.set(c,u)};return pa(()=>{e.clear()}),[e,o]}const Oa=0,_a=Object.assign(Object.assign({},oe.props),{to:fe.propTo,defaultValue:{type:[Number,Array],default:0},marks:Object,disabled:{type:Boolean,default:void 0},formatTooltip:Function,keyboard:{type:Boolean,default:!0},min:{type:Number,default:0},max:{type:Number,default:100},step:{type:[Number,String],default:1},range:Boolean,value:[Number,Array],placement:String,showTooltip:{type:Boolean,default:void 0},tooltip:{type:Boolean,default:!0},vertical:Boolean,reverse:Boolean,"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],onDragstart:[Function],onDragend:[Function]}),Ua=ne({name:"Slider",props:_a,slots:Object,setup(e){const{mergedClsPrefixRef:o,namespaceRef:c,inlineThemeDisabled:u}=ze(e),i=oe("Slider","-slider",Pa,Aa,e,o),l=w(null),[y,C]=Re(),[V,M]=Re(),f=w(new Set),b=ya(e),{mergedDisabledRef:z}=b,Y=g(()=>{const{step:a}=e;if(Number(a)<=0||a==="mark")return 0;const t=a.toString();let n=0;return t.includes(".")&&(n=t.length-t.indexOf(".")-1),n}),S=w(e.defaultValue),B=ae(e,"value"),$=ka(B,S),k=g(()=>{const{value:a}=$;return(e.range?a:[a]).map(pe)}),E=g(()=>k.value.length>2),re=g(()=>e.placement===void 0?e.vertical?"right":"top":e.placement),j=g(()=>{const{marks:a}=e;return a?Object.keys(a).map(Number.parseFloat):null}),T=w(-1),he=w(-1),F=w(-1),I=w(!1),L=w(!1),ie=g(()=>{const{vertical:a,reverse:t}=e;return a?t?"top":"bottom":t?"right":"left"}),Be=g(()=>{if(E.value)return;const a=k.value,t=U(e.range?Math.min(...a):e.min),n=U(e.range?Math.max(...a):a[0]),{value:s}=ie;return e.vertical?{[s]:`${t}%`,height:`${n-t}%`}:{[s]:`${t}%`,width:`${n-t}%`}}),Te=g(()=>{const a=[],{marks:t}=e;if(t){const n=k.value.slice();n.sort((R,x)=>R-x);const{value:s}=ie,{value:h}=E,{range:p}=e,N=h?()=>!1:R=>p?R>=n[0]&&R<=n[n.length-1]:R<=n[0];for(const R of Object.keys(t)){const x=Number(R);a.push({active:N(x),key:x,label:t[R],style:{[s]:`${U(x)}%`}})}}return a});function Ne(a,t){const n=U(a),{value:s}=ie;return{[s]:`${n}%`,zIndex:t===T.value?1:0}}function me(a){return e.showTooltip||F.value===a||T.value===a&&I.value}function Me(a){return I.value?!(T.value===a&&he.value===a):!0}function De(a){var t;~a&&(T.value=a,(t=y.get(a))===null||t===void 0||t.focus())}function Ve(){V.forEach((a,t)=>{me(t)&&a.syncPosition()})}function ve(a){const{"onUpdate:value":t,onUpdateValue:n}=e,{nTriggerFormInput:s,nTriggerFormChange:h}=b;n&&G(n,a),t&&G(t,a),S.value=a,s(),h()}function be(a){const{range:t}=e;if(t){if(Array.isArray(a)){const{value:n}=k;a.join()!==n.join()&&ve(a)}}else Array.isArray(a)||k.value[0]!==a&&ve(a)}function le(a,t){if(e.range){const n=k.value.slice();n.splice(t,1,a),be(n)}else be(a)}function se(a,t,n){const s=n!==void 0;n||(n=a-t>0?1:-1);const h=j.value||[],{step:p}=e;if(p==="mark"){const x=X(a,h.concat(t),s?n:void 0);return x?x.value:t}if(p<=0)return t;const{value:N}=Y;let R;if(s){const x=Number((t/p).toFixed(N)),D=Math.floor(x),de=x>D?D:D-1,ce=x<D?D:D+1;R=X(t,[Number((de*p).toFixed(N)),Number((ce*p).toFixed(N)),...h],n)}else{const x=Fe(a);R=X(a,[...h,x])}return R?pe(R.value):t}function pe(a){return Math.min(e.max,Math.max(e.min,a))}function U(a){const{max:t,min:n}=e;return(a-n)/(t-n)*100}function Ee(a){const{max:t,min:n}=e;return n+(t-n)*a}function Fe(a){const{step:t,min:n}=e;if(Number(t)<=0||t==="mark")return a;const s=Math.round((a-n)/t)*t+n;return Number(s.toFixed(Y.value))}function X(a,t=j.value,n){if(!(t!=null&&t.length))return null;let s=null,h=-1;for(;++h<t.length;){const p=t[h]-a,N=Math.abs(p);(n===void 0||p*n>0)&&(s===null||N<s.distance)&&(s={index:h,distance:N,value:t[h]})}return s}function ge(a){const t=l.value;if(!t)return;const n=ke(a)?a.touches[0]:a,s=t.getBoundingClientRect();let h;return e.vertical?h=(s.bottom-n.clientY)/s.height:h=(n.clientX-s.left)/s.width,e.reverse&&(h=1-h),Ee(h)}function Ie(a){if(z.value||!e.keyboard)return;const{vertical:t,reverse:n}=e;switch(a.key){case"ArrowUp":a.preventDefault(),W(t&&n?-1:1);break;case"ArrowRight":a.preventDefault(),W(!t&&n?-1:1);break;case"ArrowDown":a.preventDefault(),W(t&&n?1:-1);break;case"ArrowLeft":a.preventDefault(),W(!t&&n?1:-1);break}}function W(a){const t=T.value;if(t===-1)return;const{step:n}=e,s=k.value[t],h=Number(n)<=0||n==="mark"?s:s+n*a;le(se(h,s,a>0?1:-1),t)}function Ae(a){var t,n;if(z.value||!ke(a)&&a.button!==Oa)return;const s=ge(a);if(s===void 0)return;const h=k.value.slice(),p=e.range?(n=(t=X(s,h))===null||t===void 0?void 0:t.index)!==null&&n!==void 0?n:-1:0;p!==-1&&(a.preventDefault(),De(p),Pe(),le(se(s,k.value[p]),p))}function Pe(){I.value||(I.value=!0,e.onDragstart&&G(e.onDragstart),J("touchend",document,Z),J("mouseup",document,Z),J("touchmove",document,K),J("mousemove",document,K))}function q(){I.value&&(I.value=!1,e.onDragend&&G(e.onDragend),Q("touchend",document,Z),Q("mouseup",document,Z),Q("touchmove",document,K),Q("mousemove",document,K))}function K(a){const{value:t}=T;if(!I.value||t===-1){q();return}const n=ge(a);n!==void 0&&le(se(n,k.value[t]),t)}function Z(){q()}function Oe(a){T.value=a,z.value||(F.value=a)}function _e(a){T.value===a&&(T.value=-1,q()),F.value===a&&(F.value=-1)}function He(a){F.value=a}function Ye(a){F.value===a&&(F.value=-1)}ee(T,(a,t)=>void H(()=>he.value=t)),ee($,()=>{if(e.marks){if(L.value)return;L.value=!0,H(()=>{L.value=!1})}H(Ve)}),Ra(()=>{q()});const xe=g(()=>{const{self:{markFontSize:a,railColor:t,railColorHover:n,fillColor:s,fillColorHover:h,handleColor:p,opacityDisabled:N,dotColor:R,dotColorModal:x,handleBoxShadow:D,handleBoxShadowHover:de,handleBoxShadowActive:ce,handleBoxShadowFocus:je,dotBorder:Le,dotBoxShadow:Ue,railHeight:Xe,railWidthVertical:We,handleSize:qe,dotHeight:Ke,dotWidth:Ze,dotBorderRadius:Ge,fontSize:Je,dotBorderActive:Qe,dotColorPopover:ea},common:{cubicBezierEaseInOut:aa}}=i.value;return{"--n-bezier":aa,"--n-dot-border":Le,"--n-dot-border-active":Qe,"--n-dot-border-radius":Ge,"--n-dot-box-shadow":Ue,"--n-dot-color":R,"--n-dot-color-modal":x,"--n-dot-color-popover":ea,"--n-dot-height":Ke,"--n-dot-width":Ze,"--n-fill-color":s,"--n-fill-color-hover":h,"--n-font-size":Je,"--n-handle-box-shadow":D,"--n-handle-box-shadow-active":ce,"--n-handle-box-shadow-focus":je,"--n-handle-box-shadow-hover":de,"--n-handle-color":p,"--n-handle-size":qe,"--n-opacity-disabled":N,"--n-rail-color":t,"--n-rail-color-hover":n,"--n-rail-height":Xe,"--n-rail-width-vertical":We,"--n-mark-font-size":a}}),A=u?ue("slider",void 0,xe,e):void 0,we=g(()=>{const{self:{fontSize:a,indicatorColor:t,indicatorBoxShadow:n,indicatorTextColor:s,indicatorBorderRadius:h}}=i.value;return{"--n-font-size":a,"--n-indicator-border-radius":h,"--n-indicator-box-shadow":n,"--n-indicator-color":t,"--n-indicator-text-color":s}}),P=u?ue("slider-indicator",void 0,we,e):void 0;return{mergedClsPrefix:o,namespace:c,uncontrolledValue:S,mergedValue:$,mergedDisabled:z,mergedPlacement:re,isMounted:Ca(),adjustedTo:fe(e),dotTransitionDisabled:L,markInfos:Te,isShowTooltip:me,shouldKeepTooltipTransition:Me,handleRailRef:l,setHandleRefs:C,setFollowerRefs:M,fillStyle:Be,getHandleStyle:Ne,activeIndex:T,arrifiedValues:k,followerEnabledIndexSet:f,handleRailMouseDown:Ae,handleHandleFocus:Oe,handleHandleBlur:_e,handleHandleMouseEnter:He,handleHandleMouseLeave:Ye,handleRailKeyDown:Ie,indicatorCssVars:u?void 0:we,indicatorThemeClass:P==null?void 0:P.themeClass,indicatorOnRender:P==null?void 0:P.onRender,cssVars:u?void 0:xe,themeClass:A==null?void 0:A.themeClass,onRender:A==null?void 0:A.onRender}},render(){var e;const{mergedClsPrefix:o,themeClass:c,formatTooltip:u}=this;return(e=this.onRender)===null||e===void 0||e.call(this),d("div",{class:[`${o}-slider`,c,{[`${o}-slider--disabled`]:this.mergedDisabled,[`${o}-slider--active`]:this.activeIndex!==-1,[`${o}-slider--with-mark`]:this.marks,[`${o}-slider--vertical`]:this.vertical,[`${o}-slider--reverse`]:this.reverse}],style:this.cssVars,onKeydown:this.handleRailKeyDown,onMousedown:this.handleRailMouseDown,onTouchstart:this.handleRailMouseDown},d("div",{class:`${o}-slider-rail`},d("div",{class:`${o}-slider-rail__fill`,style:this.fillStyle}),this.marks?d("div",{class:[`${o}-slider-dots`,this.dotTransitionDisabled&&`${o}-slider-dots--transition-disabled`]},this.markInfos.map(i=>d("div",{key:i.key,class:[`${o}-slider-dot`,{[`${o}-slider-dot--active`]:i.active}],style:i.style}))):null,d("div",{ref:"handleRailRef",class:`${o}-slider-handles`},this.arrifiedValues.map((i,l)=>{const y=this.isShowTooltip(l);return d(ga,null,{default:()=>[d(xa,null,{default:()=>d("div",{ref:this.setHandleRefs(l),class:`${o}-slider-handle-wrapper`,tabindex:this.mergedDisabled?-1:0,role:"slider","aria-valuenow":i,"aria-valuemin":this.min,"aria-valuemax":this.max,"aria-orientation":this.vertical?"vertical":"horizontal","aria-disabled":this.disabled,style:this.getHandleStyle(i,l),onFocus:()=>{this.handleHandleFocus(l)},onBlur:()=>{this.handleHandleBlur(l)},onMouseenter:()=>{this.handleHandleMouseEnter(l)},onMouseleave:()=>{this.handleHandleMouseLeave(l)}},$e(this.$slots.thumb,()=>[d("div",{class:`${o}-slider-handle`})]))}),this.tooltip&&d(wa,{ref:this.setFollowerRefs(l),show:y,to:this.adjustedTo,enabled:this.showTooltip&&!this.range||this.followerEnabledIndexSet.has(l),teleportDisabled:this.adjustedTo===fe.tdkey,placement:this.mergedPlacement,containerClass:this.namespace},{default:()=>d(Se,{name:"fade-in-scale-up-transition",appear:this.isMounted,css:this.shouldKeepTooltipTransition(l),onEnter:()=>{this.followerEnabledIndexSet.add(l)},onAfterLeave:()=>{this.followerEnabledIndexSet.delete(l)}},{default:()=>{var C;return y?((C=this.indicatorOnRender)===null||C===void 0||C.call(this),d("div",{class:[`${o}-slider-handle-indicator`,this.indicatorThemeClass,`${o}-slider-handle-indicator--${this.mergedPlacement}`],style:this.indicatorCssVars},typeof u=="function"?u(i):i)):null}})})]})})),this.marks?d("div",{class:`${o}-slider-marks`},this.markInfos.map(i=>d("div",{key:i.key,class:`${o}-slider-mark`,style:i.style},typeof i.label=="function"?i.label():i.label))):null))}}),Ha={class:"inline-block",viewBox:"0 0 24 24",width:"1em",height:"1em"};function Ya(e,o){return za(),$a("svg",Ha,o[0]||(o[0]=[Ba("path",{fill:"currentColor",d:"M17 9.17a1 1 0 0 0-1.41 0L12 12.71L8.46 9.17a1 1 0 0 0-1.41 0a1 1 0 0 0 0 1.42l4.24 4.24a1 1 0 0 0 1.42 0L17 10.59a1 1 0 0 0 0-1.42"},null,-1)]))}const Xa=Sa({name:"uil-angle-down",render:Ya});export{La as N,Ua as _,Xa as a};
