(function() {
  // BEGIN CART WATCHER CLASS LOGIC
  class CartWatcher {
    init() {
      this.emitCartChanges().then(() => {
        this.observeCartChanges();
      });
    }

    async fetchCart() {
      const response = await fetch('/cart.js');
      return response.json();
    }

    storeCart(cart) {
      localStorage.setItem('__cart__', JSON.stringify(cart));
    }

   storedCart() {
      return JSON.parse(localStorage.getItem('__cart__')) || { items: [] };
    }

   findCartChanges(oldCart, newCart) {
      const onlyInLeft = (l, r) => l.filter(li => !r.some(ri => li.key == ri.key));
      let result = {
        added: onlyInLeft(newCart.items, oldCart.items),
        removed: onlyInLeft(oldCart.items, newCart.items),
      };

      oldCart.items.forEach(oi => {
        const ni = newCart.items.find(i => i.key == oi.key && i.quantity != oi.quantity);
        if (!ni) return;
        let quantity = ni.quantity - oi.quantity;
        let item = { ...ni };
        item.quantity = Math.abs(quantity);
        quantity > 0
          ? result.added.push(item)
          : result.removed.push(item)
      });

      return result;
    }

    async emitCartChanges() {
      const newCart = await this.fetchCart();
      const oldCart = this.storedCart();
      const changes = this.findCartChanges(oldCart, newCart);

      const event = new CustomEvent("__cart_changed__", { detail: changes });
      window.dispatchEvent(event);

      this.storeCart(newCart);
    }

   observeCartChanges() {
      const cartObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const isValidRequestType = ['xmlhttprequest', 'fetch'].includes(entry.initiatorType);
          const isCartChangeRequest = /\/cart\//.test(entry.name);
          if (isValidRequestType && isCartChangeRequest) {
            this.emitCartChanges();
          }
        });
      });
      cartObserver.observe({ entryTypes: ["resource"] });
    }
  }
  // END CART WATCHER CLASS LOGIC


  var isDevEnvLoaded = document.getElementsByTagName('html')[0].innerHTML.indexOf('localhost:4055') > 0
  if(window.location.href.indexOf('debugReplayJS') > 0 && !isDevEnvLoaded){
    var devScript = document.createElement('script');
    devScript.setAttribute('src','http://localhost:4055/replay.js');
    document.head.appendChild(devScript);
    throw('loading dev script')
  }


  const myCartWatcher = new CartWatcher;
  myCartWatcher.init();
  if(isDevEnvLoaded){
    window.addEventListener("__cart_changed__", e => console.log("cart changed", e.detail));  
  }

  
  var cookieEnabled=(navigator.cookieEnabled)? true : false

  if (typeof navigator.cookieEnabled=='undefined' && !cookieEnabled){
    document.cookie='testcookie'
    cookieEnabled=(document.cookie.indexOf('testcookie')!=-1)? true : false
  }

  if (!cookieEnabled) {
   console.info('Cookies not enabled, exiting better replay') ; return
  }

  function isShopifyAdmin(){
    if(document.getElementById('admin-bar-iframe') != null) return true;
    // inside the theme editor
    if(Shopify && Shopify.designMode) return true;

    return false
  }

  function getUrlVars(url) {
    var vars = {};
    var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
  }

  var __replayScript = document.querySelector('script[src*="/replay.js"]');
  var __replayApiKey = getUrlVars(__replayScript.src)['replayApiKey']
  var __replaySettings = {
    proof_ignore_admin_visits: getUrlVars(__replayScript.src)['proof_ignore_admin_visits'],
    proof_has_custom_js: getUrlVars(__replayScript.src)['proof_has_custom_js'],
  }

  if(!__replayApiKey || __replayApiKey == ''){ console.info('replay API Key is Blank') ; return }

  if(__replaySettings.proof_ignore_admin_visits == 'true' && isShopifyAdmin()){ console.info('replay Ignoring Admin Session') ; return }

  (function(w,d,n,u,o,t,m){w['SrecObject']=o;w[o]=w[o]||function(){
  (w[o].q=w[o].q||[]).push(arguments)},w[o].l=1*new Date();t=d.createElement(n),
  m=d.getElementsByTagName(n)[0];t.async=1;t.src=u;m.parentNode.insertBefore(t,m)
  })(window,document,'script','https://replayapp.io/collect/initialize.js','replay');
  replay('init', __replayApiKey);
  
  if(__brGetCookie('br-uid')){
    replay('uid', __brGetCookie('br-uid'));
  } else {
    var uid = 'uid-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
    __brSetCookie('br-uid', uid)
    replay('uid', uid);
  }


  // NOTE: the **Order Thank You page** is COMPLETELY DIFFERENT than the 
  // **Order Status page**. The Order Status page for example, has
  // window.Shopify.Checkout rather than window.Shopify.checkout
  // that we use below to determine whether we're on a thank you page.
  // When debugging, keep this in mind.......
  function isOnRecentThankYouPage() {
    /* COPIED FROM CART SYNC JS */
    /* it starts as /checkouts/.../thank_you when the order is placed */
    /* any subsequent calls will auto redirect to /orders/ */

    /* IF WE ARE ON ORDER STATUS PAGE, IGNORE */
    var orders_check = window.location.href.indexOf('/orders/') > 0
    if(orders_check) return false;

    /* This rarely but sometimes happens */
    /* nks.com/en-ph/account/login?checkout_url=/checkouts/cn/Z2NwLWFzaWEtc291dGhlYX */
    var account_check = window.location.href.indexOf('/account/') > 0
    if(account_check) return false;

    /* IF WE ARE ON THANK YOU PAGE CONTINUE */
    var checkouts_check = window.location.href.indexOf('/checkouts/') > 0
    var thank_you_check = window.location.href.indexOf('/thank_you') > 0
    if(!checkouts_check && !thank_you_check) return false;

    return true
  }

  if(isOnRecentThankYouPage()){
    replay('tag', 'order placed');

    /* IT IS IMPOSSIBLE TO GET THE ORDER ID FROM THE THANK YOU PAGE */
    /* We are going to go with a webhook based solution instead */
    // var orderId = getOrderId();
    // if(orderId) replay('tag', 'id:' + String(orderId));
    fetch(`https://api.better-replay.com/micro/api/sites/thank-you-page?unique_id=${Shopify.shop}&url=${encodeURIComponent(window.location.href)}&rid=${__brGetCookie('br-uid')}`)
      .catch(error => {
        console.error('Fetch Error:', error);
      });
  }

  function __brIsCookieSet(cname) {
    var decodedCookie = decodeURIComponent(document.cookie);
    return (decodedCookie.indexOf(cname) >= 0)
  }

  function __brGetCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  function __brSetCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

  function __brPushTag(tag) {
    if(__brIsCookieSet('__brTagsSet')) {
      __brSetCookie('__brTagsSet', __brGetCookie('__brTagsSet') + ', ' + tag)
    } else {
      __brSetCookie('__brTagsSet', tag)
    }
    replay('tag', tag)
  }

  window.addEventListener("__cart_changed__", (e) => {
    if(e.detail.added.length > 0){
      __brPushTag('add to cart')  
    }
  });


  if(__replaySettings.proof_has_custom_js == 'true'){
    let scriptPath = `https://cdn.api.better-replay.com/custom-js.js?unique_id=${Shopify.shop}`
    document.head.appendChild(Object.assign(document.createElement('script'), { type: 'text/javascript', src: scriptPath }));
  }


  /* send unique sessions to server */
  /*
  var unique_session_cookie = __brGetCookie('replay_unique_visitor');
  if (unique_session_cookie != 'set') {
    __brSetCookie('replay_unique_visitor', 'set', (1/24 / 2)) // new session every 30 min
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.better-replay.com/static/site_session", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        apiKey: __replayApiKey
    }));
  }
  */
})();
