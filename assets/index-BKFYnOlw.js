import{Z as x,a4 as me,a0 as H,a1 as V,a2 as O,d as ee,a5 as $,a8 as ye,dL as Me,a9 as Te,ad as ze,eh as De,e7 as Re,e8 as Pe,d5 as Le,aR as ue,B as ne,ah as ve,d8 as Ve,aa as xe,ei as Be,bv as Ne,r as B,bx as Oe,bw as Ie,a as ie,al as Ee,am as fe,i as _e,dF as Fe,b as q,o as S,e as t,aI as Se,aL as pe,at as je,av as Ue,aw as $e,c as oe,w as I,z as Q,t as T,aF as ce,g as L,f as j,aC as Ae,ax as ke,aV as we,aE as He,ej as We,aZ as Ge,aH as be,a_ as Ye,az as qe,h as Ke,A as Xe,ek as Ze,el as Je,cl as Qe}from"./index-BHFXhhrx.js";import{u as et}from"./usePageData-CiDKwIfi.js";import{N as tt}from"./RadioButton-euKXrJ-r.js";import{s as ge,g as K,a as X,f as se,b as de,d as at,c as he}from"./utils-Ck3BJELy.js";import{C as rt}from"./ChevronLeft-ILwkinLA.js";const g="0!important",Ce="-1px!important";function Z(d){return H(`${d}-type`,[V("& +",[x("button",{},[H(`${d}-type`,[O("border",{borderLeftWidth:g}),O("state-border",{left:Ce})])])])])}function J(d){return H(`${d}-type`,[V("& +",[x("button",[H(`${d}-type`,[O("border",{borderTopWidth:g}),O("state-border",{top:Ce})])])])])}const ot=x("button-group",`
 flex-wrap: nowrap;
 display: inline-flex;
 position: relative;
`,[me("vertical",{flexDirection:"row"},[me("rtl",[x("button",[V("&:first-child:not(:last-child)",`
 margin-right: ${g};
 border-top-right-radius: ${g};
 border-bottom-right-radius: ${g};
 `),V("&:last-child:not(:first-child)",`
 margin-left: ${g};
 border-top-left-radius: ${g};
 border-bottom-left-radius: ${g};
 `),V("&:not(:first-child):not(:last-child)",`
 margin-left: ${g};
 margin-right: ${g};
 border-radius: ${g};
 `),Z("default"),H("ghost",[Z("primary"),Z("info"),Z("success"),Z("warning"),Z("error")])])])]),H("vertical",{flexDirection:"column"},[x("button",[V("&:first-child:not(:last-child)",`
 margin-bottom: ${g};
 margin-left: ${g};
 margin-right: ${g};
 border-bottom-left-radius: ${g};
 border-bottom-right-radius: ${g};
 `),V("&:last-child:not(:first-child)",`
 margin-top: ${g};
 margin-left: ${g};
 margin-right: ${g};
 border-top-left-radius: ${g};
 border-top-right-radius: ${g};
 `),V("&:not(:first-child):not(:last-child)",`
 margin: ${g};
 border-radius: ${g};
 `),J("default"),H("ghost",[J("primary"),J("info"),J("success"),J("warning"),J("error")])])])]),nt={size:{type:String,default:void 0},vertical:Boolean},lt=ee({name:"ButtonGroup",props:nt,setup(d){const{mergedClsPrefixRef:l,mergedRtlRef:f}=ye(d);return Me("-button-group",ot,l),ze(De,d),{rtlEnabled:Te("ButtonGroup",f,l),mergedClsPrefix:l}},render(){const{mergedClsPrefix:d}=this;return $("div",{class:[`${d}-button-group`,this.rtlEnabled&&`${d}-button-group--rtl`,this.vertical&&`${d}-button-group--vertical`],role:"group"},this.$slots)}}),st=V([x("calendar",`
 line-height: var(--n-line-height);
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 height: 720px;
 display: flex;
 flex-direction: column;
 `,[x("calendar-prev-btn",`
 cursor: pointer;
 `),x("calendar-next-btn",`
 cursor: pointer;
 `),x("calendar-header",`
 display: flex;
 align-items: center;
 line-height: 1;
 font-size: var(--n-title-font-size);
 padding: 0 0 18px 0;
 justify-content: space-between;
 `,[O("title",`
 color: var(--n-title-text-color);
 font-weight: var(--n-title-font-weight);
 transition: color .3s var(--n-bezier);
 `),O("extra",`
 display: flex;
 align-items: center;
 `)]),x("calendar-dates",`
 display: grid;
 grid-template-columns: repeat(7, minmax(0, 1fr));
 grid-auto-rows: 1fr;
 border-radius: var(--n-border-radius);
 flex: 1;
 border-top: 1px solid;
 border-left: 1px solid;
 border-color: var(--n-border-color);
 transition: border-color .3s var(--n-bezier);
 `),x("calendar-cell",`
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
 `,[V("&:nth-child(7)",`
 border-top-right-radius: var(--n-border-radius);
 `),V("&:nth-last-child(7)",`
 border-bottom-left-radius: var(--n-border-radius);
 `),V("&:last-child",`
 border-bottom-right-radius: var(--n-border-radius);
 `),V("&:hover",`
 background-color: var(--n-cell-color-hover);
 `),O("bar",`
 position: absolute;
 left: 0;
 right: 0;
 bottom: -1px;
 height: 3px;
 background-color: #0000;
 transition: background-color .3s var(--n-bezier);
 `),H("selected",[O("bar",`
 background-color: var(--n-bar-color);
 `)]),x("calendar-date",`
 transition:
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 color: var(--n-text-color);
 `,[O("date",`
 color: var(--n-text-color);
 `)]),H("disabled, other-month",`
 color: var(--n-day-text-color);
 `,[x("calendar-date",[O("date",`
 color: var(--n-day-text-color);
 `)])]),H("disabled",`
 cursor: not-allowed;
 `),H("current",[x("calendar-date",[O("date",`
 color: var(--n-date-text-color-current);
 background-color: var(--n-date-color-current);
 `)])]),x("calendar-date",`
 position: relative;
 line-height: 1;
 display: flex;
 align-items: center;
 height: 1em;
 justify-content: space-between;
 padding-bottom: .75em;
 `,[O("date",`
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
 `),O("day",`
 color: var(--n-day-text-color);
 transition: color .3s var(--n-bezier);
 `)])])]),Re(x("calendar",[x("calendar-dates",`
 border-color: var(--n-border-color-modal);
 `),x("calendar-cell",`
 border-color: var(--n-border-color-modal);
 `,[V("&:hover",`
 background-color: var(--n-cell-color-hover-modal);
 `)])])),Pe(x("calendar",[x("calendar-dates",`
 border-color: var(--n-border-color-popover);
 `),x("calendar-cell",`
 border-color: var(--n-border-color-popover);
 `,[V("&:hover",`
 background-color: var(--n-cell-color-hover-popover);
 `)])]))]),dt=Object.assign(Object.assign({},xe.props),{isDateDisabled:Function,value:Number,defaultValue:{type:Number,default:null},onPanelChange:Function,"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array]}),it=ee({name:"Calendar",props:dt,slots:Object,setup(d){var l;const{mergedClsPrefixRef:f,inlineThemeDisabled:u}=ye(d),E=xe("Calendar","-calendar",st,Be,d,f),{localeRef:k,dateLocaleRef:U}=Ne("DatePicker"),D=Date.now(),_=B(de((l=d.defaultValue)!==null&&l!==void 0?l:D).valueOf()),r=B(d.defaultValue||null),y=Oe(Ie(d,"value"),r);function F(m,n){const{onUpdateValue:s,"onUpdate:value":c}=d;s&&fe(s,m,n),c&&fe(c,m,n),r.value=m}function R(){var m;const n=he(_.value,-1).valueOf();_.value=n,(m=d.onPanelChange)===null||m===void 0||m.call(d,{year:K(n),month:X(n)+1})}function A(){var m;const n=he(_.value,1).valueOf();_.value=n,(m=d.onPanelChange)===null||m===void 0||m.call(d,{year:K(n),month:X(n)+1})}function W(){var m;const{value:n}=_,s=K(n),c=X(n),i=de(D).valueOf();_.value=i;const o=K(i),e=X(i);(s!==o||c!==e)&&((m=d.onPanelChange)===null||m===void 0||m.call(d,{year:o,month:e+1}))}const N=ie(()=>{const{common:{cubicBezierEaseInOut:m},self:{borderColor:n,borderColorModal:s,borderColorPopover:c,borderRadius:i,titleFontSize:o,textColor:e,titleFontWeight:a,titleTextColor:b,dayTextColor:w,fontSize:z,lineHeight:C,dateColorCurrent:p,dateTextColorCurrent:P,cellColorHover:M,cellColor:G,cellColorModal:Y,barColor:te,cellColorPopover:ae,cellColorHoverModal:re,cellColorHoverPopover:h}}=E.value;return{"--n-bezier":m,"--n-border-color":n,"--n-border-color-modal":s,"--n-border-color-popover":c,"--n-border-radius":i,"--n-text-color":e,"--n-title-font-weight":a,"--n-title-font-size":o,"--n-title-text-color":b,"--n-day-text-color":w,"--n-font-size":z,"--n-line-height":C,"--n-date-color-current":p,"--n-date-text-color-current":P,"--n-cell-color":G,"--n-cell-color-modal":Y,"--n-cell-color-popover":ae,"--n-cell-color-hover":M,"--n-cell-color-hover-modal":re,"--n-cell-color-hover-popover":h,"--n-bar-color":te}}),v=u?Ee("calendar",void 0,N,d):void 0;return{mergedClsPrefix:f,locale:k,dateLocale:U,now:D,mergedValue:y,monthTs:_,dateItems:ie(()=>at(_.value,y.value,D,k.value.firstDayOfWeek,!0)),doUpdateValue:F,handleTodayClick:W,handlePrevClick:R,handleNextClick:A,mergedTheme:E,cssVars:u?void 0:N,themeClass:v==null?void 0:v.themeClass,onRender:v==null?void 0:v.onRender}},render(){const{isDateDisabled:d,mergedClsPrefix:l,monthTs:f,cssVars:u,mergedValue:E,mergedTheme:k,$slots:U,locale:{monthBeforeYear:D,today:_},dateLocale:{locale:r},handleTodayClick:y,handlePrevClick:F,handleNextClick:R,onRender:A}=this;A==null||A();const W=E&&ge(E).valueOf(),N=K(f),v=X(f)+1;return $("div",{class:[`${l}-calendar`,this.themeClass],style:u},$("div",{class:`${l}-calendar-header`},$("div",{class:`${l}-calendar-header__title`},Le(U.header,{year:N,month:v},()=>{const m=se(f,"MMMM",{locale:r});return[D?`${m} ${N}`:`${N} ${m}`]})),$("div",{class:`${l}-calendar-header__extra`},$(lt,null,{default:()=>$(ue,null,$(ne,{size:"small",onClick:F,theme:k.peers.Button,themeOverrides:k.peerOverrides.Button},{icon:()=>$(ve,{clsPrefix:l,class:`${l}-calendar-prev-btn`},{default:()=>$(rt,null)})}),$(ne,{size:"small",onClick:y,theme:k.peers.Button,themeOverrides:k.peerOverrides.Button},{default:()=>_}),$(ne,{size:"small",onClick:R,theme:k.peers.Button,themeOverrides:k.peerOverrides.Button},{icon:()=>$(ve,{clsPrefix:l,class:`${l}-calendar-next-btn`},{default:()=>$(Ve,null)})}))}))),$("div",{class:`${l}-calendar-dates`},this.dateItems.map(({dateObject:m,ts:n,inCurrentMonth:s,isCurrentDate:c},i)=>{var o;const{year:e,month:a,date:b}=m,w=se(n,"yyyy-MM-dd"),z=!s,C=(d==null?void 0:d(n))===!0,p=W===ge(n).valueOf();return $("div",{key:`${v}-${i}`,class:[`${l}-calendar-cell`,C&&`${l}-calendar-cell--disabled`,z&&`${l}-calendar-cell--other-month`,C&&`${l}-calendar-cell--not-allowed`,c&&`${l}-calendar-cell--current`,p&&`${l}-calendar-cell--selected`],onClick:()=>{var P;if(C)return;const M=de(n).valueOf();this.monthTs=M,z&&((P=this.onPanelChange)===null||P===void 0||P.call(this,{year:K(M),month:X(M)+1})),this.doUpdateValue(n,{year:e,month:a+1,date:b})}},$("div",{class:`${l}-calendar-date`},$("div",{class:`${l}-calendar-date__date`,title:w},b),i<7&&$("div",{class:`${l}-calendar-date__day`,title:w},se(n,"EEE",{locale:r}))),(o=U.default)===null||o===void 0?void 0:o.call(U,{year:e,month:a+1,date:b}),$("div",{class:`${l}-calendar-cell__bar`}))})))}}),ct={class:"map-wrapper",style:{height:"100%",position:"relative"}},ut=ee({__name:"map",props:{trackData:{},username:{}},setup(d){const l=B(null);let f=null;const u=d,k=B([{id:25,pid:10,longitude:120.367925,latitude:30.300161,address:"浙江省杭州市钱塘区白杨街道留学生创业",dbtime:"2025-10-28 22:38:57",username:"auditor",daytime:"2025-10-28"},{id:25,pid:10,ctype:2,longitude:120.373554,latitude:30.288942,address:"三花-道路停车位",dbtime:"2025-10-28 22:38:57",username:"auditor",daytime:"2025-10-28"},{id:26,pid:10,longitude:120.358237,latitude:30.278233,duration:0,ctype:2,address:"浙江省杭州市钱塘区菜鸟网络",dbtime:"2025-10-30 22:39:12",username:"auditor",daytime:"2025-10-30"},{id:26,pid:10,longitude:120.362971,latitude:30.285184,duration:0,ctype:2,address:"浙江省杭州市钱塘区菜鸟网络",dbtime:"2025-10-30 22:39:12",username:"auditor",daytime:"2025-10-30"},{id:26,pid:10,longitude:120.361513,latitude:30.309509,duration:0,address:"浙江省杭州市钱塘区菜鸟网络asdasda",dbtime:"2025-10-30 22:39:12",username:"auditor",daytime:"2025-10-30"}]),U=["#FFA726","#6BCF7F"],D=ie(()=>{if(k.value.length===0)return[120.370086,30.305716];const n=k.value.map(o=>o.longitude),s=k.value.map(o=>o.latitude),c=(Math.min(...n)+Math.max(...n))/2,i=(Math.min(...s)+Math.max(...s))/2;return console.log(c,i),[c,i]});async function _(){const n="/map-sdk.json",{data:s}=await Se.get(`${n}?_t=${Date.now()}`);return s}function r(n){return new Promise((s,c)=>{if(window.AMap)return s(window.AMap);const i=document.createElement("script");i.src=`https://webapi.amap.com/maps?v=2.0&key=${n}&plugin=AMap.PolylineEditor`,i.defer=!0,i.onload=()=>window.AMap?s(window.AMap):c(new Error("AMap加载失败")),i.onerror=()=>c(new Error("AMap脚本加载错误")),document.head.appendChild(i)})}const y=B({});function F(n,s,c,i,o){const e=document.createElement("div");return e.className="custom-marker",e.style.transform="translateX(-50%)",e.innerHTML=`
    <div class="avatar-wrapper" style="border-color: ${i}; box-shadow: 0 0 10px ${i}, 0 0 20px ${i};">
      <img src="${o||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
    </div>
    <div class="marker-name" style="color: ${i};">${c}</div>
  `,new n.Marker({position:[s.lng,s.lat],content:e})}function R(n,s,c,i,o){const e=document.createElement("div");return e.className="custom-marker",e.style.transform="translateX(-50%)",e.innerHTML=`
    <div class="marker-dot"></div>
  `,new n.Marker({position:[s.lng,s.lat],content:e})}function A(){l.value&&l.value.clearMap(),y.value={}}function W(n){A();const s=k.value.map(o=>({lng:o.longitude,lat:o.latitude,address:o.address,dbtime:o.dbtime,proname:o.proname||"未指定项目",duration:o.duration||0,userimage:o.userimage,longitude:o.longitude,latitude:o.latitude,ctype:o.ctype||1})),c=U[0],i=[];if(s.length>1){const o=new n.Polyline({path:s.map(e=>[e.lng,e.lat]),strokeColor:c,strokeWeight:3,strokeOpacity:.7,strokeStyle:"solid",lineJoin:"round",lineCap:"round",isOutline:!0,outlineColor:"#FFFFFF",borderWeight:2});o.setMap(l.value),i.push(o)}s.forEach(o=>{let e;o.ctype!=2?e=F(n,o,u.username,c,s[0].userimage):e=R(n,o,u.username,c,s[0].userimage),e.setMap(l.value),i.push(e),e.on("click",()=>{const a=`
        <div style="min-width:220px; background:#fff; padding:12px 14px; font-size:13px;">
          <div style="font-weight:bold; color:${c}; font-size:15px; margin-bottom:6px;">
            ${u.username}
          </div>
          <div><b>地点：</b>${o.address}</div>
          <div><b>时间：</b>${o.dbtime}</div>
          <div><b>项目：</b>${o.proname}</div>
          <div><b>类型：</b>${o.ctype==0?"上班打卡":o.ctype==1?"下班打卡":"系统上报"}</div>
          <div><b>经纬度：</b>${o.longitude}, ${o.latitude}</div>
          ${o.duration?`<div><b>工时：</b>${o.duration} 小时</div>`:""}
        </div>
      `;f.setContent(a),f.open(l.value,e.getPosition())})});for(let o=1;o<s.length;o++){const e=s[o-1],a=s[o],b={lng:(e.lng+a.lng)/2,lat:(e.lat+a.lat)/2},w=N(e,a),z=v(n,b,w,c);z.setMap(l.value),i.push(z)}l.value.setFitView(i,!1,[60,60,60,60]),y.value.single=i}function N(n,s){const c=s.lng-n.lng,i=s.lat-n.lat;return(Math.atan2(-i,c)*180/Math.PI-90+360)%360-175}function v(n,s,c,i){const o=document.createElement("div");return o.style.cssText=`
    width: 12px;
    height: 18px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 18px solid ${i};
    transform: translate(-50%, -50%) rotate(${c}deg);
    transform-origin: center center;
  `,new n.Marker({position:[s.lng,s.lat],content:o,offset:new n.Pixel(0,0)})}async function m(){try{const n=await _(),s=await r(n.AMAP_SDK_KEY);l.value=new s.Map("amap-container",{viewMode:"2D",zoom:15,center:D.value,features:["bg","point"]}),f=new s.InfoWindow({anchor:"bottom-center",closeWhenClickMap:!0}),W(s)}catch(n){console.error("地图初始化失败:",n)}}return _e(()=>{k.value=u.trackData??[],m()}),Fe(()=>{l.value&&l.value.destroy()}),(n,s)=>(S(),q("div",ct,s[0]||(s[0]=[t("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)])))}}),pt=pe(ut,[["__scopeId","data-v-ed8f606e"]]),mt={class:"p-1 border-b border-gray-100 last:border-b-0 font-size-16px"},vt={class:"flex mb-3 items-center"},ft={class:"flex-col justify-center items-center mr-20px"},bt=["src"],gt={class:"font-bold mt-10px text-[#000]"},ht={class:"flex mb-1"},yt={class:"c-#4169e1 font-bold"},xt={class:"flex mb-1"},_t={class:"mr-20px"},$t={class:"c-#4169e1 font-bold"},kt={class:"c-#4169e1 font-bold"},wt={class:"flex mb-1"},Ct={class:"c-#4169e1 font-bold"},Mt={class:"flex mb-1"},Tt={class:"c-#4169e1 font-bold"},zt={class:"mx-20px flex items-center"},Dt={class:"flex items-center"},Rt={class:"flex mb-1"},Pt={key:0},Lt={class:""},Vt={class:""},Bt={class:""},Nt=ee({__name:"calendarModal",props:je({lookdetail:{},creater:{}},{dialogVisible:{type:Boolean,default:!1},dialogVisibleModifiers:{}}),emits:["update:dialogVisible"],setup(d){const l=Ue(d,"dialogVisible"),f=d,u=B({pid:0,address:"",startTime:void 0,endTime:void 0,duration:0,status:0,dailyReport:0,username:"",daytime:"",projectName:"",userImage:"",ctype:0}),E=B([]),k=async()=>{const{data:_,error:r}=await We({startTime:f.lookdetail.startTime,endTime:f.lookdetail.endTime||Ge(1,new Date),pid:f.lookdetail.pid,creater:f.creater});_&&(E.value=_)};$e(()=>l.value,async _=>{_&&(Object.assign(u.value,f.lookdetail),k())});const U=()=>{l.value=!1,setTimeout(()=>{u.value={pid:0,address:"",startTime:void 0,endTime:void 0,duration:0,status:0,dailyReport:0,username:"",daytime:"",projectName:"",userImage:"",ctype:0}},200)},D=B("table");return(_,r)=>{const y=ce,F=ce,R=tt,A=Ae,W=ke,N=He;return S(),oe(N,{show:l.value,"onUpdate:show":r[1]||(r[1]=v=>l.value=v),class:"w-1000px",preset:"card",onClose:U,"modal-animation-name":"el-fade"},{header:I(()=>r[2]||(r[2]=[L(" 详情 ")])),default:I(()=>[t("div",mt,[t("div",vt,[t("div",ft,[t("img",{class:"w-60px h-60px rounded-full shadow-sm",src:u.value.userImage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"},null,8,bt),t("div",gt,T(u.value.username),1)]),t("div",null,[t("div",ht,[r[3]||(r[3]=t("span",{class:"mr-2"}," 🏗️ 项目名称： ",-1)),t("span",yt,T(u.value.projectName||"暂无项目"),1)]),t("div",xt,[t("div",_t,[r[4]||(r[4]=t("span",null,"📅 上班打卡时间：",-1)),t("span",$t,T(u.value.startTime||"无"),1)]),t("div",null,[r[5]||(r[5]=t("span",null,"📅 下班打卡时间：",-1)),t("span",kt,T(u.value.endTime||"无"),1)])]),t("div",wt,[r[6]||(r[6]=t("span",{style:{"white-space":"nowrap"}},"📍 地址：",-1)),t("span",Ct,T(u.value.address),1)]),t("div",Mt,[t("div",null,[r[7]||(r[7]=t("span",null,"🕓 工时：",-1)),t("span",Tt,T(u.value.duration||0)+"小时",1)]),t("div",zt,[r[10]||(r[10]=t("span",null,"🔔 打卡状态：",-1)),t("span",null,[u.value.status==1?(S(),oe(y,{key:0,type:"error",size:"small"},{default:I(()=>r[8]||(r[8]=[t("span",{class:"mr-1"},null,-1),L("异常 ")])),_:1,__:[8]})):Q("",!0),u.value.status==0?(S(),oe(y,{key:1,type:"success",size:"small"},{default:I(()=>r[9]||(r[9]=[t("span",{class:"mr-1"},null,-1),L("正常 ")])),_:1,__:[9]})):Q("",!0)])]),t("div",Dt,[r[11]||(r[11]=t("span",null,"📝 日报：",-1)),t("span",null,[j(F,{size:"small",type:u.value.dailyReport==1?"success":"error"},{default:I(()=>[L(T(u.value.dailyReport==1?"已提交":"未提交"),1)]),_:1},8,["type"])])])])])]),t("div",Rt,[r[12]||(r[12]=t("div",{class:"mr-15px"},"历史轨迹",-1)),j(A,{size:"small",value:D.value,"onUpdate:value":r[0]||(r[0]=v=>D.value=v),name:"radiobuttongroup1"},{default:I(()=>[j(R,{value:"table",label:"表格"}),j(R,{value:"map",label:"地图"})]),_:1},8,["value"])]),D.value=="table"?(S(),q("div",Pt,[j(W,{style:{height:"600px"},trigger:"hover"},{default:I(()=>[(S(!0),q(ue,null,we(E.value,v=>(S(),q("div",{class:"tableItem",key:v.id},[t("div",null,[r[13]||(r[13]=L("打卡类型：")),t("span",Lt,T(v.ctype==0?"上班打卡":v.ctype==1?"下班打卡":"系统上报"),1)]),t("div",null,[r[14]||(r[14]=L("地址： ")),t("span",Vt,T(v.address),1)]),t("div",null,[r[15]||(r[15]=L("打卡时间：")),t("span",Bt,T(v.dbtime),1)])]))),128))]),_:1})])):Q("",!0),D.value=="map"?(S(),oe(pt,{key:1,trackData:E.value,username:f.lookdetail.username,class:"map"},null,8,["trackData","username"])):Q("",!0)])]),_:1},8,["show"])}}}),Ot=pe(Nt,[["__scopeId","data-v-a06b44d7"]]),It={class:"calendarBox"},Et={class:"top"},Ft={key:0,class:"isreport"},St=["onClick"],jt=ee({name:"reportmanagement_calendar",__name:"index",setup(d){const l=B(new Date().getTime()),f=B([]),{pageData:u,getData:E,nextPage:k}=et(Qe),U=async e=>{const a=e.currentTarget,b=a.scrollTop;a.scrollTop+a.offsetHeight>=a.scrollHeight&&u.data.length<u.total&&(await k(),await be(),setTimeout(()=>{a.scrollTop=b}))},D=async()=>{var e;await E({usertypes:"2,3"}),y.value.creater=(e=u.data[0])==null?void 0:e.id,console.log(y.value.creater)},_=async e=>{y.value.creater=e,F()},r=e=>e<10?`0${e}`:`${e}`,y=B({creater:void 0,startTime:"",endTime:""}),F=async()=>{const{start:e,end:a}=Ze(l.value);y.value.startTime=e,y.value.endTime=a;const{data:b,error:w}=await Je(y.value);b&&(f.value=W(b),console.log(f.value,"dataList.value"))},R=e=>{var b,w,z;return((z=f.value[(w=(b=u.data)==null?void 0:b.find(C=>C.id==y.value.creater))==null?void 0:w.username])==null?void 0:z.filter(C=>C.daytime==e))||[]},A=()=>{F()},W=e=>{const a={};for(const b in e){const w=e[b].sort((C,p)=>C.dbtime>p.dbtime?1:-1),z=[];for(let C=0;C<w.length;C++){const p=w[C],P=w[C+1];p.ctype===0&&P&&P.ctype===1?(z.push({address:p.address,startTime:p.dbtime,endTime:P.dbtime,status:P.status,duration:P.duration||0,dailyReport:P.dailyReport,username:p.username,daytime:p.daytime,projectName:p.proname,userImage:p.userimage,ctype:P.ctype,pid:p.pid}),C++):z.push({address:p.address,startTime:p.ctype===0?p.dbtime:"",endTime:p.ctype===1?p.dbtime:"",duration:p.duration||0,status:p.status,dailyReport:p.dailyReport,username:p.username,daytime:p.daytime,projectName:p.proname,userImage:p.userimage,ctype:p.ctype,pid:p.pid})}a[b]=z}return a},N=B(null),v=B(null),m=e=>{if(!v.value)return;const a=e.target;v.value.scrollLeft=a.scrollLeft};_e(async()=>{var e;await D(),await F(),await be(),N.value=document.querySelector(".n-calendar"),v.value=document.querySelector(".weeks-wrapper"),(e=N.value)==null||e.addEventListener("scroll",m)}),Ye(()=>{var e;(e=N.value)==null||e.removeEventListener("scroll",m)}),$e(()=>l.value,e=>{F()});function n(e,a){const b=new Date(e),w=new Date(a);return b.getFullYear()===w.getFullYear()&&b.getMonth()===w.getMonth()}function s(e){return!n(e,l.value)}const c=B(!1),i=B(),o=async e=>{i.value=e,c.value=!0};return(e,a)=>{const b=qe,w=Xe,z=ne,C=ce,p=ke,P=it;return S(),q("div",It,[t("div",Et,[a[5]||(a[5]=t("h3",{class:"mr-20px font-size-18px font-bold"},"调试人员月度考勤",-1)),a[6]||(a[6]=t("div",{class:"w-270px"},null,-1)),j(w,{label:"",class:"pr-24px","label-placement":"left","show-feedback":!1},{label:I(()=>a[3]||(a[3]=[t("div",{class:"flex items-center"},[t("span",{class:"font-size-14px font-bold"},"调试人员")],-1)])),default:I(()=>[j(b,{size:"small",filterable:"",value:y.value.creater,"onUpdate:value":[a[0]||(a[0]=M=>y.value.creater=M),_],placeholder:"请选择","label-field":"username","value-field":"id",options:Ke(u).data,onScroll:U,style:{width:"180px"}},null,8,["value","options"])]),_:1}),j(z,{size:"small",type:"info",ghost:"",onClick:A},{default:I(()=>a[4]||(a[4]=[L(T("查询"))])),_:1,__:[4]})]),a[13]||(a[13]=t("div",{class:"weeks-wrapper"},[t("div",{class:"weeks"},[t("div",null,"周一"),t("div",null,"周二"),t("div",null,"周三"),t("div",null,"周四"),t("div",null,"周五"),t("div",null,"周六"),t("div",null,"周日")])],-1)),j(P,{value:l.value,"onUpdate:value":a[1]||(a[1]=M=>l.value=M),"is-date-disabled":s},{default:I(({year:M,month:G,date:Y})=>{var te,ae,re;return[((te=R(`${M}-${r(G)}-${r(Y)}`))==null?void 0:te.length)>0?(S(),q("div",Ft,[j(C,{size:"small",type:((re=R(`${M}-${r(G)}-${r(Y)}`)[((ae=R(`${M}-${r(G)}-${r(Y)}`))==null?void 0:ae.length)-1])==null?void 0:re.dailyReport)==1?"success":"error"},{default:I(()=>{var h,le;return[L(T(((le=R(`${M}-${r(G)}-${r(Y)}`)[((h=R(`${M}-${r(G)}-${r(Y)}`))==null?void 0:h.length)-1])==null?void 0:le.dailyReport)==1?"日报已提交":"日报未提交"),1)]}),_:2},1032,["type"])])):Q("",!0),j(p,{style:{"max-height":"200px"},trigger:"none"},{default:I(()=>[(S(!0),q(ue,null,we(R(`${M}-${r(G)}-${r(Y)}`),h=>(S(),q("div",{class:"prjItem",onClick:le=>o(h),key:h.id},[t("div",null,[a[7]||(a[7]=L("调试人：")),t("span",null,T(h==null?void 0:h.username),1)]),t("div",null,[a[8]||(a[8]=L("项目名称： ")),t("span",null,T((h==null?void 0:h.projectName)||"暂无项目"),1)]),t("div",null,[a[9]||(a[9]=L("上班打卡时间：")),t("span",null,T(h.startTime?h.startTime:"无"),1)]),t("div",null,[a[10]||(a[10]=L("下班打卡时间：")),t("span",null,T(h.endTime||"无"),1)]),t("div",null,[a[11]||(a[11]=L("工时：")),t("span",null,T((h==null?void 0:h.duration)||0)+"小时",1)]),t("div",null,[a[12]||(a[12]=L("地址：")),t("span",null,T(h==null?void 0:h.address),1)])],8,St))),128))]),_:2},1024)]}),_:1},8,["value"]),j(Ot,{"dialog-visible":c.value,"onUpdate:dialogVisible":a[2]||(a[2]=M=>c.value=M),lookdetail:i.value,creater:y.value.creater},null,8,["dialog-visible","lookdetail","creater"])])}}}),Yt=pe(jt,[["__scopeId","data-v-6fd16c62"]]);export{Yt as default};
