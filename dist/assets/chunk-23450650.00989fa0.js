(window.webpackJsonp=window.webpackJsonp||[]).push([["chunk-23450650"],{"519b":function(e,t,a){},"5d20":function(e,t,a){"use strict";var s=a("519b");a.n(s).a},"834a":function(e,t,a){"use strict";a.r(t);a("4160"),a("c975"),a("a434"),a("a9e3"),a("ac1f"),a("5319"),a("159b");var s=a("5530"),o=a("bc3a"),i=a.n(o),r=a("2f62"),n=a("c1df"),l=a.n(n),d=a("7424"),u=a("e199"),c=a("b775"),m={name:"internet",i18n:a("bf1c"),data:function(){return{activeKey:["1"],labelCol:{span:4},wrapperCol:{span:20},labelColEn:{span:6},wrapperColEn:{span:18},dataForm:{},networkList:[],modeList:[],ipList:[],storeIPList:[],ipIds:[],routeList:[],gatewayTime:l()(new Date).format("YYYY-MM-DD HH:mm:ss"),enableList:[{label:this.$t("yes"),value:1},{label:this.$t("noUsedhcpServer"),value:0}],defaultList:[{label:this.$t("yes"),value:1},{label:this.$t("no"),value:0}],modeOneList:[{label:"DHCP",value:"dhcp"},{label:this.$t("staticIP"),value:"manual"}],modeTwoList:[{label:this.$t("staticIP"),value:"manual"}],addIp:"",addMask:"",addTarget:"",addNextStep:"",isEditDefaultRoute:!1,defaultIpIndex:0,selectedEthIpAddress:""}},computed:Object(s.a)(Object(s.a)({},Object(r.e)("account",["user"])),Object(r.e)("setting",["lang"])),methods:{moment:l.a,filterOption:function(e,t){return t.componentOptions.children[0].text.toLowerCase().indexOf(e.toLowerCase())>=0},getIpInfo:function(){var e=this,t={};e.networkList=[],Object(u.u)({}).then((function(a){var s=a.data;if(!s)return!1;if(0!=s.code&&(e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(s.msg)),7==s.code)return!1;if(sessionStorage.setItem("getIplist",JSON.stringify(s.data)),s.data.forEach((function(t){var a={};"dhcp"!=t.mode&&(t.mode="manual"),Object.prototype.hasOwnProperty.call(t,"virtual")||(a={label:"NET"+(Number(t.eth)+1),value:t.eth},e.networkList.push(a))})),e.dataForm.eth){for(var o=0;o<s.data.length;o++)if(!Object.prototype.hasOwnProperty.call(s.data[o],"virtual")&&s.data[o].eth==e.dataForm.eth){t=s.data[o];break}}else t=s.data[0];e.dataForm=t,1==t.enable?e.modeList=e.modeOneList:e.modeList=e.modeTwoList;var i=[],r=[];t.ip_info?t.ip_info.forEach((function(t,a){window.location.hostname==t.ip&&(e.defaultIpIndex=a),i.push(t)})):i=[{ip:t.ip,mask:t.mask}],t.route_info&&t.route_info.forEach((function(e){e.route&&e.next&&r.push(e)})),e.ipList=i,e.selectedEthIpAddress=e.ipList.length>0?e.ipList[0].ip:"",e.routeList=r,e.storeIPList=i})).catch((function(e){return console.log(e),!1}))},selectEth:function(e){var t=this,a=[],s=[],o=sessionStorage.getItem("getIplist")?JSON.parse(sessionStorage.getItem("getIplist")):[];if(o.length>0){this.dataForm={},this.ipList=[],this.routeList=[];for(var i=0;i<o.length;i++){var r=o[i];if(!Object.prototype.hasOwnProperty.call(r,"virtual")&&r.eth==e){this.dataForm=r,this.dataForm.eth=e,"dhcp"!=r.mode&&(r.mode="manual"),r.ip_info?r.ip_info.forEach((function(e,s){window.location.hostname==e.ip&&(t.defaultIpIndex=s),a.push(e)})):a=[{ip:r.ip,mask:r.mask}],r.route_info&&r.route_info.forEach((function(e){s.push(e)})),this.ipList=a,this.selectedEthIpAddress=this.ipList.length>0?this.ipList[0].ip:"",this.routeList=s,this.storeIPList=a;break}}}},handleEnable:function(e){var t=this,a=null;if(sessionStorage.getItem("getIplist")){a=JSON.parse(sessionStorage.getItem("getIplist"));for(var s=0;s<a.length;s++){var o=a[s];o.eth===t.dataForm.eth&&(o.enable=e)}sessionStorage.setItem("getIplist",JSON.stringify(a))}0===e?t.$confirm({title:t.$t("hint"),content:t.$t("actingDhcpCauseGatewayOffline"),okText:t.$t("confirm"),cancelText:t.$t("cancel"),onOk:function(){t.dataForm.enable=0,t.modeList=t.modeTwoList,t.dataForm.mode="manual",t.dataForm.gateway="",t.dataForm.default=0},onCancel:function(){t.dataForm.enable=1}}):t.modeList=t.modeOneList},handleIPGet:function(e){if(sessionStorage.getItem("getIplist")){for(var t=JSON.parse(sessionStorage.getItem("getIplist")),a=0;a<t.length;a++){var s=t[a];s.eth===this.dataForm.eth&&(s.mode=e)}sessionStorage.setItem("getIplist",JSON.stringify(t))}"dhcp"===e?(this.ipList=[],this.dataForm.gateway="",this.dataForm.default=0):this.ipList=this.storeIPList},handlegateway:function(){if(sessionStorage.getItem("getIplist")){for(var e=JSON.parse(sessionStorage.getItem("getIplist")),t=0;t<e.length;t++){var a=e[t];a.eth===this.dataForm.eth&&(a.gateway=this.dataForm.gateway)}sessionStorage.setItem("getIplist",JSON.stringify(e))}},handledefault:function(e){if(this.isEditDefaultRoute=!0,sessionStorage.getItem("getIplist")){for(var t=JSON.parse(sessionStorage.getItem("getIplist")),a=0;a<t.length;a++){var s=t[a];s.eth===this.dataForm.eth&&(s.default=e)}sessionStorage.setItem("getIplist",JSON.stringify(t))}},handleMask:function(){var e=parseInt(this.addIp);this.addMask=e>=0&&e<=127?"255.0.0.0":e>=128&&e<=191?"255.255.0.0":"255.255.255.0"},handleAddIpChange:function(){var e=!1;if(!this.addIp)return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.error(this.$t("pleaseEnterIPAddress"));if(!/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.test(this.addIp))return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.error(this.$t("pleaseEnterTheCorrectIPAddress"));if(!this.addMask)return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.error(this.$t("pleaseEnterSubnetMask"));if(!/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){3}$/.test(this.addMask))return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.error(this.$t("pleaseEnterTheCorrectSubnetMask"));if(!(this.ipList.length<10))return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.info(this.$t("ipConfigMaxLimit"));if(0==this.ipList.length)this.ipList.push({ip:this.addIp,mask:this.addMask});else for(var t=0;t<this.ipList.length;t++)if(this.ipList[t].ip==this.addIp&&this.ipList[t].mask==this.addMask){e=!0;break}if(e)return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.error(this.$t("existIpAndMask"));this.ipList.push({ip:this.addIp,mask:this.addMask}),this.storeIPList=this.ipList;for(var a=sessionStorage.getItem("getIplist")?JSON.parse(sessionStorage.getItem("getIplist")):[],s=0;s<a.length;s++){var o=a[s];o.eth===this.dataForm.eth&&(o.ip_info=this.ipList)}sessionStorage.setItem("getIplist",JSON.stringify(a)),this.addIp="",this.addMask=""},handleIpDeleteChange:function(e,t){var a=this;if(e.ip&&(a.ipIds=[],a.ipIds.push(e)),window.location.hostname==e.ip)a.$confirm({title:a.$t("hint"),content:a.$t("webAccessedFailed"),okText:a.$t("confirm"),cancelText:a.$t("cancel"),onOk:function(){a.ipList.splice(t,1),a.storeIPList=a.ipList;for(var e=sessionStorage.getItem("getIplist")?JSON.parse(sessionStorage.getItem("getIplist")):[],s=0;s<e.length;s++){var o=e[s];o.eth===a.dataForm.eth&&(o.ip_info=a.ipList)}sessionStorage.setItem("getIplist",JSON.stringify(e)),a.$message.config({maxCount:1}),a.$message.destroy(),a.$message.success(a.$t("deleteSuccess"))}});else{a.ipList.splice(t,1),a.storeIPList=a.ipList;for(var s=sessionStorage.getItem("getIplist")?JSON.parse(sessionStorage.getItem("getIplist")):[],o=0;o<s.length;o++){var i=s[o];i.eth===a.dataForm.eth&&(i.ip_info=a.ipList)}sessionStorage.setItem("getIplist",JSON.stringify(s)),a.$message.config({maxCount:1}),a.$message.destroy(),a.$message.success(a.$t("deleteSuccess"))}},handleAddTargetNextStepChange:function(){var e=!1;if(!this.addTarget)return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.error(this.$t("pleaseEnterTheDestinationRoute"));if(!/^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)(\/(\d|[1-2]\d|3[0-2]))?$/.test(this.addTarget))return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.error(this.$t("pleaseEnterTheCorrectDestinationRoute"));if(!this.addNextStep)return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.error(this.$t("pleaseEnterNextHop"));if(!/^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)(\/(\d|[1-2]\d|3[0-2]))?$/.test(this.addNextStep))return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.error(this.$t("pleaseenterTheCorrectNextHop"));if(!(this.routeList.length<10))return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.info(this.$t("targetConfigMaxLimit"));if(0==this.routeList.length)this.routeList.push({route:this.addTarget,next:this.addNextStep});else{for(var t=0;t<this.routeList.length;t++)if(this.routeList[t].route==this.addTarget&&this.routeList[t].next==this.addNextStep){e=!0;break}if(e)return this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.error(this.$t("existTargetAndNexthop"));this.routeList.push({route:this.addTarget,next:this.addNextStep})}},handleRouteNextDeleteChange:function(e,t){e.route&&[].push(e),this.routeList.splice(t,1);for(var a=sessionStorage.getItem("getIplist")?JSON.parse(sessionStorage.getItem("getIplist")):[],s=0;s<a.length;s++){var o=a[s];o.eth===this.dataForm.eth&&(o.route_info=this.routeList)}sessionStorage.setItem("getIplist",JSON.stringify(a)),this.$message.config({maxCount:1}),this.$message.destroy(),this.$message.success(this.$t("deleteSuccess"))},setIpInfo:function(){var e=this,t=!1,a=window.location.hostname,s={mode:e.dataForm.mode,default:Number(e.dataForm.default),enable:Number(e.dataForm.enable),route_info:[],gateway:e.dataForm.gateway,ip_info:[],eth:Number(e.dataForm.eth)};if(!/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.test(e.dataForm.gateway))return e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(e.$t("pleaseEnterTheCorrectDefaultGatewayAddress"));if(e.ipList.length>0&&e.ipList[0].ip==e.selectedEthIpAddress&&(t=!0),t)if(e.isEditDefaultRoute)e.$confirm({title:e.$t("hint"),content:e.$t("modifyingIPSettingsCauseNetworkDisconnected"),okText:e.$t("confirm"),cancelText:e.$t("cancel"),onOk:function(){if(1==e.dataForm.default&&!e.dataForm.gateway)return e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(e.$t("defaultGatewayCannotBeEmpty"));if("manual"==e.dataForm.mode&&0==e.ipList.length)return e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(e.$t("ipSubnetMaskCannotBeEmpty"));if(e.ipList.length>0&&e.ipList.forEach((function(e){var t={ip:e.ip,mask:e.mask};s.ip_info.push(t)})),e.routeList.length>0){if(e.routeList.forEach((function(e){var t={route:e.route,next:e.next};s.route_info.push(t)})),s.route_info.length<10)for(var t=s.routeinfo.length;t<10;t++)s.route_info.push({route:"",next:""})}else for(var a=0;a<10;a++)s.route_info.push({route:"",next:""});Object(u.Y)(s).then((function(t){var a=t.data;return 0!=a.code?(e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(a.msg)):a.data.received?(e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.success(e.$t("setupSuccessful"))):(e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(a.msg))})).catch((function(e){return console.log(e),!1}))}});else{if(1==e.dataForm.default&&!e.dataForm.gateway)return e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(e.$t("defaultGatewayCannotBeEmpty"));if("manual"==e.dataForm.mode&&0==e.ipList.length)return e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(e.$t("ipSubnetMaskCannotBeEmpty"));if(e.ipList.length>0&&e.ipList.forEach((function(e){var t={ip:e.ip,mask:e.mask};s.ip_info.push(t)})),e.routeList.length>0){if(e.routeList.forEach((function(e){var t={route:e.route,next:e.next};s.route_info.push(t)})),s.route_info.length<10)for(var o=s.routeinfo.length;o<10;o++)s.route_info.push({route:"",next:""})}else for(var r=0;r<10;r++)s.route_info.push({route:"",next:""});Object(u.Y)(s).then((function(t){var a=t.data;return 0!=a.code?(e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(a.msg)):a.data.received?(e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.success(e.$t("setupSuccessful"))):(e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(a.msg))})).catch((function(e){return console.log(e),!1}))}else e.$confirm({title:e.$t("hint"),content:e.$t("jumpNewIpAddress"),okText:e.$t("confirm"),cancelText:e.$t("cancel"),onOk:function(){if(e.isEditDefaultRoute)e.$confirm({title:e.$t("hint"),content:e.$t("modifyingIPSettingsCauseNetworkDisconnected"),okText:e.$t("confirm"),cancelText:e.$t("cancel"),onOk:function(){if(1==e.dataForm.default&&!e.dataForm.gateway)return e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(e.$t("defaultGatewayCannotBeEmpty"));if("manual"==e.dataForm.mode&&0==e.ipList.length)return e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(e.$t("ipSubnetMaskCannotBeEmpty"));if(e.ipList.length>0&&e.ipList.forEach((function(e){var t={ip:e.ip,mask:e.mask};s.ip_info.push(t)})),e.routeList.length>0){if(e.routeList.forEach((function(e){var t={route:e.route,next:e.next};s.route_info.push(t)})),s.route_info.length<10)for(var t=s.routeinfo.length;t<10;t++)s.route_info.push({route:"",next:""})}else for(var o=0;o<10;o++)s.route_info.push({route:"",next:""});i.a.post("".concat(d.BASE_URL,"/setip"),s),setTimeout((function(){return e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.success(e.$t("setupSuccessful")),localStorage.removeItem("admin.routes"),localStorage.removeItem("admin.permissions"),localStorage.removeItem("admin.roles"),Object(c.d)(),window.open(window.location.href.replace(a,e.ipList[0].ip),"_self")}),1e3)}});else{if(1==e.dataForm.default&&!e.dataForm.gateway)return e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(e.$t("defaultGatewayCannotBeEmpty"));if("manual"==e.dataForm.mode&&0==e.ipList.length)return e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.error(e.$t("ipSubnetMaskCannotBeEmpty"));if(e.ipList.length>0&&e.ipList.forEach((function(e){var t={ip:e.ip,mask:e.mask};s.ip_info.push(t)})),e.routeList.length>0){if(e.routeList.forEach((function(e){var t={route:e.route,next:e.next};s.route_info.push(t)})),s.route_info.length<10)for(var t=s.routeinfo.length;t<10;t++)s.route_info.push({route:"",next:""})}else for(var o=0;o<10;o++)s.route_info.push({route:"",next:""});i.a.post("".concat(d.BASE_URL,"/setip"),s),setTimeout((function(){return e.$message.config({maxCount:1}),e.$message.destroy(),e.$message.success(e.$t("setupSuccessful")),localStorage.removeItem("admin.routes"),localStorage.removeItem("admin.permissions"),localStorage.removeItem("admin.roles"),Object(c.d)(),window.open(window.location.href.replace(a,e.ipList[0].ip),"_self")}),1e3)}}})},setTime:function(){var e=this,t={time:this.gatewayTime};Object(u.W)(t).then((function(t){1==t.data.data.result?e.$message.success(e.$t("setupSuccessful")):e.$message.error(e.$t("setupFailed"))})).catch((function(t){e.$message.error(e.$t("setupFailed"))}))},handleTimeChange:function(e,t){this.gatewayTime=t}},mounted:function(){this.getIpInfo()},watch:{lang:{handler:function(){this.enableList=[{label:this.$t("yes"),value:1},{label:this.$t("noUsedhcpServer"),value:0}],this.defaultList=[{label:this.$t("yes"),value:1},{label:this.$t("no"),value:0}],this.modeOneList=[{label:"DHCP",value:"dhcp"},{label:this.$t("staticIP"),value:"manual"}],this.modeTwoList=[{label:this.$t("staticIP"),value:"manual"}]},deep:!0,immediate:!0}}},p=(a("5d20"),a("0c7c")),h=Object(p.a)(m,(function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("a-card",[a("a-collapse",{model:{value:e.activeKey,callback:function(t){e.activeKey=t},expression:"activeKey"}},[a("a-collapse-panel",{key:"1",attrs:{header:e.$t("ipConfiguration"),disabled:""}},[a("a-form-model",{attrs:{"label-col":"US"==e.lang?e.labelColEn:e.labelCol,"wrapper-col":"US"==e.lang?e.wrapperColEn:e.wrapperCol,model:e.dataForm}},[a("a-row",[a("a-col",{attrs:{xs:24,sm:24,md:12,lg:12,xl:12,xxl:12}},[a("a-form-model-item",{attrs:{label:e.$t("networkCard")}},[a("a-select",{staticStyle:{width:"100%"},attrs:{placeholder:e.$t("pleaseChoose"),"show-search":"","option-filter-prop":"children","filter-option":e.filterOption,disabled:"visitor"==e.user},on:{change:e.selectEth},model:{value:e.dataForm.eth,callback:function(t){e.$set(e.dataForm,"eth",t)},expression:"dataForm.eth"}},e._l(e.networkList,(function(t){return a("a-select-option",{key:t.value,attrs:{label:t.label,value:t.value}},[e._v(" "+e._s(t.label)+" ")])})),1)],1)],1),a("a-col",{attrs:{xs:24,sm:24,md:12,lg:12,xl:12,xxl:12}},[a("a-form-model-item",{attrs:{label:e.$t("whetherToEnable")}},[a("a-select",{staticStyle:{width:"100%"},attrs:{placeholder:e.$t("pleaseChoose"),"show-search":"","option-filter-prop":"children","filter-option":e.filterOption,disabled:"visitor"==e.user||(-1!=String(e.dataForm.eth).indexOf("_")||!!String(e.dataForm.eth).includes("br"))},on:{change:e.handleEnable},model:{value:e.dataForm.enable,callback:function(t){e.$set(e.dataForm,"enable",t)},expression:"dataForm.enable"}},e._l(e.enableList,(function(t){return a("a-select-option",{key:t.value,attrs:{label:t.label,value:t.value}},[e._v(" "+e._s(t.label)+" ")])})),1)],1)],1),a("a-col",{attrs:{xs:24,sm:24,md:12,lg:12,xl:12,xxl:12}},[a("a-form-model-item",{attrs:{label:e.$t("ipAcquisitionMethod")}},[a("a-select",{staticStyle:{width:"100%"},attrs:{placeholder:e.$t("pleaseChoose"),"show-search":"","option-filter-prop":"children","filter-option":e.filterOption,disabled:"visitor"==e.user||(0==e.dataForm.enable||-1!=String(e.dataForm.eth).indexOf("_"))},on:{change:e.handleIPGet},model:{value:e.dataForm.mode,callback:function(t){e.$set(e.dataForm,"mode",t)},expression:"dataForm.mode"}},e._l(e.modeList,(function(t){return a("a-select-option",{key:t.value,attrs:{label:t.label,value:t.value}},[e._v(" "+e._s(t.label)+" ")])})),1)],1)],1),a("a-col",{attrs:{xs:24,sm:24,md:12,lg:12,xl:12,xxl:12}},[a("a-form-model-item",{attrs:{label:e.$t("defaultGateway")}},[a("a-input",{attrs:{allowClear:"",placeholder:e.$t("pleaseEnterDefaultGateway"),disabled:"visitor"==e.user||("dhcp"==e.dataForm.mode||0==e.dataForm.enable||-1!=String(e.dataForm.eth).indexOf("_")||!!String(e.dataForm.eth).includes("br"))},on:{change:e.handlegateway},model:{value:e.dataForm.gateway,callback:function(t){e.$set(e.dataForm,"gateway","string"==typeof t?t.trim():t)},expression:"dataForm.gateway"}})],1)],1),a("a-col",{attrs:{xs:24,sm:24,md:12,lg:12,xl:12,xxl:12}},[a("a-form-model-item",{attrs:{label:e.$t("whetherToSetAsDefaultRoute")}},[a("a-select",{staticStyle:{width:"100%"},attrs:{placeholder:e.$t("pleaseChoose"),"show-search":"","option-filter-prop":"children","filter-option":e.filterOption,disabled:"visitor"==e.user||("dhcp"==e.dataForm.mode||0==e.dataForm.enable||-1!=String(e.dataForm.eth).indexOf("_")||!!String(e.dataForm.eth).includes("br"))},on:{change:e.handledefault},model:{value:e.dataForm.default,callback:function(t){e.$set(e.dataForm,"default",t)},expression:"dataForm.default"}},e._l(e.defaultList,(function(t){return a("a-select-option",{key:t.value,attrs:{label:t.label,value:t.value}},[e._v(" "+e._s(t.label)+" ")])})),1)],1)],1),a("a-col",{attrs:{xs:24,sm:24,md:12,lg:12,xl:12,xxl:12}},[a("a-form-model-item",{attrs:{wrapperCol:{span:"US"==e.lang?21:22,offset:"US"==e.lang?3:2}}},[a("a-space",[a("a-button",{attrs:{icon:"reload"},on:{click:e.getIpInfo}},[e._v(e._s(e.$t("refresh")))]),"visitor"!=e.user?a("a-button",{attrs:{type:"primary",icon:"setting"},on:{click:e.setIpInfo}},[e._v(e._s(e.$t("setUp")))]):e._e()],1)],1)],1)],1),"visitor"!=e.user?a("a-row",[a("h3",[e._v(e._s(e.$t("setGatewayTime")))])]):e._e(),"visitor"!=e.user?a("a-row",[a("a-col",{attrs:{xs:24,sm:24,md:24,lg:24,xl:24,xxl:24}},[a("a-form-model-item",{attrs:{label:"",wrapperCol:{span:24,offset:"US"==e.lang?3:2}}},[a("a-date-picker",{attrs:{format:"YYYY-MM-DD HH:mm:ss","show-time":"","default-value":e.moment(e.gatewayTime,"YYYY-MM-DD HH:mm:ss")},on:{change:e.handleTimeChange}}),a("a-button",{staticStyle:{margin:"0 20px"},attrs:{type:"primary",icon:"setting"},on:{click:e.setTime}},[e._v(e._s(e.$t("setUp")))])],1)],1)],1):e._e(),"visitor"!=e.user?a("a-row",[a("h3",[e._v(e._s(e.$t("addGatewayIp")))])]):e._e(),"visitor"!=e.user?a("a-row",[a("a-col",{attrs:{xs:24,sm:24,md:11,lg:11,xl:11,xxl:11}},[a("a-form-model-item",{attrs:{label:e.$t("ipAddress")}},[a("a-input",{attrs:{allowClear:"",placeholder:e.$t("pleaseEnterIPAddress"),disabled:"dhcp"==e.dataForm.mode||-1!=String(e.dataForm.eth).indexOf("_")},nativeOn:{keyup:function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"enter",13,t.key,"Enter")?null:e.handleAddIpChange(t)}},model:{value:e.addIp,callback:function(t){e.addIp=t},expression:"addIp"}})],1)],1),a("a-col",{attrs:{xs:24,sm:24,md:11,lg:11,xl:11,xxl:11}},[a("a-form-model-item",{attrs:{label:e.$t("subnetMask")}},[a("a-input",{attrs:{allowClear:"",placeholder:e.$t("pleaseEnterSubnetMask"),disabled:"dhcp"==e.dataForm.mode||-1!=String(e.dataForm.eth).indexOf("_")},on:{focus:e.handleMask},nativeOn:{keyup:function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"enter",13,t.key,"Enter")?null:e.handleAddIpChange(t)}},model:{value:e.addMask,callback:function(t){e.addMask=t},expression:"addMask"}})],1)],1),a("a-col",{staticStyle:{"text-align":"right"},attrs:{xs:24,sm:24,md:2,lg:2,xl:2,xxl:2}},[a("a-form-model-item",["visitor"!=e.user?a("a-button",{attrs:{type:"primary",icon:"plus-circle",disabled:"dhcp"==e.dataForm.mode||-1!=String(e.dataForm.eth).indexOf("_")},on:{click:e.handleAddIpChange}},[e._v(e._s(e.$t("add")))]):e._e()],1)],1)],1):e._e(),a("a-row",[a("a-col",{attrs:{xs:24,sm:24,md:24,lg:24,xl:24,xxl:24}},[a("vxe-table",{ref:"recordIpTable",staticStyle:{"margin-bottom":"10px"},attrs:{border:"",resizable:"","auto-resize":"","sync-resize":"","show-overflow":"",size:"small","highlight-current-row":"","highlight-hover-row":"",data:e.ipList,"empty-text":e.$t("noData")}},[a("vxe-column",{key:"1",attrs:{field:"ip",title:e.$t("ipAddress"),align:"center","show-overflow":""},scopedSlots:e._u([{key:"default",fn:function(t){return[a("a-input",{attrs:{allowClear:"",placeholder:e.$t("pleaseEnterIPAddress"),disabled:"visitor"==e.user||("dhcp"==e.dataForm.mode||-1!=String(e.dataForm.eth).indexOf("_"))},model:{value:t.row.ip,callback:function(a){e.$set(t.row,"ip",a)},expression:"scope.row.ip"}})]}}])}),a("vxe-column",{key:"2",attrs:{field:"mask",title:e.$t("subnetMask"),align:"center","show-overflow":""},scopedSlots:e._u([{key:"default",fn:function(t){return[a("a-input",{attrs:{allowClear:"",placeholder:e.$t("pleaseEnterIPAddress"),disabled:"visitor"==e.user||("dhcp"==e.dataForm.mode||-1!=String(e.dataForm.eth).indexOf("_"))},model:{value:t.row.mask,callback:function(a){e.$set(t.row,"mask",a)},expression:"scope.row.mask"}})]}}])}),"visitor"!=e.user?a("vxe-table-column",{key:"3",attrs:{title:e.$t("option"),"header-align":"center",align:"center",width:"CN"==e.lang?200:300,fixed:"right"},scopedSlots:e._u([{key:"default",fn:function(t){var s=t.row,o=t.rowIndex;return[e.ipList.length>1?a("a",{attrs:{disabled:"dhcp"==e.dataForm.mode||-1!=String(e.dataForm.eth).indexOf("_")},on:{click:function(t){return e.handleIpDeleteChange(s,o)}}},[e._v(e._s(e.$t("delete")))]):e._e()]}}],null,!1,4186151773)}):e._e()],1)],1)],1),"visitor"!=e.user?a("a-row",[a("h3",[e._v(e._s(e.$t("addGatewayRoute")))])]):e._e(),"visitor"!=e.user?a("a-row",[a("a-col",{attrs:{xs:24,sm:24,md:11,lg:11,xl:11,xxl:11}},[a("a-form-model-item",{attrs:{label:e.$t("target")}},[a("a-input",{attrs:{allowClear:"",placeholder:e.$t("exampleTarget"),disabled:"visitor"==e.user||"dhcp"==e.dataForm.mode},nativeOn:{keyup:function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"enter",13,t.key,"Enter")?null:e.handleAddTargetNextStepChange(t)}},model:{value:e.addTarget,callback:function(t){e.addTarget=t},expression:"addTarget"}})],1)],1),a("a-col",{attrs:{xs:24,sm:24,md:11,lg:11,xl:11,xxl:11}},[a("a-form-model-item",{attrs:{label:e.$t("nextHop")}},[a("a-input",{attrs:{allowClear:"",placeholder:e.$t("pleaseEnterNextHop"),disabled:"visitor"==e.user||"dhcp"==e.dataForm.mode},nativeOn:{keyup:function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"enter",13,t.key,"Enter")?null:e.handleAddTargetNextStepChange(t)}},model:{value:e.addNextStep,callback:function(t){e.addNextStep=t},expression:"addNextStep"}})],1)],1),a("a-col",{staticStyle:{"text-align":"right"},attrs:{xs:24,sm:24,md:2,lg:2,xl:2,xxl:2}},[a("a-form-model-item",["visitor"!=e.user?a("a-button",{attrs:{type:"primary",icon:"plus-circle",disabled:"dhcp"==e.dataForm.mode},on:{click:e.handleAddTargetNextStepChange}},[e._v(e._s(e.$t("add")))]):e._e()],1)],1)],1):e._e(),a("a-row",[a("a-col",{attrs:{xs:24,sm:24,md:24,lg:24,xl:24,xxl:24}},[a("vxe-table",{ref:"recordRouteTable",staticStyle:{"margin-top":"10px"},attrs:{border:"",resizable:"","auto-resize":"","sync-resize":"","show-overflow":"",size:"small","highlight-current-row":"","highlight-hover-row":"",data:e.routeList,"empty-text":e.$t("noData")}},[a("vxe-column",{key:"1",attrs:{field:"route",title:e.$t("target"),align:"center","show-overflow":""},scopedSlots:e._u([{key:"default",fn:function(t){return[a("a-input",{attrs:{allowClear:"",placeholder:e.$t("exampleTarget"),disabled:"visitor"==e.user||"dhcp"==e.dataForm.mode},model:{value:t.row.route,callback:function(a){e.$set(t.row,"route",a)},expression:"scope.row.route"}})]}}])}),a("vxe-column",{key:"2",attrs:{field:"next",title:e.$t("nextHop"),align:"center","show-overflow":""},scopedSlots:e._u([{key:"default",fn:function(t){return[a("a-input",{attrs:{allowClear:"",placeholder:e.$t("pleaseEnterNextHop"),disabled:"visitor"==e.user||"dhcp"==e.dataForm.mode},model:{value:t.row.next,callback:function(a){e.$set(t.row,"next",a)},expression:"scope.row.next"}})]}}])}),"visitor"!=e.user?a("vxe-table-column",{key:"3",attrs:{title:e.$t("option"),"header-align":"center",align:"center",width:"CN"==e.lang?200:300,fixed:"right"},scopedSlots:e._u([{key:"default",fn:function(t){var s=t.row,o=t.rowIndex;return[a("a",{attrs:{disabled:"dhcp"==e.dataForm.mode},on:{click:function(t){return e.handleRouteNextDeleteChange(s,o)}}},[e._v(e._s(e.$t("delete")))])]}}],null,!1,1822838863)}):e._e()],1)],1)],1)],1)],1)],1)],1)}),[],!1,null,"0e283bb8",null).exports;t.default=h},bf1c:function(e,t){e.exports={messages:{CN:{ipConfiguration:"IP配置",networkCard:"网卡",pleaseChoose:"请选择",whetherToEnable:"是否启用",ipAcquisitionMethod:"IP获取方式",defaultGateway:"默认网关",pleaseEnterDefaultGateway:"请输入默认网关",whetherToSetAsDefaultRoute:"是否设为默认路由",refresh:"刷新",setUp:"设置",addGatewayIp:"添加网关IP",ipAddress:"IP地址",pleaseEnterIPAddress:"请输入IP地址",pleaseEnterTheCorrectIPAddress:"请输入正确的IP地址",subnetMask:"子网掩码",pleaseEnterSubnetMask:"请输入子网掩码",pleaseEnterTheCorrectSubnetMask:"请输入正确的子网掩码",existIpAndMask:"已存在该IP和网关,请勿重复添加",ipConfigMaxLimit:"IP配置最多只能配置十个,请先删除IP配置再进行添加",add:"添加",option:"操作",delete:"删除",deleteSuccess:"删除成功",addGatewayRoute:"添加网关路由",target:"目标",exampleTarget:"例:192.168.0.0/24",pleaseEnterTheDestinationRoute:"请输入目标路由",pleaseEnterTheCorrectDestinationRoute:"请输入正确的目标路由",nextHop:"下一跳",pleaseEnterNextHop:"请输入下一跳",pleaseenterTheCorrectNextHop:"请输入正确的下一跳",existTargetAndNexthop:"已存在该目标和下一跳,请勿重复添加",targetConfigMaxLimit:"路由配置最多只能配置十个,请先删除路由配置再进行添加",noData:"暂无数据",yes:"是",no:"否",noUsedhcpServer:"否(用作DHCP服务器)",staticIP:"静态IP",hint:"提示",actingDhcpCauseGatewayOffline:"用作DHCP服务器可能导致网关离线，是否继续？",confirm:"确认",cancel:"取消",pleaseEnterTheCorrectDefaultGatewayAddress:"请输入正确的默认网关地址",modifyingIPSettingsCauseNetworkDisconnected:"修改IP设置可能导致断网若干秒,是否继续?",defaultGatewayCannotBeEmpty:"默认网关不可为空",ipSubnetMaskCannotBeEmpty:"IP和子网掩码不能为空,请至少设置一个",setupSuccessful:"设置成功",setupFailed:"设置失败",jumpNewIpAddress:"设置完成后，会跳转到新的ip地址去访问。",webAccessedFailed:"删除后当前的web无法访问，请确认是否删除？",setGatewayTime:"设置网关时间"},US:{ipConfiguration:"IP configuration",networkCard:"Network card",pleaseChoose:"Please choose",whetherToEnable:"Whether to enable",ipAcquisitionMethod:"IP acquisition method",whetherToSetAsDefaultRoute:"Whether to set as default route",refresh:"Refresh",setUp:"Set up",addGatewayIp:"Add gateway IP",ipAddress:"IP address",pleaseEnterIPAddress:"Please Enter IP Address",pleaseEnterTheCorrectIPAddress:"Please enter the correct IP address",subnetMask:"Subnet mask",pleaseEnterSubnetMask:"Please Enter Subnet Mask",defaultGateway:"Default Gateway",pleaseEnterDefaultGateway:"Please Enter Default Gateway",pleaseEnterTheCorrectSubnetMask:"Please enter the correct subnet mask",existIpAndMask:"The IP and gateway already exist, please do not add them again.",ipConfigMaxLimit:"Only ten IP configurations can be configured at most. Please delete the IP configuration first and then add it.",add:"Add",option:"Option",delete:"Delete",deleteSuccess:"Delete successful",addGatewayRoute:"Add gateway route",target:"Target",exampleTarget:"Example:192.168.0.0/24",pleaseEnterTheDestinationRoute:"Please enter the destination route",pleaseEnterTheCorrectDestinationRoute:"Please enter the correct destination route",nextHop:"Next hop",pleaseEnterNextHop:"Please enter next hop",pleaseenterTheCorrectNextHop:"Please enter the correct next hop",existTargetAndNexthop:"The target and next hop already exist, please do not add them again.",targetConfigMaxLimit:"Only ten routing configurations can be configured at most. Please delete the routing configuration first and then add it.",noData:"No data",yes:"Yes",no:"No",noUsedhcpServer:"No (use as DHCP server)",staticIP:"Static IP",hint:"Hint",actingDhcpCauseGatewayOffline:"Acting as a DHCP server may cause the gateway to go offline. Do you want to continue?",confirm:"Confirm",cancel:"Cancel",pleaseEnterTheCorrectDefaultGatewayAddress:"Please enter the correct default gateway address",modifyingIPSettingsCauseNetworkDisconnected:"Modifying IP settings may cause the network to be disconnected for a few seconds. Do you want to continue?",defaultGatewayCannotBeEmpty:"Default gateway cannot be empty",ipSubnetMaskCannotBeEmpty:"IP and subnet mask cannot be empty, please set at least one",setupSuccessful:"Setup successful",setupFailed:"Setup failed",jumpNewIpAddress:"After the setting is completed, it will jump to the new IP address for access.",webAccessedFailed:"The current web cannot be accessed after deletion. Please confirm whether to delete it?",setGatewayTime:"Set gateway time"}}}}}]);