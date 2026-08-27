(function(){
  var ga=document.createElement('script');
  ga.async=true;
  ga.src='https://www.googletagmanager.com/gtag/js?id=G-45Q0B2B2XR';
  document.head.appendChild(ga);
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){dataLayer.push(arguments)};
  gtag('js',new Date());
  gtag('set','linker',{domains:['wecocompany.com']});
  gtag('config','G-45Q0B2B2XR');

  function attribution(){
    var q=new URLSearchParams(location.search);
    var incoming={traffic_source:q.get('utm_source'),traffic_medium:q.get('utm_medium'),campaign_name:q.get('utm_campaign'),campaign_content:q.get('utm_content'),campaign_term:q.get('utm_term')};
    try{
      var stored=JSON.parse(sessionStorage.getItem('weco_attribution')||'{}');
      var merged={};
      Object.keys(incoming).forEach(function(key){merged[key]=incoming[key]||stored[key]||'unknown'});
      if(Object.keys(incoming).some(function(key){return !!incoming[key]}))sessionStorage.setItem('weco_attribution',JSON.stringify(merged));
      return merged;
    }catch(e){
      Object.keys(incoming).forEach(function(key){incoming[key]=incoming[key]||'unknown'});
      return incoming;
    }
  }

  function eventParams(extra){return Object.assign({landing_path:location.pathname},attribution(),extra||{})}

  if(!window.fbq){
    var n=window.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!window._fbq)window._fbq=n;
    n.push=n;n.loaded=true;n.version='2.0';n.queue=[];
    var px=document.createElement('script');px.async=true;px.src='https://connect.facebook.net/en_US/fbevents.js';
    var first=document.getElementsByTagName('script')[0];first.parentNode.insertBefore(px,first);
    fbq('init','1099004869049392');fbq('track','PageView');fbq('track','ViewContent');
  }

  document.addEventListener('click',function(event){
    var link=event.target.closest('a');
    if(!link)return;
    var href=link.getAttribute('href')||'';
    if(href.indexOf('#contact')>-1){
      if(window.gtag)gtag('event','contact_cta_click',eventParams({content_type:'insight',link_url:href}));
      if(window.fbq)fbq('trackCustom','ContactCTAClick',{content_type:'insight',link_url:href});
    }else if(href.indexOf('/brand-discovery')>-1||href.indexOf('brand-discovery.html')>-1){
      if(window.gtag)gtag('event','brand_discovery_click',eventParams({content_type:'insight',link_url:href}));
      if(window.fbq)fbq('trackCustom','BrandDiscoveryClick',{content_type:'insight',link_url:href});
    }else if(link.closest('.insight-card')){
      if(window.gtag)gtag('event','select_content',eventParams({content_type:'insight',item_id:href}));
    }else if(/^project-[a-z0-9-]+\.html(?:$|[?#])/i.test(href)){
      if(window.gtag)gtag('event','project_detail_click',eventParams({content_type:'project_case',item_id:href}));
    }
  });
})();
