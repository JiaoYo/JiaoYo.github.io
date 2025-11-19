import{Z as _,a4 as me,a0 as H,a1 as L,a2 as N,d as ee,a5 as k,a8 as ye,dL as Me,a9 as Te,ad as ze,eh as Re,e7 as De,e8 as Pe,d5 as Le,aR as ue,B as ne,ah as ve,d8 as Ve,aa as xe,ei as Be,bv as Ne,r as V,bx as Oe,bw as Ie,a as ie,al as Ee,am as fe,i as _e,dF as Fe,b as Y,o as S,e as a,aI as Se,aL as pe,at as je,av as Ue,aw as $e,c as re,w as O,z as Q,t as T,aF as ce,g as P,f as j,aC as Ae,ax as ke,aV as we,aE as He,ej as We,aH as be,a_ as qe,az as Ge,h as Ye,A as Ke,ek as Xe,el as Ze,cl as Je}from"./index--GDXRx9n.js";import{u as Qe}from"./usePageData-GADHvGie.js";import{N as et}from"./RadioButton-DeB00DGi.js";import{s as ge,g as K,a as X,f as se,b as de,d as tt,c as he}from"./utils-DG-EDt72.js";import{C as at}from"./ChevronLeft-B2F3NbNy.js";const h="0!important",Ce="-1px!important";function Z(d){return H(`${d}-type`,[L("& +",[_("button",{},[H(`${d}-type`,[N("border",{borderLeftWidth:h}),N("state-border",{left:Ce})])])])])}function J(d){return H(`${d}-type`,[L("& +",[_("button",[H(`${d}-type`,[N("border",{borderTopWidth:h}),N("state-border",{top:Ce})])])])])}const ot=_("button-group",`
 flex-wrap: nowrap;
 display: inline-flex;
 position: relative;
`,[me("vertical",{flexDirection:"row"},[me("rtl",[_("button",[L("&:first-child:not(:last-child)",`
 margin-right: ${h};
 border-top-right-radius: ${h};
 border-bottom-right-radius: ${h};
 `),L("&:last-child:not(:first-child)",`
 margin-left: ${h};
 border-top-left-radius: ${h};
 border-bottom-left-radius: ${h};
 `),L("&:not(:first-child):not(:last-child)",`
 margin-left: ${h};
 margin-right: ${h};
 border-radius: ${h};
 `),Z("default"),H("ghost",[Z("primary"),Z("info"),Z("success"),Z("warning"),Z("error")])])])]),H("vertical",{flexDirection:"column"},[_("button",[L("&:first-child:not(:last-child)",`
 margin-bottom: ${h};
 margin-left: ${h};
 margin-right: ${h};
 border-bottom-left-radius: ${h};
 border-bottom-right-radius: ${h};
 `),L("&:last-child:not(:first-child)",`
 margin-top: ${h};
 margin-left: ${h};
 margin-right: ${h};
 border-top-left-radius: ${h};
 border-top-right-radius: ${h};
 `),L("&:not(:first-child):not(:last-child)",`
 margin: ${h};
 border-radius: ${h};
 `),J("default"),H("ghost",[J("primary"),J("info"),J("success"),J("warning"),J("error")])])])]),rt={size:{type:String,default:void 0},vertical:Boolean},nt=ee({name:"ButtonGroup",props:rt,setup(d){const{mergedClsPrefixRef:n,mergedRtlRef:f}=ye(d);return Me("-button-group",ot,n),ze(Re,d),{rtlEnabled:Te("ButtonGroup",f,n),mergedClsPrefix:n}},render(){const{mergedClsPrefix:d}=this;return k("div",{class:[`${d}-button-group`,this.rtlEnabled&&`${d}-button-group--rtl`,this.vertical&&`${d}-button-group--vertical`],role:"group"},this.$slots)}}),lt=L([_("calendar",`
 line-height: var(--n-line-height);
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 height: 720px;
 display: flex;
 flex-direction: column;
 `,[_("calendar-prev-btn",`
 cursor: pointer;
 `),_("calendar-next-btn",`
 cursor: pointer;
 `),_("calendar-header",`
 display: flex;
 align-items: center;
 line-height: 1;
 font-size: var(--n-title-font-size);
 padding: 0 0 18px 0;
 justify-content: space-between;
 `,[N("title",`
 color: var(--n-title-text-color);
 font-weight: var(--n-title-font-weight);
 transition: color .3s var(--n-bezier);
 `),N("extra",`
 display: flex;
 align-items: center;
 `)]),_("calendar-dates",`
 display: grid;
 grid-template-columns: repeat(7, minmax(0, 1fr));
 grid-auto-rows: 1fr;
 border-radius: var(--n-border-radius);
 flex: 1;
 border-top: 1px solid;
 border-left: 1px solid;
 border-color: var(--n-border-color);
 transition: border-color .3s var(--n-bezier);
 `),_("calendar-cell",`
 box-sizing: border-box;
 padding: 10px;
 border-right: 1px solid;
 border-bottom: 1px solid;
 border-color: var(--n-border-color);
 cursor: pointer;
 position: relative;
 transition:
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `,[L("&:nth-child(7)",`
 border-top-right-radius: var(--n-border-radius);
 `),L("&:nth-last-child(7)",`
 border-bottom-left-radius: var(--n-border-radius);
 `),L("&:last-child",`
 border-bottom-right-radius: var(--n-border-radius);
 `),L("&:hover",`
 background-color: var(--n-cell-color-hover);
 `),N("bar",`
 position: absolute;
 left: 0;
 right: 0;
 bottom: -1px;
 height: 3px;
 background-color: #0000;
 transition: background-color .3s var(--n-bezier);
 `),H("selected",[N("bar",`
 background-color: var(--n-bar-color);
 `)]),_("calendar-date",`
 transition:
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 color: var(--n-text-color);
 `,[N("date",`
 color: var(--n-text-color);
 `)]),H("disabled, other-month",`
 color: var(--n-day-text-color);
 `,[_("calendar-date",[N("date",`
 color: var(--n-day-text-color);
 `)])]),H("disabled",`
 cursor: not-allowed;
 `),H("current",[_("calendar-date",[N("date",`
 color: var(--n-date-text-color-current);
 background-color: var(--n-date-color-current);
 `)])]),_("calendar-date",`
 position: relative;
 line-height: 1;
 display: flex;
 align-items: center;
 height: 1em;
 justify-content: space-between;
 padding-bottom: .75em;
 `,[N("date",`
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 margin-left: -0.4em;
 width: 1.8em;
 height: 1.8em;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `),N("day",`
 color: var(--n-day-text-color);
 transition: color .3s var(--n-bezier);
 `)])])]),De(_("calendar",[_("calendar-dates",`
 border-color: var(--n-border-color-modal);
 `),_("calendar-cell",`
 border-color: var(--n-border-color-modal);
 `,[L("&:hover",`
 background-color: var(--n-cell-color-hover-modal);
 `)])])),Pe(_("calendar",[_("calendar-dates",`
 border-color: var(--n-border-color-popover);
 `),_("calendar-cell",`
 border-color: var(--n-border-color-popover);
 `,[L("&:hover",`
 background-color: var(--n-cell-color-hover-popover);
 `)])]))]),st=Object.assign(Object.assign({},xe.props),{isDateDisabled:Function,value:Number,defaultValue:{type:Number,default:null},onPanelChange:Function,"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array]}),dt=ee({name:"Calendar",props:st,slots:Object,setup(d){var n;const{mergedClsPrefixRef:f,inlineThemeDisabled:u}=ye(d),I=xe("Calendar","-calendar",lt,Be,d,f),{localeRef:w,dateLocaleRef:U}=Ne("DatePicker"),R=Date.now(),$=V(de((n=d.defaultValue)!==null&&n!==void 0?n:R).valueOf()),o=V(d.defaultValue||null),x=Oe(Ie(d,"value"),o);function E(m,v){const{onUpdateValue:s,"onUpdate:value":r}=d;s&&fe(s,m,v),r&&fe(r,m,v),o.value=m}function D(){var m;const v=he($.value,-1).valueOf();$.value=v,(m=d.onPanelChange)===null||m===void 0||m.call(d,{year:K(v),month:X(v)+1})}function A(){var m;const v=he($.value,1).valueOf();$.value=v,(m=d.onPanelChange)===null||m===void 0||m.call(d,{year:K(v),month:X(v)+1})}function W(){var m;const{value:v}=$,s=K(v),r=X(v),c=de(R).valueOf();$.value=c;const i=K(c),e=X(c);(s!==i||r!==e)&&((m=d.onPanelChange)===null||m===void 0||m.call(d,{year:i,month:e+1}))}const B=ie(()=>{const{common:{cubicBezierEaseInOut:m},self:{borderColor:v,borderColorModal:s,borderColorPopover:r,borderRadius:c,titleFontSize:i,textColor:e,titleFontWeight:t,titleTextColor:p,dayTextColor:C,fontSize:F,lineHeight:M,dateColorCurrent:q,dateTextColorCurrent:g,cellColorHover:l,cellColor:z,cellColorModal:G,barColor:te,cellColorPopover:ae,cellColorHoverModal:oe,cellColorHoverPopover:y}}=I.value;return{"--n-bezier":m,"--n-border-color":v,"--n-border-color-modal":s,"--n-border-color-popover":r,"--n-border-radius":c,"--n-text-color":e,"--n-title-font-weight":t,"--n-title-font-size":i,"--n-title-text-color":p,"--n-day-text-color":C,"--n-font-size":F,"--n-line-height":M,"--n-date-color-current":q,"--n-date-text-color-current":g,"--n-cell-color":z,"--n-cell-color-modal":G,"--n-cell-color-popover":ae,"--n-cell-color-hover":l,"--n-cell-color-hover-modal":oe,"--n-cell-color-hover-popover":y,"--n-bar-color":te}}),b=u?Ee("calendar",void 0,B,d):void 0;return{mergedClsPrefix:f,locale:w,dateLocale:U,now:R,mergedValue:x,monthTs:$,dateItems:ie(()=>tt($.value,x.value,R,w.value.firstDayOfWeek,!0)),doUpdateValue:E,handleTodayClick:W,handlePrevClick:D,handleNextClick:A,mergedTheme:I,cssVars:u?void 0:B,themeClass:b==null?void 0:b.themeClass,onRender:b==null?void 0:b.onRender}},render(){const{isDateDisabled:d,mergedClsPrefix:n,monthTs:f,cssVars:u,mergedValue:I,mergedTheme:w,$slots:U,locale:{monthBeforeYear:R,today:$},dateLocale:{locale:o},handleTodayClick:x,handlePrevClick:E,handleNextClick:D,onRender:A}=this;A==null||A();const W=I&&ge(I).valueOf(),B=K(f),b=X(f)+1;return k("div",{class:[`${n}-calendar`,this.themeClass],style:u},k("div",{class:`${n}-calendar-header`},k("div",{class:`${n}-calendar-header__title`},Le(U.header,{year:B,month:b},()=>{const m=se(f,"MMMM",{locale:o});return[R?`${m} ${B}`:`${B} ${m}`]})),k("div",{class:`${n}-calendar-header__extra`},k(nt,null,{default:()=>k(ue,null,k(ne,{size:"small",onClick:E,theme:w.peers.Button,themeOverrides:w.peerOverrides.Button},{icon:()=>k(ve,{clsPrefix:n,class:`${n}-calendar-prev-btn`},{default:()=>k(at,null)})}),k(ne,{size:"small",onClick:x,theme:w.peers.Button,themeOverrides:w.peerOverrides.Button},{default:()=>$}),k(ne,{size:"small",onClick:D,theme:w.peers.Button,themeOverrides:w.peerOverrides.Button},{icon:()=>k(ve,{clsPrefix:n,class:`${n}-calendar-next-btn`},{default:()=>k(Ve,null)})}))}))),k("div",{class:`${n}-calendar-dates`},this.dateItems.map(({dateObject:m,ts:v,inCurrentMonth:s,isCurrentDate:r},c)=>{var i;const{year:e,month:t,date:p}=m,C=se(v,"yyyy-MM-dd"),F=!s,M=(d==null?void 0:d(v))===!0,q=W===ge(v).valueOf();return k("div",{key:`${b}-${c}`,class:[`${n}-calendar-cell`,M&&`${n}-calendar-cell--disabled`,F&&`${n}-calendar-cell--other-month`,M&&`${n}-calendar-cell--not-allowed`,r&&`${n}-calendar-cell--current`,q&&`${n}-calendar-cell--selected`],onClick:()=>{var g;if(M)return;const l=de(v).valueOf();this.monthTs=l,F&&((g=this.onPanelChange)===null||g===void 0||g.call(this,{year:K(l),month:X(l)+1})),this.doUpdateValue(v,{year:e,month:t+1,date:p})}},k("div",{class:`${n}-calendar-date`},k("div",{class:`${n}-calendar-date__date`,title:C},p),c<7&&k("div",{class:`${n}-calendar-date__day`,title:C},se(v,"EEE",{locale:o}))),(i=U.default)===null||i===void 0?void 0:i.call(U,{year:e,month:t+1,date:p}),k("div",{class:`${n}-calendar-cell__bar`}))})))}}),it={class:"map-wrapper",style:{height:"100%",position:"relative"}},ct=ee({__name:"map",props:{trackData:{},username:{}},setup(d){const n=V(null);let f=null;const u=d,w=V([{id:25,pid:10,longitude:120.367925,latitude:30.300161,address:"浙江省杭州市钱塘区白杨街道留学生创业",dbtime:"2025-10-28 22:38:57",username:"auditor",daytime:"2025-10-28"},{id:25,pid:10,ctype:2,longitude:120.373554,latitude:30.288942,address:"三花-道路停车位",dbtime:"2025-10-28 22:38:57",username:"auditor",daytime:"2025-10-28"},{id:26,pid:10,longitude:120.358237,latitude:30.278233,duration:0,ctype:2,address:"浙江省杭州市钱塘区菜鸟网络",dbtime:"2025-10-30 22:39:12",username:"auditor",daytime:"2025-10-30"},{id:26,pid:10,longitude:120.362971,latitude:30.285184,duration:0,ctype:2,address:"浙江省杭州市钱塘区菜鸟网络",dbtime:"2025-10-30 22:39:12",username:"auditor",daytime:"2025-10-30"},{id:26,pid:10,longitude:120.361513,latitude:30.309509,duration:0,address:"浙江省杭州市钱塘区菜鸟网络asdasda",dbtime:"2025-10-30 22:39:12",username:"auditor",daytime:"2025-10-30"}]),U=["#FFA726","#6BCF7F"],R=ie(()=>{if(w.value.length===0)return[120.370086,30.305716];const s=w.value.map(e=>e.longitude),r=w.value.map(e=>e.latitude),c=(Math.min(...s)+Math.max(...s))/2,i=(Math.min(...r)+Math.max(...r))/2;return console.log(c,i),[c,i]});async function $(){const s="/map-sdk.json",{data:r}=await Se.get(`${s}?_t=${Date.now()}`);return r}function o(s){return new Promise((r,c)=>{if(window.AMap)return r(window.AMap);const i=document.createElement("script");i.src=`https://webapi.amap.com/maps?v=2.0&key=${s}&plugin=AMap.PolylineEditor`,i.defer=!0,i.onload=()=>window.AMap?r(window.AMap):c(new Error("AMap加载失败")),i.onerror=()=>c(new Error("AMap脚本加载错误")),document.head.appendChild(i)})}const x=V({});function E(s,r,c,i,e){const t=document.createElement("div");return t.className="custom-marker",t.style.transform="translateX(-50%)",t.innerHTML=`
    <div class="avatar-wrapper" style="border-color: ${i}; box-shadow: 0 0 10px ${i}, 0 0 20px ${i};">
      <img src="${e||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
    </div>
    <div class="marker-name" style="color: ${i};">${c}</div>
  `,new s.Marker({position:[r.lng,r.lat],content:t})}function D(s,r,c,i,e){const t=document.createElement("div");return t.className="custom-marker",t.style.transform="translateX(-50%)",t.innerHTML=`
    <div class="marker-dot"></div>
  `,new s.Marker({position:[r.lng,r.lat],content:t})}function A(){n.value&&n.value.clearMap(),x.value={}}function W(s){A();const r=w.value.map(e=>({lng:e.longitude,lat:e.latitude,address:e.address,dbtime:e.dbtime,proname:e.proname||"未指定项目",duration:e.duration||0,userimage:e.userimage,longitude:e.longitude,latitude:e.latitude,ctype:e.ctype||1})),c=U[0],i=[];if(r.length>1){const e=new s.Polyline({path:r.map(t=>[t.lng,t.lat]),strokeColor:c,strokeWeight:3,strokeOpacity:.7,strokeStyle:"solid",lineJoin:"round",lineCap:"round",isOutline:!0,outlineColor:"#FFFFFF",borderWeight:2});e.setMap(n.value),i.push(e)}r.forEach(e=>{let t;e.ctype!=2?t=E(s,e,u.username,c,r[0].userimage):t=D(s,e,u.username,c,r[0].userimage),t.setMap(n.value),i.push(t),t.on("click",()=>{const p=`
        <div style="min-width:220px; background:#fff; padding:12px 14px; font-size:13px;">
          <div style="font-weight:bold; color:${c}; font-size:15px; margin-bottom:6px;">
            ${u.username}
          </div>
          <div><b>地点：</b>${e.address}</div>
          <div><b>时间：</b>${e.dbtime}</div>
          <div><b>项目：</b>${e.proname}</div>
          <div><b>类型：</b>${e.ctype==0?"上班打卡":e.ctype==1?"下班打卡":"系统上报"}</div>
          <div><b>经纬度：</b>${e.longitude}, ${e.latitude}</div>
          ${e.duration?`<div><b>工时：</b>${e.duration} 小时</div>`:""}
        </div>
      `;f.setContent(p),f.open(n.value,t.getPosition())})});for(let e=1;e<r.length;e++){const t=r[e-1],p=r[e];if(m(t,p))continue;const C={lng:(t.lng+p.lng)/2,lat:(t.lat+p.lat)/2},F=B(t,p),M=b(s,C,F,c);M.setMap(n.value),i.push(M)}n.value.setFitView(i,!1,[60,60,60,60]),x.value.single=i}function B(s,r){const c=r.lng-s.lng,i=r.lat-s.lat;return(Math.atan2(-i,c)*180/Math.PI-90+360)%360-175}function b(s,r,c,i){const e=document.createElement("div");return e.style.cssText=`
    width: 12px;
    height: 18px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 18px solid ${i};
    transform: translate(-50%, -50%) rotate(${c}deg);
    transform-origin: center center;
  `,new s.Marker({position:[r.lng,r.lat],content:e,offset:new s.Pixel(0,0)})}function m(s,r,c=1e-7){return Math.abs(s.lng-r.lng)<c&&Math.abs(s.lat-r.lat)<c}async function v(){try{const s=await $(),r=await o(s.AMAP_SDK_KEY);n.value=new r.Map("amap-container",{viewMode:"2D",zoom:15,center:R.value,features:["bg","point"]}),f=new r.InfoWindow({anchor:"bottom-center",closeWhenClickMap:!0}),W(r)}catch(s){console.error("地图初始化失败:",s)}}return _e(()=>{w.value=u.trackData??[],v()}),Fe(()=>{n.value&&n.value.destroy()}),(s,r)=>(S(),Y("div",it,r[0]||(r[0]=[a("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)])))}}),ut=pe(ct,[["__scopeId","data-v-d4ea365e"]]),pt={class:"p-1 border-b border-gray-100 last:border-b-0 font-size-16px"},mt={class:"flex mb-3 items-center"},vt={class:"flex-col justify-center items-center mr-20px"},ft=["src"],bt={class:"font-bold mt-10px text-[#000]"},gt={class:"flex mb-1"},ht={class:"c-#4169e1 font-bold"},yt={class:"flex mb-1"},xt={class:"mr-20px"},_t={class:"c-#4169e1 font-bold"},$t={class:"c-#4169e1 font-bold"},kt={class:"flex mb-1"},wt={class:"c-#4169e1 font-bold"},Ct={class:"flex mb-1"},Mt={class:"c-#4169e1 font-bold"},Tt={class:"mx-20px flex items-center"},zt={class:"flex items-center"},Rt={class:"flex mb-1"},Dt={key:0},Pt={class:""},Lt={class:""},Vt={class:""},Bt=ee({__name:"calendarModal",props:je({lookdetail:{},creater:{}},{dialogVisible:{type:Boolean,default:!1},dialogVisibleModifiers:{}}),emits:["update:dialogVisible"],setup(d){const n=Ue(d,"dialogVisible"),f=d,u=V({pid:0,address:"",startTime:void 0,endTime:void 0,duration:0,status:0,dailyReport:0,username:"",daytime:"",projectName:"",userImage:"",ctype:0}),I=V([]),w=async()=>{const{data:$,error:o}=await We({startTime:f.lookdetail.startTime||f.lookdetail.daytime+" 00:00:00",endTime:f.lookdetail.endTime||f.lookdetail.daytime+" 23:59:59",pid:f.lookdetail.pid,creater:f.creater});$&&(I.value=$)};$e(()=>n.value,async $=>{$&&(Object.assign(u.value,f.lookdetail),R.value="table",w())});const U=()=>{n.value=!1,setTimeout(()=>{u.value={pid:0,address:"",startTime:void 0,endTime:void 0,duration:0,status:0,dailyReport:0,username:"",daytime:"",projectName:"",userImage:"",ctype:0}},200)},R=V("table");return($,o)=>{const x=ce,E=ce,D=et,A=Ae,W=ke,B=He;return S(),re(B,{show:n.value,"onUpdate:show":o[1]||(o[1]=b=>n.value=b),class:"w-1000px",preset:"card",onClose:U,"modal-animation-name":"el-fade"},{header:O(()=>o[2]||(o[2]=[P(" 详情 ")])),default:O(()=>[a("div",pt,[a("div",mt,[a("div",vt,[a("img",{class:"w-60px h-60px rounded-full shadow-sm",src:u.value.userImage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"},null,8,ft),a("div",bt,T(u.value.username),1)]),a("div",null,[a("div",gt,[o[3]||(o[3]=a("span",{class:"mr-2"}," 🏗️ 项目名称： ",-1)),a("span",ht,T(u.value.projectName||"暂无项目"),1)]),a("div",yt,[a("div",xt,[o[4]||(o[4]=a("span",null,"📅 上班打卡时间：",-1)),a("span",_t,T(u.value.startTime||"无"),1)]),a("div",null,[o[5]||(o[5]=a("span",null,"📅 下班打卡时间：",-1)),a("span",$t,T(u.value.endTime||"无"),1)])]),a("div",kt,[o[6]||(o[6]=a("span",{style:{"white-space":"nowrap"}},"📍 地址：",-1)),a("span",wt,T(u.value.address),1)]),a("div",Ct,[a("div",null,[o[7]||(o[7]=a("span",null,"🕓 工时：",-1)),a("span",Mt,T(u.value.duration||0)+"小时",1)]),a("div",Tt,[o[10]||(o[10]=a("span",null,"🔔 打卡状态：",-1)),a("span",null,[u.value.status==1?(S(),re(x,{key:0,type:"error",size:"small"},{default:O(()=>o[8]||(o[8]=[a("span",{class:"mr-1"},null,-1),P("异常 ")])),_:1,__:[8]})):Q("",!0),u.value.status==0?(S(),re(x,{key:1,type:"success",size:"small"},{default:O(()=>o[9]||(o[9]=[a("span",{class:"mr-1"},null,-1),P("正常 ")])),_:1,__:[9]})):Q("",!0)])]),a("div",zt,[o[11]||(o[11]=a("span",null,"📝 日报：",-1)),a("span",null,[j(E,{size:"small",type:u.value.dailyReport==1?"success":"error"},{default:O(()=>[P(T(u.value.dailyReport==1?"已提交":"未提交"),1)]),_:1},8,["type"])])])])])]),a("div",Rt,[o[12]||(o[12]=a("div",{class:"mr-15px"},"历史轨迹",-1)),j(A,{size:"small",value:R.value,"onUpdate:value":o[0]||(o[0]=b=>R.value=b),name:"radiobuttongroup1"},{default:O(()=>[j(D,{value:"table",label:"表格"}),j(D,{value:"map",label:"地图"})]),_:1},8,["value"])]),R.value=="table"?(S(),Y("div",Dt,[j(W,{style:{height:"600px"},trigger:"hover"},{default:O(()=>[(S(!0),Y(ue,null,we(I.value,b=>(S(),Y("div",{class:"tableItem",key:b.id},[a("div",null,[o[13]||(o[13]=P("打卡类型：")),a("span",Pt,T(b.ctype==0?"上班打卡":b.ctype==1?"下班打卡":"系统上报"),1)]),a("div",null,[o[14]||(o[14]=P("地址： ")),a("span",Lt,T(b.address),1)]),a("div",null,[o[15]||(o[15]=P("打卡时间：")),a("span",Vt,T(b.dbtime),1)])]))),128))]),_:1})])):Q("",!0),R.value=="map"?(S(),re(ut,{key:1,trackData:I.value,username:f.lookdetail.username,class:"map"},null,8,["trackData","username"])):Q("",!0)])]),_:1},8,["show"])}}}),Nt=pe(Bt,[["__scopeId","data-v-c67c3449"]]),Ot={class:"calendarBox"},It={class:"top"},Et={key:0,class:"isreport"},Ft=["onClick"],St=ee({name:"reportmanagement_calendar",__name:"index",setup(d){const n=V(new Date().getTime()),f=V([]),{pageData:u,getData:I,nextPage:w}=Qe(Je),U=async e=>{const t=e.currentTarget,p=t.scrollTop;t.scrollTop+t.offsetHeight>=t.scrollHeight&&u.data.length<u.total&&(await w(),await be(),setTimeout(()=>{t.scrollTop=p}))},R=async()=>{var e;await I({usertypes:"2,3"}),x.value.creater=(e=u.data[0])==null?void 0:e.id,console.log(x.value.creater)},$=async e=>{x.value.creater=e,E()},o=e=>e<10?`0${e}`:`${e}`,x=V({creater:void 0,startTime:"",endTime:""}),E=async()=>{const{start:e,end:t}=Xe(n.value);x.value.startTime=e,x.value.endTime=t;const{data:p,error:C}=await Ze(x.value);p&&(f.value=W(p),console.log(f.value,"dataList.value"))},D=e=>{var p,C,F;return((F=f.value[(C=(p=u.data)==null?void 0:p.find(M=>M.id==x.value.creater))==null?void 0:C.username])==null?void 0:F.filter(M=>M.daytime==e))||[]},A=()=>{E()},W=e=>{const t={};for(const p in e){const C=new Map;e[p].forEach(g=>{const l=`${g.pid}_${g.ctype}_${g.dbtime}_${g.daytime}_${g.address}`;C.has(l)||C.set(l,g)});const M=Array.from(C.values()).sort((g,l)=>g.daytime===l.daytime?g.dbtime.localeCompare(l.dbtime):g.daytime.localeCompare(l.daytime)),q=[];for(let g=0;g<M.length;g++){const l=M[g],z=M[g+1];l.ctype===0&&z&&z.ctype===1&&l.daytime===z.daytime?(q.push({address:l.address,startTime:l.dbtime,endTime:z.dbtime,status:z.status,duration:z.duration||0,dailyReport:z.dailyReport,username:l.username,daytime:l.daytime,projectName:l.proname,userImage:l.userimage,ctype:z.ctype,pid:l.pid}),g++):q.push({address:l.address,startTime:l.ctype===0?l.dbtime:"",endTime:l.ctype===1?l.dbtime:"",duration:l.duration||0,status:l.status,dailyReport:l.dailyReport,username:l.username,daytime:l.daytime,projectName:l.proname,userImage:l.userimage,ctype:l.ctype,pid:l.pid})}t[p]=q}return t},B=V(null),b=V(null),m=e=>{if(!b.value)return;const t=e.target;b.value.scrollLeft=t.scrollLeft};_e(async()=>{var e;await R(),await E(),await be(),B.value=document.querySelector(".n-calendar"),b.value=document.querySelector(".weeks-wrapper"),(e=B.value)==null||e.addEventListener("scroll",m)}),qe(()=>{var e;(e=B.value)==null||e.removeEventListener("scroll",m)}),$e(()=>n.value,e=>{E()});function v(e,t){const p=new Date(e),C=new Date(t);return p.getFullYear()===C.getFullYear()&&p.getMonth()===C.getMonth()}function s(e){return!v(e,n.value)}const r=V(!1),c=V(),i=async e=>{c.value=e,r.value=!0};return(e,t)=>{const p=Ge,C=Ke,F=ne,M=ce,q=ke,g=dt;return S(),Y("div",Ot,[a("div",It,[t[5]||(t[5]=a("h3",{class:"mr-20px font-size-18px font-bold"},"调试人员月度考勤",-1)),t[6]||(t[6]=a("div",{class:"w-270px"},null,-1)),j(C,{label:"",class:"pr-24px","label-placement":"left","show-feedback":!1},{label:O(()=>t[3]||(t[3]=[a("div",{class:"flex items-center"},[a("span",{class:"font-size-14px font-bold"},"调试人员")],-1)])),default:O(()=>[j(p,{size:"small",filterable:"",value:x.value.creater,"onUpdate:value":[t[0]||(t[0]=l=>x.value.creater=l),$],placeholder:"请选择","label-field":"username","value-field":"id",options:Ye(u).data,onScroll:U,style:{width:"180px"}},null,8,["value","options"])]),_:1}),j(F,{size:"small",type:"info",ghost:"",onClick:A},{default:O(()=>t[4]||(t[4]=[P(T("查询"))])),_:1,__:[4]})]),t[13]||(t[13]=a("div",{class:"weeks-wrapper"},[a("div",{class:"weeks"},[a("div",null,"周一"),a("div",null,"周二"),a("div",null,"周三"),a("div",null,"周四"),a("div",null,"周五"),a("div",null,"周六"),a("div",null,"周日")])],-1)),j(g,{value:n.value,"onUpdate:value":t[1]||(t[1]=l=>n.value=l),"is-date-disabled":s},{default:O(({year:l,month:z,date:G})=>{var te,ae,oe;return[((te=D(`${l}-${o(z)}-${o(G)}`))==null?void 0:te.length)>0?(S(),Y("div",Et,[j(M,{size:"small",type:((oe=D(`${l}-${o(z)}-${o(G)}`)[((ae=D(`${l}-${o(z)}-${o(G)}`))==null?void 0:ae.length)-1])==null?void 0:oe.dailyReport)==1?"success":"error"},{default:O(()=>{var y,le;return[P(T(((le=D(`${l}-${o(z)}-${o(G)}`)[((y=D(`${l}-${o(z)}-${o(G)}`))==null?void 0:y.length)-1])==null?void 0:le.dailyReport)==1?"日报已提交":"日报未提交"),1)]}),_:2},1032,["type"])])):Q("",!0),j(q,{style:{"max-height":"200px"},trigger:"none"},{default:O(()=>[(S(!0),Y(ue,null,we(D(`${l}-${o(z)}-${o(G)}`),y=>(S(),Y("div",{class:"prjItem",onClick:le=>i(y),key:y.id},[a("div",null,[t[7]||(t[7]=P("调试人：")),a("span",null,T(y==null?void 0:y.username),1)]),a("div",null,[t[8]||(t[8]=P("项目名称： ")),a("span",null,T((y==null?void 0:y.projectName)||"暂无项目"),1)]),a("div",null,[t[9]||(t[9]=P("上班打卡时间：")),a("span",null,T(y.startTime?y.startTime:"无"),1)]),a("div",null,[t[10]||(t[10]=P("下班打卡时间：")),a("span",null,T(y.endTime||"无"),1)]),a("div",null,[t[11]||(t[11]=P("工时：")),a("span",null,T((y==null?void 0:y.duration)||0)+"小时",1)]),a("div",null,[t[12]||(t[12]=P("地址：")),a("span",null,T(y==null?void 0:y.address),1)])],8,Ft))),128))]),_:2},1024)]}),_:1},8,["value"]),j(Nt,{"dialog-visible":r.value,"onUpdate:dialogVisible":t[2]||(t[2]=l=>r.value=l),lookdetail:c.value,creater:x.value.creater},null,8,["dialog-visible","lookdetail","creater"])])}}}),qt=pe(St,[["__scopeId","data-v-30d95f9a"]]);export{qt as default};
