import{d as Z,a0 as ee,j as y,J as ne,K as $,o as i,e as f,f as m,ai as B,ag as E,g as a,w as s,h as v,i as g,B as N,t as b,M as ae,L as I,c as k,av as se,an as z,A as te,C as oe,D as le,E as re,aa as ie,ab as ue,aX as de,S as ce,a6 as pe,ar as V,aY as me,_ as _e,X as fe,a9 as ve,aw as ge,ax as be,ay as ke}from"./index-ClKiVTJI.js";import{d as we,e as he,g as ye}from"./basic-config-1sftC1Um.js";import{_ as Ne}from"./FormItemGridItem-OIGZ-ZEg.js";import{_ as Se}from"./Grid-D0xzNjlx.js";const Ie=w=>(ge("data-v-0a11c6b4"),w=w(),be(),w),xe={class:"min-h-500px flex-col-stretch gap-16px overflow-auto lt-sm:overflow-auto"},Ce={key:0,class:"lan-network"},De={class:"lanList"},Ue=["onClick"],$e={class:"but"},Be=Ie(()=>m("span",{style:{width:"3px",height:"15px",background:"#1980ff",display:"inline-block","margin-right":"5px","border-radius":"20px"}},null,-1)),Ee=Z({name:"basicconfig_network-manage",__name:"index",setup(w){const A=ee(),P=()=>{let t=[];for(let e=1;e<=32;e++)t.push({label:e+"",value:e});return t},u=y([{id:1,nname:"eno1",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:""},{id:2,nname:"eno2",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:""},{id:3,nname:"eno3",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:""},{id:4,nname:"eno4",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:""},{id:5,nname:"eno5",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:""},{id:6,nname:"eno6",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:""},{id:7,nname:"eno7",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:""},{id:8,nname:"eno8",nip:"",nmaskbits:null,nmask:"",predns:"",bakdns:"",gateway:""}]),c=y(0),q=async()=>{const{data:t,error:e}=await we();if(t){const o=JSON.parse(JSON.stringify(t));c.value=o.id||o.nname.charAt(o.nname.length-1)||o.nname.replace("eno",""),u.value[c.value-1]=o,u.value[c.value-1].id=c.value,se(()=>{var p;const r=document.getElementById((p=u.value.find(h=>h.id==c.value))==null?void 0:p.nname);r&&r.scrollIntoView({behavior:"smooth",block:"center"})})}},M={nip:{required:!1,validator:V,trigger:["input","change","blur","password-input"]},gateway:{required:!1,validator:V,trigger:["input","change","blur","password-input"]}},F=async t=>{var r,p;const{data:e,error:o}=await ye(u.value[t]);o||((r=window.$message)==null||r.destroyAll(),(p=window.$message)==null||p.success("配置成功"))},O=y(null),T=async(t,e)=>{const o=document.getElementById(t.nname);o&&o.scrollIntoView({behavior:"smooth",block:"start"}),O.value=e},l=y({visible:!1,dns1:"",dns2:""}),j={dns1:{required:!0,trigger:["blur","input","change"],validator:(t,e)=>e?z(e)?!0:new Error("请输入正确的DNS"):new Error("请输入DNS")},dns2:{required:!1,trigger:["blur","input","change"],validator:(t,e)=>e?z(e)?!0:new Error("请输入正确的DNS"):new Error("请输入DNS")}},G=()=>{l.value.visible=!0,l.value.dns1=u.value[c.value-1].predns,l.value.dns2=u.value[c.value-1].bakdns},x=async()=>{var o,r;const{data:t,error:e}=await he({dns1:l.value.dns1,dns2:l.value.dns2});e||((o=window.$message)==null||o.destroyAll(),(r=window.$message)==null||r.success("配置成功"),C())},C=()=>{l.value.visible=!1,l.value.dns1="",l.value.dns2=""},J=(t,e)=>{e.nmask=me(t)};return ne(()=>{q()}),(t,e)=>{const o=_e,r=te,p=oe,h=le,D=re,K=ie,L=ue,R=de,_=Ne,X=fe,W=Se,Y=ve,H=ce,U=$("no-space"),Q=$("no-auth");return i(),f("div",xe,[u.value.length>0?(i(),f("div",Ce,[m("div",De,[(i(!0),f(B,null,E(u.value,(n,S)=>(i(),f("div",{class:"lanItem",key:n.id,onClick:d=>T(n,S)},[Number(n.nname.charAt(n.nname.length-1)||n.nname.replace("eno",""))==c.value?(i(),k(o,{key:0,"local-icon":"lan-active",style:{"font-size":"30px"},class:"animation"})):(i(),k(o,{key:1,"local-icon":"lan-default",style:{"font-size":"30px"}})),m("span",null,b(n.nname),1)],8,Ue))),128))]),m("div",$e,[a(g(N),{type:"info",ghost:"",onClick:G},{default:s(()=>[v("DNS配置")]),_:1})]),a(L,{show:l.value.visible,"onUpdate:show":e[2]||(e[2]=n=>l.value.visible=n),"display-directive":"show",width:300},{default:s(()=>[a(K,{title:"设置DNS","native-scrollbar":!1,closable:""},{footer:s(()=>[a(D,{size:16},{default:s(()=>[a(g(N),{onClick:C},{default:s(()=>[v(b(t.$t("common.cancel")),1)]),_:1}),a(g(N),{type:"primary",onClick:x},{default:s(()=>[v(b(t.$t("common.confirm")),1)]),_:1})]),_:1})]),default:s(()=>[a(h,{ref:"formRef",model:l.value,rules:j,onKeyup:ae(x,["enter"])},{default:s(()=>[a(p,{label:"DNS(首选)",path:"dns1"},{default:s(()=>[I(a(r,{clearable:"",value:l.value.dns1,"onUpdate:value":e[0]||(e[0]=n=>l.value.dns1=n),placeholder:"请输入IP"},null,8,["value"]),[[U]])]),_:1}),a(p,{label:"DNS(备用)",path:"dns2"},{default:s(()=>[I(a(r,{clearable:"",value:l.value.dns2,"onUpdate:value":e[1]||(e[1]=n=>l.value.dns2=n),placeholder:"请输入IP"},null,8,["value"]),[[U]])]),_:1})]),_:1},8,["model"])]),_:1})]),_:1},8,["show"])])):(i(),k(R,{key:1,size:"huge",description:"未检测到有效的系统返回码"})),a(H,null,{default:s(()=>[(i(!0),f(B,null,E(u.value,(n,S)=>(i(),k(Y,{bordered:!1,size:"small",class:"card-wrapper",key:n.nname,id:n.nname},{header:s(()=>[m("div",{style:pe({color:g(A).themeScheme==="dark"?"#fff":"#000",fontWeight:"bolder",padding:"5px",fontSize:"18px",marginBottom:"10px",display:"flex",alignItems:"center"})},[Be,v(" "+b(n.nname)+"网络配置 ",1)],4)]),default:s(()=>[a(h,{ref_for:!0,ref:"formRef",model:n,rules:M,"label-placement":"left","label-width":140,"require-mark-placement":"left"},{default:s(()=>[a(W,{responsive:"screen","item-responsive":""},{default:s(()=>[a(_,{span:"24 s:12 m:6",label:"IP地址",path:"nip"},{default:s(()=>[a(r,{clearable:"",placeholder:"请输入IP地址",value:n.nip,"onUpdate:value":d=>n.nip=d},null,8,["value","onUpdate:value"])]),_:2},1024),a(_,{span:"24 s:12 m:6",label:"掩码位数",path:"nmaskbits"},{default:s(()=>[a(X,{clearable:"",options:P(),placeholder:"请选择掩码位数",value:n.nmaskbits,"onUpdate:value":d=>n.nmaskbits=d,onUpdateValue:d=>J(d,n)},null,8,["options","value","onUpdate:value","onUpdateValue"])]),_:2},1024),a(_,{span:"24 s:12 m:6",label:"掩码",path:"nmask"},{default:s(()=>[m("span",null,b(n.nmask),1)]),_:2},1024),a(_,{span:"24 s:12 m:6",label:"网关",path:"gateway"},{default:s(()=>[a(r,{clearable:"",placeholder:"请输入网关",value:n.gateway,"onUpdate:value":d=>n.gateway=d},null,8,["value","onUpdate:value"])]),_:2},1024),a(_,{span:"24 s:24 m:24"},{default:s(()=>[a(D,{justify:"center",class:"w-100%"},{default:s(()=>[I((i(),k(g(N),{type:"info",ghost:"",onClick:d=>F(S)},{default:s(()=>[v("应用配置 ")]),_:2},1032,["onClick"])),[[Q,"sys.network.update"]])]),_:2},1024)]),_:2},1024)]),_:2},1024)]),_:2},1032,["model"])]),_:2},1032,["id"]))),128))]),_:1})])}}}),qe=ke(Ee,[["__scopeId","data-v-0a11c6b4"]]);export{qe as default};