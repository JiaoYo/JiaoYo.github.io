import{bj as p,aX as e,bH as F,bm as C,bl as B,cz as H,cA as N,d as E,bn as G,bo as L,b as M,bN as T,bw as K,cN as J,bJ as W,a$ as n,co as X,bK as q,cO as Q}from"./index-DLQv0xE2.js";function D(r,b="default",a=[]){const{children:i}=r;if(i!==null&&typeof i=="object"&&!Array.isArray(i)){const l=i[b];if(typeof l=="function")return l()}return a}const V="DESCRIPTION_ITEM_FLAG";function U(r){return typeof r=="object"&&r&&!Array.isArray(r)?r.type&&r.type[V]:!1}const Y=p([e("descriptions",{fontSize:"var(--n-font-size)"},[e("descriptions-separator",`
 display: inline-block;
 margin: 0 8px 0 2px;
 `),e("descriptions-table-wrapper",[e("descriptions-table",[e("descriptions-table-row",[e("descriptions-table-header",{padding:"var(--n-th-padding)"}),e("descriptions-table-content",{padding:"var(--n-td-padding)"})])])]),F("bordered",[e("descriptions-table-wrapper",[e("descriptions-table",[e("descriptions-table-row",[p("&:last-child",[e("descriptions-table-content",{paddingBottom:0})])])])])]),C("left-label-placement",[e("descriptions-table-content",[p("> *",{verticalAlign:"top"})])]),C("left-label-align",[p("th",{textAlign:"left"})]),C("center-label-align",[p("th",{textAlign:"center"})]),C("right-label-align",[p("th",{textAlign:"right"})]),C("bordered",[e("descriptions-table-wrapper",`
 border-radius: var(--n-border-radius);
 overflow: hidden;
 background: var(--n-merged-td-color);
 border: 1px solid var(--n-merged-border-color);
 `,[e("descriptions-table",[e("descriptions-table-row",[p("&:not(:last-child)",[e("descriptions-table-content",{borderBottom:"1px solid var(--n-merged-border-color)"}),e("descriptions-table-header",{borderBottom:"1px solid var(--n-merged-border-color)"})]),e("descriptions-table-header",`
 font-weight: 400;
 background-clip: padding-box;
 background-color: var(--n-merged-th-color);
 `,[p("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})]),e("descriptions-table-content",[p("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})])])])])]),e("descriptions-header",`
 font-weight: var(--n-th-font-weight);
 font-size: 18px;
 transition: color .3s var(--n-bezier);
 line-height: var(--n-line-height);
 margin-bottom: 16px;
 color: var(--n-title-text-color);
 `),e("descriptions-table-wrapper",`
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[e("descriptions-table",`
 width: 100%;
 border-collapse: separate;
 border-spacing: 0;
 box-sizing: border-box;
 `,[e("descriptions-table-row",`
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[e("descriptions-table-header",`
 font-weight: var(--n-th-font-weight);
 line-height: var(--n-line-height);
 display: table-cell;
 box-sizing: border-box;
 color: var(--n-th-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `),e("descriptions-table-content",`
 vertical-align: top;
 line-height: var(--n-line-height);
 display: table-cell;
 box-sizing: border-box;
 color: var(--n-td-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[B("content",`
 transition: color .3s var(--n-bezier);
 display: inline-block;
 color: var(--n-td-text-color);
 `)]),B("label",`
 font-weight: var(--n-th-font-weight);
 transition: color .3s var(--n-bezier);
 display: inline-block;
 margin-right: 14px;
 color: var(--n-th-text-color);
 `)])])])]),e("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color);
 --n-merged-td-color: var(--n-td-color);
 --n-merged-border-color: var(--n-border-color);
 `),H(e("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-modal);
 --n-merged-td-color: var(--n-td-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),N(e("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-popover);
 --n-merged-td-color: var(--n-td-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]),Z=Object.assign(Object.assign({},L.props),{title:String,column:{type:Number,default:3},columns:Number,labelPlacement:{type:String,default:"top"},labelAlign:{type:String,default:"left"},separator:{type:String,default:":"},size:{type:String,default:"medium"},bordered:Boolean,labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]}),te=E({name:"Descriptions",props:Z,setup(r){const{mergedClsPrefixRef:b,inlineThemeDisabled:a}=G(r),i=L("Descriptions","-descriptions",Y,Q,r,b),l=M(()=>{const{size:d,bordered:h}=r,{common:{cubicBezierEaseInOut:g},self:{titleTextColor:S,thColor:P,thColorModal:t,thColorPopover:z,thTextColor:v,thFontWeight:$,tdTextColor:_,tdColor:j,tdColorModal:R,tdColorPopover:o,borderColor:f,borderColorModal:A,borderColorPopover:c,borderRadius:m,lineHeight:y,[T("fontSize",d)]:w,[T(h?"thPaddingBordered":"thPadding",d)]:u,[T(h?"tdPaddingBordered":"tdPadding",d)]:x}}=i.value;return{"--n-title-text-color":S,"--n-th-padding":u,"--n-td-padding":x,"--n-font-size":w,"--n-bezier":g,"--n-th-font-weight":$,"--n-line-height":y,"--n-th-text-color":v,"--n-td-text-color":_,"--n-th-color":P,"--n-th-color-modal":t,"--n-th-color-popover":z,"--n-td-color":j,"--n-td-color-modal":R,"--n-td-color-popover":o,"--n-border-radius":m,"--n-border-color":f,"--n-border-color-modal":A,"--n-border-color-popover":c}}),s=a?K("descriptions",M(()=>{let d="";const{size:h,bordered:g}=r;return g&&(d+="a"),d+=h[0],d}),l,r):void 0;return{mergedClsPrefix:b,cssVars:a?void 0:l,themeClass:s==null?void 0:s.themeClass,onRender:s==null?void 0:s.onRender,compitableColumn:J(r,["columns","column"]),inlineThemeDisabled:a}},render(){const r=this.$slots.default,b=r?W(r()):[];b.length;const{contentClass:a,labelClass:i,compitableColumn:l,labelPlacement:s,labelAlign:d,size:h,bordered:g,title:S,cssVars:P,mergedClsPrefix:t,separator:z,onRender:v}=this;v==null||v();const $=b.filter(o=>U(o)),_={span:0,row:[],secondRow:[],rows:[]},R=$.reduce((o,f,A)=>{const c=f.props||{},m=$.length-1===A,y=["label"in c?c.label:D(f,"label")],w=[D(f)],u=c.span||1,x=o.span;o.span+=u;const I=c.labelStyle||c["label-style"]||this.labelStyle,O=c.contentStyle||c["content-style"]||this.contentStyle;if(s==="left")g?o.row.push(n("th",{class:[`${t}-descriptions-table-header`,i],colspan:1,style:I},y),n("td",{class:[`${t}-descriptions-table-content`,a],colspan:m?(l-x)*2+1:u*2-1,style:O},w)):o.row.push(n("td",{class:`${t}-descriptions-table-content`,colspan:m?(l-x)*2:u*2},n("span",{class:[`${t}-descriptions-table-content__label`,i],style:I},[...y,z&&n("span",{class:`${t}-descriptions-separator`},z)]),n("span",{class:[`${t}-descriptions-table-content__content`,a],style:O},w)));else{const k=m?(l-x)*2:u*2;o.row.push(n("th",{class:[`${t}-descriptions-table-header`,i],colspan:k,style:I},y)),o.secondRow.push(n("td",{class:[`${t}-descriptions-table-content`,a],colspan:k,style:O},w))}return(o.span>=l||m)&&(o.span=0,o.row.length&&(o.rows.push(o.row),o.row=[]),s!=="left"&&o.secondRow.length&&(o.rows.push(o.secondRow),o.secondRow=[])),o},_).rows.map(o=>n("tr",{class:`${t}-descriptions-table-row`},o));return n("div",{style:P,class:[`${t}-descriptions`,this.themeClass,`${t}-descriptions--${s}-label-placement`,`${t}-descriptions--${d}-label-align`,`${t}-descriptions--${h}-size`,g&&`${t}-descriptions--bordered`]},S||this.$slots.header?n("div",{class:`${t}-descriptions-header`},S||q(this,"header")):null,n("div",{class:`${t}-descriptions-table-wrapper`},n("table",{class:`${t}-descriptions-table`},n("tbody",null,s==="top"&&n("tr",{class:`${t}-descriptions-table-row`,style:{visibility:"collapse"}},X(l*2,n("td",null))),R))))}}),ee={label:String,span:{type:Number,default:1},labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]},re=E({name:"DescriptionsItem",[V]:!0,props:ee,render(){return null}});export{re as _,te as a};
