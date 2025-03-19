import{_ as Le}from"./round-plus-Cy8c1zzO.js";import{d as G,j as g,b as M,y as we,aA as pe,aI as te,aM as h,aE as _,aZ as Ye,aB as N,a_ as Fe,aC as $,aD as xe,a$ as ke,b0 as We,b1 as Ge,aF as Ke,b2 as me,aG as $e,aH as Se,b3 as Xe,J as Ce,b4 as Ne,b5 as He,aL as Je,b6 as Ze,a9 as Qe,b7 as et,aN as tt,b8 as nt,b9 as at,ba as Q,bb as st,bc as J,bd as lt,be as rt,bf as ot,o as O,e as ne,f as j,a5 as it,r as ut,g as a,A as H,a2 as be,B as A,$ as ae,ar as F,h as P,K as ve,w as i,i as x,t as se,M as ct,L as le,am as dt,ak as ft,c as ee,ah as pt,bg as mt,E as bt,ad as vt,C as ht,D as gt,ae as _t,af as yt,F as wt,T as xt,U as kt,aa as $t,aw as he,_ as St,V as Ct}from"./index-7Q9xZuwa.js";import{l as ge}from"./lodash-CYudMFH4.js";import{d as Nt,e as _e,g as It}from"./basic-config-xmOspnLV.js";import{_ as Rt}from"./DataTable-n3fP4Loy.js";import{_ as Pt}from"./FormItemGridItem-DYTXkfwP.js";import{_ as zt}from"./Grid-CRtcNhSF.js";import"./Forward-BzUEeUAa.js";const ye=G({name:"SlotMachineNumber",props:{clsPrefix:{type:String,required:!0},value:{type:[Number,String],required:!0},oldOriginalNumber:{type:Number,default:void 0},newOriginalNumber:{type:Number,default:void 0}},setup(e){const s=g(null),r=g(e.value),l=g(e.value),c=g("up"),o=g(!1),d=M(()=>o.value?`${e.clsPrefix}-base-slot-machine-current-number--${c.value}-scroll`:null),I=M(()=>o.value?`${e.clsPrefix}-base-slot-machine-old-number--${c.value}-scroll`:null);we(te(e,"value"),(p,w)=>{r.value=w,l.value=p,pe(V)});function V(){const p=e.newOriginalNumber,w=e.oldOriginalNumber;w===void 0||p===void 0||(p>w?k("up"):w>p&&k("down"))}function k(p){c.value=p,o.value=!1,pe(()=>{var w;(w=s.value)===null||w===void 0||w.offsetWidth,o.value=!0})}return()=>{const{clsPrefix:p}=e;return h("span",{ref:s,class:`${p}-base-slot-machine-number`},r.value!==null?h("span",{class:[`${p}-base-slot-machine-old-number ${p}-base-slot-machine-old-number--top`,I.value]},r.value):null,h("span",{class:[`${p}-base-slot-machine-current-number`,d.value]},h("span",{ref:"numberWrapper",class:[`${p}-base-slot-machine-current-number__inner`,typeof e.value!="number"&&`${p}-base-slot-machine-current-number__inner--not-number`]},l.value)),r.value!==null?h("span",{class:[`${p}-base-slot-machine-old-number ${p}-base-slot-machine-old-number--bottom`,I.value]},r.value):null)}}}),{cubicBezierEaseOut:W}=Ye;function Tt({duration:e=".2s"}={}){return[_("&.fade-up-width-expand-transition-leave-active",{transition:`
 opacity ${e} ${W},
 max-width ${e} ${W},
 transform ${e} ${W}
 `}),_("&.fade-up-width-expand-transition-enter-active",{transition:`
 opacity ${e} ${W},
 max-width ${e} ${W},
 transform ${e} ${W}
 `}),_("&.fade-up-width-expand-transition-enter-to",{opacity:1,transform:"translateX(0) translateY(0)"}),_("&.fade-up-width-expand-transition-enter-from",{maxWidth:"0 !important",opacity:0,transform:"translateY(60%)"}),_("&.fade-up-width-expand-transition-leave-from",{opacity:1,transform:"translateY(0)"}),_("&.fade-up-width-expand-transition-leave-to",{maxWidth:"0 !important",opacity:0,transform:"translateY(60%)"})]}const Mt=_([_("@keyframes n-base-slot-machine-fade-up-in",`
 from {
 transform: translateY(60%);
 opacity: 0;
 }
 to {
 transform: translateY(0);
 opacity: 1;
 }
 `),_("@keyframes n-base-slot-machine-fade-down-in",`
 from {
 transform: translateY(-60%);
 opacity: 0;
 }
 to {
 transform: translateY(0);
 opacity: 1;
 }
 `),_("@keyframes n-base-slot-machine-fade-up-out",`
 from {
 transform: translateY(0%);
 opacity: 1;
 }
 to {
 transform: translateY(-60%);
 opacity: 0;
 }
 `),_("@keyframes n-base-slot-machine-fade-down-out",`
 from {
 transform: translateY(0%);
 opacity: 1;
 }
 to {
 transform: translateY(60%);
 opacity: 0;
 }
 `),N("base-slot-machine",`
 overflow: hidden;
 white-space: nowrap;
 display: inline-block;
 height: 18px;
 line-height: 18px;
 `,[N("base-slot-machine-number",`
 display: inline-block;
 position: relative;
 height: 18px;
 width: .6em;
 max-width: .6em;
 `,[Tt({duration:".2s"}),Fe({duration:".2s",delay:"0s"}),N("base-slot-machine-old-number",`
 display: inline-block;
 opacity: 0;
 position: absolute;
 left: 0;
 right: 0;
 `,[$("top",{transform:"translateY(-100%)"}),$("bottom",{transform:"translateY(100%)"}),$("down-scroll",{animation:"n-base-slot-machine-fade-down-out .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),$("up-scroll",{animation:"n-base-slot-machine-fade-up-out .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1})]),N("base-slot-machine-current-number",`
 display: inline-block;
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 1;
 transform: translateY(0);
 width: .6em;
 `,[$("down-scroll",{animation:"n-base-slot-machine-fade-down-in .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),$("up-scroll",{animation:"n-base-slot-machine-fade-up-in .2s cubic-bezier(0, 0, .2, 1)",animationIterationCount:1}),xe("inner",`
 display: inline-block;
 position: absolute;
 right: 0;
 top: 0;
 width: .6em;
 `,[$("not-number",`
 right: unset;
 left: 0;
 `)])])])])]),Bt=G({name:"BaseSlotMachine",props:{clsPrefix:{type:String,required:!0},value:{type:[Number,String],default:0},max:{type:Number,default:void 0},appeared:{type:Boolean,required:!0}},setup(e){ke("-base-slot-machine",Mt,te(e,"clsPrefix"));const s=g(),r=g(),l=M(()=>{if(typeof e.value=="string")return[];if(e.value<1)return[0];const c=[];let o=e.value;for(e.max!==void 0&&(o=Math.min(e.max,o));o>=1;)c.push(o%10),o/=10,o=Math.floor(o);return c.reverse(),c});return we(te(e,"value"),(c,o)=>{typeof c=="string"?(r.value=void 0,s.value=void 0):typeof o=="string"?(r.value=c,s.value=void 0):(r.value=c,s.value=o)}),()=>{const{value:c,clsPrefix:o}=e;return typeof c=="number"?h("span",{class:`${o}-base-slot-machine`},h(Ge,{name:"fade-up-width-expand-transition",tag:"span"},{default:()=>l.value.map((d,I)=>h(ye,{clsPrefix:o,key:l.value.length-I-1,oldOriginalNumber:s.value,newOriginalNumber:r.value,value:d}))}),h(We,{key:"+",width:!0},{default:()=>e.max!==void 0&&e.max<c?h(ye,{clsPrefix:o,value:"+"}):null})):h("span",{class:`${o}-base-slot-machine`},c)}}}),Dt=e=>{const{errorColor:s,infoColor:r,successColor:l,warningColor:c,fontFamily:o}=e;return{color:s,colorInfo:r,colorSuccess:l,colorError:s,colorWarning:c,fontSize:"12px",fontFamily:o}},qt={name:"Badge",common:Ke,self:Dt},Et=_([_("@keyframes badge-wave-spread",{from:{boxShadow:"0 0 0.5px 0px var(--n-ripple-color)",opacity:.6},to:{boxShadow:"0 0 0.5px 4.5px var(--n-ripple-color)",opacity:0}}),N("badge",`
 display: inline-flex;
 position: relative;
 vertical-align: middle;
 font-family: var(--n-font-family);
 `,[$("as-is",[N("badge-sup",{position:"static",transform:"translateX(0)"},[me({transformOrigin:"left bottom",originalTransform:"translateX(0)"})])]),$("dot",[N("badge-sup",`
 height: 8px;
 width: 8px;
 padding: 0;
 min-width: 8px;
 left: 100%;
 bottom: calc(100% - 4px);
 `,[_("::before","border-radius: 4px;")])]),N("badge-sup",`
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
 z-index: 1;
 display: flex;
 align-items: center;
 `,[me({transformOrigin:"left bottom",originalTransform:"translateX(-50%)"}),N("base-wave",{zIndex:1,animationDuration:"2s",animationIterationCount:"infinite",animationDelay:"1s",animationTimingFunction:"var(--n-ripple-bezier)",animationName:"badge-wave-spread"}),_("&::before",`
 opacity: 0;
 transform: scale(1);
 border-radius: 9px;
 content: "";
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 `)])])]),At=Object.assign(Object.assign({},Se.props),{value:[String,Number],max:Number,dot:Boolean,type:{type:String,default:"default"},show:{type:Boolean,default:!0},showZero:Boolean,processing:Boolean,color:String,offset:Array}),Ot=G({name:"Badge",props:At,setup(e,{slots:s}){const{mergedClsPrefixRef:r,inlineThemeDisabled:l,mergedRtlRef:c}=$e(e),o=Se("Badge","-badge",Et,qt,e,r),d=g(!1),I=()=>{d.value=!0},V=()=>{d.value=!1},k=M(()=>e.show&&(e.dot||e.value!==void 0&&!(!e.showZero&&Number(e.value)<=0)||!Xe(s.value)));Ce(()=>{k.value&&(d.value=!0)});const p=Ne("Badge",c,r),w=M(()=>{const{type:S,color:C}=e,{common:{cubicBezierEaseInOut:R,cubicBezierEaseOut:K},self:{[He("color",S)]:T,fontFamily:L,fontSize:B}}=o.value;return{"--n-font-size":B,"--n-font-family":L,"--n-color":C||T,"--n-ripple-color":C||T,"--n-bezier":R,"--n-ripple-bezier":K}}),z=l?Je("badge",M(()=>{let S="";const{type:C,color:R}=e;return C&&(S+=C[0]),R&&(S+=Ze(R)),S}),w,e):void 0,Z=M(()=>{const{offset:S}=e;if(!S)return;const[C,R]=S,K=typeof C=="number"?`${C}px`:C,T=typeof R=="number"?`${R}px`:R;return{transform:`translate(calc(${p!=null&&p.value?"50%":"-50%"} + ${K}), ${T})`}});return{rtlEnabled:p,mergedClsPrefix:r,appeared:d,showBadge:k,handleAfterEnter:I,handleAfterLeave:V,cssVars:l?void 0:w,themeClass:z==null?void 0:z.themeClass,onRender:z==null?void 0:z.onRender,offsetStyle:Z}},render(){var e;const{mergedClsPrefix:s,onRender:r,themeClass:l,$slots:c}=this;r==null||r();const o=(e=c.default)===null||e===void 0?void 0:e.call(c);return h("div",{class:[`${s}-badge`,this.rtlEnabled&&`${s}-badge--rtl`,l,{[`${s}-badge--dot`]:this.dot,[`${s}-badge--as-is`]:!o}],style:this.cssVars},o,h(Qe,{name:"fade-in-scale-up-transition",onAfterEnter:this.handleAfterEnter,onAfterLeave:this.handleAfterLeave},{default:()=>this.showBadge?h("sup",{class:`${s}-badge-sup`,title:et(this.value),style:this.offsetStyle},tt(c.value,()=>[this.dot?null:h(Bt,{clsPrefix:s,appeared:this.appeared,max:this.max,value:this.value})]),this.processing?h(nt,{clsPrefix:s}):null):null}))}}),Vt=at(24,null).map((e,s)=>{const r=s+1,l=`calc(100% / 24 * ${r})`;return[$(`${r}-span`,{width:l}),$(`${r}-offset`,{marginLeft:l}),$(`${r}-push`,{left:l}),$(`${r}-pull`,{right:l})]}),Ut=_([N("row",{width:"100%",display:"flex",flexWrap:"wrap"}),N("col",{verticalAlign:"top",boxSizing:"border-box",display:"inline-block",position:"relative",zIndex:"auto"},[xe("box",{position:"relative",zIndex:"auto",width:"100%",height:"100%"}),Vt])]),Ie=lt("n-row"),jt={gutter:{type:[Array,Number,String],default:0},alignItems:String,justifyContent:String},Lt=G({name:"Row",props:jt,setup(e){const{mergedClsPrefixRef:s,mergedRtlRef:r}=$e(e);ke("-legacy-grid",Ut,s);const l=Ne("Row",r,s),c=Q(()=>{const{gutter:d}=e;return Array.isArray(d)&&d[1]||0}),o=Q(()=>{const{gutter:d}=e;return Array.isArray(d)?d[0]:Number(d)});return st(Ie,{mergedClsPrefixRef:s,gutterRef:te(e,"gutter"),verticalGutterRef:c,horizontalGutterRef:o}),{mergedClsPrefix:s,rtlEnabled:l,styleMargin:Q(()=>`-${J(c.value,{c:.5})} -${J(o.value,{c:.5})}`),styleWidth:Q(()=>`calc(100% + ${J(o.value)})`)}},render(){return h("div",{class:[`${this.mergedClsPrefix}-row`,this.rtlEnabled&&`${this.mergedClsPrefix}-row--rtl`],style:{margin:this.styleMargin,width:this.styleWidth,alignItems:this.alignItems,justifyContent:this.justifyContent}},this.$slots)}}),Yt={span:{type:[String,Number],default:1},push:{type:[String,Number],default:0},pull:{type:[String,Number],default:0},offset:{type:[String,Number],default:0}},Ft=G({name:"Col",props:Yt,setup(e){const s=rt(Ie,null);return s||ot("col","`n-col` must be placed inside `n-row`."),{mergedClsPrefix:s.mergedClsPrefixRef,gutter:s.gutterRef,stylePadding:M(()=>`${J(s.verticalGutterRef.value,{c:.5})} ${J(s.horizontalGutterRef.value,{c:.5})}`),mergedPush:M(()=>Number(e.push)-Number(e.pull))}},render(){const{$slots:e,span:s,mergedPush:r,offset:l,stylePadding:c,gutter:o,mergedClsPrefix:d}=this;return h("div",{class:[`${d}-col`,{[`${d}-col--${s}-span`]:!0,[`${d}-col--${r}-push`]:r>0,[`${d}-col--${-r}-pull`]:r<0,[`${d}-col--${l}-offset`]:l}],style:{padding:c}},o?h("div",null,e):e)}}),Wt={class:"inline-block",viewBox:"0 0 24 24",width:"1em",height:"1em"},Gt=j("path",{fill:"currentColor",d:"M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h11.175q.4 0 .763.15t.637.425l2.85 2.85q.275.275.425.638t.15.762V19q0 .825-.587 1.413T19 21zM19 7.85L16.15 5H5v14h14zM12 18q1.25 0 2.125-.875T15 15t-.875-2.125T12 12t-2.125.875T9 15t.875 2.125T12 18m-5-8h7q.425 0 .713-.288T15 9V7q0-.425-.288-.712T14 6H7q-.425 0-.712.288T6 7v2q0 .425.288.713T7 10M5 7.85V19V5z"},null,-1),Kt=[Gt];function Xt(e,s){return O(),ne("svg",Wt,[...Kt])}const Ht={name:"material-symbols-save-outline-rounded",render:Xt},Jt={class:"inline-block",viewBox:"0 0 24 24",width:"1em",height:"1em"},Zt=j("path",{fill:"currentColor",d:"m9.25 22l-.4-3.2q-.325-.125-.612-.3t-.563-.375L4.7 19.375l-2.75-4.75l2.575-1.95Q4.5 12.5 4.5 12.338v-.675q0-.163.025-.338L1.95 9.375l2.75-4.75l2.975 1.25q.275-.2.575-.375t.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3t.562.375l2.975-1.25l2.75 4.75l-2.575 1.95q.025.175.025.338v.674q0 .163-.05.338l2.575 1.95l-2.75 4.75l-2.95-1.25q-.275.2-.575.375t-.6.3l-.4 3.2zm2.8-6.5q1.45 0 2.475-1.025T15.55 12t-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12t1.013 2.475T12.05 15.5"},null,-1),Qt=[Zt];function en(e,s){return O(),ne("svg",Jt,[...Qt])}const tn={name:"material-symbols-settings",render:en},Re=e=>(xt("data-v-b12de079"),e=e(),kt(),e),nn={class:"min-h-500px flex-col-stretch gap-16px overflow-auto lt-sm:overflow-auto"},an={class:"lan-network"},sn=Re(()=>j("span",{class:"font-size-16px font-700"},"系统网络配置",-1)),ln=Re(()=>j("span",{style:{width:"3px",height:"15px",background:"#1980ff",display:"inline-block","margin-right":"5px","border-radius":"20px"}},null,-1)),rn={class:"w-100% h-100% flex-col"};function on(e){return typeof e=="function"||Object.prototype.toString.call(e)==="[object Object]"&&!pt(e)}const un=G({name:"basicconfig_network-manage",__name:"index",setup(e){const s=it(),r=()=>{let t=[];for(let n=1;n<=32;n++)t.push({label:n+"",value:n,name:mt(n)});return t},l=g([{id:1,nname:"eno1",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:2,nname:"eno2",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:3,nname:"eno3",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:4,nname:"eno4",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:5,nname:"eno5",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:6,nname:"eno6",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:7,nname:"eno7",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]},{id:8,nname:"eno8",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:"",curr:null,checked2:[],list2:[]}]),c=ut([{key:"ip",title:"目标",width:240,align:"center",render:t=>a(H,{value:t.ip,clearable:!0,"onUpdate:value":n=>t.ip=n,status:t.inputStatus?"error":"success",onBlur:()=>z(t,t.ip),onInput:n=>z(t,n)},null)},{key:"netMask",title:"掩码",align:"center",width:240,render:t=>(console.log(t.netMask),a(be,{renderLabel:ue,value:t.netMask,clearable:!0,status:t.selectStatus?"error":"success",onBlur:()=>S(t,t.netMask),"onUpdate:value":n=>S(t,n),options:r()},null))},{key:"nextip",title:"下一跳",align:"center",width:240,render:t=>a(H,{value:t.nextip,"onUpdate:value":n=>t.nextip=n,clearable:!0,status:t.inputStatus1?"error":"success",onBlur:()=>Z(t,t.nextip),onInput:n=>Z(t,n)},null)},{key:"operate",title:"操作",align:"center",width:130,fixed:"right",render:(t,n)=>{let f;return a("div",{class:"flex-center gap-8px"},[a(A,{type:"error",ghost:!0,size:"small",onClick:()=>o(n)},on(f=ae("common.delete"))?f:{default:()=>[f]})])}}]),o=t=>{B.value.splice(t,1)},d=g(0),I=g(""),V=async()=>{var f;const{data:t,error:n}=await Nt();if(t){const u=JSON.parse(JSON.stringify(t));d.value=u.findIndex(m=>m.curr),I.value=(f=u.find(m=>m.curr))==null?void 0:f.nip,l.value.forEach((m,D)=>{const q=u.find(U=>U.nname.charAt(U.nname.length-1)==m.id);q&&(l.value[D]={...q,id:D+1})})}},k=g(),p={nip:[{required:!0,message:"请输入IP地址",trigger:["input","change","blur","password-input"]},{validator:he,trigger:["input","change","blur","password-input"]}],nmaskbits:{required:!0,validator:(t,n)=>new Promise((f,u)=>{n==0||n==null?u(new Error("请选择掩码")):f()}),trigger:["input","change","blur"]}},w={nip:[{required:!0,message:"请输入IP地址",trigger:["input"]},{validator:he,trigger:["input"]}],nmaskbits:{required:!0,validator:(t,n)=>new Promise((f,u)=>{n==0||n==null?u(new Error("请选择掩码")):f()}),trigger:["change"]}},z=(t,n)=>{t.inputStatus=!F(n)},Z=(t,n)=>{t.inputStatus1=!F(n)},S=(t,n)=>{t.netMask=n,t.selectStatus=n==null},C=async()=>{var u,m,D,q,U;const t=l.value.findIndex(v=>!v.nip&&v.nmaskbits||v.nip&&!v.nmaskbits);t!=-1&&await k.value[t].validate(),k.value[d.value].validate();const n=l.value.filter((v,E)=>{if(v.nip&&v.nmaskbits)return v.nip&&v.nmaskbits;!v.nip&&!v.nmaskbits&&k.value[E].restoreValidation()});if(n.length==0)return(u=window.$message)==null?void 0:u.warning("请至少设置一个网口的配置");const f=(m=l.value.find(v=>v.curr))==null?void 0:m.nip;if(f!=I.value)(D=window.$dialog)==null||D.warning({title:"提示",content:"检测到您要修改当前网关的IP地址，确认要修改吗？",positiveText:"确认",negativeText:"取消",positiveButtonProps:{type:"info",ghost:!0},onPositiveClick:async()=>{const v=window.location.href.replace(new RegExp(I.value,"g"),f);setTimeout(()=>{window.location.href=v},3e3);try{const{data:E,error:ce}=await _e(n)}catch{}}});else try{const{data:v,error:E}=await _e(n);E||((q=window.$message)==null||q.destroyAll(),(U=window.$message)==null||U.success("配置成功"),V())}catch(v){console.error(v)}},R=t=>{l.value[t].nmaskbits||setTimeout(()=>{k.value[t].restoreValidation()},100)},K=t=>{l.value[t].nip||setTimeout(()=>{k.value[t].restoreValidation()},100)},T=g(!1),L=g(0),B=g(),Pe=async t=>{await k.value[t].validate(),T.value=!0,L.value=t,B.value=ge.cloneDeep(l.value[t].list2)?ge.cloneDeep(l.value[t].list2).map((n,f)=>{const[u,m]=n.ip.split("/");return{...n,id:f+1,ip:u,netMask:m&&Number(m)}}):[]},ze=()=>{var f;if(!(u=>{for(const m of u){if(!F(m.ip))return m.inputStatus=!0,!1;if(m.netMask==null||m.netMask==0)return m.selectStatus=!0,!1;if(!F(m.nextip))return m.inputStatus1=!0,!1}return!0})(B.value))return(f=window.$message)==null?void 0:f.warning("目标IP、掩码、下一跳IP不能为空或IP格式错误，请检查后重试");l.value[L.value].list2=B.value.map(u=>(u.ip=u.ip+"/"+u.netMask,u.netMask=null,u.id=void 0,u.inputStatus=void 0,u.inputStatus1=void 0,u.selectStatus=void 0,u)),T.value=!1},re=g(),y=g({visible:!1,dns1:"",dns2:""}),Te={dns1:{required:!0,trigger:["blur","input","change"],validator:(t,n)=>n?F(n)?!0:new Error("请输入正确的DNS"):new Error("请输入DNS")},dns2:{required:!1,trigger:["input","change"],validator:(t,n)=>n?F(n)?!0:new Error("请输入正确的DNS"):new Error("请输入DNS")}},Me=()=>{y.value.visible=!0,y.value.dns1=l.value[d.value].predns,y.value.dns2=l.value[d.value].bakdns},oe=async()=>{var f,u;const{data:t,error:n}=await It({dns1:y.value.dns1,dns2:y.value.dns2});n||((f=window.$message)==null||f.destroyAll(),(u=window.$message)==null||u.success("配置成功"),V(),ie())},Be=t=>{setTimeout(()=>{re.value.restoreValidation()},100)},ie=()=>{y.value.visible=!1,y.value.dns1="",y.value.dns2=""},ue=t=>a("div",{style:{display:"flex",alignItems:"center"}},[a("span",null,[t.label]),a("span",{style:{fontSize:"12px",marginLeft:"20px"}},[P("("),t.name,P(")")])]);return Ce(()=>{V()}),(t,n)=>{const f=tn,u=bt,m=vt,D=ht,q=gt,U=_t,v=yt,E=St,ce=Ot,de=Pt,De=zt,qe=Ft,Ee=Lt,Ae=Ht,Oe=Le,Ve=Rt,Ue=wt,fe=ve("no-space"),je=ve("no-auth");return O(),ne("div",nn,[j("div",an,[a(m,{bordered:!0,size:"small"},{default:i(()=>[a(u,{justify:"space-between",align:"center",class:"w-100%"},{default:i(()=>[sn,a(x(A),{type:"info",ghost:"",onClick:Me},{icon:i(()=>[a(f,{class:"text-icon"})]),default:i(()=>[P(" DNS配置 ")]),_:1})]),_:1})]),_:1}),a(v,{show:y.value.visible,"onUpdate:show":n[2]||(n[2]=b=>y.value.visible=b),"display-directive":"show",width:300},{default:i(()=>[a(U,{title:"设置DNS","native-scrollbar":!1,closable:""},{footer:i(()=>[a(u,{size:16},{default:i(()=>[a(x(A),{onClick:ie},{default:i(()=>[P(se(x(ae)("common.cancel")),1)]),_:1}),a(x(A),{type:"primary",onClick:oe},{default:i(()=>[P(se(x(ae)("common.confirm")),1)]),_:1})]),_:1})]),default:i(()=>[a(q,{ref_key:"formRef",ref:re,model:y.value,rules:Te,onKeyup:ct(oe,["enter"])},{default:i(()=>[a(D,{label:"DNS(首选)",path:"dns1"},{default:i(()=>[le(a(x(H),{clearable:"",value:y.value.dns1,"onUpdate:value":n[0]||(n[0]=b=>y.value.dns1=b),placeholder:"请输入IP"},null,8,["value"]),[[fe]])]),_:1}),a(D,{label:"DNS(备用)",path:"dns2"},{default:i(()=>[le(a(x(H),{clearable:"",value:y.value.dns2,"onUpdate:value":n[1]||(n[1]=b=>y.value.dns2=b),onClear:Be,placeholder:"请输入IP"},null,8,["value"]),[[fe]])]),_:1})]),_:1},8,["model"])]),_:1})]),_:1},8,["show"])]),a(Ee,{gutter:[12,12]},{default:i(()=>[(O(!0),ne(dt,null,ft(l.value,(b,X)=>(O(),ee(qe,{span:12,key:b.nname},{default:i(()=>[a(m,{bordered:!0,size:"small"},{header:i(()=>[j("div",{style:$t({color:x(s).themeScheme==="dark"?"#fff":"#000",fontWeight:"bolder",padding:"5px",fontSize:"18px",marginBottom:"10px",display:"flex",alignItems:"center"})},[ln,P(" "+se(b.nname)+"网络配置   ",1),Number(b.nname.charAt(b.nname.length-1)||b.nname.replace("eno",""))==d.value+1?(O(),ee(E,{key:0,"local-icon":"lan-active",style:{"font-size":"24px"},class:"animation"})):(O(),ee(E,{key:1,"local-icon":"lan-default",style:{"font-size":"24px"}}))],4)]),"header-extra":i(()=>[a(ce,{value:b.list2.length,max:100,type:"info"},{default:i(()=>[a(x(A),{type:"info",ghost:"",onClick:Y=>Pe(X),class:"ml-20px"},{icon:i(()=>[a(f,{class:"text-icon"})]),default:i(()=>[P(" 网关路由 ")]),_:2},1032,["onClick"])]),_:2},1032,["value"])]),default:i(()=>[a(q,{ref_for:!0,ref_key:"IpformRef",ref:k,model:b,rules:d.value==X?p:w,"label-placement":"left","label-width":70,"show-require-mark":d.value==X,"require-mark-placement":"left"},{default:i(()=>[a(De,{responsive:"screen","item-responsive":""},{default:i(()=>[a(de,{span:"24 s:12 m:12",label:"IP地址",path:"nip"},{default:i(()=>[a(x(H),{clearable:"",placeholder:"请输入IP地址",value:b.nip,"onUpdate:value":Y=>b.nip=Y,onClear:Y=>R(X)},null,8,["value","onUpdate:value","onClear"])]),_:2},1024),a(de,{span:"24 s:12 m:12",label:"掩码",path:"nmaskbits"},{default:i(()=>[a(x(be),{"render-label":ue,clearable:"",options:r(),placeholder:"请选择掩码位数",value:b.nmaskbits,"onUpdate:value":Y=>b.nmaskbits=Y,onClear:Y=>K(X)},null,8,["options","value","onUpdate:value","onClear"])]),_:2},1024)]),_:2},1024)]),_:2},1032,["model","rules","show-require-mark"])]),_:2},1024)]),_:2},1024))),128))]),_:1}),a(u,{justify:"center",class:"w-100%"},{default:i(()=>[le((O(),ee(x(A),{type:"info",ghost:"",onClick:C,"icon-placement":"left"},{icon:i(()=>[a(Ae)]),default:i(()=>[P(" 应用配置 ")]),_:1})),[[je,"sys.network.update"]])]),_:1}),a(Ue,{show:T.value,"onUpdate:show":n[4]||(n[4]=b=>T.value=b),title:l.value[L.value].nname+"网关路由配置",preset:"card","mask-closable":!1,class:"w-900px h-500px"},{footer:i(()=>[a(u,{size:16,justify:"end"},{default:i(()=>[a(x(A),{type:"primary",onClick:ze},{default:i(()=>[P("保存")]),_:1})]),_:1})]),default:i(()=>[j("div",rn,[a(u,{justify:"end",align:"center",class:"w-100% mb-10px"},{default:i(()=>[a(x(A),{size:"small",ghost:"",type:"primary",onClick:n[3]||(n[3]=b=>B.value.push({id:l.value[L.value].list2.length+1,ip:"",nextip:"",netMask:null}))},{icon:i(()=>[a(Oe,{class:"text-icon"})]),default:i(()=>[P(" 添加")]),_:1})]),_:1}),a(Ve,{columns:c,data:B.value,size:"small",remote:"","row-key":b=>b.id,class:"sm:h-full","max-height":280},null,8,["columns","data","row-key"])])]),_:1},8,["show","title"])])}}}),gn=Ct(un,[["__scopeId","data-v-b12de079"]]);export{gn as default};
