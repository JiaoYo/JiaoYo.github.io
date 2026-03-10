import{d as J,z as Q,Y as ee,Z as ae,s as w,a as y,i as te,dO as ne,b as o,o as l,e as n,f as u,g as p,t as r,h as q,aP as se,w as f,G as oe,b7 as le,b8 as re,aA as b,a$ as x,a3 as ie,b6 as de,fo as ce,b0 as pe,W as ue}from"./index-BsgUFTri.js";import{d as fe,c as me}from"./home-CWhblqyC.js";import{u as ve}from"./usePageData-BIep8n6Q.js";const ge={class:"map-wrapper",style:{height:"600px",position:"relative"}},we={class:"clockInInfo"},be={style:{color:"#1890ff","font-weight":"700","font-size":"20px"}},xe={style:{color:"#52c41a","font-weight":"700","font-size":"20px"}},he={style:{color:"#faad14","font-weight":"700","font-size":"20px"}},ye={style:{color:"#8a8886","font-weight":"700","font-size":"20px"}},ke={key:0,class:"details"},_e={class:"shrink-0 flex flex-col items-center justify-center w-20"},Pe=["src"],Me={class:"mt-2 c-#52c41a text-sm font-bold text-center truncate w-full"},Te={class:"flex-1 flex flex-col justify-center gap-1"},je={class:"flex text-sm"},Se={class:"text-[#4169e1] font-semibold"},Ce={class:"flex text-sm"},Ie={class:"text-[#4169e1] font-semibold"},$e={class:"flex text-sm"},ze={class:"text-[#4169e1] font-semibold"},Ae=J({name:"trajectory_realtimetrajectory",__name:"index",setup(De){const T=Q(),j=ee(),R=ae(),m=w([]),s=w(null);let v=null;const{pageData:h,getData:U}=ve(pe),O=async()=>{await U({usertypes:"2,3"}),h.data=h.data.filter(a=>a.status==0)};async function W(){const a="/map-sdk.json",{data:e}=await ce.get(`${a}?_t=${Date.now()}`);return e}function G(a){return new Promise((e,d)=>{if(window.AMap)return e(window.AMap);const i=document.createElement("script");i.src=`https://webapi.amap.com/maps?v=2.0&key=${a}`,i.defer=!0,i.onload=()=>window.AMap?e(window.AMap):d(new Error("AMap加载失败")),i.onerror=()=>d(new Error("AMap脚本加载错误")),document.head.appendChild(i)})}const k=w(!1),_=y(()=>m.value.filter(a=>a.pid!=-1)),P=y(()=>m.value.filter(a=>a.pid==-1)),S=y(()=>h.data.filter(a=>!m.value.some(e=>e.creater==a.id))),C=w("allPeople"),H=()=>{k.value=!k.value},I=y(()=>_.value.length),$=y(()=>P.value.length);async function z(){const{data:a,error:e}=await fe();e||(m.value=a)}const g=w({contractname:"",dispatch:"",debugname:"",dbdbtime:""}),K=async a=>{const{data:e,error:d}=await me({pid:a.pid>0?a.pid:void 0,creater:a.creater});g.value=e};async function Y(){const a=await W(),e=await G(a.AMAP_SDK_KEY);s.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36]}),R.themeScheme==="dark"&&s.value.setMapStyle("amap://styles/dark"),e.plugin(["AMap.Scale","AMap.ToolBar"],()=>{s.value.addControl(new e.Scale),s.value.addControl(new e.ToolBar)}),v=new e.InfoWindow({offset:new e.Pixel(0,-30)}),Z(e),s.value.on("click",()=>{v.close()})}function Z(a){console.log(m.value,"srealTimeTrack"),m.value.forEach(e=>{new a.Marker({position:[e.longitude,e.latitude],content:'<div class="marker-dot"></div>',anchor:"center",offset:new a.Pixel(0,0),mapStyle:"amap://styles/dark"}).setMap(s.value);const i=document.createElement("div");i.className="custom-marker",i.style="display: flex;align-items: center;flex-direction: column;z-index:999;transform: translateX(4px);",i.innerHTML=`
      <div class="avatar-wrapper">
        <img src="${e.userimage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
      </div>
      <div class="marker-name">${e.username}</div>
    `;const c=new a.Marker({position:[e.longitude,e.latitude],content:i,anchor:"bottom-center",offset:new a.Pixel(0,-5)});c.on("click",async()=>{var A,D,E,N,B,L;await K(e);const t=`
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
        <div><b>合同名称：</b><span style="color:#1890ff;">${((A=g.value)==null?void 0:A.contractname)||"-"}</span></div>
        <div><b>调度名称：</b><span style="color:#1890ff;">${((D=g.value)==null?void 0:D.dispatch)||"-"}</span></div>
        <div><b>调试任务：</b><span style="color:#1890ff;cursor:pointer" class="debug-name">${((E=g.value)==null?void 0:E.debugname)||"-"}</span></div>
        <div><b>开始时间：</b><span style="color:#1890ff;">${((N=g.value)==null?void 0:N.dbdbtime)||"-"}</span></div>

      </div>
    `;v.setContent(t),v.setOffset(new a.Pixel(4,-70)),v.open(s.value,c.getPosition()),s.value.setCenter(c.getPosition()),(B=document.querySelector(".project-name"))==null||B.addEventListener("click",()=>{X(e)}),(L=document.querySelector(".debug-name"))==null||L.addEventListener("click",()=>{var V;F(e,(V=g.value)==null?void 0:V.debugname)})}),c.on("dblclick",()=>{v.open(s.value,c.getPosition()),s.value.setCenter(c.getPosition()),s.value.setZoom(14)}),c.setMap(s.value)})}const F=(a,e)=>{j.push("/projectmanagement/business?panme="+a.proname+"&prjId"+a.pid+"&debugname="+e),T.setProjectInfo({pid:a.pid,pname:a.proname})},X=a=>{j.push("/projectmanagement/orderdetail?prjId="+a.pid),T.setProjectInfo({pid:a.pid,pname:a.proname})},M=w(null);return te(async()=>{O(),await z(),M.value=window.setInterval(z,1e3*60*5),Y()}),ne(()=>{M.value&&clearInterval(M.value),s.value&&s.value.destroy()}),(a,e)=>{const d=re,i=ie,c=le;return l(),o("div",ge,[e[12]||(e[12]=n("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)),n("div",we,[n("div",{class:"title",onClick:H,style:{display:"flex","align-items":"center",gap:"16px","font-size":"16px"}},[n("span",null,[e[1]||(e[1]=p(" 共 ")),n("span",be,r(q(h).data.length),1),e[2]||(e[2]=p(" 人 "))]),n("span",null,[e[3]||(e[3]=p(" 今日外勤人数： ")),n("span",xe,r(I.value),1),e[4]||(e[4]=p(" 人 "))]),n("span",null,[e[5]||(e[5]=p(" 公司人数： ")),n("span",he,r($.value),1),e[6]||(e[6]=p(" 人 "))]),n("span",null,[e[7]||(e[7]=p(" 未知： ")),n("span",ye,r(q(h).data.length-I.value-$.value),1),e[8]||(e[8]=p(" 人 "))]),n("span",{class:se(["arrow",{open:k.value}])},"▼",2)]),u(de,{name:"slide"},{default:f(()=>[k.value?(l(),o("div",ke,[u(c,{value:C.value,"onUpdate:value":e[0]||(e[0]=t=>C.value=t),type:"card",animated:""},{default:f(()=>[u(d,{name:"allPeople",tab:"全部调试员工"},{default:f(()=>[(l(!0),o(b,null,x(_.value,t=>(l(),o("span",{class:"outPeople",key:t.id},r(t.username),1))),128)),(l(!0),o(b,null,x(P.value,t=>(l(),o("span",{class:"inPeople",key:t.id},r(t.username),1))),128)),(l(!0),o(b,null,x(S.value,t=>(l(),o("span",{class:"unknown",key:t.id},r(t.username),1))),128))]),_:1}),u(d,{name:"outPeople",tab:"外勤人员"},{default:f(()=>[u(i,{style:{"max-height":"500px"}},{default:f(()=>[(l(!0),o(b,null,x(_.value,t=>(l(),o("div",{key:t.id,class:"mb-4 bg-white outPeopleBg rounded-lg shadow-sm hover:shadow-md transition-shadow flex"},[n("div",_e,[n("img",{class:"w30px h-30px rounded-full shadow",src:t.userImage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png",alt:"头像"},null,8,Pe),n("div",Me,r(t.username),1)]),n("div",Te,[n("div",je,[e[9]||(e[9]=n("span",{class:"whitespace-nowrap"},"🏗️ 项目名称：",-1)),n("span",Se,r(t.proname||"暂无项目"),1)]),n("div",Ce,[e[10]||(e[10]=n("span",{class:"whitespace-nowrap"},"📅 上班打卡时间：",-1)),n("span",Ie,r(t.dbtime||"无"),1)]),n("div",$e,[e[11]||(e[11]=n("span",{class:"whitespace-nowrap"},"📍 地址：",-1)),n("span",ze,r(t.address),1)])])]))),128))]),_:1})]),_:1}),u(d,{name:"inPeople",tab:"公司人员"},{default:f(()=>[(l(!0),o(b,null,x(P.value,t=>(l(),o("span",{class:"inPeople",key:t.id},r(t.username),1))),128))]),_:1}),u(d,{name:"unknownPeople",tab:"未知人员"},{default:f(()=>[(l(!0),o(b,null,x(S.value,t=>(l(),o("span",{class:"unknown",key:t.id},r(t.username),1))),128))]),_:1})]),_:1},8,["value"])])):oe("",!0)]),_:1})])])}}}),Le=ue(Ae,[["__scopeId","data-v-26073b54"]]);export{Le as default};
