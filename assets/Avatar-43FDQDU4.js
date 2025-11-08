import{bB as I,af as T,cJ as W,cK as K,aK as P,ag as _,d as M,aT as N,aS as V,W as p,d$ as A,e0 as G,ah as D,r as y,bC as k,a as O,aj as B,e1 as J,e2 as U,al as X,am as Y,e3 as q,i as Q,bT as Z,e4 as ee,de as re,a1 as oe}from"./index-CXGXpIU7.js";const te=I("n-avatar-group"),ne=T("avatar",`
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
`,[W(P("&","--n-merged-color: var(--n-color-modal);")),K(P("&","--n-merged-color: var(--n-color-popover);")),P("img",`
 width: 100%;
 height: 100%;
 `),_("text",`
 white-space: nowrap;
 display: inline-block;
 position: absolute;
 left: 50%;
 top: 50%;
 `),T("icon",`
 vertical-align: bottom;
 font-size: calc(var(--n-merged-size) - 6px);
 `),_("text","line-height: 1.25")]),ae=Object.assign(Object.assign({},B.props),{size:[String,Number],src:String,circle:{type:Boolean,default:void 0},objectFit:String,round:{type:Boolean,default:void 0},bordered:{type:Boolean,default:void 0},onError:Function,fallbackSrc:String,intersectionObserverOptions:Object,lazy:Boolean,onLoad:Function,renderPlaceholder:Function,renderFallback:Function,imgProps:Object,color:String}),ie=M({name:"Avatar",props:ae,slots:Object,setup(o){const{mergedClsPrefixRef:l,inlineThemeDisabled:g}=D(o),m=y(!1);let d=null;const c=y(null),s=y(null),x=()=>{const{value:e}=c;if(e&&(d===null||d!==e.innerHTML)){d=e.innerHTML;const{value:r}=s;if(r){const{offsetWidth:t,offsetHeight:a}=r,{offsetWidth:n,offsetHeight:L}=e,R=.9,S=Math.min(t/n*R,a/L*R,1);e.style.transform=`translateX(-50%) translateY(-50%) scale(${S})`}}},b=k(te,null),i=O(()=>{const{size:e}=o;if(e)return e;const{size:r}=b||{};return r||"medium"}),u=B("Avatar","-avatar",ne,J,o,l),z=k(U,null),f=O(()=>{if(b)return!0;const{round:e,circle:r}=o;return e!==void 0||r!==void 0?e||r:z?z.roundRef.value:!1}),v=O(()=>b?!0:o.bordered||!1),F=O(()=>{const e=i.value,r=f.value,t=v.value,{color:a}=o,{self:{borderRadius:n,fontSize:L,color:R,border:S,colorModal:H,colorPopover:$},common:{cubicBezierEaseInOut:w}}=u.value;let E;return typeof e=="number"?E=`${e}px`:E=u.value.self[X("height",e)],{"--n-font-size":L,"--n-border":t?S:"none","--n-border-radius":r?"50%":n,"--n-color":a||R,"--n-color-modal":a||H,"--n-color-popover":a||$,"--n-bezier":w,"--n-merged-size":`var(--n-avatar-size-override, ${E})`}}),h=g?Y("avatar",O(()=>{const e=i.value,r=f.value,t=v.value,{color:a}=o;let n="";return e&&(typeof e=="number"?n+=`a${e}`:n+=e[0]),r&&(n+="b"),t&&(n+="c"),a&&(n+=q(a)),n}),F,o):void 0,j=y(!o.lazy);Q(()=>{if(o.lazy&&o.intersectionObserverOptions){let e;const r=Z(()=>{e==null||e(),e=void 0,o.lazy&&(e=ee(s.value,o.intersectionObserverOptions,j))});re(()=>{r(),e==null||e()})}}),oe(()=>{var e;return o.src||((e=o.imgProps)===null||e===void 0?void 0:e.src)},()=>{m.value=!1});const C=y(!o.lazy);return{textRef:c,selfRef:s,mergedRoundRef:f,mergedClsPrefix:l,fitTextTransform:x,cssVars:g?void 0:F,themeClass:h==null?void 0:h.themeClass,onRender:h==null?void 0:h.onRender,hasLoadError:m,shouldStartLoading:j,loaded:C,mergedOnError:e=>{if(!j.value)return;m.value=!0;const{onError:r,imgProps:{onError:t}={}}=o;r==null||r(e),t==null||t(e)},mergedOnLoad:e=>{const{onLoad:r,imgProps:{onLoad:t}={}}=o;r==null||r(e),t==null||t(e),C.value=!0}}},render(){var o,l;const{$slots:g,src:m,mergedClsPrefix:d,lazy:c,onRender:s,loaded:x,hasLoadError:b,imgProps:i={}}=this;s==null||s();let u;const z=!x&&!b&&(this.renderPlaceholder?this.renderPlaceholder():(l=(o=this.$slots).placeholder)===null||l===void 0?void 0:l.call(o));return this.hasLoadError?u=this.renderFallback?this.renderFallback():N(g.fallback,()=>[p("img",{src:this.fallbackSrc,style:{objectFit:this.objectFit}})]):u=V(g.default,f=>{if(f)return p(A,{onResize:this.fitTextTransform},{default:()=>p("span",{ref:"textRef",class:`${d}-avatar__text`},f)});if(m||i.src){const v=this.src||i.src;return p("img",Object.assign(Object.assign({},i),{loading:G&&!this.intersectionObserverOptions&&c?"lazy":"eager",src:c&&this.intersectionObserverOptions?this.shouldStartLoading?v:void 0:v,"data-image-src":v,onLoad:this.mergedOnLoad,onError:this.mergedOnError,style:[i.style||"",{objectFit:this.objectFit},z?{height:"0",width:"0",visibility:"hidden",position:"absolute"}:""]}))}}),p("span",{ref:"selfRef",class:[`${d}-avatar`,this.themeClass],style:this.cssVars},u,c&&z)}});export{ie as _};
