import{o as _,b as m,e as f,d as $,p as B,i as T,f as t,w as n,g as i,t as c,am as d,A as U,B as V,F as j,E as q}from"./index-HZqiqJ25.js";import{_ as F}from"./round-check-circle-CKG7tRPj.js";import{_ as z}from"./FormItemGridItem-ti7ONDuQ.js";import{_ as S}from"./Grid-Cn-aZgeW.js";const D={class:"inline-block",viewBox:"0 0 24 24",width:"1em",height:"1em"},E=f("path",{fill:"currentColor",d:"M3 20v-6l8-2l-8-2V4l19 8z"},null,-1),G=[E];function I(v,r){return _(),m("svg",D,[...G])}const R={name:"material-symbols-send",render:I},A={class:"w-500px",style:{margin:"50px auto"}},M=f("div",{class:"c-#fff font-size-20px"},"接口配置",-1),O=$({name:"manage_interfaceconfig",__name:"index",setup(v){const{formRef:r,validate:h,restoreValidation:Y}=B(),a=T({ptoken:"f202f93f4b145aa389684f7510c9ee46",pwd:"aa1bb98e86710ebfa1f5fbc48f3b5e5c",savepath:"C:\\Users\\lijf\\Desktop\\wea",text:""}),w=async()=>{await h(),d({url:"http://172.20.1.104:8018/weather/updateYml.do",method:"post",data:{ptoken:a.value.ptoken,pwd:a.value.pwd,savepath:a.value.savepath},headers:{"Content-Type":"application/json"}}).then(s=>{var e;(e=window.$message)==null||e.success(s.data)}).catch(s=>{var e;(e=window.$message)==null||e.error(s)})},g=()=>{var s;if(a.value.text==""){(s=window.$message)==null||s.warning("请输入命令");return}d({url:"http://172.20.1.104:8018/weather/updatecmd.do",method:"post",data:{text:a.value.text},headers:{"Content-Type":"application/json"}}).then(e=>{var o;(o=window.$message)==null||o.success(e.data)}).catch(e=>{var o;(o=window.$message)==null||o.error(e)})},b={ptoken:{required:!0,message:"请输入Token",trigger:"blur"},pwd:{required:!0,message:"请输入密码",trigger:"blur"},savepath:{required:!0,message:"请输入路径",trigger:"blur"}};return(s,e)=>{const o=z,p=U,x=F,u=V,k=S,y=j,N=R,C=q;return _(),m("div",A,[t(y,{ref_key:"formRef",ref:r,model:a.value,rules:b,"label-placement":"top","label-width":"auto","require-mark-placement":"left"},{default:n(()=>[t(k,{responsive:"screen","item-responsive":""},{default:n(()=>[t(o,{span:"24 m:24",label:" "},{default:n(()=>[M]),_:1}),t(o,{span:"24 m:24",label:"Token",path:"ptoken"},{default:n(()=>[t(p,{clearable:"",value:a.value.ptoken,"onUpdate:value":e[0]||(e[0]=l=>a.value.ptoken=l),placeholder:"请输入"},null,8,["value"])]),_:1}),t(o,{span:"24 m:24",label:"密码",path:"pwd"},{default:n(()=>[t(p,{clearable:"",value:a.value.pwd,"onUpdate:value":e[1]||(e[1]=l=>a.value.pwd=l),placeholder:"请输入",style:{width:"100%"}},null,8,["value"])]),_:1}),t(o,{span:"24 m:24",label:"路径",path:"savepath"},{default:n(()=>[t(p,{clearable:"",value:a.value.savepath,"onUpdate:value":e[2]||(e[2]=l=>a.value.savepath=l),placeholder:"请输入",style:{width:"100%"}},null,8,["value"])]),_:1}),t(o,{span:"24 m:24",label:"",path:"savepath"},{default:n(()=>[t(u,{type:"primary",onClick:w,class:"w-100px",style:{margin:"0 auto"}},{icon:n(()=>[t(x,{class:"text-icon"})]),default:n(()=>[i(" "+c(s.$t("page.manage.scencename.save")),1)]),_:1})]),_:1}),t(o,{span:"24 m:24",label:"命令",path:"text"},{default:n(()=>[t(p,{clearable:"",value:a.value.text,"onUpdate:value":e[3]||(e[3]=l=>a.value.text=l),placeholder:"请输入",style:{width:"100%"}},null,8,["value"])]),_:1})]),_:1})]),_:1},8,["model"]),t(C,{size:16,justify:"center"},{default:n(()=>[t(u,{type:"primary",onClick:g,class:"w-100px"},{icon:n(()=>[t(N,{class:"text-icon"})]),default:n(()=>[i(" "+c("发送"))]),_:1})]),_:1})])}}});export{O as default};