import{d as K,r as w,a as _,i as O,dP as W,b as s,o,e as n,f as u,g as p,t as i,h as S,aP as X,w as f,z as F,b1 as G,b2 as J,aT as g,aX as x,az as Y,T as Z,aJ as Q,b4 as ee,av as ae}from"./index-9CCyyUlU.js";import{c as te,b as ne}from"./home-mlDGjyLN.js";import{u as se}from"./usePageData-BXqTxcmW.js";const oe={class:"map-wrapper",style:{height:"600px",position:"relative"}},le={class:"clockInInfo"},ie={style:{color:"#1890ff","font-weight":"700","font-size":"20px"}},re={style:{color:"#52c41a","font-weight":"700","font-size":"20px"}},de={style:{color:"#faad14","font-weight":"700","font-size":"20px"}},ce={style:{color:"#8a8886","font-weight":"700","font-size":"20px"}},pe={key:0,class:"details"},ue={class:"shrink-0 flex flex-col items-center justify-center w-20"},fe=["src"],ve={class:"mt-2 c-#52c41a text-sm font-bold text-center truncate w-full"},me={class:"flex-1 flex flex-col justify-center gap-1"},we={class:"flex text-sm"},ge={class:"text-[#4169e1] font-semibold"},xe={class:"flex text-sm"},be={class:"text-[#4169e1] font-semibold"},ye={class:"flex text-sm"},_e={class:"text-[#4169e1] font-semibold"},ke=K({name:"trajectory_realtimetrajectory",__name:"index",setup(he){const v=w([]),l=w(null);let m=null;const{pageData:b,getData:B}=se(ee),N=async()=>{await B({usertypes:"2,3"}),b.data=b.data.filter(a=>a.status==0)};async function U(){const a="/map-sdk.json",{data:e}=await Q.get(`${a}?_t=${Date.now()}`);return e}function L(a){return new Promise((e,d)=>{if(window.AMap)return e(window.AMap);const r=document.createElement("script");r.src=`https://webapi.amap.com/maps?v=2.0&key=${a}`,r.defer=!0,r.onload=()=>window.AMap?e(window.AMap):d(new Error("AMap加载失败")),r.onerror=()=>d(new Error("AMap脚本加载错误")),document.head.appendChild(r)})}const k=w(!1),h=_(()=>v.value.filter(a=>a.pid!=-1)),P=_(()=>v.value.filter(a=>a.pid==-1)),T=_(()=>b.data.filter(a=>!v.value.some(e=>e.creater==a.id))),C=w("allPeople"),R=()=>{k.value=!k.value},$=_(()=>h.value.length),z=_(()=>P.value.length);async function D(){const{data:a,error:e}=await te();e||(v.value=a)}const y=w({contractname:"",dispatch:"",debugname:"",dbdbtime:""}),V=async a=>{const{data:e,error:d}=await ne({pid:a.pid>0?a.pid:void 0,creater:a.creater});y.value=e};async function q(){const a=await U(),e=await L(a.AMAP_SDK_KEY);l.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36]}),e.plugin(["AMap.Scale","AMap.ToolBar"],()=>{l.value.addControl(new e.Scale),l.value.addControl(new e.ToolBar)}),m=new e.InfoWindow({offset:new e.Pixel(0,-30)}),H(e),l.value.on("click",()=>{m.close()})}function H(a){console.log(v.value,"srealTimeTrack"),v.value.forEach(e=>{new a.Marker({position:[e.longitude,e.latitude],content:'<div class="marker-dot"></div>',anchor:"center",offset:new a.Pixel(0,0)}).setMap(l.value);const r=document.createElement("div");r.className="custom-marker",r.style="display: flex;align-items: center;flex-direction: column;z-index:999;transform: translateX(4px);",r.innerHTML=`
      <div class="avatar-wrapper">
        <img src="${e.userimage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
      </div>
      <div class="marker-name">${e.username}</div>
    `;const c=new a.Marker({position:[e.longitude,e.latitude],content:r,anchor:"bottom-center",offset:new a.Pixel(0,-5)});c.on("click",async()=>{var I,j,A,E;await V(e);const t=`
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
        <div><b>合同名称：</b><span style="color:#1890ff;">${((I=y.value)==null?void 0:I.contractname)||"-"}</span></div>
        <div><b>调度名称：</b><span style="color:#1890ff;">${((j=y.value)==null?void 0:j.dispatch)||"-"}</span></div>
        <div><b>调试任务：</b><span style="color:#1890ff;">${((A=y.value)==null?void 0:A.debugname)||"-"}</span></div>
        <div><b>开始时间：</b><span style="color:#1890ff;">${((E=y.value)==null?void 0:E.dbdbtime)||"-"}</span></div>

      </div>
    `;m.setContent(t),m.setOffset(new a.Pixel(4,-70)),m.open(l.value,c.getPosition()),l.value.setCenter(c.getPosition())}),c.on("dblclick",()=>{m.open(l.value,c.getPosition()),l.value.setCenter(c.getPosition()),l.value.setZoom(14)}),c.setMap(l.value)})}const M=w(null);return O(async()=>{N(),await D(),M.value=window.setInterval(D,1e3*60*5),q()}),W(()=>{M.value&&clearInterval(M.value),l.value&&l.value.destroy()}),(a,e)=>{const d=J,r=Y,c=G;return o(),s("div",oe,[e[12]||(e[12]=n("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)),n("div",le,[n("div",{class:"title",onClick:R,style:{display:"flex","align-items":"center",gap:"16px","font-size":"16px"}},[n("span",null,[e[1]||(e[1]=p(" 共 ")),n("span",ie,i(S(b).data.length),1),e[2]||(e[2]=p(" 人 "))]),n("span",null,[e[3]||(e[3]=p(" 今日外勤人数： ")),n("span",re,i($.value),1),e[4]||(e[4]=p(" 人 "))]),n("span",null,[e[5]||(e[5]=p(" 公司人数： ")),n("span",de,i(z.value),1),e[6]||(e[6]=p(" 人 "))]),n("span",null,[e[7]||(e[7]=p(" 未知： ")),n("span",ce,i(S(b).data.length-$.value-z.value),1),e[8]||(e[8]=p(" 人 "))]),n("span",{class:X(["arrow",{open:k.value}])},"▼",2)]),u(Z,{name:"slide"},{default:f(()=>[k.value?(o(),s("div",pe,[u(c,{value:C.value,"onUpdate:value":e[0]||(e[0]=t=>C.value=t),type:"card",animated:""},{default:f(()=>[u(d,{name:"allPeople",tab:"全部调试员工"},{default:f(()=>[(o(!0),s(g,null,x(h.value,t=>(o(),s("span",{class:"outPeople",key:t.id},i(t.username),1))),128)),(o(!0),s(g,null,x(P.value,t=>(o(),s("span",{class:"inPeople",key:t.id},i(t.username),1))),128)),(o(!0),s(g,null,x(T.value,t=>(o(),s("span",{class:"unknown",key:t.id},i(t.username),1))),128))]),_:1}),u(d,{name:"outPeople",tab:"外勤人员"},{default:f(()=>[u(r,{style:{"max-height":"500px"}},{default:f(()=>[(o(!0),s(g,null,x(h.value,t=>(o(),s("div",{key:t.id,class:"mb-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow flex"},[n("div",ue,[n("img",{class:"w30px h-30px rounded-full shadow",src:t.userImage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png",alt:"头像"},null,8,fe),n("div",ve,i(t.username),1)]),n("div",me,[n("div",we,[e[9]||(e[9]=n("span",{class:"whitespace-nowrap"},"🏗️ 项目名称：",-1)),n("span",ge,i(t.proname||"暂无项目"),1)]),n("div",xe,[e[10]||(e[10]=n("span",{class:"whitespace-nowrap"},"📅 上班打卡时间：",-1)),n("span",be,i(t.dbtime||"无"),1)]),n("div",ye,[e[11]||(e[11]=n("span",{class:"whitespace-nowrap"},"📍 地址：",-1)),n("span",_e,i(t.address),1)])])]))),128))]),_:1})]),_:1}),u(d,{name:"inPeople",tab:"公司人员"},{default:f(()=>[(o(!0),s(g,null,x(P.value,t=>(o(),s("span",{class:"inPeople",key:t.id},i(t.username),1))),128))]),_:1}),u(d,{name:"unknownPeople",tab:"未知人员"},{default:f(()=>[(o(!0),s(g,null,x(T.value,t=>(o(),s("span",{class:"unknown",key:t.id},i(t.username),1))),128))]),_:1})]),_:1},8,["value"])])):F("",!0)]),_:1})])])}}}),Ce=ae(ke,[["__scopeId","data-v-ce695f81"]]);export{Ce as default};
