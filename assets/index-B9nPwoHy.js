import{d as g,r as c,i as M,dh as _,b as $,o as x,e as T,bs as A,a6 as E}from"./index-DMk9ecAg.js";import{c as I,b as P}from"./home-NiN8q0EL.js";const C={class:"map-wrapper",style:{height:"600px",position:"relative"}},D=g({name:"trajectory_realtimetrajectory",__name:"index",setup(j){const i=c([]),o=c(null);let r=null;async function b(){const a="/map-sdk.json",{data:e}=await A.get(`${a}?_t=${Date.now()}`);return e}function v(a){return new Promise((e,t)=>{if(window.AMap)return e(window.AMap);const n=document.createElement("script");n.src=`https://webapi.amap.com/maps?v=2.0&key=${a}`,n.defer=!0,n.onload=()=>window.AMap?e(window.AMap):t(new Error("AMap加载失败")),n.onerror=()=>t(new Error("AMap脚本加载错误")),document.head.appendChild(n)})}async function d(){const{data:a,error:e}=await I();e||(i.value=a)}const s=c({contractname:"",dispatch:"",debugname:"",dbdbtime:""}),w=async a=>{const{data:e,error:t}=await P({pid:a.pid>0?a.pid:void 0,creater:a.creater});s.value=e};async function k(){const a=await b(),e=await v(a.AMAP_SDK_KEY);o.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36]}),r=new e.InfoWindow({offset:new e.Pixel(0,-30)}),y(e),o.value.on("click",()=>{r.close()})}function y(a){console.log(i.value,"srealTimeTrack"),i.value.forEach(e=>{const t=document.createElement("div");t.className="custom-marker",t.style.transform="translateX(-50%)",t.innerHTML=`
      <div class="avatar-wrapper">
        <img src="${e.userimage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
      </div>
      <div class="marker-name">${e.username}</div>
    `;const n=new a.Marker({position:[e.longitude,e.latitude],content:t,anchor:"bottom-center",offset:new a.Pixel(0,-25),zooms:[3,19]});n.on("click",async()=>{var p,u,f,m;await w(e);const h=`
      <div style="min-width:180px;">
        <b>调试人：</b> <span style="color:#1890ff">${e.username||""}</span><br/>
        <b>打卡时间：</b> <span style="color:#1890ff">${e.dbtime||""}</span><br/>
        <b>地址：</b> <span style="color:#1890ff">${e.address||""}</span><br/>
        <b>项目名称：</b> <span style="color:#1890ff">${e.proname||""}</span><br/>
        <b>合同名称：</b> <span style="color:#1890ff">${((p=s.value)==null?void 0:p.contractname)||""}</span><br/>
        <b>调度名称：</b> <span style="color:#1890ff">${((u=s.value)==null?void 0:u.dispatch)||""}</span><br/>
        <b>调试任务名称：</b> <span style="color:#1890ff">${((f=s.value)==null?void 0:f.debugname)||""}</span><br/>
        <b>任务开始时间：</b> <span style="color:#1890ff">${((m=s.value)==null?void 0:m.dbdbtime)||""}</span><br/>
      </div>
    `;r.setContent(h),r.setOffset(new a.Pixel(0,-80)),r.open(o.value,n.getPosition()),o.value.setCenter(n.getPosition())}),n.setMap(o.value)})}const l=c(null);return M(async()=>{await d(),l.value=window.setInterval(d,1e3*60*5),k()}),_(()=>{l.value&&clearInterval(l.value),o.value&&o.value.destroy()}),(a,e)=>(x(),$("div",C,e[0]||(e[0]=[T("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)])))}}),z=E(D,[["__scopeId","data-v-ca274ec3"]]);export{z as default};
