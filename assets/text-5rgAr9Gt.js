import{ai as N,a5 as _,dW as D,dX as A,a7 as T,a8 as F,d as w,al as G,ak as q,ab as f,ep as X,eq as U,ae as H,r as C,ao as k,a as p,ag as j,er as Y,es as J,aq as V,ar as I,et as Q,i as Z,cn as ee,eu as oe,dR as te,az as re,a6 as P,ev as ne,ew as se}from"./index-TrXGIlo8.js";const ae=N("n-avatar-group"),ie=_("avatar",`
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
`,[D(T("&","--n-merged-color: var(--n-color-modal);")),A(T("&","--n-merged-color: var(--n-color-popover);")),T("img",`
 width: 100%;
 height: 100%;
 `),F("text",`
 white-space: nowrap;
 display: inline-block;
 position: absolute;
 left: 50%;
 top: 50%;
 `),_("icon",`
 vertical-align: bottom;
 font-size: calc(var(--n-merged-size) - 6px);
 `),F("text","line-height: 1.25")]),le=Object.assign(Object.assign({},j.props),{size:[String,Number],src:String,circle:{type:Boolean,default:void 0},objectFit:String,round:{type:Boolean,default:void 0},bordered:{type:Boolean,default:void 0},onError:Function,fallbackSrc:String,intersectionObserverOptions:Object,lazy:Boolean,onLoad:Function,renderPlaceholder:Function,renderFallback:Function,imgProps:Object,color:String}),fe=w({name:"Avatar",props:le,slots:Object,setup(o){const{mergedClsPrefixRef:i,inlineThemeDisabled:l}=H(o),n=C(!1);let s=null;const r=C(null),d=C(null),z=()=>{const{value:e}=r;if(e&&(s===null||s!==e.innerHTML)){s=e.innerHTML;const{value:t}=d;if(t){const{offsetWidth:a,offsetHeight:b}=t,{offsetWidth:c,offsetHeight:L}=e,S=.9,$=Math.min(a/c*S,b/L*S,1);e.style.transform=`translateX(-50%) translateY(-50%) scale(${$})`}}},x=k(ae,null),u=p(()=>{const{size:e}=o;if(e)return e;const{size:t}=x||{};return t||"medium"}),v=j("Avatar","-avatar",ie,Y,o,i),y=k(J,null),h=p(()=>{if(x)return!0;const{round:e,circle:t}=o;return e!==void 0||t!==void 0?e||t:y?y.roundRef.value:!1}),g=p(()=>x?!0:o.bordered||!1),O=p(()=>{const e=u.value,t=h.value,a=g.value,{color:b}=o,{self:{borderRadius:c,fontSize:L,color:S,border:$,colorModal:M,colorPopover:W},common:{cubicBezierEaseInOut:K}}=v.value;let E;return typeof e=="number"?E=`${e}px`:E=v.value.self[V("height",e)],{"--n-font-size":L,"--n-border":a?$:"none","--n-border-radius":t?"50%":c,"--n-color":b||S,"--n-color-modal":b||M,"--n-color-popover":b||W,"--n-bezier":K,"--n-merged-size":`var(--n-avatar-size-override, ${E})`}}),m=l?I("avatar",p(()=>{const e=u.value,t=h.value,a=g.value,{color:b}=o;let c="";return e&&(typeof e=="number"?c+=`a${e}`:c+=e[0]),t&&(c+="b"),a&&(c+="c"),b&&(c+=Q(b)),c}),O,o):void 0,R=C(!o.lazy);Z(()=>{if(o.lazy&&o.intersectionObserverOptions){let e;const t=ee(()=>{e==null||e(),e=void 0,o.lazy&&(e=oe(d.value,o.intersectionObserverOptions,R))});te(()=>{t(),e==null||e()})}}),re(()=>{var e;return o.src||((e=o.imgProps)===null||e===void 0?void 0:e.src)},()=>{n.value=!1});const B=C(!o.lazy);return{textRef:r,selfRef:d,mergedRoundRef:h,mergedClsPrefix:i,fitTextTransform:z,cssVars:l?void 0:O,themeClass:m==null?void 0:m.themeClass,onRender:m==null?void 0:m.onRender,hasLoadError:n,shouldStartLoading:R,loaded:B,mergedOnError:e=>{if(!R.value)return;n.value=!0;const{onError:t,imgProps:{onError:a}={}}=o;t==null||t(e),a==null||a(e)},mergedOnLoad:e=>{const{onLoad:t,imgProps:{onLoad:a}={}}=o;t==null||t(e),a==null||a(e),B.value=!0}}},render(){var o,i;const{$slots:l,src:n,mergedClsPrefix:s,lazy:r,onRender:d,loaded:z,hasLoadError:x,imgProps:u={}}=this;d==null||d();let v;const y=!z&&!x&&(this.renderPlaceholder?this.renderPlaceholder():(i=(o=this.$slots).placeholder)===null||i===void 0?void 0:i.call(o));return this.hasLoadError?v=this.renderFallback?this.renderFallback():G(l.fallback,()=>[f("img",{src:this.fallbackSrc,style:{objectFit:this.objectFit}})]):v=q(l.default,h=>{if(h)return f(X,{onResize:this.fitTextTransform},{default:()=>f("span",{ref:"textRef",class:`${s}-avatar__text`},h)});if(n||u.src){const g=this.src||u.src;return f("img",Object.assign(Object.assign({},u),{loading:U&&!this.intersectionObserverOptions&&r?"lazy":"eager",src:r&&this.intersectionObserverOptions?this.shouldStartLoading?g:void 0:g,"data-image-src":g,onLoad:this.mergedOnLoad,onError:this.mergedOnError,style:[u.style||"",{objectFit:this.objectFit},y?{height:"0",width:"0",visibility:"hidden",position:"absolute"}:""]}))}}),f("span",{ref:"selfRef",class:[`${s}-avatar`,this.themeClass],style:this.cssVars},v,r&&y)}}),de=_("text",`
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
`,[P("strong",`
 font-weight: var(--n-font-weight-strong);
 `),P("italic",{fontStyle:"italic"}),P("underline",{textDecoration:"underline"}),P("code",`
 line-height: 1.4;
 display: inline-block;
 font-family: var(--n-font-famliy-mono);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 box-sizing: border-box;
 padding: .05em .35em 0 .35em;
 border-radius: var(--n-code-border-radius);
 font-size: .9em;
 color: var(--n-code-text-color);
 background-color: var(--n-code-color);
 border: var(--n-code-border);
 `)]),ce=Object.assign(Object.assign({},j.props),{code:Boolean,type:{type:String,default:"default"},delete:Boolean,strong:Boolean,italic:Boolean,underline:Boolean,depth:[String,Number],tag:String,as:{type:String,validator:()=>!0,default:void 0}}),ve=w({name:"Text",props:ce,setup(o){const{mergedClsPrefixRef:i,inlineThemeDisabled:l}=H(o),n=j("Typography","-text",de,ne,o,i),s=p(()=>{const{depth:d,type:z}=o,x=z==="default"?d===void 0?"textColor":`textColor${d}Depth`:V("textColor",z),{common:{fontWeightStrong:u,fontFamilyMono:v,cubicBezierEaseInOut:y},self:{codeTextColor:h,codeBorderRadius:g,codeColor:O,codeBorder:m,[x]:R}}=n.value;return{"--n-bezier":y,"--n-text-color":R,"--n-font-weight-strong":u,"--n-font-famliy-mono":v,"--n-code-border-radius":g,"--n-code-text-color":h,"--n-code-color":O,"--n-code-border":m}}),r=l?I("text",p(()=>`${o.type[0]}${o.depth||""}`),s,o):void 0;return{mergedClsPrefix:i,compitableTag:se(o,["as","tag"]),cssVars:l?void 0:s,themeClass:r==null?void 0:r.themeClass,onRender:r==null?void 0:r.onRender}},render(){var o,i,l;const{mergedClsPrefix:n}=this;(o=this.onRender)===null||o===void 0||o.call(this);const s=[`${n}-text`,this.themeClass,{[`${n}-text--code`]:this.code,[`${n}-text--delete`]:this.delete,[`${n}-text--strong`]:this.strong,[`${n}-text--italic`]:this.italic,[`${n}-text--underline`]:this.underline}],r=(l=(i=this.$slots).default)===null||l===void 0?void 0:l.call(i);return this.code?f("code",{class:s,style:this.cssVars},this.delete?f("del",null,r):r):this.delete?f("del",{class:s,style:this.cssVars},r):f(this.compitableTag||"span",{class:s,style:this.cssVars},r)}});export{fe as _,ve as a};
