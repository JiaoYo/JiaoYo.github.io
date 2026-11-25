import{bW as g,a1 as e,d7 as W,d8 as K,cv as Q,bY as P,a2 as L,d as F,a3 as N,cx as Y,c as d,o as p,a4 as s,R as v,a6 as n,g as R,cy as Z,ck as q,a7 as J,f as M,dZ as U,a9 as j,aa as X,cQ as H}from"./index-BzZargB0.js";function V(t,u="default",b=[]){const{children:l}=t;if(l!==null&&typeof l=="object"&&!Array.isArray(l)){const i=l[u];if(typeof i=="function")return i()}return b}var ee=g([e("descriptions",{fontSize:"var(--n-font-size)"},[e("descriptions-separator",`
 display: inline-block;
 margin: 0 8px 0 2px;
 `),e("descriptions-table-wrapper",[e("descriptions-table",[e("descriptions-table-row",[e("descriptions-table-header",{padding:"var(--n-th-padding)"}),e("descriptions-table-content",{padding:"var(--n-td-padding)"})])])]),Q("bordered",[e("descriptions-table-wrapper",[e("descriptions-table",[e("descriptions-table-row",[g("&:last-child",[e("descriptions-table-content",{paddingBottom:0})])])])])]),P("left-label-placement",[e("descriptions-table-content",[g("> *",{verticalAlign:"top"})])]),P("left-label-align",[g("th",{textAlign:"left"})]),P("center-label-align",[g("th",{textAlign:"center"})]),P("right-label-align",[g("th",{textAlign:"right"})]),P("bordered",[e("descriptions-table-wrapper",`
 border-radius: var(--n-border-radius);
 overflow: hidden;
 background: var(--n-merged-td-color);
 border: 1px solid var(--n-merged-border-color);
 `,[e("descriptions-table",[e("descriptions-table-row",[g("&:not(:last-child)",[e("descriptions-table-content",{borderBottom:"1px solid var(--n-merged-border-color)"}),e("descriptions-table-header",{borderBottom:"1px solid var(--n-merged-border-color)"})]),e("descriptions-table-header",`
 font-weight: 400;
 background-clip: padding-box;
 background-color: var(--n-merged-th-color);
 `,[g("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})]),e("descriptions-table-content",[g("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})])])])])]),e("descriptions-header",`
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
 `,[L("content",`
 transition: color .3s var(--n-bezier);
 display: inline-block;
 color: var(--n-td-text-color);
 `)]),L("label",`
 font-weight: var(--n-th-font-weight);
 transition: color .3s var(--n-bezier);
 display: inline-block;
 margin-right: 14px;
 color: var(--n-th-text-color);
 `)])])])]),e("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color);
 --n-merged-td-color: var(--n-td-color);
 --n-merged-border-color: var(--n-border-color);
 `),W(e("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-modal);
 --n-merged-td-color: var(--n-td-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),K(e("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-popover);
 --n-merged-td-color: var(--n-td-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]);const oe="DESCRIPTION_ITEM_FLAG";function re(t){return typeof t=="object"&&t&&!Array.isArray(t)?t.type&&t.type.DESCRIPTION_ITEM_FLAG:!1}const te=["colspan"],ne=["colspan"],se=["colspan"],le=["colspan"],ie={...N.props,title:String,column:{type:Number,default:3},columns:Number,labelPlacement:{type:String,default:"top"},labelAlign:{type:String,default:"left"},separator:{type:String,default:":"},size:String,bordered:Boolean,labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var de=F({name:"Descriptions",props:ie,slots:Object,setup(t){const{mergedClsPrefixRef:u,inlineThemeDisabled:b,mergedComponentPropsRef:l}=J(t),i=M(()=>{var a,c;return t.size||((c=(a=l==null?void 0:l.value)==null?void 0:a.Descriptions)==null?void 0:c.size)||"medium"}),f=N("Descriptions","-descriptions",ee,U,t,u),I=M(()=>{const{bordered:a}=t,c=i.value,{common:{cubicBezierEaseInOut:B},self:{titleTextColor:r,thColor:A,thColorModal:x,thColorPopover:D,thTextColor:O,thFontWeight:o,tdTextColor:S,tdColor:E,tdColorModal:h,tdColorPopover:y,borderColor:z,borderColorModal:C,borderColorPopover:w,borderRadius:$,lineHeight:_,[j("fontSize",c)]:k,[j(a?"thPaddingBordered":"thPadding",c)]:T,[j(a?"tdPaddingBordered":"tdPadding",c)]:G}}=f.value;return{"--n-title-text-color":r,"--n-th-padding":T,"--n-td-padding":G,"--n-font-size":k,"--n-bezier":B,"--n-th-font-weight":o,"--n-line-height":_,"--n-th-text-color":O,"--n-td-text-color":S,"--n-th-color":A,"--n-th-color-modal":x,"--n-th-color-popover":D,"--n-td-color":E,"--n-td-color-modal":h,"--n-td-color-popover":y,"--n-border-radius":$,"--n-border-color":z,"--n-border-color-modal":C,"--n-border-color-popover":w}}),m=b?X("descriptions",M(()=>{let a="";const{bordered:c}=t;return c&&(a+="a"),a+=i.value[0],a}),I,t):void 0;return{mergedClsPrefix:u,cssVars:b?void 0:I,themeClass:m==null?void 0:m.themeClass,onRender:m==null?void 0:m.onRender,compitableColumn:H(t,["columns","column"]),inlineThemeDisabled:b,mergedSize:i}},render(){const t=this.$slots.default,u=t?Y(t()):[];u.length;const{contentClass:b,labelClass:l,compitableColumn:i,labelPlacement:f,labelAlign:I,mergedSize:m,bordered:a,title:c,cssVars:B,mergedClsPrefix:r,separator:A,onRender:x}=this;x==null||x();const D=u.filter(o=>re(o)),O=D.reduce((o,S,E)=>{const h=S.props||{},y=D.length-1===E,z=["label"in h?h.label:V(S,"label")],C=[V(S)],w=h.span||1,$=o.span;o.span+=w;const _=h.labelStyle||h["label-style"]||this.labelStyle,k=h.contentStyle||h["content-style"]||this.contentStyle;if(f==="left")a?o.row.push((p(),d("th",{key:1,class:n([`${r}-descriptions-table-header`,l]),colspan:1,style:v(_)},[s(()=>z)],6)),(p(),d("td",{key:2,class:n([`${r}-descriptions-table-content`,b]),colspan:y?(i-$)*2+1:w*2-1,style:v(k)},[s(()=>C)],14,te))):o.row.push((p(),d("td",{key:3,class:n(`${r}-descriptions-table-content`),colspan:y?(i-$)*2:w*2},[R("span",{class:n([`${r}-descriptions-table-content__label`,l]),style:v(_)},[s(()=>[...z,A&&(p(),d("span",{key:4,class:n(`${r}-descriptions-separator`)},[s(()=>A)],2))])],6),R("span",{class:n([`${r}-descriptions-table-content__content`,b]),style:v(k)},[s(()=>C)],6)],10,ne)));else{const T=y?(i-$)*2:w*2;o.row.push((p(),d("th",{key:5,class:n([`${r}-descriptions-table-header`,l]),colspan:T,style:v(_)},[s(()=>z)],14,se))),o.secondRow.push((p(),d("td",{key:6,class:n([`${r}-descriptions-table-content`,b]),colspan:T,style:v(k)},[s(()=>C)],14,le)))}return(o.span>=i||y)&&(o.span=0,o.row.length&&(o.rows.push(o.row),o.row=[]),f!=="left"&&o.secondRow.length&&(o.rows.push(o.secondRow),o.secondRow=[])),o},{span:0,row:[],secondRow:[],rows:[]}).rows.map(o=>(p(),d("tr",{class:n(`${r}-descriptions-table-row`)},[s(()=>o)],2)));return p(),d("div",{style:v(B),class:n([`${r}-descriptions`,this.themeClass,`${r}-descriptions--${f}-label-placement`,`${r}-descriptions--${I}-label-align`,`${r}-descriptions--${m}-size`,a&&`${r}-descriptions--bordered`])},[c||this.$slots.header?(p(),d("div",{key:0,class:n(`${r}-descriptions-header`)},[s(()=>c||Z(this,"header"))],2)):s(()=>null),R("div",{class:n(`${r}-descriptions-table-wrapper`)},[R("table",{class:n(`${r}-descriptions-table`)},[R("tbody",null,[s(()=>f==="top"&&(p(),d("tr",{class:n(`${r}-descriptions-table-row`),style:{visibility:"collapse"}},[s(()=>q(i*2,(p(),d("td"))))],2))),s(()=>O)])],2)],2)],6)}});const ae={label:String,span:{type:Number,default:1},labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var pe=F({name:"DescriptionsItem",[oe]:!0,props:ae,slots:Object,render(){return null}});export{de as D,pe as a};
