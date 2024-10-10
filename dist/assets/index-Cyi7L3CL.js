import{aK as ut,aL as ht,aM as vt,aN as le,aO as l,aP as V,aQ as fe,aR as $e,aS as ft,aT as mt,d as Ee,aU as pt,aV as Pe,i as g,aW as bt,a as F,aX as gt,aY as wt,a2 as Be,ac as we,aZ as xt,a_ as De,a$ as _t,b0 as Se,aA as x,b1 as yt,b2 as kt,b3 as Ct,b4 as St,T as Rt,b5 as me,b6 as pe,b7 as be,o as ae,b as Ue,e as L,b8 as Me,f as y,s as zt,b9 as Nt,w as k,c as ge,g as U,t as K,h as X,B as te,ba as Ce,U as Ve,ad as Tt,bb as Ie,bc as Oe,an as Ae,bd as $t,E as Bt,be as Dt,bf as Mt,X as Vt,G as It,H as Ot,I as At}from"./index-CUNPF4fr.js";import{_ as Ht}from"./Split-B1J0hDHz.js";import{_ as Ft}from"./Tree-BTZj9OQb.js";import{_ as Et}from"./DataTable-DCVZic8E.js";import"./RadioGroup-Dt9BXj20.js";import"./Forward-D2lkVYwM.js";const Pt=o=>{const d="rgba(0, 0, 0, .85)",$="0 2px 8px 0 rgba(0, 0, 0, 0.12)",{railColor:f,primaryColor:c,baseColor:m,cardColor:r,modalColor:E,popoverColor:oe,borderRadius:ne,fontSize:Q,opacityDisabled:I}=o;return Object.assign(Object.assign({},ht),{fontSize:Q,markFontSize:Q,railColor:f,railColorHover:f,fillColor:c,fillColorHover:c,opacityDisabled:I,handleColor:"#FFF",dotColor:r,dotColorModal:E,dotColorPopover:oe,handleBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",handleBoxShadowHover:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",handleBoxShadowActive:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",handleBoxShadowFocus:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",indicatorColor:d,indicatorBoxShadow:$,indicatorTextColor:m,indicatorBorderRadius:ne,dotBorder:`2px solid ${f}`,dotBorderActive:`2px solid ${c}`,dotBoxShadow:""})},Ut={name:"Slider",common:ut,self:Pt};function He(o){return window.TouchEvent&&o instanceof window.TouchEvent}function Fe(){const o=new Map,d=$=>f=>{o.set($,f)};return vt(()=>{o.clear()}),[o,d]}const Lt=le([l("slider",`
 display: block;
 padding: calc((var(--n-handle-size) - var(--n-rail-height)) / 2) 0;
 position: relative;
 z-index: 0;
 width: 100%;
 cursor: pointer;
 user-select: none;
 -webkit-user-select: none;
 `,[V("reverse",[l("slider-handles",[l("slider-handle-wrapper",`
 transform: translate(50%, -50%);
 `)]),l("slider-dots",[l("slider-dot",`
 transform: translateX(50%, -50%);
 `)]),V("vertical",[l("slider-handles",[l("slider-handle-wrapper",`
 transform: translate(-50%, -50%);
 `)]),l("slider-marks",[l("slider-mark",`
 transform: translateY(calc(-50% + var(--n-dot-height) / 2));
 `)]),l("slider-dots",[l("slider-dot",`
 transform: translateX(-50%) translateY(0);
 `)])])]),V("vertical",`
 padding: 0 calc((var(--n-handle-size) - var(--n-rail-height)) / 2);
 width: var(--n-rail-width-vertical);
 height: 100%;
 `,[l("slider-handles",`
 top: calc(var(--n-handle-size) / 2);
 right: 0;
 bottom: calc(var(--n-handle-size) / 2);
 left: 0;
 `,[l("slider-handle-wrapper",`
 top: unset;
 left: 50%;
 transform: translate(-50%, 50%);
 `)]),l("slider-rail",`
 height: 100%;
 `,[fe("fill",`
 top: unset;
 right: 0;
 bottom: unset;
 left: 0;
 `)]),V("with-mark",`
 width: var(--n-rail-width-vertical);
 margin: 0 32px 0 8px;
 `),l("slider-marks",`
 top: calc(var(--n-handle-size) / 2);
 right: unset;
 bottom: calc(var(--n-handle-size) / 2);
 left: 22px;
 font-size: var(--n-mark-font-size);
 `,[l("slider-mark",`
 transform: translateY(50%);
 white-space: nowrap;
 `)]),l("slider-dots",`
 top: calc(var(--n-handle-size) / 2);
 right: unset;
 bottom: calc(var(--n-handle-size) / 2);
 left: 50%;
 `,[l("slider-dot",`
 transform: translateX(-50%) translateY(50%);
 `)])]),V("disabled",`
 cursor: not-allowed;
 opacity: var(--n-opacity-disabled);
 `,[l("slider-handle",`
 cursor: not-allowed;
 `)]),V("with-mark",`
 width: 100%;
 margin: 8px 0 32px 0;
 `),le("&:hover",[l("slider-rail",{backgroundColor:"var(--n-rail-color-hover)"},[fe("fill",{backgroundColor:"var(--n-fill-color-hover)"})]),l("slider-handle",{boxShadow:"var(--n-handle-box-shadow-hover)"})]),V("active",[l("slider-rail",{backgroundColor:"var(--n-rail-color-hover)"},[fe("fill",{backgroundColor:"var(--n-fill-color-hover)"})]),l("slider-handle",{boxShadow:"var(--n-handle-box-shadow-hover)"})]),l("slider-marks",`
 position: absolute;
 top: 18px;
 left: calc(var(--n-handle-size) / 2);
 right: calc(var(--n-handle-size) / 2);
 `,[l("slider-mark",`
 position: absolute;
 transform: translateX(-50%);
 white-space: nowrap;
 `)]),l("slider-rail",`
 width: 100%;
 position: relative;
 height: var(--n-rail-height);
 background-color: var(--n-rail-color);
 transition: background-color .3s var(--n-bezier);
 border-radius: calc(var(--n-rail-height) / 2);
 `,[fe("fill",`
 position: absolute;
 top: 0;
 bottom: 0;
 border-radius: calc(var(--n-rail-height) / 2);
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-fill-color);
 `)]),l("slider-handles",`
 position: absolute;
 top: 0;
 right: calc(var(--n-handle-size) / 2);
 bottom: 0;
 left: calc(var(--n-handle-size) / 2);
 `,[l("slider-handle-wrapper",`
 outline: none;
 position: absolute;
 top: 50%;
 transform: translate(-50%, -50%);
 cursor: pointer;
 display: flex;
 `,[l("slider-handle",`
 height: var(--n-handle-size);
 width: var(--n-handle-size);
 border-radius: 50%;
 overflow: hidden;
 transition: box-shadow .2s var(--n-bezier), background-color .3s var(--n-bezier);
 background-color: var(--n-handle-color);
 box-shadow: var(--n-handle-box-shadow);
 `,[le("&:hover",`
 box-shadow: var(--n-handle-box-shadow-hover);
 `)]),le("&:focus",[l("slider-handle",`
 box-shadow: var(--n-handle-box-shadow-focus);
 `,[le("&:hover",`
 box-shadow: var(--n-handle-box-shadow-active);
 `)])])])]),l("slider-dots",`
 position: absolute;
 top: 50%;
 left: calc(var(--n-handle-size) / 2);
 right: calc(var(--n-handle-size) / 2);
 `,[V("transition-disabled",[l("slider-dot","transition: none;")]),l("slider-dot",`
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
 `,[V("active","border: var(--n-dot-border-active);")])])]),l("slider-handle-indicator",`
 font-size: var(--n-font-size);
 padding: 6px 10px;
 border-radius: var(--n-indicator-border-radius);
 color: var(--n-indicator-text-color);
 background-color: var(--n-indicator-color);
 box-shadow: var(--n-indicator-box-shadow);
 `,[$e()]),l("slider-handle-indicator",`
 font-size: var(--n-font-size);
 padding: 6px 10px;
 border-radius: var(--n-indicator-border-radius);
 color: var(--n-indicator-text-color);
 background-color: var(--n-indicator-color);
 box-shadow: var(--n-indicator-box-shadow);
 `,[V("top",`
 margin-bottom: 12px;
 `),V("right",`
 margin-left: 12px;
 `),V("bottom",`
 margin-top: 12px;
 `),V("left",`
 margin-right: 12px;
 `),$e()]),ft(l("slider",[l("slider-dot","background-color: var(--n-dot-color-modal);")])),mt(l("slider",[l("slider-dot","background-color: var(--n-dot-color-popover);")]))]),jt=0,Wt=Object.assign(Object.assign({},Pe.props),{to:Se.propTo,defaultValue:{type:[Number,Array],default:0},marks:Object,disabled:{type:Boolean,default:void 0},formatTooltip:Function,keyboard:{type:Boolean,default:!0},min:{type:Number,default:0},max:{type:Number,default:100},step:{type:[Number,String],default:1},range:Boolean,value:[Number,Array],placement:String,showTooltip:{type:Boolean,default:void 0},tooltip:{type:Boolean,default:!0},vertical:Boolean,reverse:Boolean,"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],onDragstart:[Function],onDragend:[Function]}),Kt=Ee({name:"Slider",props:Wt,setup(o){const{mergedClsPrefixRef:d,namespaceRef:$,inlineThemeDisabled:f}=pt(o),c=Pe("Slider","-slider",Lt,Ut,o,d),m=g(null),[r,E]=Fe(),[oe,ne]=Fe(),Q=g(new Set),I=bt(o),{mergedDisabledRef:G}=I,C=F(()=>{const{step:e}=o;if(Number(e)<=0||e==="mark")return 0;const t=e.toString();let a=0;return t.includes(".")&&(a=t.length-t.indexOf(".")-1),a}),j=g(o.defaultValue),q=gt(o,"value"),Y=wt(q,j),D=F(()=>{const{value:e}=Y;return(o.range?e:[e]).map(Re)}),J=F(()=>D.value.length>2),xe=F(()=>o.placement===void 0?o.vertical?"right":"top":o.placement),re=F(()=>{const{marks:e}=o;return e?Object.keys(e).map(parseFloat):null}),B=g(-1),se=g(-1),P=g(-1),A=g(!1),n=g(!1),i=F(()=>{const{vertical:e,reverse:t}=o;return e?t?"top":"bottom":t?"right":"left"}),S=F(()=>{if(J.value)return;const e=D.value,t=ie(o.range?Math.min(...e):o.min),a=ie(o.range?Math.max(...e):e[0]),{value:s}=i;return o.vertical?{[s]:`${t}%`,height:`${a-t}%`}:{[s]:`${t}%`,width:`${a-t}%`}}),v=F(()=>{const e=[],{marks:t}=o;if(t){const a=D.value.slice();a.sort((N,T)=>N-T);const{value:s}=i,{value:h}=J,{range:_}=o,H=h?()=>!1:N=>_?N>=a[0]&&N<=a[a.length-1]:N<=a[0];for(const N of Object.keys(t)){const T=Number(N);e.push({active:H(T),label:t[N],style:{[s]:`${ie(T)}%`}})}}return e});function p(e,t){const a=ie(e),{value:s}=i;return{[s]:`${a}%`,zIndex:t===B.value?1:0}}function w(e){return o.showTooltip||P.value===e||B.value===e&&A.value}function M(e){return A.value?!(B.value===e&&se.value===e):!0}function O(e){var t;~e&&(B.value=e,(t=r.get(e))===null||t===void 0||t.focus())}function R(){oe.forEach((e,t)=>{w(t)&&e.syncPosition()})}function z(e){const{"onUpdate:value":t,onUpdateValue:a}=o,{nTriggerFormInput:s,nTriggerFormChange:h}=I;a&&me(a,e),t&&me(t,e),j.value=e,s(),h()}function u(e){const{range:t}=o;if(t){if(Array.isArray(e)){const{value:a}=D;e.join()!==a.join()&&z(e)}}else Array.isArray(e)||D.value[0]!==e&&z(e)}function b(e,t){if(o.range){const a=D.value.slice();a.splice(t,1,e),u(a)}else u(e)}function _e(e,t,a){const s=a!==void 0;a||(a=e-t>0?1:-1);const h=re.value||[],{step:_}=o;if(_==="mark"){const T=de(e,h.concat(t),s?a:void 0);return T?T.value:t}if(_<=0)return t;const{value:H}=C;let N;if(s){const T=Number((t/_).toFixed(H)),W=Math.floor(T),ye=T>W?W:W-1,ke=T<W?W:W+1;N=de(t,[Number((ye*_).toFixed(H)),Number((ke*_).toFixed(H)),...h],a)}else{const T=je(e);N=de(e,[...h,T])}return N?Re(N.value):t}function Re(e){return Math.min(o.max,Math.max(o.min,e))}function ie(e){const{max:t,min:a}=o;return(e-a)/(t-a)*100}function Le(e){const{max:t,min:a}=o;return a+(t-a)*e}function je(e){const{step:t,min:a}=o;if(Number(t)<=0||t==="mark")return e;const s=Math.round((e-a)/t)*t+a;return Number(s.toFixed(C.value))}function de(e,t=re.value,a){if(!(t!=null&&t.length))return null;let s=null,h=-1;for(;++h<t.length;){const _=t[h]-e,H=Math.abs(_);(a===void 0||_*a>0)&&(s===null||H<s.distance)&&(s={index:h,distance:H,value:t[h]})}return s}function ze(e){const t=m.value;if(!t)return;const a=He(e)?e.touches[0]:e,s=t.getBoundingClientRect();let h;return o.vertical?h=(s.bottom-a.clientY)/s.height:h=(a.clientX-s.left)/s.width,o.reverse&&(h=1-h),Le(h)}function We(e){if(G.value||!o.keyboard)return;const{vertical:t,reverse:a}=o;switch(e.key){case"ArrowUp":e.preventDefault(),ce(t&&a?-1:1);break;case"ArrowRight":e.preventDefault(),ce(!t&&a?-1:1);break;case"ArrowDown":e.preventDefault(),ce(t&&a?1:-1);break;case"ArrowLeft":e.preventDefault(),ce(!t&&a?1:-1);break}}function ce(e){const t=B.value;if(t===-1)return;const{step:a}=o,s=D.value[t],h=Number(a)<=0||a==="mark"?s:s+a*e;b(_e(h,s,e>0?1:-1),t)}function Ke(e){var t,a;if(G.value||!He(e)&&e.button!==jt)return;const s=ze(e);if(s===void 0)return;const h=D.value.slice(),_=o.range?(a=(t=de(s,h))===null||t===void 0?void 0:t.index)!==null&&a!==void 0?a:-1:0;_!==-1&&(e.preventDefault(),O(_),Xe(),b(_e(s,D.value[_]),_))}function Xe(){A.value||(A.value=!0,o.onDragstart&&me(o.onDragstart),pe("touchend",document,ve),pe("mouseup",document,ve),pe("touchmove",document,he),pe("mousemove",document,he))}function ue(){A.value&&(A.value=!1,o.onDragend&&me(o.onDragend),be("touchend",document,ve),be("mouseup",document,ve),be("touchmove",document,he),be("mousemove",document,he))}function he(e){const{value:t}=B;if(!A.value||t===-1){ue();return}const a=ze(e);a!==void 0&&b(_e(a,D.value[t]),t)}function ve(){ue()}function Ye(e){B.value=e,G.value||(P.value=e)}function Je(e){B.value===e&&(B.value=-1,ue()),P.value===e&&(P.value=-1)}function Qe(e){P.value=e}function Ge(e){P.value===e&&(P.value=-1)}Be(B,(e,t)=>void we(()=>se.value=t)),Be(Y,()=>{if(o.marks){if(n.value)return;n.value=!0,we(()=>{n.value=!1})}we(R)}),xt(()=>{ue()});const Ne=F(()=>{const{self:{markFontSize:e,railColor:t,railColorHover:a,fillColor:s,fillColorHover:h,handleColor:_,opacityDisabled:H,dotColor:N,dotColorModal:T,handleBoxShadow:W,handleBoxShadowHover:ye,handleBoxShadowActive:ke,handleBoxShadowFocus:qe,dotBorder:Ze,dotBoxShadow:et,railHeight:tt,railWidthVertical:at,handleSize:ot,dotHeight:nt,dotWidth:lt,dotBorderRadius:rt,fontSize:st,dotBorderActive:it,dotColorPopover:dt},common:{cubicBezierEaseInOut:ct}}=c.value;return{"--n-bezier":ct,"--n-dot-border":Ze,"--n-dot-border-active":it,"--n-dot-border-radius":rt,"--n-dot-box-shadow":et,"--n-dot-color":N,"--n-dot-color-modal":T,"--n-dot-color-popover":dt,"--n-dot-height":nt,"--n-dot-width":lt,"--n-fill-color":s,"--n-fill-color-hover":h,"--n-font-size":st,"--n-handle-box-shadow":W,"--n-handle-box-shadow-active":ke,"--n-handle-box-shadow-focus":qe,"--n-handle-box-shadow-hover":ye,"--n-handle-color":_,"--n-handle-size":ot,"--n-opacity-disabled":H,"--n-rail-color":t,"--n-rail-color-hover":a,"--n-rail-height":tt,"--n-rail-width-vertical":at,"--n-mark-font-size":e}}),Z=f?De("slider",void 0,Ne,o):void 0,Te=F(()=>{const{self:{fontSize:e,indicatorColor:t,indicatorBoxShadow:a,indicatorTextColor:s,indicatorBorderRadius:h}}=c.value;return{"--n-font-size":e,"--n-indicator-border-radius":h,"--n-indicator-box-shadow":a,"--n-indicator-color":t,"--n-indicator-text-color":s}}),ee=f?De("slider-indicator",void 0,Te,o):void 0;return{mergedClsPrefix:d,namespace:$,uncontrolledValue:j,mergedValue:Y,mergedDisabled:G,mergedPlacement:xe,isMounted:_t(),adjustedTo:Se(o),dotTransitionDisabled:n,markInfos:v,isShowTooltip:w,shouldKeepTooltipTransition:M,handleRailRef:m,setHandleRefs:E,setFollowerRefs:ne,fillStyle:S,getHandleStyle:p,activeIndex:B,arrifiedValues:D,followerEnabledIndexSet:Q,handleRailMouseDown:Ke,handleHandleFocus:Ye,handleHandleBlur:Je,handleHandleMouseEnter:Qe,handleHandleMouseLeave:Ge,handleRailKeyDown:We,indicatorCssVars:f?void 0:Te,indicatorThemeClass:ee==null?void 0:ee.themeClass,indicatorOnRender:ee==null?void 0:ee.onRender,cssVars:f?void 0:Ne,themeClass:Z==null?void 0:Z.themeClass,onRender:Z==null?void 0:Z.onRender}},render(){var o;const{mergedClsPrefix:d,themeClass:$,formatTooltip:f}=this;return(o=this.onRender)===null||o===void 0||o.call(this),x("div",{class:[`${d}-slider`,$,{[`${d}-slider--disabled`]:this.mergedDisabled,[`${d}-slider--active`]:this.activeIndex!==-1,[`${d}-slider--with-mark`]:this.marks,[`${d}-slider--vertical`]:this.vertical,[`${d}-slider--reverse`]:this.reverse}],style:this.cssVars,onKeydown:this.handleRailKeyDown,onMousedown:this.handleRailMouseDown,onTouchstart:this.handleRailMouseDown},x("div",{class:`${d}-slider-rail`},x("div",{class:`${d}-slider-rail__fill`,style:this.fillStyle}),this.marks?x("div",{class:[`${d}-slider-dots`,this.dotTransitionDisabled&&`${d}-slider-dots--transition-disabled`]},this.markInfos.map(c=>x("div",{key:c.label,class:[`${d}-slider-dot`,{[`${d}-slider-dot--active`]:c.active}],style:c.style}))):null,x("div",{ref:"handleRailRef",class:`${d}-slider-handles`},this.arrifiedValues.map((c,m)=>{const r=this.isShowTooltip(m);return x(yt,null,{default:()=>[x(kt,null,{default:()=>x("div",{ref:this.setHandleRefs(m),class:`${d}-slider-handle-wrapper`,tabindex:this.mergedDisabled?-1:0,role:"slider","aria-valuenow":c,"aria-valuemin":this.min,"aria-valuemax":this.max,"aria-orientation":this.vertical?"vertical":"horizontal","aria-disabled":this.disabled,style:this.getHandleStyle(c,m),onFocus:()=>{this.handleHandleFocus(m)},onBlur:()=>{this.handleHandleBlur(m)},onMouseenter:()=>{this.handleHandleMouseEnter(m)},onMouseleave:()=>{this.handleHandleMouseLeave(m)}},Ct(this.$slots.thumb,()=>[x("div",{class:`${d}-slider-handle`})]))}),this.tooltip&&x(St,{ref:this.setFollowerRefs(m),show:r,to:this.adjustedTo,enabled:this.showTooltip&&!this.range||this.followerEnabledIndexSet.has(m),teleportDisabled:this.adjustedTo===Se.tdkey,placement:this.mergedPlacement,containerClass:this.namespace},{default:()=>x(Rt,{name:"fade-in-scale-up-transition",appear:this.isMounted,css:this.shouldKeepTooltipTransition(m),onEnter:()=>{this.followerEnabledIndexSet.add(m)},onAfterLeave:()=>{this.followerEnabledIndexSet.delete(m)}},{default:()=>{var E;return r?((E=this.indicatorOnRender)===null||E===void 0||E.call(this),x("div",{class:[`${d}-slider-handle-indicator`,this.indicatorThemeClass,`${d}-slider-handle-indicator--${this.mergedPlacement}`],style:this.indicatorCssVars},typeof f=="function"?f(c):c)):null}})})]})})),this.marks?x("div",{class:`${d}-slider-marks`},this.markInfos.map(c=>x("div",{key:c.label,class:`${d}-slider-mark`,style:c.style},c.label))):null))}}),Xt={class:"inline-block",viewBox:"0 0 24 24",width:"1em",height:"1em"},Yt=L("path",{fill:"currentColor",d:"M17 9.17a1 1 0 0 0-1.41 0L12 12.71L8.46 9.17a1 1 0 0 0-1.41 0a1 1 0 0 0 0 1.42l4.24 4.24a1 1 0 0 0 1.42 0L17 10.59a1 1 0 0 0 0-1.42"},null,-1),Jt=[Yt];function Qt(o,d){return ae(),Ue("svg",Xt,[...Jt])}const Gt={name:"uil-angle-down",render:Qt},qt=o=>(It("data-v-90fe40b2"),o=o(),Ot(),o),Zt={class:"min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto"},ea={class:"flex h-100%",style:{"flex-direction":"column"}},ta={class:"flex"},aa=qt(()=>L("span",null,"监测级别",-1)),oa={class:"flex items-center"},na={class:"flex items-center"},la={class:"cursor-pointer"},ra=Ee({name:"configsetting_realtimedata_channeldetection",__name:"index",setup(o){const d=g({0:"简单",1:"标准",2:"详细"}),$=g(!0),f=g([]),c=g(null),m=g([{title:"监视时间",key:"time",width:240,render(n){return Me(2,n.time)}},{title:"监视类型",key:"data_type",width:120,render(n){return n.data_type==0?"发送>>":n.data_type==1?"接收<<":n.data_type==2?"信息  ":n.data_type==3?"警告  ":"错误  "}},{title:"内容长度",key:"data_len",width:120},{title:"监视内容",key:"data_buf",render(n){return y("div",{innerHTML:n.data_buf},null)}}]),r=g({acceptColor:"#d6f0f0",sendOutColor:"#ffe3bf",infoColor:"#f4f4f5",warningColor:"#fdf6ec",errorColor:"#fee7e7",acceptNums:0,sendOutNums:0,infoNums:0,errorNums:0,warningNums:0}),E=[{label:"信息",key:0},{label:"警告",key:1},{label:"错误",key:2}],oe=n=>x(Ce,{value:n.key==0?r.value.infoNums:n.key==1?r.value.warningNums:r.value.errorNums},{default:()=>x("div",{class:"c-#676d71 w-50px h-32px flex items-center justify-center",style:{backgroundColor:n.key==0?r.value.infoColor:n.key==1?r.value.warningColor:r.value.errorColor,borderRadius:"4px"}},{default:()=>n.label})}),ne=n=>({style:{minHeight:"50px",background:n.data_type==0?r.value.sendOutColor:n.data_type==1?r.value.acceptColor:n.data_type==2?r.value.infoColor:n.data_type==3?r.value.warningColor:r.value.errorColor}}),Q=({option:n})=>n.key==0?"":n.chl_status!==null?x("span",{style:{width:"12px",height:"12px",borderRadius:"50%",backgroundColor:n.hasOwnProperty("chl_status")&&n.chl_status==1?"#00b42a":n.chl_status==2?"#ff0000":"#ccc"}}):"",I=g(),G=async()=>{var v,p,w,M;const{data:n,error:i}=await Tt();if((n==null?void 0:n.length)==0)return;const S=n.reduce((O,R)=>{const z=R.chlType===0?"采集通道":R.chlType===1?"转发通道":"系统通道";let u=O.find(b=>b.key===z);return u||(u={key:z,label:z,children:[],chl_status:null},O.push(u)),u.children.push({key:R.id,label:R.chlName,chlType:R.chlType,chl_status:null}),z=="系统通道"?[]:O},[]);I.value=S,I.value.length>0&&(C.value.chlId=(p=(v=I.value[0])==null?void 0:v.children[0])==null?void 0:p.key,J.value=[(M=(w=I.value[0])==null?void 0:w.children[0])==null?void 0:M.key],D(),q())},C=g({chlId:"",type:1,level:1}),j=g(null),q=()=>{var w;(w=j.value)==null||w.close(),f.value=[],r.value={...r.value,sendOutNums:0,acceptNums:0,infoNums:0,warningNums:0,errorNums:0};const n=new Ie;let i="";n.appendAsciiStr("$Link+Qi^123987WWg#"+C.value.chlId),i=n.end();const S=new Date().getTime(),v=C.value.level==0?"1":C.value.level==1?"257":"65793";C.value.type=1;const p=new Oe(Ae.replace("https","wss")+`/ChannelDetectionWebsocket/${C.value.chlId}/${C.value.type}/${v}/${i}/${S}`,{maxReconnectAttempts:3,heartbeatInterval:1e3*30});j.value=p,p.connect(),p.onclose(()=>{}),p.onerror(()=>{}),p.onopen(()=>{}),p.onmessage(M=>{if(console.log(M,"通道监测websocket接受数据"),!A(M.data))return;const O=JSON.parse(M.data);if(f.value.push(...O.param),$.value&&c.value){const u=document.querySelector(".n-scrollbar-content"),b=u==null?void 0:u.scrollHeight;u&&we(()=>{c.value.scrollTo({top:b,behavior:"smooth"})})}r.value={...r.value,sendOutNums:0,acceptNums:0,infoNums:0,warningNums:0,errorNums:0};let R=`      监视时间                  监视类型      内容长度          监视内容
`,z="";f.value.forEach(u=>{switch(u.data_type){case 0:r.value.sendOutNums+=1;break;case 1:r.value.acceptNums+=1;break;case 2:r.value.infoNums+=1;break;case 3:r.value.warningNums+=1;break;case 4:r.value.errorNums+=1;break}z+=Me(2,u.time)+"           "+(u.data_type==0?"发送>>":u.data_type==1?"接受<<":u.data_type==2?"信息  ":u.data_type==3?"警告  ":"错误  ")+"         "+u.data_len+"          "+u.data_buf+`
`}),c.value.content=R+z,f.value.length>=1e3&&(f.value=[])})},Y=g(null),D=()=>{var p;(p=Y.value)==null||p.close();const n=new Ie;let i="";n.appendAsciiStr("$Link+Qi^123987WWg#getchlstatus"),i=n.end();const S=new Date().getTime(),v=new Oe(Ae.replace("https","wss")+`/ChannelStatusWebsocket/getchlstatus/${i}/${S}`,{maxReconnectAttempts:3,heartbeatInterval:1e3*30});Y.value=v,v.connect(),v.onclose(()=>{}),v.onerror(()=>{}),v.onopen(()=>{}),v.onmessage(w=>{let M=[];console.log(w,"通道状态websocket接受数据"),A(w.data)&&(M=JSON.parse(w.data).data,I.value.forEach(O=>{var R;(R=O.children)==null||R.forEach(z=>{M.forEach(u=>{u.chl_id==z.key&&(z.chl_status=u.chl_status)})})}))})};zt(()=>{G()}),Nt(()=>{var n,i;(n=j.value)==null||n.close(),(i=Y.value)==null||i.close()});const J=g([]),xe=async(n,i,S)=>{var v,p,w;((v=S.node)==null?void 0:v.key)!=J.value[0]&&(J.value=[(p=S.node)==null?void 0:p.key],C.value.chlId=(w=S.node)==null?void 0:w.key,q())},re=n=>{q()},B=n=>{C.value.type=n,j.value.close(),n==1&&q()},se=()=>{f.value=[],r.value={...r.value,sendOutNums:0,acceptNums:0,infoNums:0,warningNums:0,errorNums:0},c.value.content=""},P=()=>{let n=c.value.content?c.value.content+"":c.value.content,i=new $t(".Btn",{text:function(){return n}});i.on("success",S=>{var v;(v=window.$message)==null||v.success("复制成功"),i.destroy()}),i.on("error",S=>{var v;(v=window.$message)==null||v.error("复制失败"),i.destroy()})},A=n=>{try{return JSON.parse(n),!0}catch{return!1}};return(n,i)=>{const S=Ft,v=Bt,p=Kt,w=Dt,M=Gt,O=Mt,R=Vt,z=Et,u=Ht;return ae(),Ue("div",Zt,[y(R,{bordered:!1,size:"small",class:"sm:flex-1-hidden card-wrapper"},{default:k(()=>[y(u,{direction:"horizontal",class:"sm:h-full","default-size":.15,max:.35,min:.1,"resize-trigger-size":6},{1:k(()=>[y(S,{"block-line":"","default-expand-all":"",data:I.value,"checked-keys":J.value,"expand-on-click":!1,"check-strategy":"child","onUpdate:checkedKeys":xe,"render-prefix":Q,checkable:""},null,8,["data","checked-keys"])]),2:k(()=>[L("div",ea,[y(R,{bordered:!1,size:"small",class:"card-wrapper",style:{"min-height":"60px"}},{header:k(()=>[y(v,{align:"center",wrap:"",justify:"start",class:"lt-sm:w-200px"},{default:k(()=>[C.value.type==0?(ae(),ge(X(te),{key:0,onClick:i[0]||(i[0]=b=>B(1))},{default:k(()=>[U(K("开启监视"))]),_:1})):(ae(),ge(X(te),{key:1,onClick:i[1]||(i[1]=b=>B(0))},{default:k(()=>[U(K("停止监视"))]),_:1})),$.value?(ae(),ge(X(te),{key:3,onClick:i[3]||(i[3]=b=>$.value=!$.value)},{default:k(()=>[U(K("停止滚屏"))]),_:1})):(ae(),ge(X(te),{key:2,onClick:i[2]||(i[2]=b=>$.value=!$.value)},{default:k(()=>[U(K("开启滚屏"))]),_:1})),y(X(te),{onClick:se},{default:k(()=>[U(K("清空列表"))]),_:1}),y(X(te),{onClick:P,class:"Btn"},{default:k(()=>[U(K("复制全部内容"))]),_:1})]),_:1})]),"header-extra":k(()=>[y(v,{align:"center",wrap:"",justify:"end",class:"lt-sm:w-200px"},{default:k(()=>[L("div",ta,[aa,y(p,{value:C.value.level,"onUpdate:value":[i[4]||(i[4]=b=>C.value.level=b),re],step:1,marks:d.value,min:0,max:2,style:{margin:"0 10px",width:"170px !important"}},null,8,["value","marks"])]),L("div",oa,[U(" 发送报文颜色 "),y(w,{class:"w-24px h-24px ml-5px",swatches:["#ffe3bf","#d6f0f0"],value:r.value.sendOutColor,"onUpdate:value":i[5]||(i[5]=b=>r.value.sendOutColor=b)},null,8,["value"])]),L("div",na,[U(" 接受报文颜色 "),y(w,{class:"w-24px h-24px ml-5px",swatches:["#ffe3bf","#d6f0f0"],value:r.value.acceptColor,"onUpdate:value":i[6]||(i[6]=b=>r.value.acceptColor=b)},null,8,["value"])]),y(X(Ce),{value:r.value.sendOutNums},{default:k(()=>[L("div",{style:Ve({background:r.value.sendOutColor}),class:"c-#676d71 w-50px h-32px flex items-center justify-center"},K("发送"),4)]),_:1},8,["value"]),y(X(Ce),{value:r.value.acceptNums},{default:k(()=>[L("div",{style:Ve({background:r.value.acceptColor}),class:"c-#676d71 w-50px h-32px flex items-center justify-center"},K("接收"),4)]),_:1},8,["value"]),y(O,{trigger:"click",options:E,"render-label":oe},{default:k(()=>[L("span",la,[U("其他类型 "),y(M,{class:"font-size-20px"})])]),_:1})]),_:1})]),_:1}),y(z,{columns:m.value,ref_key:"tableRef",ref:c,data:f.value,size:"small",remote:"","row-key":b=>b.id,"flex-height":!0,"scroll-x":"",class:"sm:h-full flex-1 pl-16px","row-props":ne},null,8,["columns","data","row-key"])])]),_:1})]),_:1})])}}}),va=At(ra,[["__scopeId","data-v-90fe40b2"]]);export{va as default};
