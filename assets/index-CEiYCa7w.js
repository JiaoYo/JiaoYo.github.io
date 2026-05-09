import{u as je,_ as We,a as $e,b as ze,c as De,f as Be}from"./echartshome-C5XRdcAz.js";import{d as V,W as Ae,X as Y,b as y,o as u,I as Ce,J as Re,D as _,n as Te,Y as Pe,Z as Ke,V as Se,i as Le,r as Ye,H as Ne,M as Ve,e as t,c as K,O as Ee,a0 as He,f as c,g as ke,_ as Fe,t as d,w as f,a1 as Ge,a2 as $,a3 as B,a4 as Oe,a5 as Ue,T as N,a6 as be,$ as L,a7 as qe}from"./index-C8YdCm4G.js";import{d as Je}from"./debounce-BtQTmPcT.js";import Xe from"./dingwei-CKJKE7tQ.js";import"./installCanvasRenderer-B0u_oPmM.js";const Ze=V({name:"SimplePieChart",__name:"pie-chart",props:{data:{},name:{},eventTotal:{}},setup(A){const v=A,m=Ae(),{domRef:z,updateOptions:i}=je(()=>({tooltip:{trigger:"item",formatter:"{b}<br/>{c}  ({d}%)"},title:{text:"",left:"49%",top:"center",textAlign:"center",textStyle:{fontSize:14,fontWeight:600,lineHeight:26}},legend:{orient:"vertical",right:"2%",top:"20%",icon:"circle",itemWidth:10,itemHeight:10,itemGap:16,formatter:function(e){const n=v.data.find(b=>b.name===e);if(!n)return e;const o=v.data.reduce((b,w)=>b+w.value,0);return o&&(n.value/o*100).toFixed(1),`${e}  ${n.value}`},textStyle:{fontSize:13,color:"#fff"}},series:[{type:"pie",radius:["45%","65%"],center:["50%","50%"],label:{show:!0,formatter:"{d}%",fontSize:13,color:"#fff"},labelLine:{show:!0},data:[]}],graphic:[{type:"text",right:"2%",top:"0%",style:{text:"单位：个",fill:"#fff",font:"12px sans-serif"}}]}));async function h(){await new Promise(e=>setTimeout(e,500)),i(e=>{const n=v.data||[];return e.series[0].data=n.map(o=>({name:o.name,value:o.value,itemStyle:{color:o.color}})),e.legend.data=n.map(o=>o.name),e.title.text=v.eventTotal,e})}return Y(()=>v.data,h,{deep:!0}),Y(()=>v.name,h),Y(()=>m.locale,h),h(),(e,n)=>(u(),y("div",{ref_key:"domRef",ref:z,class:"h-100% w-full overflow-hidden"},null,512))}}),Qe={id:"amap-container"},et=V({__name:"PrjMap",props:{data:{type:Array,default:()=>[]}},setup(A){const v=Ce(),m=Re(),z=A,i=_(null),h=_([]);let e=null,n=null,o=null;async function b(){const l="/map-sdk.json",{data:s}=await Ke.get(`${l}?_t=${Date.now()}`);return s}function w(l){return new Promise((s,p)=>{if(window.AMap){s(window.AMap);return}const T=document.createElement("script");T.src=`https://webapi.amap.com/maps?v=2.0&key=${l}`,T.onload=()=>{s(window.AMap)},T.onerror=p,document.head.appendChild(T)})}async function I(){const l=await b();e=await w(l.AMAP_SDK_KEY),i.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36],zooms:[3,20]}),m.themeScheme==="dark"&&i.value.setMapStyle("amap://styles/dark"),e.plugin(["AMap.Scale","AMap.ToolBar"],()=>{i.value.addControl(new e.Scale),i.value.addControl(new e.ToolBar)}),o=new e.InfoWindow({isCustom:!0,offset:new e.Pixel(0,-25)}),i.value.on("click",()=>{o.close()}),g()}function C(l){return`
  <div style="
    min-width:260px;
    border-radius:12px;
    overflow:hidden;

    background:
      linear-gradient(
        180deg,
        rgba(8,25,48,.96),
        rgba(3,12,24,.96)
      );

    border:
      1px solid rgba(0,191,255,.35);

    box-shadow:
      0 0 12px rgba(0,183,255,.35);

    color:#fff;
  ">

    <div style="
      height:42px;
      display:flex;
      align-items:center;
      justify-content:space-between;

      padding:0 16px;

      background:
        linear-gradient(
          90deg,
          rgba(0,170,255,.25),
          rgba(0,170,255,.05)
        );
    ">

      <div style="
        color:#6fe6ff;
        font-weight:bold;
      ">
        储能站监控
      </div>

      <div
        onclick="window.__closeInfo()"
        style="
          cursor:pointer;
          font-size:18px;
        "
      >
        ×
      </div>

    </div>

    <div style="
      padding:16px;
      display:flex;
      flex-direction:column;
      gap:14px;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
      ">
        <span style="color:rgba(255,255,255,.65)">
          项目名称
        </span>

        <span
          onclick="window.__gotoProject(${l.id})"
          style="
            color:#4dd7ff;
            font-weight:bold;
            cursor:pointer;
          "
        >
          ${l.proname||"-"}
        </span>
      </div>

      <div style="
        display:flex;
        justify-content:space-between;
      ">

        <span style="color:rgba(255,255,255,.65)">
          当前状态
        </span>

        <span style="
          padding:2px 10px;
          border-radius:999px;

          background:
            ${l.status==0?"rgba(255,77,79,.18)":"rgba(0,255,133,.18)"};

          color:
            ${l.status==0?"#ff7875":"#00ff85"};
        ">
          ${l.status==0?"离线":"在线"}
        </span>

      </div>

    </div>

  </div>
  `}function g(){if(!i.value)return;n&&(n.clear(),n.setMap(null),n=null);const l=h.value.map(s=>({lnglat:[s.longitude,s.latitude],data:s}));n=new e.MassMarks(l,{zIndex:100,opacity:1,zooms:[3,20],cursor:"pointer",style:{url:Xe,anchor:new e.Pixel(13,30),size:new e.Size(26,30)}}),n.on("click",s=>{const p=s.data.data;o.setContent(C(p)),o.open(i.value,s.data.lnglat),i.value.setCenter(s.data.lnglat)}),n.setMap(i.value),window.__closeInfo=()=>{o.close()},window.__gotoProject=s=>{const p=h.value.find(T=>T.id==s);v.push({path:"/projectmanagement/gatewaylist",query:{pid:p==null?void 0:p.id,pname:p==null?void 0:p.proname}})}}return Te(async()=>{await I()}),Y(()=>z.data,l=>{h.value=(l==null?void 0:l.filter(s=>s.longitude&&s.latitude).slice(0,200))||[],g()},{immediate:!0,deep:!0}),Pe(()=>{n&&(n.clear(),n.setMap(null)),i.value&&i.value.destroy()}),(l,s)=>(u(),y("div",Qe))}}),tt=Se(et,[["__scopeId","data-v-e3b512f7"]]),at={class:"content_wrap"},ot={class:"d-flex jc-center title_wrap"},nt={class:"top_Info"},lt={class:"left"},st={class:"right"},ct={class:"index-box"},it={class:"contentTop"},rt={class:"contentTopLeft"},ut={class:"iconBox"},dt={class:"titleText"},vt={class:"unit"},pt={class:"contentRightBox"},ft={class:"titleText"},_t={class:"unit"},mt={class:"contentTopCenter"},gt={class:"contentRight"},yt={class:"flex-col"},ht={class:"flex-col items-center"},wt={class:"flex-col justify-center items-center"},xt={class:"titleText"},kt={class:"unit"},bt={class:"flex-col crc"},Ct={class:"flex-col items-center"},Tt={class:"flex-col justify-center items-center mt-12px"},St={class:"titleText"},It={class:"unit"},Mt={class:"flex levelCssBox"},jt={class:"flex justify-between items-center"},Wt={class:"flex items-center"},$t={class:"levelName"},zt=V({name:"bigscreen",__name:"index",setup(A){const v=Le(),m=Ye({dateDay:"",dateYear:"",dateWeek:"",timing:null});Ne();const z=Ce(),i=["周日","周一","周二","周三","周四","周五","周六"];(()=>{m.timing=setInterval(()=>{m.dateDay=be().format("YYYY-MM-DD hh : mm : ss"),m.dateWeek=i[be().day()]},1e3)})();const e=_({}),n=async()=>{var k,R,M,j,W,S,P,a,r,E,H,F,G,O,U,q,J,X,Z,Q,ee,te,ae,oe,ne,le,se,ce,ie,re,ue,de,ve,pe,fe,_e,me,ge,ye,he,we,xe;const{data:D,error:x}=await Be();x||(e.value=D,console.log(e.value),o.value[0].value=(R=(k=e.value)==null?void 0:k.snstatus)==null?void 0:R.total,o.value[1].value=(j=(M=e.value)==null?void 0:M.snstatus)==null?void 0:j.online,o.value[2].value=(S=(W=e.value)==null?void 0:W.snstatus)==null?void 0:S.offline,o.value[3].value=(a=(P=e.value)==null?void 0:P.snstatus)==null?void 0:a.unknown,g.value[0].value=(E=(r=e.value)==null?void 0:r.power)==null?void 0:E.chargeday,g.value[1].value=(F=(H=e.value)==null?void 0:H.power)==null?void 0:F.dischargeday,g.value[2].value=(O=(G=e.value)==null?void 0:G.power)==null?void 0:O.chargemon,g.value[3].value=(q=(U=e.value)==null?void 0:U.power)==null?void 0:q.dischargemon,g.value[4].value=(X=(J=e.value)==null?void 0:J.power)==null?void 0:X.chargeyear,g.value[5].value=(Q=(Z=e.value)==null?void 0:Z.power)==null?void 0:Q.dischargeyear,I.value[0].value=(te=(ee=e.value)==null?void 0:ee.income)==null?void 0:te.yesterdayIncome,I.value[1].value=(oe=(ae=e.value)==null?void 0:ae.income)==null?void 0:oe.monthIncome,I.value[2].value=(le=(ne=e.value)==null?void 0:ne.income)==null?void 0:le.yearIncome,C.value[0].value=(ce=(se=e.value)==null?void 0:se.power)==null?void 0:ce.totalload,C.value[1].value=(re=(ie=e.value)==null?void 0:ie.power)==null?void 0:re.totalbatterypower,C.value[2].value=(de=(ue=e.value)==null?void 0:ue.power)==null?void 0:de.totalbatterycharge,C.value[3].value=(pe=(ve=e.value)==null?void 0:ve.power)==null?void 0:pe.totalbatterydischarge,b.value=(_e=(fe=e.value)==null?void 0:fe.event)==null?void 0:_e.total,w.value[0].value=(ge=(me=e.value)==null?void 0:me.event)==null?void 0:ge.level0,w.value[1].value=(he=(ye=e.value)==null?void 0:ye.event)==null?void 0:he.level1,w.value[2].value=(xe=(we=e.value)==null?void 0:we.event)==null?void 0:xe.level2)},o=_([{key:"total",title:"网关总数量",value:0,icon:"gateway",unit:"个"},{key:"online",title:"在线数量",value:0,icon:"gateway",unit:"个"},{key:"offline",title:"离线数量",value:0,icon:"gateway",unit:"个"},{key:"unknown",title:"未知数量",value:0,icon:"gateway",unit:"个"}]),b=_(0),w=_([{name:"普通",value:0,color:"#0096ff"},{name:"严重",value:0,color:"#ff9600"},{name:"事故",value:0,color:"#ff0000"}]),I=_([{key:"yesterdayIncome",title:"昨日收益",value:0,icon:"income",unit:"元"},{key:"monthIncome",title:"本月收益",value:0,icon:"income",unit:"元"},{key:"yearIncome",title:"本年收益",value:0,icon:"income",unit:"元"}]),C=_([{key:"totalload",title:"总负荷",value:0,icon:"totalload",unit:"kW"},{key:"totalbatterypower",title:"总功率",value:0,icon:"totalbatterypower",unit:"kW"},{key:"totalbatterycharge",title:"累计电池总充电量",value:0,icon:"rongliang",unit:"kWh"},{key:"totalbatterydischarge",title:"累计电池总放电量",value:0,icon:"totalbatterydischarge",unit:"kWh"}]),g=_([{key:"chargeday",title:"当日累计充电量",value:0,unit:"KW·h"},{key:"dischargeday",title:"当日累计放电量",value:0,unit:"KW·h"},{key:"chargemon",title:"当月累计充电量",value:0,unit:"KW·h"},{key:"dischargemon",title:"当月累计放电量",value:0,unit:"KW·h"},{key:"chargeyear",title:"当年累计充电量",value:0,unit:"KW·h"},{key:"dischargeyear",title:"当年累计放电量",value:0,unit:"KW·h"}]),l=_(0),s=Je(()=>{l.value++},500),p=()=>{s()},T=_(!1);Te(async()=>{n(),window.addEventListener("resize",p)}),Ve(()=>{});const Ie=()=>{z.push("/projectmanagement/projectlist")},Me=async()=>{var D;(D=window.$dialog)==null||D.info({title:L("common.tip"),content:L("common.logoutConfirm"),positiveText:L("common.confirm"),negativeText:L("common.cancel"),onPositiveClick:async()=>{try{const{data:x,error:k}=await qe();v.clearInfo(),window.location.reload()}catch(x){console.log("e",x),v.clearInfo()}}})};return(D,x)=>{const k=Fe,R=We,M=$e,j=Oe,W=Ge,S=ze,P=De;return u(),y($,null,[t("div",at,[t("div",ot,[x[1]||(x[1]=He('<div class="zuojuxing" data-v-c6a18d57></div><div class="youjuxing" data-v-c6a18d57></div><div class="guang" data-v-c6a18d57></div><div class="d-flex jc-center" data-v-c6a18d57><div class="title" data-v-c6a18d57><span class="title-text" data-v-c6a18d57>储能云平台</span></div></div>',4)),t("div",nt,[t("div",lt,[t("div",{class:"setting_icon flex items-center font-bold",onClick:Ie},[c(k,{"local-icon":"return",class:"text-42px"}),x[0]||(x[0]=ke(" 返回 "))])]),t("div",st,[t("div",null,d(m.dateYear)+" "+d(m.dateWeek)+" "+d(m.dateDay),1),t("div",{class:"cursor-pointer logoutCss",onClick:Me},[c(R)])])])]),t("div",ct,[t("div",it,[t("div",rt,[c(S,{class:"contentTopLeftTop",title:"平台概况"},{default:f(()=>[c(W,{cols:C.value.length/2,responsive:"screen",class:"gridCss"},{default:f(()=>[(u(!0),y($,null,B(C.value,(a,r)=>(u(),K(j,{key:a.key},{default:f(()=>[t("div",{class:Ue(["powerCard",[r===0?"border-r border-b":"",r===1?"border-b":"",r===2?"border-r":""]])},[t("div",ut,[c(k,{"local-icon":a.icon,class:"svgCSS",style:{color:"#00eaff"}},null,8,["local-icon"])]),c(M,{"start-value":1,"end-value":a.value,style:{color:"#00eaff"},class:"CountTotext"},null,8,["end-value"]),t("div",dt,d(a.title),1),t("div",vt," ("+d(a.unit)+") ",1)],2)]),_:2},1024))),128))]),_:1},8,["cols"])]),_:1}),c(S,{class:"contentTopLeftBottom",title:"充放电统计"},{default:f(()=>[t("div",pt,[(u(!0),y($,null,B(g.value,(a,r)=>(u(),y("div",{class:"contentTopRightItem",key:r},[t("div",ft,[ke(d(a.title)+" ",1),t("span",_t,"("+d(a.unit)+")",1)]),c(M,{"start-value":1,"end-value":a.value,decimals:2,style:N([{color:r%2==0?"#44bd32":"#ff9600"},{"font-family":"dsdigits","font-weight":"bolder"}]),class:"CountTotext dark:text-dark text-center"},null,8,["end-value","style"])]))),128))])]),_:1})]),t("div",mt,[c(tt,{data:e.value.project,style:{height:"100%"}},null,8,["data"])]),t("div",gt,[c(S,{class:"contentRightTop",title:"收益指标"},{default:f(()=>[c(W,{cols:I.value.length,responsive:"screen",class:"gridCss"},{default:f(()=>[(u(!0),y($,null,B(I.value,(a,r)=>(u(),K(j,{key:a.key},{default:f(()=>[t("div",yt,[t("div",ht,[c(k,{"local-icon":a.icon,class:"svgCSS",style:{color:"#00eaff"}},null,8,["local-icon"])]),t("div",wt,[c(M,{"start-value":1,"end-value":a.value,style:{color:"#00eaff"},class:"CountTotext dark:text-dark text-center"},null,8,["end-value"]),t("h3",xt,d(a.title),1),t("span",kt,"("+d(a.unit)+")",1)])])]),_:2},1024))),128))]),_:1},8,["cols"])]),_:1}),c(S,{class:"contentRightcenter",title:"平台运行信息"},{default:f(()=>[c(W,{cols:o.value.length,responsive:"screen",class:"gridCss"},{default:f(()=>[(u(!0),y($,null,B(o.value,(a,r)=>(u(),K(j,{key:a.key},{default:f(()=>[t("div",bt,[t("div",Ct,[c(k,{"local-icon":a.icon,class:"svgCSS",style:N({color:r==0?"#00eaff":r==1?"#44bd32":r==2?"#ff0000":"#ccc"})},null,8,["local-icon","style"])]),t("div",Tt,[c(M,{"start-value":1,"end-value":a.value,style:{color:"#00eaff"},class:"CountTotext dark:text-dark text-center"},null,8,["end-value"]),t("h3",St,d(a.title),1),t("span",It,"("+d(a.unit)+")",1)])])]),_:2},1024))),128))]),_:1},8,["cols"])]),_:1}),c(S,{class:"contentRightBottom",title:"告警事件"},{default:f(()=>[c(Ze,{data:w.value,eventTotal:b.value,class:"levelChart"},null,8,["data","eventTotal"]),t("div",Mt,[(u(!0),y($,null,B(w.value,a=>(u(),y("div",{key:a.name,class:"levelCssItem",style:N({background:a.color})},[t("div",jt,[t("div",Wt,[t("div",$t,d(a.name),1)]),t("div",null,d(a.value),1)])],4))),128))])]),_:1})])])])]),T.value?(u(),K(P,{key:0})):Ee("",!0)],64)}}}),Kt=Se(zt,[["__scopeId","data-v-c6a18d57"]]);export{Kt as default};
