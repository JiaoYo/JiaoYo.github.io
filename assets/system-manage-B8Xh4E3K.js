import{bg as t}from"./index-B6CaFrdK.js";function m(e){return t({url:"/sys/role/page.do",method:"get",params:e})}function p(e){return t({url:`/sys/role/${e}`,method:"get"})}function g(e,r,o,s,u){return t({url:e?"/sys/role/update.so":"/sys/role",method:"post",data:{id:e,name:r,menuIdList:o,remark:s,rtype:u}})}function y(e){return t({url:e.id?"/sys/role/update.so":"/sys/role",method:"post",data:e})}function U(e){return t({url:"/sys/role/delete.do",method:"get",params:{ids:e.join(",")}})}function R(e){return t({url:"/user/getPage.do",method:"get",params:e})}function S(e){return t({url:"/user/getById.do",method:"get",params:{id:e}})}function v(e,r,o,s,u,n,a,d,l,f){return t({url:"/user/insert.do",method:"post",data:{username:e,usertype:r,password:o,starttime:s,endtime:u,effstarttime:n,effendtime:a,status:d,superadmin:l,udesc:f}})}function G(e,r,o,s,u,n,a,d,l,f,c,h){return t({url:"/user/update.do",method:"post",data:{id:e,username:r,usertype:o,oripwd:s,password:u,starttime:n,endtime:a,effstarttime:d,effendtime:l,status:f,superadmin:c,udesc:h}})}function I(e){return t({url:"/user/update.do",method:"post",data:e})}function D(e){return t({url:"/user/delete.do",method:"get",params:{ids:e.join(",")}})}function j(e,r){return t({url:"/user/updateRoleUser.do",method:"post",params:{uids:e,rid:r}})}function b(e){return t({url:"/sys/menu/navSup.do",method:"get",params:e})}export{g as a,y as b,b as c,p as d,m as e,R as f,U as g,v as h,G as i,j,S as k,I as l,D as m};