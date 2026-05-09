import{u as Te,_ as We,a as je,b as $e,c as ze,f as De}from"./echartshome-D466GrKw.js";import{d as V,W as Be,X as Y,b as g,o as u,I as Ce,J as Ae,D as y,n as Se,Y as Re,Z as Ke,V as Ie,i as Pe,r as Le,H as Ye,M as Ne,e as t,c as P,O as Ve,a0 as Ee,f as c,g as ke,_ as He,t as d,w as _,a1 as Fe,a2 as j,a3 as D,a4 as Ge,a5 as Oe,T as N,a6 as be,$ as L,a7 as Ue}from"./index-BV1EZCX-.js";import{d as qe}from"./debounce-BVBknlCr.js";import Je from"./dingwei-CKJKE7tQ.js";import"./installCanvasRenderer-B0u_oPmM.js";const Xe=V({name:"SimplePieChart",__name:"pie-chart",props:{data:{},name:{}},setup(B){const f=B,m=Be(),{domRef:$,updateOptions:i}=Te(()=>({tooltip:{trigger:"item",formatter:"{b}<br/>{c}  ({d}%)"},title:{text:"",left:"40%",top:"center",textAlign:"center",textStyle:{fontSize:12,fontWeight:600,lineHeight:26}},legend:{orient:"vertical",right:"2%",top:"20%",icon:"circle",itemWidth:10,itemHeight:10,itemGap:16,formatter:function(e){const n=f.data.find(v=>v.name===e);if(!n)return e;const o=f.data.reduce((v,w)=>v+w.value,0);return o&&(n.value/o*100).toFixed(1),`${e}  ${n.value}`},textStyle:{fontSize:13,color:"#fff"}},series:[{type:"pie",radius:["45%","65%"],center:["30%","50%"],label:{show:!0,formatter:"{d}%",fontSize:13,color:"#fff"},labelLine:{show:!0},data:[]}],graphic:[{type:"text",right:"2%",top:"0%",style:{text:"单位：个",fill:"#fff",font:"12px sans-serif"}}]}));async function h(){await new Promise(e=>setTimeout(e,500)),i(e=>{const n=f.data||[];return e.series[0].data=n.map(o=>({name:o.name,value:o.value,itemStyle:{color:o.color}})),e.legend.data=n.map(o=>o.name),e})}return Y(()=>f.data,h,{deep:!0}),Y(()=>f.name,h),Y(()=>m.locale,h),h(),(e,n)=>(u(),g("div",{ref_key:"domRef",ref:$,class:"h-100% w-full overflow-hidden"},null,512))}}),Ze={id:"amap-container"},Qe=V({__name:"PrjMap",props:{data:{type:Array,default:()=>[]}},setup(B){const f=Ce(),m=Ae(),$=B,i=y(null),h=y([]);let e=null,n=null,o=null;async function v(){const l="/map-sdk.json",{data:s}=await Ke.get(`${l}?_t=${Date.now()}`);return s}function w(l){return new Promise((s,p)=>{if(window.AMap){s(window.AMap);return}const S=document.createElement("script");S.src=`https://webapi.amap.com/maps?v=2.0&key=${l}`,S.onload=()=>{s(window.AMap)},S.onerror=p,document.head.appendChild(S)})}async function C(){const l=await v();e=await w(l.AMAP_SDK_KEY),i.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36],zooms:[3,20]}),m.themeScheme==="dark"&&i.value.setMapStyle("amap://styles/dark"),e.plugin(["AMap.Scale","AMap.ToolBar"],()=>{i.value.addControl(new e.Scale),i.value.addControl(new e.ToolBar)}),o=new e.InfoWindow({isCustom:!0,offset:new e.Pixel(0,-25)}),i.value.on("click",()=>{o.close()}),A()}function x(l){return`
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
  `}function A(){if(!i.value)return;n&&(n.clear(),n.setMap(null),n=null);const l=h.value.map(s=>({lnglat:[s.longitude,s.latitude],data:s}));n=new e.MassMarks(l,{zIndex:100,opacity:1,zooms:[3,20],cursor:"pointer",style:{url:Je,anchor:new e.Pixel(13,30),size:new e.Size(26,30)}}),n.on("click",s=>{const p=s.data.data;o.setContent(x(p)),o.open(i.value,s.data.lnglat),i.value.setCenter(s.data.lnglat)}),n.setMap(i.value),window.__closeInfo=()=>{o.close()},window.__gotoProject=s=>{const p=h.value.find(S=>S.id==s);f.push({path:"/projectmanagement/gatewaylist",query:{pid:p==null?void 0:p.id,pname:p==null?void 0:p.proname}})}}return Se(async()=>{await C()}),Y(()=>$.data,l=>{h.value=(l==null?void 0:l.filter(s=>s.longitude&&s.latitude).slice(0,200))||[],A()},{immediate:!0,deep:!0}),Re(()=>{n&&(n.clear(),n.setMap(null)),i.value&&i.value.destroy()}),(l,s)=>(u(),g("div",Ze))}}),et=Ie(Qe,[["__scopeId","data-v-e3b512f7"]]),tt={class:"content_wrap"},at={class:"d-flex jc-center title_wrap"},ot={class:"top_Info"},nt={class:"left"},lt={class:"right"},st={class:"index-box"},ct={class:"contentTop"},it={class:"contentTopLeft"},rt={class:"iconBox"},ut={class:"titleText"},dt={class:"unit"},vt={class:"flex-col"},pt={class:"flex-col items-center"},ft={class:"flex-col justify-center items-center mt-12px"},_t={class:"titleText"},mt={class:"unit"},gt={class:"contentTopCenter"},yt={class:"contentRight"},ht={class:"flex-col"},wt={class:"flex-col items-center"},xt={class:"flex-col justify-center items-center"},kt={class:"titleText"},bt={class:"unit"},Ct={class:"contentRightBox"},St={class:"titleText"},It={class:"unit"},Mt={class:"flex levelCssBox"},Tt={class:"flex justify-between items-center"},Wt={class:"flex items-center"},jt={class:"levelName"},$t=V({name:"bigscreen",__name:"index",setup(B){const f=Pe(),m=Le({dateDay:"",dateYear:"",dateWeek:"",timing:null});Ye();const $=Ce(),i=["周日","周一","周二","周三","周四","周五","周六"];(()=>{m.timing=setInterval(()=>{m.dateDay=be().format("YYYY-MM-DD hh : mm : ss"),m.dateWeek=i[be().day()]},1e3)})();const e=y({}),n=async()=>{var b,R,M,T,W,I,K,a,r,E,H,F,G,O,U,q,J,X,Z,Q,ee,te,ae,oe,ne,le,se,ce,ie,re,ue,de,ve,pe,fe,_e,me,ge,ye,he,we,xe;const{data:z,error:k}=await De();k||(e.value=z,console.log(e.value),o.value[0].value=(R=(b=e.value)==null?void 0:b.snstatus)==null?void 0:R.total,o.value[1].value=(T=(M=e.value)==null?void 0:M.snstatus)==null?void 0:T.online,o.value[2].value=(I=(W=e.value)==null?void 0:W.snstatus)==null?void 0:I.offline,o.value[3].value=(a=(K=e.value)==null?void 0:K.snstatus)==null?void 0:a.unknown,x.value[0].value=(E=(r=e.value)==null?void 0:r.power)==null?void 0:E.chargeday,x.value[1].value=(F=(H=e.value)==null?void 0:H.power)==null?void 0:F.dischargeday,x.value[2].value=(O=(G=e.value)==null?void 0:G.power)==null?void 0:O.chargemon,x.value[3].value=(q=(U=e.value)==null?void 0:U.power)==null?void 0:q.dischargemon,x.value[4].value=(X=(J=e.value)==null?void 0:J.power)==null?void 0:X.chargeyear,x.value[5].value=(Q=(Z=e.value)==null?void 0:Z.power)==null?void 0:Q.dischargeyear,w.value[0].value=(te=(ee=e.value)==null?void 0:ee.income)==null?void 0:te.yesterdayIncome,w.value[1].value=(oe=(ae=e.value)==null?void 0:ae.income)==null?void 0:oe.monthIncome,w.value[2].value=(le=(ne=e.value)==null?void 0:ne.income)==null?void 0:le.yearIncome,C.value[0].value=(ce=(se=e.value)==null?void 0:se.power)==null?void 0:ce.totalload,C.value[1].value=(re=(ie=e.value)==null?void 0:ie.power)==null?void 0:re.totalbatterypower,C.value[2].value=(de=(ue=e.value)==null?void 0:ue.power)==null?void 0:de.totalbatterycharge,C.value[3].value=(pe=(ve=e.value)==null?void 0:ve.power)==null?void 0:pe.totalbatterydischarge,v.value[0].value=(_e=(fe=e.value)==null?void 0:fe.event)==null?void 0:_e.total,v.value[1].value=(ge=(me=e.value)==null?void 0:me.event)==null?void 0:ge.level0,v.value[2].value=(he=(ye=e.value)==null?void 0:ye.event)==null?void 0:he.level1,v.value[3].value=(xe=(we=e.value)==null?void 0:we.event)==null?void 0:xe.level2)},o=y([{key:"total",title:"网关总数量",value:0,icon:"gateway",unit:"个"},{key:"online",title:"在线数量",value:0,icon:"gateway",unit:"个"},{key:"offline",title:"离线数量",value:0,icon:"gateway",unit:"个"},{key:"unknown",title:"未知数量",value:0,icon:"gateway",unit:"个"}]),v=y([{name:"总数量",value:0,color:"#0096ff"},{name:"普通",value:0,color:"#0096ff"},{name:"严重",value:0,color:"#ff9600"},{name:"事故",value:0,color:"#ff0000"}]),w=y([{key:"yesterdayIncome",title:"昨日收益",value:0,icon:"income",unit:"元"},{key:"monthIncome",title:"本月收益",value:0,icon:"income",unit:"元"},{key:"yearIncome",title:"本年收益",value:0,icon:"income",unit:"元"}]),C=y([{key:"totalload",title:"总负荷",value:0,icon:"totalload",unit:"KW·h"},{key:"totalbatterypower",title:"总功率",value:0,icon:"totalbatterypower",unit:"KW·h"},{key:"totalbatterycharge",title:"累计电池总充电量",value:0,icon:"rongliang",unit:"KW·h"},{key:"totalbatterydischarge",title:"累计电池总放电量",value:0,icon:"totalbatterydischarge",unit:"KW·h"}]),x=y([{key:"chargeday",title:"当日累计充电量",value:0,unit:"KW·h"},{key:"dischargeday",title:"当日累计放电量",value:0,unit:"KW·h"},{key:"chargemon",title:"当月累计充电量",value:0,unit:"KW·h"},{key:"dischargemon",title:"当月累计放电量",value:0,unit:"KW·h"},{key:"chargeyear",title:"当年累计充电量",value:0,unit:"KW·h"},{key:"dischargeyear",title:"当年累计放电量",value:0,unit:"KW·h"}]),A=y(0),l=qe(()=>{A.value++},500),s=()=>{l()},p=y(!1);Se(async()=>{n(),window.addEventListener("resize",s)}),Ne(()=>{});const S=()=>{$.back()},Me=async()=>{var z;(z=window.$dialog)==null||z.info({title:L("common.tip"),content:L("common.logoutConfirm"),positiveText:L("common.confirm"),negativeText:L("common.cancel"),onPositiveClick:async()=>{try{const{data:k,error:b}=await Ue();f.clearInfo(),window.location.reload()}catch(k){console.log("e",k),f.clearInfo()}}})};return(z,k)=>{const b=He,R=We,M=je,T=Ge,W=Fe,I=$e,K=ze;return u(),g(j,null,[t("div",tt,[t("div",at,[k[1]||(k[1]=Ee('<div class="zuojuxing" data-v-23817604></div><div class="youjuxing" data-v-23817604></div><div class="guang" data-v-23817604></div><div class="d-flex jc-center" data-v-23817604><div class="title" data-v-23817604><span class="title-text" data-v-23817604>储能云平台</span></div></div>',4)),t("div",ot,[t("div",nt,[t("div",{class:"setting_icon flex items-center font-bold",onClick:S},[c(b,{"local-icon":"return",class:"text-42px"}),k[0]||(k[0]=ke(" 返回 "))])]),t("div",lt,[t("div",null,d(m.dateYear)+" "+d(m.dateWeek)+" "+d(m.dateDay),1),t("div",{class:"cursor-pointer logoutCss",onClick:Me},[c(R)])])])]),t("div",st,[t("div",ct,[t("div",it,[c(I,{class:"contentTopLeftTop",title:"平台概况"},{default:_(()=>[c(W,{cols:C.value.length/2,responsive:"screen",class:"gridCss"},{default:_(()=>[(u(!0),g(j,null,D(C.value,(a,r)=>(u(),P(T,{key:a.key},{default:_(()=>[t("div",{class:Oe(["powerCard",[r===0?"border-r border-b":"",r===1?"border-b":"",r===2?"border-r":""]])},[t("div",rt,[c(b,{"local-icon":a.icon,class:"svgCSS",style:{color:"#00eaff"}},null,8,["local-icon"])]),c(M,{"start-value":1,"end-value":a.value,style:{color:"#00eaff"},class:"CountTotext"},null,8,["end-value"]),t("div",ut,d(a.title),1),t("div",dt," ("+d(a.unit)+") ",1)],2)]),_:2},1024))),128))]),_:1},8,["cols"])]),_:1}),c(I,{class:"contentTopLeftBottom",title:"平台运行信息"},{default:_(()=>[c(W,{cols:o.value.length,responsive:"screen",class:"gridCss"},{default:_(()=>[(u(!0),g(j,null,D(o.value,(a,r)=>(u(),P(T,{key:a.key},{default:_(()=>[t("div",vt,[t("div",pt,[c(b,{"local-icon":a.icon,class:"svgCSS",style:N({color:r==0?"#00eaff":r==1?"#44bd32":r==2?"#ff0000":"#ccc"})},null,8,["local-icon","style"])]),t("div",ft,[c(M,{"start-value":1,"end-value":a.value,style:{color:"#00eaff"},class:"CountTotext dark:text-dark text-center"},null,8,["end-value"]),t("h3",_t,d(a.title),1),t("span",mt,"("+d(a.unit)+")",1)])])]),_:2},1024))),128))]),_:1},8,["cols"])]),_:1})]),t("div",gt,[c(et,{data:e.value.project,style:{height:"100%"}},null,8,["data"])]),t("div",yt,[c(I,{class:"contentRightTop",title:"收益指标"},{default:_(()=>[c(W,{cols:w.value.length,responsive:"screen",class:"gridCss"},{default:_(()=>[(u(!0),g(j,null,D(w.value,(a,r)=>(u(),P(T,{key:a.key},{default:_(()=>[t("div",ht,[t("div",wt,[c(b,{"local-icon":a.icon,class:"svgCSS",style:{color:"#00eaff"}},null,8,["local-icon"])]),t("div",xt,[c(M,{"start-value":1,"end-value":a.value,style:{color:"#00eaff"},class:"CountTotext dark:text-dark text-center"},null,8,["end-value"]),t("h3",kt,d(a.title),1),t("span",bt,"("+d(a.unit)+")",1)])])]),_:2},1024))),128))]),_:1},8,["cols"])]),_:1}),c(I,{class:"contentRightcenter",title:"充放电统计"},{default:_(()=>[t("div",Ct,[(u(!0),g(j,null,D(x.value,(a,r)=>(u(),g("div",{class:"contentTopRightItem",key:r},[t("div",St,[ke(d(a.title)+" ",1),t("span",It,"("+d(a.unit)+")",1)]),c(M,{"start-value":1,"end-value":a.value,decimals:2,style:N([{color:r%2==0?"#44bd32":"#ff9600"},{"font-family":"dsdigits","font-weight":"bolder"}]),class:"CountTotext dark:text-dark text-center"},null,8,["end-value","style"])]))),128))])]),_:1}),c(I,{class:"contentRightBottom",title:"告警事件"},{default:_(()=>[c(Xe,{data:v.value.filter(a=>a.name!=="总数量"),class:"levelChart"},null,8,["data"]),t("div",Mt,[(u(!0),g(j,null,D(v.value,a=>(u(),g("div",{key:a.name,class:"levelCssItem",style:N({background:a.color})},[t("div",Tt,[t("div",Wt,[t("div",jt,d(a.name),1)]),t("div",null,d(a.value),1)])],4))),128))])]),_:1})])])])]),p.value?(u(),P(K,{key:0})):Ve("",!0)],64)}}}),Kt=Ie($t,[["__scopeId","data-v-23817604"]]);export{Kt as default};
