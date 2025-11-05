import{d as M,r as s,i as _,cA as x,b as y,o as $,e as T,bp as A,ac as E}from"./index-4KD-vN5g.js";import{c as I,b as P}from"./home-Cxad4oC4.js";const C={class:"map-wrapper",style:{height:"600px",position:"relative"}},D=M({name:"trajectory_realtimetrajectory",__name:"index",setup(j){const c=s([]),n=s(null);let r=null;async function f(){const a="https://dingiiot.com/map-sdk.json",{data:e}=await A.get(`${a}?_t=${Date.now()}`);return e}function v(a){return new Promise((e,o)=>{if(window.AMap)return e(window.AMap);const t=document.createElement("script");t.src=`https://webapi.amap.com/maps?v=2.0&key=${a}`,t.defer=!0,t.onload=()=>window.AMap?e(window.AMap):o(new Error("AMap加载失败")),t.onerror=()=>o(new Error("AMap脚本加载错误")),document.head.appendChild(t)})}async function l(){const{data:a,error:e}=await I();e||(c.value=a)}const i=s({contractname:"",dispatch:"",debugname:"",dbdbtime:""}),w=async a=>{const{data:e,error:o}=await P({pid:a.pid>0?a.pid:void 0,creater:a.creater});i.value=e};async function k(){const a=await f(),e=await v(a.AMAP_SDK_KEY);n.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36]}),r=new e.InfoWindow({offset:new e.Pixel(0,-30)}),g(e),n.value.on("click",()=>{r.close()})}function g(a){console.log(c.value,"srealTimeTrack"),c.value.forEach(e=>{const o=document.createElement("div");o.className="custom-marker",o.style.transform="translateX(-50%)",o.innerHTML=`
      <div class="avatar-wrapper">
        <img src="https://pictures.linkqi.cn/work-project/image/cf69b543-f6b7-44e2-a3d0-a28f56fc9cb98962888825725658039.png?Avatar.png" class="marker-avatar" />
      </div>
      <div class="marker-name">${e.username}</div>
    `;const t=new a.Marker({position:[e.longitude,e.latitude],content:o,anchor:"bottom-center",offset:new a.Pixel(0,-25),zooms:[3,19]});t.on("click",async()=>{var p,u,m,b;await w(e);const h=`
        <div style="min-width:180px;" >
          <b>项目名称：</b> ${e.proname||""}<br/>
          <b>合同名称：</b> ${((p=i.value)==null?void 0:p.contractname)||""}<br/>
          <b>调度名称：</b> ${((u=i.value)==null?void 0:u.dispatch)||""}<br/>
          <b>调试任务名称：</b> ${((m=i.value)==null?void 0:m.debugname)||""}<br/>
          <b>任务时间：</b> ${((b=i.value)==null?void 0:b.dbdbtime)||""}<br/>
          <b>经度：</b> ${e.longitude.toFixed(6)||""}<br/>
          <b>纬度：</b> ${e.latitude.toFixed(6)||""}<br/>
          <b>地址：</b> ${e.address||""}<br/>
          <b>时间：</b> ${e.dbtime||""}<br/>
        </div>
      `;r.setContent(h),r.setOffset(new a.Pixel(0,-80)),r.open(n.value,t.getPosition()),n.value.setCenter(t.getPosition()),n.value.setZoom(15)}),t.setMap(n.value)})}const d=s(null);return _(async()=>{await l(),d.value=window.setInterval(l,1e3*60*5),k()}),x(()=>{d.value&&clearInterval(d.value),n.value&&n.value.destroy()}),(a,e)=>($(),y("div",C,e[0]||(e[0]=[T("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)])))}}),z=E(D,[["__scopeId","data-v-3b695f0f"]]);export{z as default};
