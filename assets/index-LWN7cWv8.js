import{o as g,e as A,f as I,d as O,q as X,r as ae,v as le,y as j,c as y,w as l,g as e,h as u,i as f,C as V,z as N,a$ as x,c0 as ne,c1 as Q,M as J,B as M,an as K,ar as se,L as W,O as Y,P as G,ak as Z,Q as oe,R as ie,S as ee,j as L,aH as ue,c2 as re,c3 as de,c4 as me,aT as pe,x as ce,F as _e,G as fe,E as ve,aD as be,ae as he,t as ge,aj as we,as as ke,a5 as te,b_ as ye,b$ as xe}from"./index-BrnhYMCg.js";import{f as $e,a as Ce,b as Ue,c as De,d as qe,e as Te,g as Se,h as Ee}from"./basic_config-DJWD1k2W.js";import{a as Be,_ as Ne}from"./DatePicker-BFos397C.js";import{_ as Ie}from"./round-search-DaON9RWD.js";import{u as Re}from"./table-sa78L7UE.js";import{_ as Pe}from"./FormItemGridItem-BjTU61Q5.js";import{_ as Fe}from"./Grid-Cys8vxe5.js";const Me={class:"inline-block",viewBox:"0 0 24 24",width:"1em",height:"1em"},Oe=I("path",{fill:"currentColor",d:"M12 22q-3.475-.875-5.738-3.988T4 11.1V5l8-3l8 3v6.1q0 3.8-2.262 6.913T12 22m0-2.1q2.6-.825 4.3-3.3t1.7-5.5V6.375l-6-2.25l-6 2.25V11.1q0 3.025 1.7 5.5t4.3 3.3m0-2.9q.425 0 .738-.312t.312-.738t-.312-.737T12 14.9t-.737.313t-.313.737t.313.738T12 17m.025-3.1q.3 0 .538-.225t.237-.525q.025-.175.075-.337t.15-.313q.175-.25.388-.45t.412-.4q.425-.425.738-.95t.312-1.15q0-1.125-.862-1.838T12 7q-.8 0-1.475.375T9.45 8.425q-.15.275-.037.55t.412.4q.275.125.55-.012T10.85 9q.225-.275.513-.412T12 8.45q.55 0 .963.325t.412.825q0 .425-.262.788t-.588.662q-.275.275-.55.538t-.475.587q-.125.2-.175.45t-.05.5q0 .325.212.55t.538.225"},null,-1),He=[Oe];function Ve(D,k){return g(),A("svg",Me,[...He])}const z={name:"material-symbols-shield-question-outline-rounded",render:Ve},H=D=>(oe("data-v-fb080b6c"),D=D(),ie(),D),Ae={class:"flex justify-center"},je=H(()=>I("span",{class:"font-bold"},"提示：",-1)),Ge=H(()=>I("span",{style:{"text-decoration":"underline"}},"被锁定的账号会在设定的时间周期后自动解锁",-1)),Le=H(()=>I("span",{class:"font-bold"},"提示：",-1)),ze=H(()=>I("span",{style:{"text-decoration":"underline"}},"建议根据电站所在位置的日出日落时间设置统计周期，以确保数据准确性。",-1)),Xe=O({name:"basicConfig",__name:"basicConfig",setup(D){const{formRef:k,validate:q,restoreValidation:o}=X(),a=ae(T());function T(){return{unlockeanble:1,unlocktime:5,aceffective:1,pwdexpire:1,expiretime:1,cputhreshold:80,memthreshold:80,passrate:20,captcha:1,tokentime:30,whiteenable:1,statistics:1,sstarttime:void 0,sendtime:void 0,hisintervel:1,emaileanble:1,eipaddr:""}}const v={type:"number",required:!0,message:"不能为空",trigger:["blur","change"]},E={unlocktime:v,expiretime:v,cputhreshold:v,memthreshold:v,tokentime:v,sstarttime:v,sendtime:v,passrate:v,hisintervel:v,eipaddr:{type:"string",required:!0,message:"不能为空",trigger:["blur","change"]}},$=async()=>{const{data:s,error:t}=await $e();t||(Object.assign(a,s),a.unlocktime=s.unlocktime/60/24,a.sstarttime=x(5,x(0,new Date)+" "+a.sstarttime),a.sendtime=x(5,x(0,new Date)+" "+a.sendtime))};le(()=>{$()});const i=async()=>{var r;const s=x(7,a.sstarttime),t=x(7,a.sendtime),p=a.unlocktime*60*24;await q();const{error:b}=await Ce({...a,sstarttime:s,sendtime:t,unlocktime:p});b||(r=window.$message)==null||r.success("设置成功")};return(s,t)=>{const p=ne,b=Q,r=J,c=M,h=K,d=se,m=W,_=Be,S=Y,C=G,U=Z,B=j("no-auth");return g(),y(U,{style:{"max-height":"calc(100vh - 245px)"}},{default:l(()=>[I("div",Ae,[e(C,{ref_key:"formRef",ref:k,"label-width":200,"label-placement":"left",model:a,rules:E},{default:l(()=>[e(r,{label:"是否开启自动解锁",path:"unlockeanble"},{label:l(()=>[u(" 是否开启自动解锁 "),e(p,{trigger:"hover",placement:"top","content-style":"padding: 5px;"},{trigger:l(()=>[e(f(z),{class:"text-xl cursor-pointer c-#7a7b78"})]),default:l(()=>[je,Ge]),_:1})]),default:l(()=>[e(b,{value:a.unlockeanble,"onUpdate:value":t[0]||(t[0]=n=>a.unlockeanble=n),"checked-value":1,"unchecked-value":0},null,8,["value"])]),_:1}),e(r,{label:"解锁时间",path:"unlocktime"},{default:l(()=>[e(d,{class:"flex items-center"},{default:l(()=>[e(c,{onClick:t[1]||(t[1]=n=>a.unlocktime--),disabled:a.unlocktime==1},{default:l(()=>[u(" − ")]),_:1},8,["disabled"]),e(h,{"show-button":!1,value:a.unlocktime,"onUpdate:value":t[2]||(t[2]=n=>a.unlocktime=n),placeholder:"",min:1,max:3},null,8,["value"]),e(c,{onClick:t[3]||(t[3]=n=>a.unlocktime++),class:"mr-5px",disabled:a.unlocktime==3},{default:l(()=>[u(" + ")]),_:1},8,["disabled"]),u(" 天 ")]),_:1})]),_:1}),e(r,{label:"密码过期时间",path:"expiretime"},{default:l(()=>[e(d,{class:"flex items-center"},{default:l(()=>[e(c,{onClick:t[4]||(t[4]=n=>a.expiretime--),disabled:a.expiretime==1},{default:l(()=>[u(" − ")]),_:1},8,["disabled"]),e(h,{"show-button":!1,value:a.expiretime,"onUpdate:value":t[5]||(t[5]=n=>a.expiretime=n),placeholder:"",min:1,max:90},null,8,["value"]),e(c,{onClick:t[6]||(t[6]=n=>a.expiretime++),class:"mr-5px",disabled:a.expiretime==90},{default:l(()=>[u(" + ")]),_:1},8,["disabled"]),u(" 天 ")]),_:1})]),_:1}),e(r,{label:"是否开启白名单",path:"whiteenable"},{default:l(()=>[e(b,{value:a.whiteenable,"onUpdate:value":t[7]||(t[7]=n=>a.whiteenable=n),"checked-value":1,"unchecked-value":0},null,8,["value"])]),_:1}),e(r,{label:"是否开启验证码",path:"captcha"},{default:l(()=>[e(b,{value:a.captcha,"onUpdate:value":t[8]||(t[8]=n=>a.captcha=n),"checked-value":1,"unchecked-value":0},null,8,["value"])]),_:1}),e(r,{label:"是否开启发送邮件",path:"emaileanble"},{default:l(()=>[e(b,{value:a.emaileanble,"onUpdate:value":t[9]||(t[9]=n=>a.emaileanble=n),"checked-value":1,"unchecked-value":0},null,8,["value"])]),_:1}),a.emaileanble==1?(g(),y(r,{key:0,label:"邮件地址",path:"eipaddr"},{default:l(()=>[e(m,{value:a.eipaddr,"onUpdate:value":t[10]||(t[10]=n=>a.eipaddr=n),placeholder:"请输入邮件地址"},null,8,["value"])]),_:1})):V("",!0),e(r,{label:"CPU阈值",path:"cputhreshold"},{default:l(()=>[e(d,{class:"flex items-center"},{default:l(()=>[e(c,{onClick:t[11]||(t[11]=n=>a.cputhreshold--),disabled:a.cputhreshold==0},{default:l(()=>[u(" − ")]),_:1},8,["disabled"]),e(h,{"show-button":!1,value:a.cputhreshold,"onUpdate:value":t[12]||(t[12]=n=>a.cputhreshold=n),precision:0,placeholder:"",min:0,max:100},null,8,["value"]),e(c,{onClick:t[13]||(t[13]=n=>a.cputhreshold++),disabled:a.cputhreshold==100,class:"mr-5px"},{default:l(()=>[u(" + ")]),_:1},8,["disabled"]),u(" % ")]),_:1})]),_:1}),e(r,{label:"MEM阈值",path:"memthreshold"},{default:l(()=>[e(d,{class:"flex items-center"},{default:l(()=>[e(c,{onClick:t[14]||(t[14]=n=>a.memthreshold--),disabled:a.memthreshold==0},{default:l(()=>[u(" − ")]),_:1},8,["disabled"]),e(h,{"show-button":!1,value:a.memthreshold,"onUpdate:value":t[15]||(t[15]=n=>a.memthreshold=n),precision:0,placeholder:"",min:0,max:100},null,8,["value"]),e(c,{onClick:t[16]||(t[16]=n=>a.memthreshold++),disabled:a.memthreshold==100,class:"mr-5px"},{default:l(()=>[u(" + ")]),_:1},8,["disabled"]),u(" % ")]),_:1})]),_:1}),e(r,{label:"合规率阈值",path:"passrate"},{default:l(()=>[e(d,{class:"flex items-center"},{default:l(()=>[e(c,{onClick:t[17]||(t[17]=n=>a.passrate--),disabled:a.passrate==0},{default:l(()=>[u(" − ")]),_:1},8,["disabled"]),e(h,{"show-button":!1,value:a.passrate,"onUpdate:value":t[18]||(t[18]=n=>a.passrate=n),placeholder:"",min:0,max:100},null,8,["value"]),e(c,{onClick:t[19]||(t[19]=n=>a.passrate++),disabled:a.passrate==100,class:"mr-5px"},{default:l(()=>[u(" + ")]),_:1},8,["disabled"])]),_:1})]),_:1}),e(r,{label:"token过期时间",path:"tokentime"},{default:l(()=>[e(d,{class:"flex items-center"},{default:l(()=>[e(c,{onClick:t[20]||(t[20]=n=>a.tokentime--),disabled:a.tokentime==1},{default:l(()=>[u(" − ")]),_:1},8,["disabled"]),e(h,{"show-button":!1,value:a.tokentime,"onUpdate:value":t[21]||(t[21]=n=>a.tokentime=n),placeholder:"",min:1},null,8,["value"]),e(c,{onClick:t[22]||(t[22]=n=>a.tokentime++),class:"mr-5px"},{default:l(()=>[u(" + ")]),_:1}),u(" 小时 ")]),_:1})]),_:1}),e(r,{label:"是否开启统计",path:"statistics"},{label:l(()=>[u(" 是否开启统计 "),e(p,{trigger:"hover",placement:"top","content-style":"padding: 5px;"},{trigger:l(()=>[e(f(z),{class:"text-xl cursor-pointer c-#7a7b78"})]),default:l(()=>[Le,ze]),_:1})]),default:l(()=>[e(b,{value:a.statistics,"onUpdate:value":t[23]||(t[23]=n=>a.statistics=n),"checked-value":1,"unchecked-value":0},null,8,["value"])]),_:1}),a.statistics==1?(g(),y(r,{key:1,label:"统计开始时间",path:"sstarttime"},{default:l(()=>[e(_,{value:a.sstarttime,"onUpdate:value":t[24]||(t[24]=n=>a.sstarttime=n),format:"HH:mm",class:"w-150px"},null,8,["value"])]),_:1})):V("",!0),a.statistics==1?(g(),y(r,{key:2,label:"统计结束时间",path:"sendtime"},{default:l(()=>[e(_,{value:a.sendtime,"onUpdate:value":t[25]||(t[25]=n=>a.sendtime=n),format:"HH:mm",class:"w-150px"},null,8,["value"])]),_:1})):V("",!0),e(r,{label:"历史数据存储误差允许间隔",path:"hisintervel"},{default:l(()=>[e(d,{class:"flex items-center"},{default:l(()=>[e(c,{onClick:t[26]||(t[26]=n=>a.hisintervel--),disabled:a.hisintervel==0},{default:l(()=>[u(" − ")]),_:1},8,["disabled"]),e(h,{"show-button":!1,value:a.hisintervel,"onUpdate:value":t[27]||(t[27]=n=>a.hisintervel=n),precision:0,placeholder:"",min:1,max:5},null,8,["value"]),e(c,{onClick:t[28]||(t[28]=n=>a.hisintervel++),disabled:a.hisintervel==5,class:"mr-5px"},{default:l(()=>[u(" + ")]),_:1},8,["disabled"]),u(" 分钟 ")]),_:1})]),_:1}),e(r,{label:" "},{default:l(()=>[e(S,null,{default:l(()=>[N((g(),y(c,{type:"default",ghost:"",onClick:$},{default:l(()=>[u(" 刷新 ")]),_:1})),[[B,"system.conf.select"]]),N((g(),y(c,{type:"info",ghost:"",onClick:i},{default:l(()=>[u(" 保存 ")]),_:1})),[[B,"system.conf.update"]])]),_:1})]),_:1})]),_:1},8,["model"])])]),_:1})}}}),Qe=ee(Xe,[["__scopeId","data-v-fb080b6c"]]),Je=O({name:"emailService",__name:"emailSever",setup(D){const{formRef:k,validate:q}=X(),o=L({port:void 0,pwd:"",sendserver:"",essl:0,uname:""}),a={sendserver:[{required:!0,validator:(i,s,t)=>s?re(s)?t():t(new Error("请输入正确的IP地址或域名")):new Error("请输入服务器地址"),trigger:["blur","input"]}],port:{type:"number",required:!0,trigger:["blur","input"],validator:(i,s,t)=>s==null||s==null?new Error("请输入端口号"):de(s)?!0:new Error("请输入在0-65535之间的数字")},uname:[{required:!0,message:"请输入账号",trigger:"blur"}],pwd:[{required:!0,message:"请输入密码",trigger:"blur"}],sendaddr:[{required:!0,message:"请输入发件邮箱",trigger:["blur","input"]},{validator:me,trigger:["blur","input"]}]},T=async()=>{const{data:i,error:s}=await Ue();s||(o.value.sendserver=(i==null?void 0:i.sendserver)??o.value.sendserver,o.value.port=(i==null?void 0:i.port)??o.value.port,o.value.pwd=(i==null?void 0:i.pwd)??o.value.pwd,o.value.essl=(i==null?void 0:i.essl)??o.value.essl,o.value.uname=(i==null?void 0:i.uname)??o.value.uname,o.value.id=(i==null?void 0:i.id)??o.value.id)};T();const v=async()=>{var i,s,t,p;if(await q(),o.value.id){const{data:b,error:r}=await De(o.value);r||((i=window.$message)==null||i.destroyAll(),(s=window.$message)==null||s.success("保存成功"))}else{const{data:b,error:r}=await qe(o.value);r||((t=window.$message)==null||t.destroyAll(),(p=window.$message)==null||p.success("保存成功"))}},E=async()=>{var t,p;const{data:i,error:s}=await Te();s||((t=window.$message)==null||t.destroyAll(),(p=window.$message)==null||p.success("重置成功"),T())},$=async()=>{var t,p;await q();const{data:i,error:s}=await Se(o.value);s||((t=window.$message)==null||t.destroyAll(),(p=window.$message)==null||p.success("测试成功"))};return(i,s)=>{const t=W,p=J,b=K,r=Q,c=G,h=M,d=Y,m=j("no-auth");return g(),A(ue,null,[e(c,{ref_key:"formRef",ref:k,"label-width":150,model:o.value,rules:a,"label-placement":"left",class:"w-400px",style:{margin:"50px auto"}},{default:l(()=>[e(p,{label:"发送邮件服务器",path:"sendserver"},{default:l(()=>[e(t,{value:o.value.sendserver,"onUpdate:value":s[0]||(s[0]=_=>o.value.sendserver=_),placeholder:"输入服务器或IP地址"},null,8,["value"])]),_:1}),e(p,{label:"端口",path:"port"},{default:l(()=>[e(b,{value:o.value.port,"onUpdate:value":s[1]||(s[1]=_=>o.value.port=_),placeholder:"输入端口",style:{width:"100%"}},null,8,["value"])]),_:1}),e(p,{label:"用户名",path:"uname"},{default:l(()=>[e(t,{value:o.value.uname,"onUpdate:value":s[2]||(s[2]=_=>o.value.uname=_),placeholder:"用户名"},null,8,["value"])]),_:1}),e(p,{label:"密码",path:"pwd"},{default:l(()=>[e(t,{type:"password",value:o.value.pwd,"onUpdate:value":s[3]||(s[3]=_=>o.value.pwd=_),placeholder:"密码","show-password-on":"click"},null,8,["value"])]),_:1}),e(p,{label:"ssl",path:"essl"},{default:l(()=>[e(r,{value:o.value.essl,"onUpdate:value":s[4]||(s[4]=_=>o.value.essl=_),"checked-value":1,"unchecked-value":0},null,8,["value"])]),_:1})]),_:1},8,["model"]),e(d,{justify:"center"},{default:l(()=>[N((g(),y(h,{type:"info",ghost:"",onClick:$},{default:l(()=>[u("测试")]),_:1})),[[m,"sysmanger.basicInfo.test.mailInfo"]]),N((g(),y(h,{type:"info",ghost:"",onClick:v},{default:l(()=>[u("保存")]),_:1})),[[m,"sysmanger.mailInfo.update"]]),N((g(),y(h,{type:"info",ghost:"",onClick:E},{default:l(()=>[u("重置")]),_:1})),[[m,"sysmanger.mailInfo.delete"]])]),_:1})],64)}}}),Ke=O({name:"dataBackup",__name:"dataBackup",setup(D){const k=[{label:"错误日志",value:0},{label:"登录日志",value:1},{label:"操作日志",value:2},{label:"功率",value:5}],q=Date.now(),o=new Date(q).setHours(0,0,0,0),a=new Date(q).setHours(23,59,59,999),{columns:T,columnChecks:v,data:E,getData:$,loading:i,mobilePagination:s,searchParams:t,resetSearchParams:p}=Re({apiFn:Ee,immediate:!0,apiParams:{page:1,limit:20,startTime:x(1,o),endTime:x(1,a),bstatus:0,btype:void 0},columns:()=>[{title:"时间",key:"dbtime",align:"center"},{title:"备份状态",key:"bstatus",align:"center",render:d=>e(pe,{type:d.bstatus==0?"success":"error",round:!0},{default:()=>[d.bstatus===0?"成功":"失败"]})},{title:"类型",key:"btype",align:"center",render:d=>{var m;return e("span",null,[(m=k.find(_=>_.value==d.btype))==null?void 0:m.label])}},{key:"operate",title:"操作",align:"center",width:130,render:d=>e("div",{class:"flex-center gap-8px"},[N(e(M,{type:"primary",ghost:!0,size:"small",onClick:()=>c(d.id)},{default:()=>[u("下载")]}),[[j("no-auth"),"data.back.download"]])])}]}),b=L([Date.now()-864e5*3,Date.now()]);async function r(d,m){t.startTime=x(1,m[0]),t.endTime=x(1,m[1]),$()}const c=async d=>{const m=ce(),_=Date.now().toString(),S=_e(`${m}${_}`);fe({url:ve+"/dataBack/download.do",method:"get",params:{id:d},responseType:"blob",headers:{token:be(),"X-Nonce":m,"X-Timestamp":_,"X-Signature":S}}).then(async C=>{var P,F;const U=C.headers["content-disposition"];console.log("文件名:",U);var B=(U==null?void 0:U.substring(U.indexOf("=")+1))||new Date().getTime()+".xls";if(C.data.type=="application/json"){const R=await C.data.text();var n=JSON.parse(R);if(n.code==500)return(P=window.$message)==null?void 0:P.error(n.data)}if(C.data){const R=window.URL.createObjectURL(new Blob([C.data])),w=document.createElement("a");w.href=R,w.setAttribute("download",B),document.body.appendChild(w),w.click()}(F=window.$message)==null||F.success("下载成功")})},h={近一天:[Date.now()-864e5*1,Date.now()],近三天:[Date.now()-864e5*3,Date.now()],近七天:[Date.now()-864e5*7,Date.now()]};return(d,m)=>{const _=we,S=Pe,C=Ne,U=Ie,B=Fe,n=G,P=ke,F=te,R=Z;return g(),y(R,{class:"h-full flex-col",style:{maxHeight:"calc(100vh - 220px)",padding:"0 0 20px 0"}},{default:l(()=>[e(F,{bordered:!1,class:"flex-1","content-style":{padding:"0"},"header-style":{paddingTop:"0"}},{header:l(()=>[e(n,{ref:"formRef",model:f(t),"label-placement":"left","show-feedback":!1},{default:l(()=>[e(B,{"x-gap":16,responsive:"screen","item-responsive":""},{default:l(()=>[e(S,{span:"24 s:12 m:4",label:"状态",path:"bstatus"},{default:l(()=>[e(_,{options:[{label:"成功",value:0},{label:"失败",value:1}],placeholder:"请选择类型",filterable:"",clearable:"",value:f(t).bstatus,"onUpdate:value":[m[0]||(m[0]=w=>f(t).bstatus=w),f($)]},null,8,["value","onUpdate:value"])]),_:1}),e(S,{span:"24 s:12 m:8",label:"起止时间",path:"startTime"},{default:l(()=>[e(C,{value:b.value,"onUpdate:value":m[1]||(m[1]=w=>b.value=w),type:"datetimerange","value-format":"yyyy-MM-dd hh:mm:ss","onUpdate:formattedValue":r,clearable:"",shortcuts:h,"default-time":["00:00:00","23:59:59"]},null,8,["value"])]),_:1}),e(S,{span:"24 s:12 m:4",label:"类型",path:"htype"},{default:l(()=>[e(_,{options:k,placeholder:"请选择类型",filterable:"",clearable:"",value:f(t).btype,"onUpdate:value":[m[2]||(m[2]=w=>f(t).btype=w),f($)]},null,8,["value","onUpdate:value"])]),_:1}),e(S,{span:"24 s:12 m:4",label:"",path:"htype"},{default:l(()=>[e(f(M),{type:"primary",ghost:"",onClick:f($),class:"ml-20px"},{icon:l(()=>[e(U,{class:he(["text-icon",{"animate-spin":f(i)}])},null,8,["class"])]),default:l(()=>[u(" "+ge(d.$t("common.search")),1)]),_:1},8,["onClick"])]),_:1})]),_:1})]),_:1},8,["model"])]),default:l(()=>[e(P,{columns:f(T),data:f(E),size:"small","scroll-x":462,"max-height":530,loading:f(i),remote:"","row-key":w=>w.id,pagination:f(s),class:"sm:h-full"},null,8,["columns","data","loading","row-key","pagination"])]),_:1})]),_:1})}}}),We={class:"h-full"},Ye=O({name:"manage_systemconfig",__name:"index",setup(D){const k=L("基础配置");return(q,o)=>{const a=ye,T=xe,v=te;return g(),A("div",We,[e(v,{style:{"margin-bottom":"16px"},class:"h-full","content-style":{height:"100%"}},{default:l(()=>[e(T,{type:"card",animated:"",class:"h-100%",value:k.value,"onUpdate:value":o[0]||(o[0]=E=>k.value=E)},{default:l(()=>[e(a,{name:"基础配置",tab:"基础配置"},{default:l(()=>[e(Qe)]),_:1}),e(a,{name:"邮件服务",tab:"邮件服务"},{default:l(()=>[e(Je)]),_:1}),e(a,{name:"数据备份",tab:"数据备份"},{default:l(()=>[e(Ke)]),_:1})]),_:1},8,["value"])]),_:1})])}}}),ot=ee(Ye,[["__scopeId","data-v-e81b8345"]]);export{ot as default};
