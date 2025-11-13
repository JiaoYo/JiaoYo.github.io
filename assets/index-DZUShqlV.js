import{d as B,r as u,a as g,i as R,dn as S,b as r,o as l,e as t,f as V,g as d,t as v,ab as q,w as H,z as K,a2 as _,a1 as $,T as L,eN as O,a3 as U}from"./index-BvFB2cuj.js";import{c as W,b as F}from"./home-BXToz1zf.js";const Y={class:"map-wrapper",style:{height:"600px",position:"relative"}},G={class:"info-panel"},J={style:{color:"#1890ff","font-weight":"700","font-size":"24px"}},Q={style:{margin:"0 5px"}},X={style:{color:"#52c41a","font-weight":"700","font-size":"24px"}},Z={style:{color:"#faad14","font-weight":"700","font-size":"24px"}},ee={key:0,class:"details"},ae={style:{"margin-bottom":"10px"}},te=B({name:"trajectory_realtimetrajectory",__name:"index",setup(ne){const i=u([]),s=u(null);let c=null;async function z(){const a="/map-sdk.json",{data:e}=await O.get(`${a}?_t=${Date.now()}`);return e}function C(a){return new Promise((e,n)=>{if(window.AMap)return e(window.AMap);const o=document.createElement("script");o.src=`https://webapi.amap.com/maps?v=2.0&key=${a}`,o.defer=!0,o.onload=()=>window.AMap?e(window.AMap):n(new Error("AMap加载失败")),o.onerror=()=>n(new Error("AMap脚本加载错误")),document.head.appendChild(o)})}const f=u(!1),P=()=>{f.value=!f.value},y=g(()=>i.value.filter(a=>a.pid!=-1)),b=g(()=>i.value.filter(a=>a.pid==-1)),D=g(()=>y.value.length),I=g(()=>b.value.length);async function x(){const{data:a,error:e}=await W();e||(i.value=a)}const p=u({contractname:"",dispatch:"",debugname:"",dbdbtime:""}),A=async a=>{const{data:e,error:n}=await F({pid:a.pid>0?a.pid:void 0,creater:a.creater});p.value=e};async function E(){const a=await z(),e=await C(a.AMAP_SDK_KEY);s.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36]}),c=new e.InfoWindow({offset:new e.Pixel(0,-30)}),N(e),s.value.on("click",()=>{c.close()})}function N(a){console.log(i.value,"srealTimeTrack"),i.value.forEach(e=>{new a.Marker({position:[e.longitude,e.latitude],content:'<div class="marker-dot"></div>',anchor:"center",offset:new a.Pixel(0,0),zooms:[3,19]}).setMap(s.value);const o=document.createElement("div");o.className="custom-marker",o.style="display: flex;align-items: center;flex-direction: column;z-index:999;",o.innerHTML=`
      <div class="avatar-wrapper">
        <img src="${e.userimage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
      </div>
      <div class="marker-name">${e.username}</div>
    `;const m=new a.Marker({position:[e.longitude,e.latitude],content:o,anchor:"bottom-center",offset:new a.Pixel(0,-5),zooms:[3,19]});m.on("click",async()=>{var k,h,M,T;await A(e);const j=`
      <div style="
        min-width: 260px;
        font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 13px;
        color: #333;
        line-height: 1.6;
        background: #fff;
        padding: 12px 14px;
      ">

        <!-- 头像 + 姓名 -->
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <img 
            src="${e.userimage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" 
            style="
              width: 40px;
              height: 40px;
              object-fit: cover;
              margin-right: 10px;
            "
          />
          <div>
            <div style="font-weight: bold; font-size: 15px; color: #1890ff;">${e.username||"未知人员"}</div>
            <div style="font-size: 12px; color: #999;">调试人员</div>
          </div>
        </div>

        <div style="border-top: 1px dashed #e8e8e8; margin: 8px 0;"></div>

        <div><b>打卡时间：</b><span style="color:#1890ff;">${e.dbtime||"-"}</span></div>
        <div><b>地址：</b><span style="color:#1890ff;">${e.address||"-"}</span></div>

        <div style="margin-top: 8px; font-weight: 500; color: #666;">项目信息</div>
        <div><b>项目名称：</b><span style="color:#1890ff;">${e.proname||"-"}</span></div>
        <div><b>合同名称：</b><span style="color:#1890ff;">${((k=p.value)==null?void 0:k.contractname)||"-"}</span></div>
        <div><b>调度名称：</b><span style="color:#1890ff;">${((h=p.value)==null?void 0:h.dispatch)||"-"}</span></div>
        <div><b>调试任务：</b><span style="color:#1890ff;">${((M=p.value)==null?void 0:M.debugname)||"-"}</span></div>
        <div><b>开始时间：</b><span style="color:#1890ff;">${((T=p.value)==null?void 0:T.dbdbtime)||"-"}</span></div>

      </div>
    `;c.setContent(j),c.setOffset(new a.Pixel(0,-80)),c.open(s.value,m.getPosition()),s.value.setCenter(m.getPosition())}),m.setMap(s.value)})}const w=u(null);return R(async()=>{await x(),w.value=window.setInterval(x,1e3*60*5),E()}),S(()=>{w.value&&clearInterval(w.value),s.value&&s.value.destroy()}),(a,e)=>(l(),r("div",Y,[e[8]||(e[8]=t("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)),t("div",G,[t("div",{onClick:P,class:"cursor-pointer"},[t("span",null,[e[0]||(e[0]=d(" 今日出勤人数：共 ")),t("span",J,v(i.value.length),1),e[1]||(e[1]=d(" 人 "))]),t("span",Q,[e[2]||(e[2]=d(" 外勤人数： ")),t("span",X,v(D.value),1),e[3]||(e[3]=d(" 人 "))]),t("span",null,[e[4]||(e[4]=d(" 公司人数： ")),t("span",Z,v(I.value),1),e[5]||(e[5]=d(" 人 "))]),t("span",{class:q(["arrow",{open:f.value}])},"▼",2)]),V(L,{name:"slide"},{default:H(()=>[f.value?(l(),r("div",ee,[t("div",ae,[e[6]||(e[6]=t("h3",null,"外勤人员：",-1)),(l(!0),r(_,null,$(y.value,n=>(l(),r("span",{class:"fieldwork",key:n.id},v(n.username),1))),128))]),t("div",null,[e[7]||(e[7]=t("h3",null,"公司人员：",-1)),(l(!0),r(_,null,$(b.value,n=>(l(),r("span",{class:"company",key:n.id},v(n.username),1))),128))])])):K("",!0)]),_:1})])]))}}),ie=U(te,[["__scopeId","data-v-41d6fe8d"]]);export{ie as default};
