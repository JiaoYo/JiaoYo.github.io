import{d as H,r as w,a as y,i as K,dL as O,b as s,o,e as a,f as u,g as p,t as l,h as N,aP as W,w as f,z as F,b1 as G,b2 as X,aT as g,aX as x,ax as Y,T as Z,aI as J,b4 as Q,aM as ee}from"./index-g7h47wCD.js";import{c as te,b as ae}from"./home-DdAxqb5_.js";import{u as ne}from"./usePageData-CSmi2WoD.js";const se={class:"map-wrapper",style:{height:"600px",position:"relative"}},oe={class:"clockInInfo"},le={style:{color:"#1890ff","font-weight":"700","font-size":"20px"}},ie={style:{color:"#52c41a","font-weight":"700","font-size":"20px"}},re={style:{color:"#faad14","font-weight":"700","font-size":"20px"}},de={style:{color:"#8a8886","font-weight":"700","font-size":"20px"}},ce={key:0,class:"details"},pe={class:"flex-shrink-0 flex flex-col items-center justify-center w-20"},ue=["src"],fe={class:"mt-2 c-#52c41a text-sm font-bold text-center truncate w-full"},ve={class:"flex-1 flex flex-col justify-center gap-1"},me={class:"flex text-sm"},we={class:"text-[#4169e1] font-semibold"},ge={class:"flex text-sm"},xe={class:"text-[#4169e1] font-semibold"},be={class:"flex text-sm"},ye={class:"text-[#4169e1] font-semibold"},_e=H({name:"trajectory_realtimetrajectory",__name:"index",setup(ke){const v=w([]),r=w(null);let m=null;const{pageData:k,getData:S}=ne(Q);async function B(){const n="/map-sdk.json",{data:e}=await J.get(`${n}?_t=${Date.now()}`);return e}function L(n){return new Promise((e,d)=>{if(window.AMap)return e(window.AMap);const i=document.createElement("script");i.src=`https://webapi.amap.com/maps?v=2.0&key=${n}`,i.defer=!0,i.onload=()=>window.AMap?e(window.AMap):d(new Error("AMap加载失败")),i.onerror=()=>d(new Error("AMap脚本加载错误")),document.head.appendChild(i)})}const _=w(!1),h=y(()=>v.value.filter(n=>n.pid!=-1)),P=y(()=>v.value.filter(n=>n.pid==-1)),T=y(()=>k.data.filter(n=>!v.value.some(e=>e.creater==n.id))),z=w("inPeople"),R=()=>{_.value=!_.value},$=y(()=>h.value.length),C=y(()=>P.value.length);async function I(){const{data:n,error:e}=await te();e||(v.value=n)}const b=w({contractname:"",dispatch:"",debugname:"",dbdbtime:""}),U=async n=>{const{data:e,error:d}=await ae({pid:n.pid>0?n.pid:void 0,creater:n.creater});b.value=e};async function V(){const n=await B(),e=await L(n.AMAP_SDK_KEY);r.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36]}),m=new e.InfoWindow({offset:new e.Pixel(0,-30)}),q(e),r.value.on("click",()=>{m.close()})}function q(n){console.log(v.value,"srealTimeTrack"),v.value.forEach(e=>{new n.Marker({position:[e.longitude,e.latitude],content:'<div class="marker-dot"></div>',anchor:"center",offset:new n.Pixel(0,0),zooms:[3,19]}).setMap(r.value);const i=document.createElement("div");i.className="custom-marker",i.style="display: flex;align-items: center;flex-direction: column;z-index:999;",i.innerHTML=`
      <div class="avatar-wrapper">
        <img src="${e.userimage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
      </div>
      <div class="marker-name">${e.username}</div>
    `;const c=new n.Marker({position:[e.longitude,e.latitude],content:i,anchor:"bottom-center",offset:new n.Pixel(0,-5),zooms:[3,19]});c.on("click",async()=>{var D,j,A,E;await U(e);const t=`
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
        <div><b>合同名称：</b><span style="color:#1890ff;">${((D=b.value)==null?void 0:D.contractname)||"-"}</span></div>
        <div><b>调度名称：</b><span style="color:#1890ff;">${((j=b.value)==null?void 0:j.dispatch)||"-"}</span></div>
        <div><b>调试任务：</b><span style="color:#1890ff;">${((A=b.value)==null?void 0:A.debugname)||"-"}</span></div>
        <div><b>开始时间：</b><span style="color:#1890ff;">${((E=b.value)==null?void 0:E.dbdbtime)||"-"}</span></div>

      </div>
    `;m.setContent(t),m.setOffset(new n.Pixel(0,-80)),m.open(r.value,c.getPosition()),r.value.setCenter(c.getPosition())}),c.on("dblclick",()=>{m.open(r.value,c.getPosition()),r.value.setCenter(c.getPosition()),r.value.setZoom(14)}),c.setMap(r.value)})}const M=w(null);return K(async()=>{S({usertypes:"2,3"}),await I(),M.value=window.setInterval(I,1e3*60*5),V()}),O(()=>{M.value&&clearInterval(M.value),r.value&&r.value.destroy()}),(n,e)=>{const d=X,i=Y,c=G;return o(),s("div",se,[e[12]||(e[12]=a("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)),a("div",oe,[a("div",{class:"title",onClick:R,style:{display:"flex","align-items":"center",gap:"16px","font-size":"16px"}},[a("span",null,[e[1]||(e[1]=p(" 共 ")),a("span",le,l(N(k).data.length),1),e[2]||(e[2]=p(" 人 "))]),a("span",null,[e[3]||(e[3]=p(" 今日外勤人数： ")),a("span",ie,l($.value),1),e[4]||(e[4]=p(" 人 "))]),a("span",null,[e[5]||(e[5]=p(" 公司人数： ")),a("span",re,l(C.value),1),e[6]||(e[6]=p(" 人 "))]),a("span",null,[e[7]||(e[7]=p(" 未知： ")),a("span",de,l(N(k).data.length-$.value-C.value),1),e[8]||(e[8]=p(" 人 "))]),a("span",{class:W(["arrow",{open:_.value}])},"▼",2)]),u(Z,{name:"slide"},{default:f(()=>[_.value?(o(),s("div",ce,[u(c,{value:z.value,"onUpdate:value":e[0]||(e[0]=t=>z.value=t),type:"card",animated:""},{default:f(()=>[u(d,{name:"allPeople",tab:"全部调试员工"},{default:f(()=>[(o(!0),s(g,null,x(h.value,t=>(o(),s("span",{class:"outPeople",key:t.id},l(t.username),1))),128)),(o(!0),s(g,null,x(P.value,t=>(o(),s("span",{class:"inPeople",key:t.id},l(t.username),1))),128)),(o(!0),s(g,null,x(T.value,t=>(o(),s("span",{class:"unknown",key:t.id},l(t.username),1))),128))]),_:1}),u(d,{name:"outPeople",tab:"外勤人员"},{default:f(()=>[u(i,{style:{"max-height":"500px"}},{default:f(()=>[(o(!0),s(g,null,x(h.value,t=>(o(),s("div",{key:t.id,class:"mb-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow flex"},[a("div",pe,[a("img",{class:"w30px h-30px rounded-full shadow",src:t.userImage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png",alt:"头像"},null,8,ue),a("div",fe,l(t.username),1)]),a("div",ve,[a("div",me,[e[9]||(e[9]=a("span",{class:"whitespace-nowrap"},"🏗️ 项目名称：",-1)),a("span",we,l(t.proname||"暂无项目"),1)]),a("div",ge,[e[10]||(e[10]=a("span",{class:"whitespace-nowrap"},"📅 上班打卡时间：",-1)),a("span",xe,l(t.dbtime||"无"),1)]),a("div",be,[e[11]||(e[11]=a("span",{class:"whitespace-nowrap"},"📍 地址：",-1)),a("span",ye,l(t.address),1)])])]))),128))]),_:1})]),_:1}),u(d,{name:"inPeople",tab:"公司人员"},{default:f(()=>[(o(!0),s(g,null,x(P.value,t=>(o(),s("span",{class:"inPeople",key:t.id},l(t.username),1))),128))]),_:1}),u(d,{name:"unknownPeople",tab:"未知人员"},{default:f(()=>[(o(!0),s(g,null,x(T.value,t=>(o(),s("span",{class:"unknown",key:t.id},l(t.username),1))),128))]),_:1})]),_:1},8,["value"])])):F("",!0)]),_:1})])])}}}),Te=ee(_e,[["__scopeId","data-v-a018a6f5"]]);export{Te as default};
