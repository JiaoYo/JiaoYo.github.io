import{a1 as S,a2 as L,d as _,a3 as v,c,o as g,a4 as p,a6 as h,R as y,a7 as I,dh as w,c4 as T,f,a9 as m,aa as V}from"./index-Dn2MukQY.js";var $=S("input-group-label",`
 position: relative;
 user-select: none;
 -webkit-user-select: none;
 box-sizing: border-box;
 padding: 0 12px;
 display: inline-block;
 border-radius: var(--n-border-radius);
 background-color: var(--n-group-label-color);
 color: var(--n-group-label-text-color);
 font-size: var(--n-font-size);
 line-height: var(--n-height);
 height: var(--n-height);
 flex-shrink: 0;
 white-space: nowrap;
 transition: 
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
`,[L("border",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 border: var(--n-group-label-border);
 transition: border-color .3s var(--n-bezier);
 `)]);const E={...v.props,size:String,bordered:{type:Boolean,default:void 0}};var P=_({name:"InputGroupLabel",props:E,setup(e){const{mergedBorderedRef:a,mergedClsPrefixRef:o,inlineThemeDisabled:i,mergedComponentPropsRef:u}=I(e),z=v("Input","-input-group-label",$,w,e,o),{mergedSizeRef:d}=T(e,{mergedSize(n){var t,l;if(e.size!==void 0)return e.size;if(n)return n.mergedSize.value;const s=(l=(t=u==null?void 0:u.value)==null?void 0:t.Input)==null?void 0:l.size;return s||"medium"}}),b=f(()=>{const{value:n}=d,{common:{cubicBezierEaseInOut:s},self:{groupLabelColor:t,borderRadius:l,groupLabelTextColor:x,lineHeight:B,groupLabelBorder:R,[m("fontSize",n)]:k,[m("height",n)]:C}}=z.value;return{"--n-bezier":s,"--n-group-label-color":t,"--n-group-label-border":R,"--n-border-radius":l,"--n-group-label-text-color":x,"--n-font-size":k,"--n-line-height":B,"--n-height":C}}),r=i?V("input-group-label",f(()=>d.value[0]),b,e):void 0;return{mergedClsPrefix:o,mergedBordered:a,cssVars:i?void 0:b,themeClass:r==null?void 0:r.themeClass,onRender:r==null?void 0:r.onRender}},render(){var a;const{mergedClsPrefix:e}=this;return(a=this.onRender)==null||a.call(this),g(),c("div",{class:h([`${e}-input-group-label`,this.themeClass]),style:y(this.cssVars)},[p(()=>{var o,i;return(i=(o=this.$slots).default)==null?void 0:i.call(o)}),this.mergedBordered?(g(),c("div",{key:0,class:h(`${e}-input-group-label__border`)},null,2)):p(()=>null)],6)}});export{P as I};
