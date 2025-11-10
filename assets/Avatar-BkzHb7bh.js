import{bB as I,ag as T,cL as M,cM as W,aL as P,ah as k,d as K,aU as N,aT as V,W as p,e1 as A,e2 as G,ai as U,r as y,bC as _,a as O,ak as B,e3 as D,e4 as X,am as Y,an as q,e5 as J,i as Q,bT as Z,e6 as ee,dh as re,a2 as oe}from"./index-DMk9ecAg.js";const te=I("n-avatar-group"),ne=T("avatar",`
 width: var(--n-merged-size);
 height: var(--n-merged-size);
 color: #FFF;
 font-size: var(--n-font-size);
 display: inline-flex;
 position: relative;
 overflow: hidden;
 text-align: center;
 border: var(--n-border);
 border-radius: var(--n-border-radius);
 --n-merged-color: var(--n-color);
 background-color: var(--n-merged-color);
 transition:
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
`,[M(P("&","--n-merged-color: var(--n-color-modal);")),W(P("&","--n-merged-color: var(--n-color-popover);")),P("img",`
 width: 100%;
 height: 100%;
 `),k("text",`
 white-space: nowrap;
 display: inline-block;
 position: absolute;
 left: 50%;
 top: 50%;
 `),T("icon",`
 vertical-align: bottom;
 font-size: calc(var(--n-merged-size) - 6px);
 `),k("text","line-height: 1.25")]),ae=Object.assign(Object.assign({},B.props),{size:[String,Number],src:String,circle:{type:Boolean,default:void 0},objectFit:String,round:{type:Boolean,default:void 0},bordered:{type:Boolean,default:void 0},onError:Function,fallbackSrc:String,intersectionObserverOptions:Object,lazy:Boolean,onLoad:Function,renderPlaceholder:Function,renderFallback:Function,imgProps:Object,color:String}),ie=K({name:"Avatar",props:ae,slots:Object,setup(o){const{mergedClsPrefixRef:l,inlineThemeDisabled:g}=U(o),m=y(!1);let d=null;const c=y(null),s=y(null),x=()=>{const{value:e}=c;if(e&&(d===null||d!==e.innerHTML)){d=e.innerHTML;const{value:r}=s;if(r){const{offsetWidth:t,offsetHeight:a}=r,{offsetWidth:n,offsetHeight:j}=e,R=.9,S=Math.min(t/n*R,a/j*R,1);e.style.transform=`translateX(-50%) translateY(-50%) scale(${S})`}}},b=_(te,null),i=O(()=>{const{size:e}=o;if(e)return e;const{size:r}=b||{};return r||"medium"}),u=B("Avatar","-avatar",ne,D,o,l),z=_(X,null),f=O(()=>{if(b)return!0;const{round:e,circle:r}=o;return e!==void 0||r!==void 0?e||r:z?z.roundRef.value:!1}),v=O(()=>b?!0:o.bordered||!1),F=O(()=>{const e=i.value,r=f.value,t=v.value,{color:a}=o,{self:{borderRadius:n,fontSize:j,color:R,border:S,colorModal:H,colorPopover:w},common:{cubicBezierEaseInOut:$}}=u.value;let E;return typeof e=="number"?E=`${e}px`:E=u.value.self[Y("height",e)],{"--n-font-size":j,"--n-border":t?S:"none","--n-border-radius":r?"50%":n,"--n-color":a||R,"--n-color-modal":a||H,"--n-color-popover":a||w,"--n-bezier":$,"--n-merged-size":`var(--n-avatar-size-override, ${E})`}}),h=g?q("avatar",O(()=>{const e=i.value,r=f.value,t=v.value,{color:a}=o;let n="";return e&&(typeof e=="number"?n+=`a${e}`:n+=e[0]),r&&(n+="b"),t&&(n+="c"),a&&(n+=J(a)),n}),F,o):void 0,L=y(!o.lazy);Q(()=>{if(o.lazy&&o.intersectionObserverOptions){let e;const r=Z(()=>{e==null||e(),e=void 0,o.lazy&&(e=ee(s.value,o.intersectionObserverOptions,L))});re(()=>{r(),e==null||e()})}}),oe(()=>{var e;return o.src||((e=o.imgProps)===null||e===void 0?void 0:e.src)},()=>{m.value=!1});const C=y(!o.lazy);return{textRef:c,selfRef:s,mergedRoundRef:f,mergedClsPrefix:l,fitTextTransform:x,cssVars:g?void 0:F,themeClass:h==null?void 0:h.themeClass,onRender:h==null?void 0:h.onRender,hasLoadError:m,shouldStartLoading:L,loaded:C,mergedOnError:e=>{if(!L.value)return;m.value=!0;const{onError:r,imgProps:{onError:t}={}}=o;r==null||r(e),t==null||t(e)},mergedOnLoad:e=>{const{onLoad:r,imgProps:{onLoad:t}={}}=o;r==null||r(e),t==null||t(e),C.value=!0}}},render(){var o,l;const{$slots:g,src:m,mergedClsPrefix:d,lazy:c,onRender:s,loaded:x,hasLoadError:b,imgProps:i={}}=this;s==null||s();let u;const z=!x&&!b&&(this.renderPlaceholder?this.renderPlaceholder():(l=(o=this.$slots).placeholder)===null||l===void 0?void 0:l.call(o));return this.hasLoadError?u=this.renderFallback?this.renderFallback():N(g.fallback,()=>[p("img",{src:this.fallbackSrc,style:{objectFit:this.objectFit}})]):u=V(g.default,f=>{if(f)return p(A,{onResize:this.fitTextTransform},{default:()=>p("span",{ref:"textRef",class:`${d}-avatar__text`},f)});if(m||i.src){const v=this.src||i.src;return p("img",Object.assign(Object.assign({},i),{loading:G&&!this.intersectionObserverOptions&&c?"lazy":"eager",src:c&&this.intersectionObserverOptions?this.shouldStartLoading?v:void 0:v,"data-image-src":v,onLoad:this.mergedOnLoad,onError:this.mergedOnError,style:[i.style||"",{objectFit:this.objectFit},z?{height:"0",width:"0",visibility:"hidden",position:"absolute"}:""]}))}}),p("span",{ref:"selfRef",class:[`${d}-avatar`,this.themeClass],style:this.cssVars},u,c&&z)}});export{ie as _};
