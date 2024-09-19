/* eslint-disable */
const propStorage = {};

let siteConsent = null;

WcpConsent &&
  WcpConsent.init("en-US", "cookie-banner", (err, _siteConsent) => {
    if (err != undefined) {
      console.log("Error initializing WcpConsent: " + err);
    } else {
      siteConsent = _siteConsent; //siteConsent is used to get the current consent
    }
  });

// prettier-ignore
!function(s,e,u){var c,n,o,r,l,t,i,a,p,d,g=s.location,f="script",m="undefined",y="crossOrigin",h="POST",v="onedsSDK",b=u.name||"oneDSWeb",w=0,S=0,C=((u.name||s[v])&&(s[v]=b),s[b]||(c=u.cfg,v=u.ext||[],o=n=!1,r={"queue":[],"sv":"4","config":c,"extensions":v},c.webAnalyticsConfiguration||(c.webAnalyticsConfiguration={}),l="1DS-Web-Snippet-"+r.sv,(a=c.url||u.src)&&((i=e.createElement(f)).src=a,!(v=u[y])&&""!==v||i[y]==m||(i[y]=v),i.onload=D,i.onerror=U,i.onreadystatechange=function(e,t){"loaded"!==i.readyState&&"complete"!==i.readyState||D(0,t)},t=i,u.ld<0?e.getElementsByTagName("head")[0].appendChild(t):setTimeout(function(){e.getElementsByTagName(f)[0].parentNode.appendChild(t)},u.ld||0)),x([v="track",(y="trackPage")+"View",v+"Exception",v+"Event",y+"Action",v+"ContentUpdate",y+"Unload",y+"ViewPerformance","addTelemetryInitializer",(y="capturePage")+"View",y+"ViewPerformance",y+"Action",y+"Unload","captureContentUpdate"]),(v=c.webAnalyticsConfiguration.autoCapture)&&!v.jsError||(x(["_"+(p="onerror")]),d=s[p],s[p]=function(e,t,n,o,i){var a=d&&d(e,t,n,o,i);return!0!==a&&r["_"+p]({"message":e,"url":t,"lineNumber":n,"columnNumber":o,"error":i,"evt":s.event}),a},c.autoExceptionInstrumented=!0),r));function T(e){var t,n,o,i,a,r;u.disableReport||(i=c.endpointUrl||"https://browser.events.data.microsoft.com/OneCollector/1.0/",a=c.instrumentationKey||"",(r=c.channelConfiguration)&&(i=r.overrideEndpointUrl||i,a=r.overrideInstrumentationKey||a),r=(r=Date).now?r.now():(new r).getTime(),i={"url":i+"?cors=true&content-type=application/x-json-stream&client-id=NO_AUTH&client-version="+l+"&apikey="+a+"&w=0&upload-time="+r.toString(),"iKey":a},(r=[]).push((a="SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details)",e=e,n=t=i.url,i=function(e,t){0===S&&(S=Math.floor(4294967296*Math.random()|0)>>>0);e={"data":{"baseData":{"ver":2}},"ext":{"app":{"sesId":"0000"},"intweb":{},"sdk":{"ver":"javascript:"+l,"epoch":""+S,"seq":w++},"utc":{"popSample":100},"web":{"userConsent":!1}},"time":function(){var e=new Date;function t(e){e=""+e;return e=1===e.length?"0"+e:e}return e.getUTCFullYear()+"-"+t(e.getUTCMonth()+1)+"-"+t(e.getUTCDate())+"T"+t(e.getUTCHours())+":"+t(e.getUTCMinutes())+":"+t(e.getUTCSeconds())+"."+String((e.getUTCMilliseconds()/1e3).toFixed(3)).slice(2,5)+"Z"}(),"iKey":"o:"+function(e){var t="";{var n;!e||-1<(n=e.indexOf("-"))&&(t=e.substring(0,n))}return t}(e),"name":t,"ver":"4.0"};return function(e){var t=(new Date).getTimezoneOffset(),n=t%60,t=(t-n)/60,o="+";0<t&&(o="-");t=Math.abs(t),n=Math.abs(n),e.ext.loc={"tz":o+(t<10?"0"+t:t.toString())+":"+(n<10?"0"+n:n.toString())}}(e),function(e){{var t;typeof navigator!=m&&(t=navigator,e.ext.user={"locale":t.userLanguage||t.language})}}(e),e}(i=i.iKey||"","Ms.Web.ClientError"),(o=i.data).baseType="ExceptionData",o.baseData.exceptions=[{"typeName":"SDKLoadFailed","message":a.replace(/\./g,"-"),"hasFullStack":!1,"stack":a+"\nSnippet failed to load ["+e+"] -- Telemetry is disabled\nHelp Link: https://go.microsoft.com/fwlink/?linkid=2128109\nHost: "+(g&&g.pathname||"_unknown_")+"\nEndpoint: "+n,"parsedStack":[]}],i)),o=r,a=t,JSON&&((e=s.fetch)&&!u.useXhr?e(a,{"method":h,"body":JSON.stringify(o),"mode":"cors"}):XMLHttpRequest&&((e=new XMLHttpRequest).open(h,a),e.setRequestHeader("Content-type","application/json"),e.send(JSON.stringify(o)))))}function U(e){n=!0,r.queue=[],o||(o=!0,T(a))}function D(e,t){o||setTimeout(function(){!t&&"function"==typeof r.isInitialized&&r.isInitialized()||U()},500)}function x(e){for(;e.length;)!function(t){r[t]=function(){var e=arguments;n||r.queue.push(function(){r[t].apply(r,e)})}}(e.pop())}function E(){u.onInit&&u.onInit(C)}(s[b]=C).queue&&0===C.queue.length?C.queue.push(E):E()}(window,document,{
    src:"https://js.monitor.azure.com/scripts/c/ms.analytics-web-4.gbl.min.js", // Version 4 is bugged and doesn't respect the `cookieCfg.enabled: false` option. If upgrade double check no cookies are saved on typespec.io.
    // name: "oneDSWeb", // Global SDK Instance name defaults to "oneDSWeb" when not supplied
    // ld: 0, // Defines the load delay (in ms) before attempting to load the sdk. -1 = block page load and add to head. (default) = 0ms load after timeout,
    // useXhr: 1, // Use XHR instead of fetch to report failures (if available),
    crossOrigin: "anonymous", // When supplied this will add the provided value as the cross origin attribute on the script tag
    // disableReport: true, // Disable reporting when the SDK cannot be downloaded
    // onInit: null, // Once the application insights instance has loaded and initialized this callback function will be called with 1 argument -- the sdk instance (DO NOT ADD anything to the sdk.queue -- As they won't get called)
    cfg:{
        instrumentationKey:"375afc556dda47148f4d721f0543233d-05299b34-7e02-4ef9-9502-4a6ef9fadbfd-7103",
        propertyConfiguration: { // Properties Plugin configuration
          callback: {
              userConsentDetails: siteConsent ? siteConsent.getConsent : null
          },
        },
        channelConfiguration: {
          // Adobe analytics will only work if we have MC1 and MS0 cookies
          // ignoreMc1Ms0CookieProcessing: true,
        },
        cookieCfg: {
          enabled: false,
        },
        // We disable cookies and provide a in memory storage for the necessary keys
        disableCookiesUsage: true,
        propertyStorageOverride: {
          setProperty: (key, value) => {
            propStorage[key] = value;
          },
          getProperty: (key) => {
            return propStorage[key];
          }
        },
    },
    ext:[]
});
