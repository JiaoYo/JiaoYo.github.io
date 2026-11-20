import{d as X,y as ee,Y as ae,Z as te,s as b,a as k,i as ne,aQ as se,j as oe,b5 as le,b as o,o as l,e as n,f,g as u,t as r,h as q,ax as re,w as v,F as ie,aS as de,aR as ce,ag as x,aJ as y,a4 as pe,a_ as ue,dJ as fe,aK as ve,W as me}from"./index-DsLkX-_3.js";import{d as ge,c as we}from"./home-Cg7_oLkE.js";import{u as be}from"./usePageData-BexUMnVy.js";const xe={class:"map-wrapper",style:{height:"600px",position:"relative"}},ye={class:"clockInInfo"},he={style:{color:"#1890ff","font-weight":"700","font-size":"20px"}},ke={style:{color:"#52c41a","font-weight":"700","font-size":"20px"}},_e={style:{color:"#faad14","font-weight":"700","font-size":"20px"}},Pe={style:{color:"#8a8886","font-weight":"700","font-size":"20px"}},Me={key:0,class:"details"},Te={class:"shrink-0 flex flex-col items-center justify-center w-20"},Se=["src"],je={class:"mt-2 c-#52c41a text-sm font-bold text-center truncate w-full"},Ce={class:"flex-1 flex flex-col justify-center gap-1"},Ie={class:"flex text-sm"},Ae={class:"text-[#4169e1] font-semibold"},$e={class:"flex text-sm"},De={class:"text-[#4169e1] font-semibold"},ze={class:"flex text-sm"},Ee={class:"text-[#4169e1] font-semibold"},Ne=X({name:"trajectory_realtimetrajectory",__name:"index",setup(Be){const j=ee(),C=ae(),U=te(),m=b([]),s=b(null);let g=null;const{pageData:h,getData:K}=be(ve),J=async()=>{await K({usertypes:"2,3,9"}),h.data=h.data.filter(a=>a.status==0)};async function O(){const a="/map-sdk.json",{data:e}=await fe.get(`${a}?_t=${Date.now()}`);return e}function W(a){return new Promise((e,c)=>{if(window.AMap)return e(window.AMap);const i=document.createElement("script");i.src=`https://webapi.amap.com/maps?v=2.0&key=${a}`,i.defer=!0,i.onload=()=>window.AMap?e(window.AMap):c(new Error("AMap加载失败")),i.onerror=()=>c(new Error("AMap脚本加载错误")),document.head.appendChild(i)})}const _=b(!1),M=k(()=>m.value.filter(a=>a.pid!=-1)),T=k(()=>m.value.filter(a=>a.pid==-1)),I=k(()=>h.data.filter(a=>!m.value.some(e=>e.creater==a.id))),A=b("allPeople"),F=()=>{_.value=!_.value},$=k(()=>M.value.length),D=k(()=>T.value.length);async function P(){const{data:a,error:e}=await ge();e||(m.value=a)}const w=b({contractname:"",dispatch:"",debugname:"",dbdbtime:""}),H=async a=>{const{data:e,error:c}=await we({pid:a.pid>0?a.pid:void 0,creater:a.creater});w.value=e};async function Y(){const a=await O();window._AMapSecurityConfig={securityJsCode:a.AMAP_SDK_SECRET};const e=await W(a.AMAP_SDK_KEY);s.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36]}),U.themeScheme==="dark"&&s.value.setMapStyle("amap://styles/dark"),e.plugin(["AMap.Scale","AMap.ToolBar"],()=>{s.value.addControl(new e.Scale),s.value.addControl(new e.ToolBar)}),g=new e.InfoWindow({offset:new e.Pixel(0,-30)}),Z(e),s.value.on("click",()=>{g.close()})}function Z(a){console.log(m.value,"srealTimeTrack"),m.value.forEach(e=>{new a.Marker({position:[e.longitude,e.latitude],content:'<div class="marker-dot"></div>',anchor:"center",offset:new a.Pixel(0,0),mapStyle:"amap://styles/dark"}).setMap(s.value);const i=document.createElement("div");i.className="custom-marker",i.style="display: flex;align-items: center;flex-direction: column;z-index:999;transform: translateX(4px);",i.innerHTML=`
      <div class="avatar-wrapper">
        <img src="${e.userimage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
      </div>
      <div class="marker-name">${e.username}</div>
    `;const p=new a.Marker({position:[e.longitude,e.latitude],content:i,anchor:"bottom-center",offset:new a.Pixel(0,-5)});p.on("click",async()=>{var z,E,N,B,R,L;await H(e);const t=`
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
        <div><b>项目名称：</b><span style="color:#1890ff;cursor:pointer" class="project-name" >${e.proname||"-"}</span></div>
        <div><b>合同名称：</b><span style="color:#1890ff;">${((z=w.value)==null?void 0:z.contractname)||"-"}</span></div>
        <div><b>调度名称：</b><span style="color:#1890ff;">${((E=w.value)==null?void 0:E.dispatch)||"-"}</span></div>
        <div><b>调试任务：</b><span style="color:#1890ff;cursor:pointer" class="debug-name">${((N=w.value)==null?void 0:N.debugname)||"-"}</span></div>
        <div><b>开始时间：</b><span style="color:#1890ff;">${((B=w.value)==null?void 0:B.dbdbtime)||"-"}</span></div>

      </div>
    `;g.setContent(t),g.setOffset(new a.Pixel(4,-70)),g.open(s.value,p.getPosition()),s.value.setCenter(p.getPosition()),(R=document.querySelector(".project-name"))==null||R.addEventListener("click",()=>{Q(e)}),(L=document.querySelector(".debug-name"))==null||L.addEventListener("click",()=>{var V;G(e,(V=w.value)==null?void 0:V.debugname)})}),p.on("dblclick",()=>{g.open(s.value,p.getPosition()),s.value.setCenter(p.getPosition()),s.value.setZoom(14)}),p.setMap(s.value)})}const G=(a,e)=>{C.push("/projectmanagement/business?pname="+a.proname+"&prjId="+a.pid+"&debugname="+e),j.setProjectInfo({pid:a.pid,pname:a.proname})},Q=a=>{C.push("/projectmanagement/orderdetail?prjId="+a.pid),j.setProjectInfo({pid:a.pid,pname:a.proname})},d=b(null);ne(async()=>{J(),await P(),d.value=window.setInterval(P,1e3*60*5),Y()});let S=!1;return se(()=>{S=!0,d.value&&(clearInterval(d.value),d.value=null)}),oe(async()=>{S&&(S=!1,await P(),d.value&&clearInterval(d.value),d.value=window.setInterval(P,1e3*60*5))}),le(()=>{d.value&&clearInterval(d.value),s.value&&s.value.destroy()}),(a,e)=>{const c=ce,i=pe,p=de;return l(),o("div",xe,[e[12]||(e[12]=n("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)),n("div",ye,[n("div",{class:"title",onClick:F,style:{display:"flex","align-items":"center",gap:"16px","font-size":"16px"}},[n("span",null,[e[1]||(e[1]=u(" 共 ")),n("span",he,r(q(h).data.length),1),e[2]||(e[2]=u(" 人 "))]),n("span",null,[e[3]||(e[3]=u(" 今日外勤人数： ")),n("span",ke,r($.value),1),e[4]||(e[4]=u(" 人 "))]),n("span",null,[e[5]||(e[5]=u(" 公司人数： ")),n("span",_e,r(D.value),1),e[6]||(e[6]=u(" 人 "))]),n("span",null,[e[7]||(e[7]=u(" 未知： ")),n("span",Pe,r(q(h).data.length-$.value-D.value),1),e[8]||(e[8]=u(" 人 "))]),n("span",{class:re(["arrow",{open:_.value}])},"▼",2)]),f(ue,{name:"slide"},{default:v(()=>[_.value?(l(),o("div",Me,[f(p,{value:A.value,"onUpdate:value":e[0]||(e[0]=t=>A.value=t),type:"card",animated:""},{default:v(()=>[f(c,{name:"allPeople",tab:"全部调试员工"},{default:v(()=>[(l(!0),o(x,null,y(M.value,t=>(l(),o("span",{class:"outPeople",key:t.id},r(t.username),1))),128)),(l(!0),o(x,null,y(T.value,t=>(l(),o("span",{class:"inPeople",key:t.id},r(t.username),1))),128)),(l(!0),o(x,null,y(I.value,t=>(l(),o("span",{class:"unknown",key:t.id},r(t.username),1))),128))]),_:1}),f(c,{name:"outPeople",tab:"外勤人员"},{default:v(()=>[f(i,{style:{"max-height":"500px"}},{default:v(()=>[(l(!0),o(x,null,y(M.value,t=>(l(),o("div",{key:t.id,class:"mb-4 bg-white outPeopleBg rounded-lg shadow-sm hover:shadow-md transition-shadow flex"},[n("div",Te,[n("img",{class:"w30px h-30px rounded-full shadow",src:t.userImage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png",alt:"头像"},null,8,Se),n("div",je,r(t.username),1)]),n("div",Ce,[n("div",Ie,[e[9]||(e[9]=n("span",{class:"whitespace-nowrap"},"🏗️ 项目名称：",-1)),n("span",Ae,r(t.proname||"暂无项目"),1)]),n("div",$e,[e[10]||(e[10]=n("span",{class:"whitespace-nowrap"},"📅 上班打卡时间：",-1)),n("span",De,r(t.dbtime||"无"),1)]),n("div",ze,[e[11]||(e[11]=n("span",{class:"whitespace-nowrap"},"📍 地址：",-1)),n("span",Ee,r(t.address),1)])])]))),128))]),_:1})]),_:1}),f(c,{name:"inPeople",tab:"公司人员"},{default:v(()=>[(l(!0),o(x,null,y(T.value,t=>(l(),o("span",{class:"inPeople",key:t.id},r(t.username),1))),128))]),_:1}),f(c,{name:"unknownPeople",tab:"未知人员"},{default:v(()=>[(l(!0),o(x,null,y(I.value,t=>(l(),o("span",{class:"unknown",key:t.id},r(t.username),1))),128))]),_:1})]),_:1},8,["value"])])):ie("",!0)]),_:1})])])}}}),qe=me(Ne,[["__scopeId","data-v-89233df7"]]);export{qe as default};
