import{d as Z,m as J,P as ee,Q as te,H as w,a as y,i as ae,dP as ne,b as o,o as l,e as n,f as u,g as p,t as r,h as N,aU as se,w as f,s as oe,T as le,W as re,U as b,V as x,a0 as ie,X as de,aP as ce,b4 as pe,M as ue}from"./index-CbkGmsUT.js";import{c as fe,b as me}from"./home-MRc9DSAn.js";import{u as ve}from"./usePageData-CtVI6YRj.js";const ge={class:"map-wrapper",style:{height:"600px",position:"relative"}},we={class:"clockInInfo"},be={style:{color:"#1890ff","font-weight":"700","font-size":"20px"}},xe={style:{color:"#52c41a","font-weight":"700","font-size":"20px"}},he={style:{color:"#faad14","font-weight":"700","font-size":"20px"}},ye={style:{color:"#8a8886","font-weight":"700","font-size":"20px"}},ke={key:0,class:"details"},_e={class:"shrink-0 flex flex-col items-center justify-center w-20"},Pe=["src"],Me={class:"mt-2 c-#52c41a text-sm font-bold text-center truncate w-full"},Te={class:"flex-1 flex flex-col justify-center gap-1"},je={class:"flex text-sm"},Se={class:"text-[#4169e1] font-semibold"},Ce={class:"flex text-sm"},Ie={class:"text-[#4169e1] font-semibold"},$e={class:"flex text-sm"},ze={class:"text-[#4169e1] font-semibold"},De=Z({name:"trajectory_realtimetrajectory",__name:"index",setup(Ae){const T=J(),j=ee(),q=te(),m=w([]),s=w(null);let v=null;const{pageData:h,getData:R}=ve(pe),H=async()=>{await R({usertypes:"2,3"}),h.data=h.data.filter(t=>t.status==0)};async function W(){const t="/map-sdk.json",{data:e}=await ce.get(`${t}?_t=${Date.now()}`);return e}function K(t){return new Promise((e,d)=>{if(window.AMap)return e(window.AMap);const i=document.createElement("script");i.src=`https://webapi.amap.com/maps?v=2.0&key=${t}`,i.defer=!0,i.onload=()=>window.AMap?e(window.AMap):d(new Error("AMap加载失败")),i.onerror=()=>d(new Error("AMap脚本加载错误")),document.head.appendChild(i)})}const k=w(!1),_=y(()=>m.value.filter(t=>t.pid!=-1)),P=y(()=>m.value.filter(t=>t.pid==-1)),S=y(()=>h.data.filter(t=>!m.value.some(e=>e.creater==t.id))),C=w("allPeople"),O=()=>{k.value=!k.value},I=y(()=>_.value.length),$=y(()=>P.value.length);async function z(){const{data:t,error:e}=await fe();e||(m.value=t)}const g=w({contractname:"",dispatch:"",debugname:"",dbdbtime:""}),X=async t=>{const{data:e,error:d}=await me({pid:t.pid>0?t.pid:void 0,creater:t.creater});g.value=e};async function F(){const t=await W(),e=await K(t.AMAP_SDK_KEY);s.value=new e.Map("amap-container",{viewMode:"2D",zoom:5,center:[105,36]}),q.themeScheme==="dark"&&s.value.setMapStyle("amap://styles/dark"),e.plugin(["AMap.Scale","AMap.ToolBar"],()=>{s.value.addControl(new e.Scale),s.value.addControl(new e.ToolBar)}),v=new e.InfoWindow({offset:new e.Pixel(0,-30)}),G(e),s.value.on("click",()=>{v.close()})}function G(t){console.log(m.value,"srealTimeTrack"),m.value.forEach(e=>{new t.Marker({position:[e.longitude,e.latitude],content:'<div class="marker-dot"></div>',anchor:"center",offset:new t.Pixel(0,0),mapStyle:"amap://styles/dark"}).setMap(s.value);const i=document.createElement("div");i.className="custom-marker",i.style="display: flex;align-items: center;flex-direction: column;z-index:999;transform: translateX(4px);",i.innerHTML=`
      <div class="avatar-wrapper">
        <img src="${e.userimage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png"}" class="marker-avatar" />
      </div>
      <div class="marker-name">${e.username}</div>
    `;const c=new t.Marker({position:[e.longitude,e.latitude],content:i,anchor:"bottom-center",offset:new t.Pixel(0,-5)});c.on("click",async()=>{var D,A,E,B,U,V;await X(e);const a=`
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
        <div><b>合同名称：</b><span style="color:#1890ff;">${((D=g.value)==null?void 0:D.contractname)||"-"}</span></div>
        <div><b>调度名称：</b><span style="color:#1890ff;">${((A=g.value)==null?void 0:A.dispatch)||"-"}</span></div>
        <div><b>调试任务：</b><span style="color:#1890ff;cursor:pointer" class="debug-name">${((E=g.value)==null?void 0:E.debugname)||"-"}</span></div>
        <div><b>开始时间：</b><span style="color:#1890ff;">${((B=g.value)==null?void 0:B.dbdbtime)||"-"}</span></div>

      </div>
    `;v.setContent(a),v.setOffset(new t.Pixel(4,-70)),v.open(s.value,c.getPosition()),s.value.setCenter(c.getPosition()),(U=document.querySelector(".project-name"))==null||U.addEventListener("click",()=>{Y(e)}),(V=document.querySelector(".debug-name"))==null||V.addEventListener("click",()=>{var L;Q(e,(L=g.value)==null?void 0:L.debugname)})}),c.on("dblclick",()=>{v.open(s.value,c.getPosition()),s.value.setCenter(c.getPosition()),s.value.setZoom(14)}),c.setMap(s.value)})}const Q=(t,e)=>{j.push("/projectmanagement/business?panme="+t.proname+"&prjId"+t.pid+"&debugname="+e),T.setProjectInfo({pid:t.pid,pname:t.proname})},Y=t=>{j.push("/projectmanagement/orderdetail?prjId="+t.pid),T.setProjectInfo({pid:t.pid,pname:t.proname})},M=w(null);return ae(async()=>{H(),await z(),M.value=window.setInterval(z,1e3*60*5),F()}),ne(()=>{M.value&&clearInterval(M.value),s.value&&s.value.destroy()}),(t,e)=>{const d=re,i=ie,c=le;return l(),o("div",ge,[e[12]||(e[12]=n("div",{id:"amap-container",style:{width:"100%",height:"100%","border-radius":"8px"}},null,-1)),n("div",we,[n("div",{class:"title",onClick:O,style:{display:"flex","align-items":"center",gap:"16px","font-size":"16px"}},[n("span",null,[e[1]||(e[1]=p(" 共 ")),n("span",be,r(N(h).data.length),1),e[2]||(e[2]=p(" 人 "))]),n("span",null,[e[3]||(e[3]=p(" 今日外勤人数： ")),n("span",xe,r(I.value),1),e[4]||(e[4]=p(" 人 "))]),n("span",null,[e[5]||(e[5]=p(" 公司人数： ")),n("span",he,r($.value),1),e[6]||(e[6]=p(" 人 "))]),n("span",null,[e[7]||(e[7]=p(" 未知： ")),n("span",ye,r(N(h).data.length-I.value-$.value),1),e[8]||(e[8]=p(" 人 "))]),n("span",{class:se(["arrow",{open:k.value}])},"▼",2)]),u(de,{name:"slide"},{default:f(()=>[k.value?(l(),o("div",ke,[u(c,{value:C.value,"onUpdate:value":e[0]||(e[0]=a=>C.value=a),type:"card",animated:""},{default:f(()=>[u(d,{name:"allPeople",tab:"全部调试员工"},{default:f(()=>[(l(!0),o(b,null,x(_.value,a=>(l(),o("span",{class:"outPeople",key:a.id},r(a.username),1))),128)),(l(!0),o(b,null,x(P.value,a=>(l(),o("span",{class:"inPeople",key:a.id},r(a.username),1))),128)),(l(!0),o(b,null,x(S.value,a=>(l(),o("span",{class:"unknown",key:a.id},r(a.username),1))),128))]),_:1}),u(d,{name:"outPeople",tab:"外勤人员"},{default:f(()=>[u(i,{style:{"max-height":"500px"}},{default:f(()=>[(l(!0),o(b,null,x(_.value,a=>(l(),o("div",{key:a.id,class:"mb-4 bg-white outPeopleBg rounded-lg shadow-sm hover:shadow-md transition-shadow flex"},[n("div",_e,[n("img",{class:"w30px h-30px rounded-full shadow",src:a.userImage||"https://pictures.linkqi.cn/work-project/image/656c9f43-e1b0-42a5-a480-d8695aaba7823098852561625908631.png",alt:"头像"},null,8,Pe),n("div",Me,r(a.username),1)]),n("div",Te,[n("div",je,[e[9]||(e[9]=n("span",{class:"whitespace-nowrap"},"🏗️ 项目名称：",-1)),n("span",Se,r(a.proname||"暂无项目"),1)]),n("div",Ce,[e[10]||(e[10]=n("span",{class:"whitespace-nowrap"},"📅 上班打卡时间：",-1)),n("span",Ie,r(a.dbtime||"无"),1)]),n("div",$e,[e[11]||(e[11]=n("span",{class:"whitespace-nowrap"},"📍 地址：",-1)),n("span",ze,r(a.address),1)])])]))),128))]),_:1})]),_:1}),u(d,{name:"inPeople",tab:"公司人员"},{default:f(()=>[(l(!0),o(b,null,x(P.value,a=>(l(),o("span",{class:"inPeople",key:a.id},r(a.username),1))),128))]),_:1}),u(d,{name:"unknownPeople",tab:"未知人员"},{default:f(()=>[(l(!0),o(b,null,x(S.value,a=>(l(),o("span",{class:"unknown",key:a.id},r(a.username),1))),128))]),_:1})]),_:1},8,["value"])])):oe("",!0)]),_:1})])])}}}),Ve=ue(De,[["__scopeId","data-v-37fa3d68"]]);export{Ve as default};
