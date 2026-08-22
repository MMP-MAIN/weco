(function(){
  var ga=document.createElement('script');
  ga.async=true;
  ga.src='https://www.googletagmanager.com/gtag/js?id=G-45Q0B2B2XR';
  document.head.appendChild(ga);
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){dataLayer.push(arguments)};
  gtag('js',new Date());
  gtag('config','G-45Q0B2B2XR');

  if(!window.fbq){
    var n=window.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!window._fbq)window._fbq=n;
    n.push=n;n.loaded=true;n.version='2.0';n.queue=[];
    var px=document.createElement('script');px.async=true;px.src='https://connect.facebook.net/en_US/fbevents.js';
    var first=document.getElementsByTagName('script')[0];first.parentNode.insertBefore(px,first);
    fbq('init','1330320655850964');fbq('track','PageView');fbq('track','ViewContent');
  }

  document.addEventListener('click',function(event){
    var link=event.target.closest('a');
    if(!link)return;
    var href=link.getAttribute('href')||'';
    if(href.indexOf('#contact')>-1){
      if(window.gtag)gtag('event','generate_lead',{content_type:'insight',link_url:href});
      if(window.fbq)fbq('track','Contact');
    }else if(link.closest('.insight-card')){
      if(window.gtag)gtag('event','select_content',{content_type:'insight',item_id:href});
    }
  });
})();
