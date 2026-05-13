import{u as ze,_ as Be,a as De,b as Re,f as Ae}from"./echartshome-peHL35iX.js";import{d as P,D as y,W as Pe,a as Ke,X as Ye,b as p,o as c,e as t,h as _,Y as F,V as H,c as A,w as g,O as Te,T as N,t as h,Z as Me,a0 as Ee,a1 as V,I as Ie,J as Ne,m as Le,a2 as Ve,a3 as He,i as Fe,r as Ge,H as Oe,M as Ue,a4 as qe,f as r,g as Ce,_ as Je,a5 as Xe,a6 as D,a7 as R,a8 as Ze,a9 as Se,$ as E,aa as Qe}from"./index-C0IJyYiR.js";import{d as et}from"./debounce-BVbQzPho.js";import tt from"./dingwei-CKJKE7tQ.js";import"./installCanvasRenderer-B0u_oPmM.js";const at=["width","height"],ot=["fill","stroke","d"],nt=["stroke"],lt=["stroke","d"],st={class:"dv-border-box-content"},it=P({__name:"border-box-13",props:{color:{type:Array,default:()=>[]},backgroundColor:{type:String,default:"transparent"}},setup(b){const u=b,d=["#6586ec","#2cf7fe"],w=y(null),{width:o,height:v}=Pe(w,{width:0,height:0},{box:"border-box"}),e=Ke(()=>Ye(d,u.color));return(l,n)=>(c(),p("div",{class:"dv-border-box-13 dv-border-box",ref_key:"domRef",ref:w},[(c(),p("svg",{width:_(o),height:_(v),class:"dv-border-svg-container"},[t("path",{fill:b.backgroundColor,stroke:e.value[0],d:`
            M 5 20 L 5 10 L 12 3  L 60 3 L 68 10
            L ${_(o)-20} 10 L ${_(o)-5} 25
            L ${_(o)-5} ${_(v)-5} L 20 ${_(v)-5}
            L 5 ${_(v)-20} L 5 20
        `},null,8,ot),t("path",{fill:"transparent","stroke-width":"3","stroke-linecap":"round","stroke-dasharray":"10, 5",stroke:e.value[0],d:"M 16 9 L 61 9"},null,8,nt),n[0]||(n[0]=t("path",{fill:"transparent",stroke:"{mergedColor[1]}",d:"M 5 20 L 5 10 L 12 3  L 60 3 L 68 10"},null,-1)),t("path",{fill:"transparent",stroke:e.value[1],d:`M ${_(o)-5} ${_(v)-30} L ${_(o)-5} ${_(v)-5} L ${_(o)-30} ${_(v)-5}`},null,8,lt)],8,at)),t("div",st,[F(l.$slots,"default",{},void 0,!0)])],512))}}),ct=H(it,[["__scopeId","data-v-4ea05f61"]]),rt={class:"flex items-center"},dt={key:0,class:"zuo"},ut={key:1,class:"dot"},vt={class:"title-inner"},pt=P({__name:"item-wrap",props:{title:{default:""},center:{default:"center"},showLeft:{type:Boolean,default:!0}},setup(b){const u=b;return(d,w)=>{const o=ct;return c(),A(o,null,{default:g(()=>[d.title!==""?(c(),p("div",{key:0,class:"item_title",style:N({"justify-content":u.center})},[t("div",rt,[u.showLeft?(c(),p("div",dt)):(c(),p("div",ut)),t("span",vt,"   "+h(d.title)+"   ",1),w[0]||(w[0]=t("div",{class:"you"},null,-1))]),F(d.$slots,"totalTight",{},void 0,!0)],4)):Te("",!0),t("div",{class:Me(d.title!==""?"item_title_content":"item_title_content_def")},[F(d.$slots,"default",{},void 0,!0)],2)]),_:3})}}}),ft=H(pt,[["__scopeId","data-v-b30187ac"]]),_t=P({name:"SimplePieChart",__name:"pie-chart",props:{data:{},name:{},eventTotal:{}},setup(b){const u=b,d=Ee(),{domRef:w,updateOptions:o}=ze(()=>({tooltip:{trigger:"item",formatter:"{b}<br/>{c}  ({d}%)"},title:{text:"",left:"49%",top:"center",textAlign:"center",textStyle:{fontSize:14,fontWeight:600,lineHeight:26}},legend:{orient:"vertical",right:"2%",top:"20%",icon:"circle",itemWidth:10,itemHeight:10,itemGap:16,formatter:function(e){const l=u.data.find(T=>T.name===e);if(!l)return e;const n=u.data.reduce((T,$)=>T+$.value,0);return n&&(l.value/n*100).toFixed(1),`${e}  ${l.value}`},textStyle:{fontSize:13,color:"#fff"}},series:[{type:"pie",radius:["45%","65%"],center:["50%","50%"],label:{show:!0,formatter:"{d}%",fontSize:13,color:"#fff"},labelLine:{show:!0},data:[]}],graphic:[{type:"text",right:"2%",top:"0%",style:{text:"单位：个",fill:"#fff",font:"12px sans-serif"}}]}));async function v(){await new Promise(e=>setTimeout(e,500)),o(e=>{const l=u.data||[];return e.series[0].data=l.map(n=>({name:n.name,value:n.value,itemStyle:{color:n.color}})),e.legend.data=l.map(n=>n.name),e.title.text=u.eventTotal,e})}return V(()=>u.data,v,{deep:!0}),V(()=>u.name,v),V(()=>d.locale,v),v(),(e,l)=>(c(),p("div",{ref_key:"domRef",ref:w,class:"h-100% w-full overflow-hidden"},null,512))}}),ht={id:"amap-container"},mt=P({__name:"PrjMap",props:{data:{type:Array,default:()=>[]}},setup(b){const u=Ie(),d=Ne(),w=b,o=y(null),v=y([]);let e=null,l=null,n=null;async function T(){const s="/map-sdk.json",{data:i}=await He.get(`${s}?_t=${Date.now()}`);return i}function $(s){return new Promise((i,m)=>{if(window.AMap){i(window.AMap);return}const x=document.createElement("script");x.src=`https://webapi.amap.com/maps?v=2.0&key=${s}`,x.onload=()=>{i(window.AMap)},x.onerror=m,document.head.appendChild(x)})}async function L(){const s=await T();e=await $(s.AMAP_SDK_KEY),o.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36],zooms:[3,20]}),d.themeScheme==="dark"&&o.value.setMapStyle("amap://styles/dark"),e.plugin(["AMap.Scale","AMap.ToolBar"],()=>{o.value.addControl(new e.Scale),o.value.addControl(new e.ToolBar)}),n=new e.InfoWindow({isCustom:!0,offset:new e.Pixel(0,-25)}),o.value.on("click",()=>{n.close()}),k()}function M(s){return`
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
          onclick="window.__gotoProject(${s.id})"
          style="
            color:#4dd7ff;
            font-weight:bold;
            cursor:pointer;
          "
        >
          ${s.proname||"-"}
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
            ${s.status==0?"rgba(255,77,79,.18)":"rgba(0,255,133,.18)"};

          color:
            ${s.status==0?"#ff7875":"#00ff85"};
        ">
          ${s.status==0?"离线":"在线"}
        </span>

      </div>

    </div>

  </div>
  `}function k(){if(!o.value)return;l&&(l.clear(),l.setMap(null),l=null);const s=v.value.map(i=>({lnglat:[i.longitude,i.latitude],data:i}));l=new e.MassMarks(s,{zIndex:100,opacity:1,zooms:[3,20],cursor:"pointer",style:{url:tt,anchor:new e.Pixel(13,30),size:new e.Size(26,30)}}),l.on("click",i=>{const m=i.data.data;n.setContent(M(m)),n.open(o.value,i.data.lnglat),o.value.setCenter(i.data.lnglat)}),l.setMap(o.value),window.__closeInfo=()=>{n.close()},window.__gotoProject=i=>{const m=v.value.find(x=>x.id==i);u.push({path:"/projectmanagement/gatewaylist",query:{pid:m==null?void 0:m.id,pname:m==null?void 0:m.proname}})}}return Le(async()=>{await L()}),V(()=>w.data,s=>{v.value=(s==null?void 0:s.filter(i=>i.longitude&&i.latitude).slice(0,200))||[],k()},{immediate:!0,deep:!0}),Ve(()=>{l&&(l.clear(),l.setMap(null)),o.value&&o.value.destroy()}),(s,i)=>(c(),p("div",ht))}}),gt=H(mt,[["__scopeId","data-v-e3b512f7"]]),yt={class:"content_wrap"},wt={class:"d-flex jc-center title_wrap"},kt={class:"top_Info"},xt={class:"left"},bt={class:"right"},$t={class:"index-box"},Ct={class:"contentTop"},St={class:"contentTopLeft"},Tt={class:"iconBox"},Mt={class:"titleText"},It={class:"unit"},Lt={class:"contentRightBox"},jt={class:"titleText"},Wt={class:"unit"},zt={class:"contentTopCenter"},Bt={class:"contentRight"},Dt={class:"flex-col"},Rt={class:"flex-col items-center"},At={class:"flex-col justify-center items-center"},Pt={class:"titleText"},Kt={class:"unit"},Yt={class:"flex-col crc"},Et={class:"flex-col items-center"},Nt={class:"flex-col justify-center items-center mt-12px"},Vt={class:"titleText"},Ht={class:"unit"},Ft={class:"flex levelCssBox"},Gt={class:"flex justify-between items-center"},Ot={class:"flex items-center"},Ut={class:"levelName"},qt=P({name:"bigscreen",__name:"index",setup(b){const u=Fe(),d=Ge({dateDay:"",dateYear:"",dateWeek:"",timing:null});Oe();const w=Ie(),o=["周日","周一","周二","周三","周四","周五","周六"];(()=>{d.timing=setInterval(()=>{d.dateDay=Se().format("YYYY-MM-DD hh : mm : ss"),d.dateWeek=o[Se().day()]},1e3)})();const e=y({}),l=async()=>{var S,K,j,z,B,I,Y,a,f,G,O,U,q,J,X,Z,Q,ee,te,ae,oe,ne,le,se,ie,ce,re,de,ue,ve,pe,fe,_e,he,me,ge,ye,we,ke,xe,be,$e;const{data:W,error:C}=await Ae();C||(e.value=W,console.log(e.value),n.value[0].value=(K=(S=e.value)==null?void 0:S.snstatus)==null?void 0:K.total,n.value[1].value=(z=(j=e.value)==null?void 0:j.snstatus)==null?void 0:z.online,n.value[2].value=(I=(B=e.value)==null?void 0:B.snstatus)==null?void 0:I.offline,n.value[3].value=(a=(Y=e.value)==null?void 0:Y.snstatus)==null?void 0:a.unknown,k.value[0].value=(G=(f=e.value)==null?void 0:f.power)==null?void 0:G.chargeday,k.value[1].value=(U=(O=e.value)==null?void 0:O.power)==null?void 0:U.dischargeday,k.value[2].value=(J=(q=e.value)==null?void 0:q.power)==null?void 0:J.chargemon,k.value[3].value=(Z=(X=e.value)==null?void 0:X.power)==null?void 0:Z.dischargemon,k.value[4].value=(ee=(Q=e.value)==null?void 0:Q.power)==null?void 0:ee.chargeyear,k.value[5].value=(ae=(te=e.value)==null?void 0:te.power)==null?void 0:ae.dischargeyear,L.value[0].value=(ne=(oe=e.value)==null?void 0:oe.income)==null?void 0:ne.yesterdayIncome,L.value[1].value=(se=(le=e.value)==null?void 0:le.income)==null?void 0:se.monthIncome,L.value[2].value=(ce=(ie=e.value)==null?void 0:ie.income)==null?void 0:ce.yearIncome,M.value[0].value=(de=(re=e.value)==null?void 0:re.power)==null?void 0:de.totalload,M.value[1].value=(ve=(ue=e.value)==null?void 0:ue.power)==null?void 0:ve.totalbatterypower,M.value[2].value=(fe=(pe=e.value)==null?void 0:pe.power)==null?void 0:fe.totalbatterycharge,M.value[3].value=(he=(_e=e.value)==null?void 0:_e.power)==null?void 0:he.totalbatterydischarge,T.value=(ge=(me=e.value)==null?void 0:me.event)==null?void 0:ge.total,$.value[0].value=(we=(ye=e.value)==null?void 0:ye.event)==null?void 0:we.level0,$.value[1].value=(xe=(ke=e.value)==null?void 0:ke.event)==null?void 0:xe.level1,$.value[2].value=($e=(be=e.value)==null?void 0:be.event)==null?void 0:$e.level2)},n=y([{key:"total",title:"网关总数量",value:0,icon:"gateway",unit:"个"},{key:"online",title:"在线数量",value:0,icon:"gateway",unit:"个"},{key:"offline",title:"离线数量",value:0,icon:"gateway",unit:"个"},{key:"unknown",title:"未知数量",value:0,icon:"gateway",unit:"个"}]),T=y(0),$=y([{name:"普通",value:0,color:"#0096ff"},{name:"严重",value:0,color:"#ff9600"},{name:"事故",value:0,color:"#ff0000"}]),L=y([{key:"yesterdayIncome",title:"昨日收益",value:0,icon:"income",unit:"元"},{key:"monthIncome",title:"本月收益",value:0,icon:"income",unit:"元"},{key:"yearIncome",title:"本年收益",value:0,icon:"income",unit:"元"}]),M=y([{key:"totalload",title:"总负荷",value:0,icon:"totalload",unit:"kW"},{key:"totalbatterypower",title:"总功率",value:0,icon:"totalbatterypower",unit:"kW"},{key:"totalbatterycharge",title:"累计电池总充电量",value:0,icon:"rongliang",unit:"kWh"},{key:"totalbatterydischarge",title:"累计电池总放电量",value:0,icon:"totalbatterydischarge",unit:"kWh"}]),k=y([{key:"chargeday",title:"当日累计充电量",value:0,unit:"KW·h"},{key:"dischargeday",title:"当日累计放电量",value:0,unit:"KW·h"},{key:"chargemon",title:"当月累计充电量",value:0,unit:"KW·h"},{key:"dischargemon",title:"当月累计放电量",value:0,unit:"KW·h"},{key:"chargeyear",title:"当年累计充电量",value:0,unit:"KW·h"},{key:"dischargeyear",title:"当年累计放电量",value:0,unit:"KW·h"}]),s=y(0),i=et(()=>{s.value++},500),m=()=>{i()},x=y(!1);Le(async()=>{try{x.value=!0,l()}catch{}finally{x.value=!1}window.addEventListener("resize",m)}),Ue(()=>{});const je=()=>{w.push("/projectmanagement/projectlist")},We=async()=>{var W;(W=window.$dialog)==null||W.info({title:E("common.tip"),content:E("common.logoutConfirm"),positiveText:E("common.confirm"),negativeText:E("common.cancel"),onPositiveClick:async()=>{try{const{data:C,error:S}=await Qe();u.clearInfo(),window.location.reload()}catch(C){console.log("e",C),u.clearInfo()}}})};return(W,C)=>{const S=Je,K=Be,j=De,z=Ze,B=Xe,I=ft,Y=Re;return c(),p(D,null,[t("div",yt,[t("div",wt,[C[1]||(C[1]=qe('<div class="zuojuxing" data-v-d3001596></div><div class="youjuxing" data-v-d3001596></div><div class="guang" data-v-d3001596></div><div class="d-flex jc-center" data-v-d3001596><div class="title" data-v-d3001596><span class="title-text" data-v-d3001596>储能云平台</span></div></div>',4)),t("div",kt,[t("div",xt,[t("div",{class:"setting_icon flex items-center font-bold",onClick:je},[r(S,{"local-icon":"return",class:"returnCss"}),C[0]||(C[0]=Ce(" 返回 "))])]),t("div",bt,[t("div",null,h(d.dateYear)+" "+h(d.dateWeek)+" "+h(d.dateDay),1),t("div",{class:"cursor-pointer logoutCss",onClick:We},[r(K)])])])]),t("div",$t,[t("div",Ct,[t("div",St,[r(I,{class:"contentTopLeftTop",title:"平台概况"},{default:g(()=>[r(B,{cols:M.value.length/2,responsive:"screen",class:"gridCss"},{default:g(()=>[(c(!0),p(D,null,R(M.value,(a,f)=>(c(),A(z,{key:a.key},{default:g(()=>[t("div",{class:Me(["powerCard",[f===0?"border-r border-b":"",f===1?"border-b":"",f===2?"border-r":""]])},[t("div",Tt,[r(S,{"local-icon":a.icon,class:"svgCSS",style:{color:"#00eaff"}},null,8,["local-icon"])]),r(j,{"start-value":0,"end-value":a.value,style:{color:"#00eaff"},class:"CountTotext"},null,8,["end-value"]),t("div",Mt,h(a.title),1),t("div",It," ("+h(a.unit)+") ",1)],2)]),_:2},1024))),128))]),_:1},8,["cols"])]),_:1}),r(I,{class:"contentTopLeftBottom",title:"充放电统计"},{default:g(()=>[t("div",Lt,[(c(!0),p(D,null,R(k.value,(a,f)=>(c(),p("div",{class:"contentTopRightItem",key:f},[t("div",jt,[Ce(h(a.title)+" ",1),t("span",Wt,"("+h(a.unit)+")",1)]),r(j,{"start-value":0,"end-value":a.value,decimals:2,style:N([{color:f%2==0?"#44bd32":"#ff9600"},{"font-family":"dsdigits","font-weight":"bolder"}]),class:"CountTotext dark:text-dark text-center"},null,8,["end-value","style"])]))),128))])]),_:1})]),t("div",zt,[r(gt,{data:e.value.project,style:{height:"100%"}},null,8,["data"])]),t("div",Bt,[r(I,{class:"contentRightTop",title:"收益指标"},{default:g(()=>[r(B,{cols:L.value.length,responsive:"screen",class:"gridCss"},{default:g(()=>[(c(!0),p(D,null,R(L.value,(a,f)=>(c(),A(z,{key:a.key},{default:g(()=>[t("div",Dt,[t("div",Rt,[r(S,{"local-icon":a.icon,class:"svgCSS",style:{color:"#00eaff"}},null,8,["local-icon"])]),t("div",At,[r(j,{"start-value":1,"end-value":a.value,style:{color:"#00eaff"},class:"CountTotext dark:text-dark text-center"},null,8,["end-value"]),t("h3",Pt,h(a.title),1),t("span",Kt,"("+h(a.unit)+")",1)])])]),_:2},1024))),128))]),_:1},8,["cols"])]),_:1}),r(I,{class:"contentRightcenter",title:"平台运行信息"},{default:g(()=>[r(B,{cols:n.value.length,responsive:"screen",class:"gridCss"},{default:g(()=>[(c(!0),p(D,null,R(n.value,(a,f)=>(c(),A(z,{key:a.key},{default:g(()=>[t("div",Yt,[t("div",Et,[r(S,{"local-icon":a.icon,class:"svgCSS",style:N({color:f==0?"#00eaff":f==1?"#44bd32":f==2?"#ff0000":"#ccc"})},null,8,["local-icon","style"])]),t("div",Nt,[r(j,{"start-value":0,"end-value":a.value,style:{color:"#00eaff"},class:"CountTotext dark:text-dark text-center"},null,8,["end-value"]),t("h3",Vt,h(a.title),1),t("span",Ht,"("+h(a.unit)+")",1)])])]),_:2},1024))),128))]),_:1},8,["cols"])]),_:1}),r(I,{class:"contentRightBottom",title:"告警事件"},{default:g(()=>[r(_t,{data:$.value,eventTotal:T.value,class:"levelChart"},null,8,["data","eventTotal"]),t("div",Ft,[(c(!0),p(D,null,R($.value,a=>(c(),p("div",{key:a.name,class:"levelCssItem",style:N({background:a.color})},[t("div",Gt,[t("div",Ot,[t("div",Ut,h(a.name),1)]),t("div",null,h(a.value),1)])],4))),128))])]),_:1})])])])]),x.value?(c(),A(Y,{key:0})):Te("",!0)],64)}}}),ta=H(qt,[["__scopeId","data-v-d3001596"]]);export{ta as default};
