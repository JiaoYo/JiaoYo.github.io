import{d as K,r as w,a as _,i as O,dP as W,b as s,o,e as n,f as u,g as p,t as l,h as N,aP as F,w as f,z as G,b1 as J,b2 as X,aT as g,aX as x,az as Y,T as Z,aJ as Q,b4 as ee,av as te}from"./index-DECenS4J.js";import{b as ae,d as ne}from"./home-IO9o44mb.js";import{u as se}from"./usePageData-cOQPgHgh.js";const oe={class:"map-wrapper",style:{height:"600px",position:"relative"}},le={class:"clockInInfo"},ie={style:{color:"#1890ff","font-weight":"700","font-size":"20px"}},re={style:{color:"#52c41a","font-weight":"700","font-size":"20px"}},de={style:{color:"#faad14","font-weight":"700","font-size":"20px"}},ce={style:{color:"#8a8886","font-weight":"700","font-size":"20px"}},pe={key:0,class:"details"},ue={class:"flex-shrink-0 flex flex-col items-center justify-center w-20"},fe=["src"],ve={class:"mt-2 c-#52c41a text-sm font-bold text-center truncate w-full"},me={class:"flex-1 flex flex-col justify-center gap-1"},we={class:"flex text-sm"},ge={class:"text-[#4169e1] font-semibold"},xe={class:"flex text-sm"},be={class:"text-[#4169e1] font-semibold"},ye={class:"flex text-sm"},_e={class:"text-[#4169e1] font-semibold"},ke=K({name:"trajectory_realtimetrajectory",__name:"index",setup(he){const v=w([]),r=w(null);let m=null;const{pageData:b,getData:S}=se(ee),U=async()=>{await S({usertypes:"2,3"}),b.data=b.data.filter(t=>t.status==0)};async function B(){const t="/map-sdk.json",{data:e}=await Q.get(`${t}?_t=${Date.now()}`);return e}function L(t){return new Promise((e,d)=>{if(window.AMap)return e(window.AMap);const i=document.createElement("script");i.src=`https://webapi.amap.com/maps?v=2.0&key=${t}`,i.defer=!0,i.onload=()=>window.AMap?e(window.AMap):d(new Error("AMap加载失败")),i.onerror=()=>d(new Error("AMap脚本加载错误")),document.head.appendChild(i)})}const k=w(!1),h=_(()=>v.value.filter(t=>t.pid!=-1)),P=_(()=>v.value.filter(t=>t.pid==-1)),T=_(()=>b.data.filter(t=>!v.value.some(e=>e.creater==t.id))),z=w("allPeople"),R=()=>{k.value=!k.value},$=_(()=>h.value.length),C=_(()=>P.value.length);async function D(){const{data:t,error:e}=await ae();e||(v.value=t)}const y=w({contractname:"",dispatch:"",debugname:"",dbdbtime:""}),V=async t=>{const{data:e,error:d}=await ne({pid:t.pid>0?t.pid:void 0,creater:t.creater});y.value=e};async function q(){const t=await B(),e=await L(t.AMAP_SDK_KEY);r.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36]}),m=new e.InfoWindow({offset:new e.Pixel(0,-30)}),H(e),r.value.on("click",()=>{m.close()})}function H(t){console.log(v.value,"srealTimeTrack"),v.value.forEach(e=>{new t.Marker({position:[e.longitude,e.latitude],content:'<div class="marker-dot"></div>',anchor:"center",offset:new t.Pixel(0,0),zooms:[3,19]}).setMap(r.value);const i=document.createElement("div");i.className="custom-marker",i.style="display: flex;align-items: center;flex-direction: column;z-index:999;",i.innerHTML=`
      <div class="avatar-wrapper">
        <img src="${e.userimage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
      </div>
      <div class="marker-name">${e.username}</div>
    `;const c=new t.Marker({position:[e.longitude,e.latitude],content:i,anchor:"bottom-center",offset:new t.Pixel(0,-5),zooms:[3,19]});c.on("click",async()=>{var I,j,A,E;await V(e);const a=`
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
    `;m.setContent(a),m.setOffset(new t.Pixel(0,-80)),m.open(r.value,c.getPosition()),r.value.setCenter(c.getPosition())}),c.on("dblclick",()=>{m.open(r.value,c.getPosition()),r.value.setCenter(c.getPosition()),r.value.setZoom(14)}),c.setMap(r.value)})}const M=w(null);return O(async()=>{U(),await D(),M.value=window.setInterval(D,1e3*60*5),q()}),W(()=>{M.value&&clearInterval(M.value),r.value&&r.value.destroy()}),(t,e)=>{const d=X,i=Y,c=J;return o(),s("div",oe,[e[12]||(e[12]=n("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)),n("div",le,[n("div",{class:"title",onClick:R,style:{display:"flex","align-items":"center",gap:"16px","font-size":"16px"}},[n("span",null,[e[1]||(e[1]=p(" 共 ")),n("span",ie,l(N(b).data.length),1),e[2]||(e[2]=p(" 人 "))]),n("span",null,[e[3]||(e[3]=p(" 今日外勤人数： ")),n("span",re,l($.value),1),e[4]||(e[4]=p(" 人 "))]),n("span",null,[e[5]||(e[5]=p(" 公司人数： ")),n("span",de,l(C.value),1),e[6]||(e[6]=p(" 人 "))]),n("span",null,[e[7]||(e[7]=p(" 未知： ")),n("span",ce,l(N(b).data.length-$.value-C.value),1),e[8]||(e[8]=p(" 人 "))]),n("span",{class:F(["arrow",{open:k.value}])},"▼",2)]),u(Z,{name:"slide"},{default:f(()=>[k.value?(o(),s("div",pe,[u(c,{value:z.value,"onUpdate:value":e[0]||(e[0]=a=>z.value=a),type:"card",animated:""},{default:f(()=>[u(d,{name:"allPeople",tab:"全部调试员工"},{default:f(()=>[(o(!0),s(g,null,x(h.value,a=>(o(),s("span",{class:"outPeople",key:a.id},l(a.username),1))),128)),(o(!0),s(g,null,x(P.value,a=>(o(),s("span",{class:"inPeople",key:a.id},l(a.username),1))),128)),(o(!0),s(g,null,x(T.value,a=>(o(),s("span",{class:"unknown",key:a.id},l(a.username),1))),128))]),_:1}),u(d,{name:"outPeople",tab:"外勤人员"},{default:f(()=>[u(i,{style:{"max-height":"500px"}},{default:f(()=>[(o(!0),s(g,null,x(h.value,a=>(o(),s("div",{key:a.id,class:"mb-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow flex"},[n("div",ue,[n("img",{class:"w30px h-30px rounded-full shadow",src:a.userImage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png",alt:"头像"},null,8,fe),n("div",ve,l(a.username),1)]),n("div",me,[n("div",we,[e[9]||(e[9]=n("span",{class:"whitespace-nowrap"},"🏗️ 项目名称：",-1)),n("span",ge,l(a.proname||"暂无项目"),1)]),n("div",xe,[e[10]||(e[10]=n("span",{class:"whitespace-nowrap"},"📅 上班打卡时间：",-1)),n("span",be,l(a.dbtime||"无"),1)]),n("div",ye,[e[11]||(e[11]=n("span",{class:"whitespace-nowrap"},"📍 地址：",-1)),n("span",_e,l(a.address),1)])])]))),128))]),_:1})]),_:1}),u(d,{name:"inPeople",tab:"公司人员"},{default:f(()=>[(o(!0),s(g,null,x(P.value,a=>(o(),s("span",{class:"inPeople",key:a.id},l(a.username),1))),128))]),_:1}),u(d,{name:"unknownPeople",tab:"未知人员"},{default:f(()=>[(o(!0),s(g,null,x(T.value,a=>(o(),s("span",{class:"unknown",key:a.id},l(a.username),1))),128))]),_:1})]),_:1},8,["value"])])):G("",!0)]),_:1})])])}}}),ze=te(ke,[["__scopeId","data-v-e607c251"]]);export{ze as default};
