import{c1 as T,a0 as j,b as L,j as x,dj as E,y as w,l as B,av as M}from"./index-DE8JjPFO.js";import{u as R,i as q,a as A,b as D,c as G,d as H,e as I,f as J,g as K,h as N,j as P,k as Q,l as V,m as W,n as X,o as Y,p as Z,q as _,r as F,s as U}from"./installCanvasRenderer-iCPGNWhM.js";R([q,A,D,G,H,I,J,K,N,P,Q,V,W,X,Y,Z,_,F]);function ta(d,$={}){const h=T(),p=j(),l=L(()=>p.darkMode),i=x(null),e={width:0,height:0},{width:m,height:b}=E(i,e);let a=null;const o=d(),{onRender:u=s=>{const t=l.value?"rgb(224, 224, 224)":"rgb(31, 31, 31)",C=l.value?"#1E0650":"rgba(255, 255, 255, 0.8)";s.showLoading({color:p.themeColor,textColor:t,fontSize:14,maskColor:C})},onUpdated:n=s=>{s.hideLoading()},onDestroy:c}=$;function k(){return i.value&&e.width>0&&e.height>0}function r(){return!!(i.value&&a)}async function v(s=()=>o){if(!r())return;const t=s(o,d);Object.assign(o,t),r()&&(a==null||a.clear()),a==null||a.setOption({...t,backgroundColor:"transparent"}),await(n==null?void 0:n(a))}function O(s){a==null||a.setOption(s)}async function g(){if(!r()){const s=l.value?"dark":"light";await M(),a=U(i.value,s),a.setOption({...o,backgroundColor:"transparent"}),await(u==null?void 0:u(a))}}function S(){a==null||a.resize()}async function f(){a&&(await(c==null?void 0:c(a)),a==null||a.dispose(),a=null)}async function y(){await f(),await g(),await(n==null?void 0:n(a))}async function z(s,t){if(e.width=s,e.height=t,!k()){await f();return}r()&&S(),await g()}return h.run(()=>{w([m,b],([s,t])=>{z(s,t)}),w(l,()=>{y()})}),B(()=>{f(),h.stop()}),{domRef:i,updateOptions:v,setOptions:O}}export{ta as u};