import{bn as x,bp as C,d as _,bt as R,bu as u,b as l,bK as a,by as y,b4 as d,bL as B}from"./index-ClERt9GJ.js";const L=x("input-group-label",`
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
`,[C("border",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 border: var(--n-group-label-border);
 transition: border-color .3s var(--n-bezier);
 `)]),k=Object.assign(Object.assign({},u.props),{size:{type:String,default:"medium"},bordered:{type:Boolean,default:void 0}}),P=_({name:"InputGroupLabel",props:k,setup(e){const{mergedBorderedRef:s,mergedClsPrefixRef:r,inlineThemeDisabled:n}=R(e),b=u("Input","-input-group-label",L,B,e,r),i=l(()=>{const{size:t}=e,{common:{cubicBezierEaseInOut:c},self:{groupLabelColor:g,borderRadius:p,groupLabelTextColor:h,lineHeight:m,groupLabelBorder:f,[a("fontSize",t)]:v,[a("height",t)]:z}}=b.value;return{"--n-bezier":c,"--n-group-label-color":g,"--n-group-label-border":f,"--n-border-radius":p,"--n-group-label-text-color":h,"--n-font-size":v,"--n-line-height":m,"--n-height":z}}),o=n?y("input-group-label",l(()=>e.size[0]),i,e):void 0;return{mergedClsPrefix:r,mergedBordered:s,cssVars:n?void 0:i,themeClass:o==null?void 0:o.themeClass,onRender:o==null?void 0:o.onRender}},render(){var e,s,r;const{mergedClsPrefix:n}=this;return(e=this.onRender)===null||e===void 0||e.call(this),d("div",{class:[`${n}-input-group-label`,this.themeClass],style:this.cssVars},(r=(s=this.$slots).default)===null||r===void 0?void 0:r.call(s),this.mergedBordered?d("div",{class:`${n}-input-group-label__border`}):null)}});export{P as _};
