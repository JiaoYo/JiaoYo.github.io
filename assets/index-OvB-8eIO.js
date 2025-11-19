import{d as E,r as c,a as u,i as N,dF as j,b as v,o as f,e as s,f as R,g as h,t as _,aN as V,w as B,z as S,aR as L,aV as q,T as F,aI as H,aL as K}from"./index--GDXRx9n.js";import{c as O,b as U}from"./home-B-BgWMDo.js";const W={class:"map-wrapper",style:{height:"600px",position:"relative"}},Y={class:"info-panel"},Z={style:{margin:"0 5px"}},G={style:{color:"#52c41a","font-weight":"700","font-size":"24px"}},J={key:0,class:"details"},Q={style:{"margin-bottom":"10px"}},X=E({name:"trajectory_realtimetrajectory",__name:"index",setup(ee){const l=c([]),t=c(null);let r=null;async function M(){const a="/map-sdk.json",{data:e}=await H.get(`${a}?_t=${Date.now()}`);return e}function T(a){return new Promise((e,o)=>{if(window.AMap)return e(window.AMap);const n=document.createElement("script");n.src=`https://webapi.amap.com/maps?v=2.0&key=${a}`,n.defer=!0,n.onload=()=>window.AMap?e(window.AMap):o(new Error("AMap加载失败")),n.onerror=()=>o(new Error("AMap脚本加载错误")),document.head.appendChild(n)})}const p=c(!1),$=()=>{p.value=!p.value},g=u(()=>l.value.filter(a=>a.pid!=-1)),P=u(()=>l.value.filter(a=>a.pid==-1)),C=u(()=>g.value.length);u(()=>P.value.length);async function w(){const{data:a,error:e}=await O();e||(l.value=a.filter(o=>o.pid!==-1))}const d=c({contractname:"",dispatch:"",debugname:"",dbdbtime:""}),z=async a=>{const{data:e,error:o}=await U({pid:a.pid>0?a.pid:void 0,creater:a.creater});d.value=e};async function I(){const a=await M(),e=await T(a.AMAP_SDK_KEY);t.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36]}),r=new e.InfoWindow({offset:new e.Pixel(0,-30)}),D(e),t.value.on("click",()=>{r.close()})}function D(a){console.log(l.value,"srealTimeTrack"),l.value.forEach(e=>{new a.Marker({position:[e.longitude,e.latitude],content:'<div class="marker-dot"></div>',anchor:"center",offset:new a.Pixel(0,0),zooms:[3,19]}).setMap(t.value);const n=document.createElement("div");n.className="custom-marker",n.style="display: flex;align-items: center;flex-direction: column;z-index:999;",n.innerHTML=`
      <div class="avatar-wrapper">
        <img src="${e.userimage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
      </div>
      <div class="marker-name">${e.username}</div>
    `;const i=new a.Marker({position:[e.longitude,e.latitude],content:n,anchor:"bottom-center",offset:new a.Pixel(0,-5),zooms:[3,19]});i.on("click",async()=>{var b,y,k,x;await z(e);const A=`
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
        <div><b>合同名称：</b><span style="color:#1890ff;">${((b=d.value)==null?void 0:b.contractname)||"-"}</span></div>
        <div><b>调度名称：</b><span style="color:#1890ff;">${((y=d.value)==null?void 0:y.dispatch)||"-"}</span></div>
        <div><b>调试任务：</b><span style="color:#1890ff;">${((k=d.value)==null?void 0:k.debugname)||"-"}</span></div>
        <div><b>开始时间：</b><span style="color:#1890ff;">${((x=d.value)==null?void 0:x.dbdbtime)||"-"}</span></div>

      </div>
    `;r.setContent(A),r.setOffset(new a.Pixel(0,-80)),r.open(t.value,i.getPosition()),t.value.setCenter(i.getPosition())}),i.on("dblclick",()=>{r.open(t.value,i.getPosition()),t.value.setCenter(i.getPosition()),t.value.setZoom(14)}),i.setMap(t.value)})}const m=c(null);return N(async()=>{await w(),m.value=window.setInterval(w,1e3*60*5),I()}),j(()=>{m.value&&clearInterval(m.value),t.value&&t.value.destroy()}),(a,e)=>(f(),v("div",W,[e[3]||(e[3]=s("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)),s("div",Y,[s("div",{onClick:$,class:"cursor-pointer"},[s("span",Z,[e[0]||(e[0]=h(" 今日外勤人数：共 ")),s("span",G,_(C.value),1),e[1]||(e[1]=h(" 人 "))]),s("span",{class:V(["arrow",{open:p.value}])},"▼",2)]),R(F,{name:"slide"},{default:B(()=>[p.value?(f(),v("div",J,[s("div",Q,[e[2]||(e[2]=s("h3",null,"外勤人员：",-1)),(f(!0),v(L,null,q(g.value,o=>(f(),v("span",{class:"fieldwork",key:o.id},_(o.username),1))),128))])])):S("",!0)]),_:1})])]))}}),ne=K(X,[["__scopeId","data-v-706e99d4"]]);export{ne as default};
