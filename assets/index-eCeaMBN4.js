import{d as M,r as i,i as _,de as $,b as x,o as y,e as T,bs as A,ae as E}from"./index-CXGXpIU7.js";import{c as I,b as P}from"./home-DXkm5H_7.js";const C={class:"map-wrapper",style:{height:"600px",position:"relative"}},D=M({name:"trajectory_realtimetrajectory",__name:"index",setup(j){const c=i([]),r=i(null);let o=null;async function v(){const a="/map-sdk.json",{data:e}=await A.get(`${a}?_t=${Date.now()}`);return e}function f(a){return new Promise((e,n)=>{if(window.AMap)return e(window.AMap);const t=document.createElement("script");t.src=`https://webapi.amap.com/maps?v=2.0&key=${a}`,t.defer=!0,t.onload=()=>window.AMap?e(window.AMap):n(new Error("AMap加载失败")),t.onerror=()=>n(new Error("AMap脚本加载错误")),document.head.appendChild(t)})}async function l(){const{data:a,error:e}=await I();e||(c.value=a)}const s=i({contractname:"",dispatch:"",debugname:"",dbdbtime:""}),w=async a=>{const{data:e,error:n}=await P({pid:a.pid>0?a.pid:void 0,creater:a.creater});s.value=e};async function k(){const a=await v(),e=await f(a.AMAP_SDK_KEY);r.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36]}),o=new e.InfoWindow({offset:new e.Pixel(0,-30)}),g(e),r.value.on("click",()=>{o.close()})}function g(a){console.log(c.value,"srealTimeTrack"),c.value.forEach(e=>{const n=document.createElement("div");n.className="custom-marker",n.style.transform="translateX(-50%)",n.innerHTML=`
      <div class="avatar-wrapper">
        <img src="${e.userimage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
      </div>
      <div class="marker-name">${e.username}</div>
    `;const t=new a.Marker({position:[e.longitude,e.latitude],content:n,anchor:"bottom-center",offset:new a.Pixel(0,-25),zooms:[3,19]});t.on("click",async()=>{var p,u,m,b;await w(e);const h=`
        <div style="min-width:180px;" >
          <b>项目名称：</b> ${e.proname||""}<br/>
          <b>合同名称：</b> ${((p=s.value)==null?void 0:p.contractname)||""}<br/>
          <b>调度名称：</b> ${((u=s.value)==null?void 0:u.dispatch)||""}<br/>
          <b>调试任务名称：</b> ${((m=s.value)==null?void 0:m.debugname)||""}<br/>
          <b>任务时间：</b> ${((b=s.value)==null?void 0:b.dbdbtime)||""}<br/>
          <b>经度：</b> ${e.longitude.toFixed(6)||""}<br/>
          <b>纬度：</b> ${e.latitude.toFixed(6)||""}<br/>
          <b>地址：</b> ${e.address||""}<br/>
          <b>时间：</b> ${e.dbtime||""}<br/>
          <b>用户：</b> ${e.username||""}<br/>
        </div>
      `;o.setContent(h),o.setOffset(new a.Pixel(0,-80)),o.open(r.value,t.getPosition()),r.value.setCenter(t.getPosition())}),t.setMap(r.value)})}const d=i(null);return _(async()=>{await l(),d.value=window.setInterval(l,1e3*60*5),k()}),$(()=>{d.value&&clearInterval(d.value),r.value&&r.value.destroy()}),(a,e)=>(y(),x("div",C,e[0]||(e[0]=[T("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)])))}}),z=E(D,[["__scopeId","data-v-e039d7fd"]]);export{z as default};
