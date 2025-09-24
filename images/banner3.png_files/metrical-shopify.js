function setupMetricalAC(_MetricalShopify) {

    var _metrical_shopify_tools_money_format = "${{amount}}";
    var _metrical_shopify_tools_formatMoney = function(cents, format) {
        if (typeof cents == 'string') { cents = cents.replace('.', ''); }
        var value = '';
        var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
        var formatString = (format || _metrical_shopify_tools_money_format);

        function defaultOption(opt, def) {
            return (typeof opt == 'undefined' ? def : opt);
        }

        function formatWithDelimiters(number, precision, thousands, decimal) {
            precision = defaultOption(precision, 2);
            thousands = defaultOption(thousands, ',');
            decimal = defaultOption(decimal, '.');

            if (isNaN(number) || number == null) { return 0; }

            number = (number / 100.0).toFixed(precision);

            var parts = number.split('.'),
                dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
                cents = parts[1] ? (decimal + parts[1]) : '';

            return dollars + cents;
        }

        switch (formatString.match(placeholderRegex)[1]) {
            case 'amount':
                value = formatWithDelimiters(cents, 2);
                break;
            case 'amount_no_decimals':
                value = formatWithDelimiters(cents, 0);
                break;
            case 'amount_with_comma_separator':
                value = formatWithDelimiters(cents, 2, '.', ',');
                break;
            case 'amount_no_decimals_with_comma_separator':
                value = formatWithDelimiters(cents, 0, '.', ',');
                break;
        }

        return formatString.replace(placeholderRegex, value);
    };



    if (typeof jQuery == 'undefined') {
        // Load jQuery
        var jsJquery = document.createElement('script');
        jsJquery.src = "//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js";
        document.body.appendChild(jsJquery);
        jsJquery.onload = function() {
            setupMetrical();
        };
    } else {
        setupMetrical();
    }

    function setupMetrical() {


        //Load metrical scripts and initialize AC
        if (typeof _Metrical == 'undefined') {
            var metricalJs = document.createElement('script');
            metricalJs.src = _MetricalShopify.endpoint + "/js/metrical.js";
            document.body.appendChild(metricalJs);
            metricalJs.onload = function() {
                if (typeof _MetricalAbandonCart == 'undefined') {
                    var abandonCartJs = document.createElement('script');
                    abandonCartJs.src = _MetricalShopify.endpoint + "/js/metrical.abandon.cart.js";
                    document.body.appendChild(abandonCartJs);

                    abandonCartJs.onload = function() {
                        initMetricalAC();
                    };
                } else {
                    initMetricalAC();
                }
            };
        } else {
            if (typeof _MetricalAbandonCart == 'undefined') {
                var abandonCartJs = document.createElement('script');
                abandonCartJs.src = metricalEndpoint + "/js/metrical.abandon.cart.js";
                document.body.appendChild(abandonCartJs);

                abandonCartJs.onload = function() {
                    initMetricalAC();
                };
            } else {
                initMetricalAC();
            }
        }
    }

    function initMetricalAC() {

        var interactionModification = null;

        if (_MetricalShopify.inCheckout == false) {
            interactionModification = function(metJQuery, interaction, processInteraction, isAsync) {
                try {

                    var timeoutValue = ('action' in interaction && (interaction['action'] == "Cart Visible" || interaction['action'] == "Qty Increase" || interaction['action'] == "Qty Decrease" || interaction['action'] == "Remove Cart Item")) ? 400 : 0;


                    setTimeout(function() {


                        fetch('/cart.js')
                            .then(function(response) {
                                return response.json();
                            })
                            .then(function(cartData) {

                                //console.log(cartData);

                                // total items in cart
                                interaction['usermeta']['totalnumitemsincart'] = cartData.item_count;

                                // cartidlist,cartskulist,cartqtylist,cartpricelist,cartitemslist
                                var idList = [];
                                var qtyList = [];
                                var priceList = [];
                                var itemsList = [];
                                var skuList = [];

                                for (var i = 0; i < cartData.items.length; i++) {
                                    var item = cartData.items[i];

                                    idList.push(item.product_id);
                                    qtyList.push(item.quantity);
                                    priceList.push(_metrical_shopify_tools_formatMoney(item.price));
                                    skuList.push(item.sku);
                                    var temp = item.product_id + "-" + item.sku + "(" + item.quantity + "/" + _metrical_shopify_tools_formatMoney(item.price) + ")";
                                    itemsList.push(temp);
                                }

                                if (idList.length > 0) {
                                    interaction['usermeta']['cartidlist'] = "[" + idList.join("+") + "]";
                                } else {
                                    interaction['usermeta']['cartidlist'] = null;
                                }

                                if (skuList.length > 0) {
                                    interaction['usermeta']['cartskulist'] = "[" + skuList.join("+") + "]";
                                } else {
                                    interaction['usermeta']['cartskulist'] = null;
                                }

                                if (qtyList.length > 0) {
                                    interaction['usermeta']['cartqtylist'] = "[" + qtyList.join("+") + "]";
                                } else {
                                    interaction['usermeta']['cartqtylist'] = null;
                                }

                                if (priceList.length > 0) {
                                    interaction['usermeta']['cartpricelist'] = "[" + priceList.join("+") + "]";
                                } else {
                                    interaction['usermeta']['cartpricelist'] = null;
                                }


                                // unique items in cart
                                interaction['usermeta']['numuniqueitemsincart'] = cartData.items.length;

                                // subtotalcartvalue
                                interaction['usermeta']['subtotalcartvalue'] = _metrical_shopify_tools_formatMoney(cartData.total_price);

                                // get the cart token
                                interaction['usermeta']['carttoken'] = cartData.token;
                                interaction['usermeta']['cartid'] = cartData.token;
                                interaction['usermeta']['currency'] = cartData.currency;

                                if (!!_MetricalAbandonCart.Config['insert_cart_attributes'] == true) {
                                    fetch('/cart/update.js', {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json"
                                            },
                                            body: JSON.stringify({ attributes: { __metrical_uuid: _MetricalIdentity.getDeviceId(), __metrical_sessionid: _MetricalIdentity.getSessionId(), __metrical_api: 1 } })
                                        })
                                        .then(function(response) {
                                            return response.json();
                                        })
                                        .then(function(cartData) {
                                            console.log(cartData);
                                        });
                                }

                                processInteraction(interaction);
                            })
                            .catch(function(error) {
                                console.error(error);
                            });


                    }, timeoutValue);

                } catch (error) {
                    console.error(error);
                }
            };
        }

        var abandonCartProperties = { abandoncartid: _MetricalShopify.acConfigID, usermeta: _MetricalShopify.usermeta, interactionModificationCallback: interactionModification };

        _MetricalAbandonCart.observe("postInit", function() {

            if (!!_MetricalAbandonCart.Config['insert_cart_attributes'] == true) {
                var form = document.querySelector("form[action='/cart']")
                if (form) {

                    var el = document.querySelector("input[name='attributes[__metrical_uuid]']");
                    if (el === null) {
                        console.log("adding uuid");
                        var uuidEl = document.createElement("input");
                        uuidEl.type = "hidden";
                        uuidEl.name = "attributes[__metrical_uuid]";
                        uuidEl.value = _MetricalIdentity.getDeviceId();
                        form.appendChild(uuidEl);
                    }
        
                    var el = document.querySelector("input[name='attributes[__metrical_sessionid]']");
                    if (el === null) {
                        console.log("adding sessionid");
                        var sessionEl = document.createElement("input");
                        sessionEl.type = "hidden";
                        sessionEl.name = "attributes[__metrical_sessionid]";
                        sessionEl.value = _MetricalIdentity.getSessionId();
                        form.appendChild(sessionEl);
                    }
        
                    var el = document.querySelector("input[name='attributes[__metrical_input]']");
                    if (el === null) {
                        console.log("adding input");
                        var inputEl = document.createElement("input");
                        inputEl.type = "hidden";
                        inputEl.name = "attributes[__metrical_input]";
                        inputEl.value = 1;
                        form.appendChild(inputEl);
                    }

                }

                (function(selector,callback) {
                    try {
                        var debounce = function(func, wait, immediate) {
                            var timeout;
                            return function() {
                                var context = this, args = arguments;
                                var later = function() {
                                    timeout = null;
                                    if (!immediate) func.apply(context, args);
                                };
                                var callNow = immediate && !timeout;
                                clearTimeout(timeout);
                                timeout = setTimeout(later, wait);
                                if (callNow) func.apply(context, args);
                            };
                        };
                
                
                
                        var targetNode = document.getElementsByTagName("body");
                        var config = { attributes: false, childList: true, subtree: true };
                
                        var selectorCheckFunction = debounce(function() {
                            _MetricalAbandonCart.logger.debug("selector check function");
                
                            var el = document.querySelector(selector);
                            if (el !== null) {
                                _MetricalAbandonCart.logger.debug("el has a value");
                                _MetricalAbandonCart.logger.debug(typeof callback);
                                callback(el);
                            }
                        },250);
                
                        var observerCallback = function(mutationsList, observer) {
                            _MetricalAbandonCart.logger.debug(mutationsList.length);
                            for (const mutation of mutationsList) {
                                if (mutation.type === "childList") {
                                    //_MetricalAbandonCart.logger.debug(mutation);
                                    //var form = document.querySelector("form[action='/cart']")
                                    //_MetricalAbandonCart.logger.debug(form);
                                    _MetricalAbandonCart.logger.debug("calling debounce method");
                                    //debounce(selectorCheckFunction,250);
                                    selectorCheckFunction();
                                }
                            }
                        };
                
                
                        const observer = new MutationObserver(observerCallback);
                        observer.observe(targetNode[0], config);
                    } catch (error) {
                        console.error(error);
                    }
                
                })("form[action='/cart']",function(form) {
                    try {
                        _MetricalAbandonCart.logger.debug("callback run");
                
                        if (form) {
                
                            var el = document.querySelector("input[name='attributes[__metrical_uuid]']");
                            if (el === null) {
                                _MetricalAbandonCart.logger.debug("adding uuid");
                                var uuidEl = document.createElement("input");
                                uuidEl.type = "hidden";
                                uuidEl.name = "attributes[__metrical_uuid]";
                                uuidEl.value = _MetricalIdentity.getDeviceId();
                                form.appendChild(uuidEl);
                            }
                
                            var el = document.querySelector("input[name='attributes[__metrical_sessionid]']");
                            if (el === null) {
                                _MetricalAbandonCart.logger.debug("adding sessionid");
                                var sessionEl = document.createElement("input");
                                sessionEl.type = "hidden";
                                sessionEl.name = "attributes[__metrical_sessionid]";
                                sessionEl.value = _MetricalIdentity.getSessionId();
                                form.appendChild(sessionEl);
                            }
                
                            var el = document.querySelector("input[name='attributes[__metrical_input]']");
                            if (el === null) {
                                _MetricalAbandonCart.logger.debug("adding input");
                                var inputEl = document.createElement("input");
                                inputEl.type = "hidden";
                                inputEl.name = "attributes[__metrical_input]";
                                inputEl.value = 1;
                                form.appendChild(inputEl);
                            }
                        }
                    } catch (error) {
                        console.error(error);
                    }
                });




            }

        });
        _MetricalAbandonCart.init(jQuery, abandonCartProperties);


    }

}


try {

    if (typeof _MetricalShopify !== "undefined") {
        setupMetricalAC(_MetricalShopify);
    } else {
        setTimeout(function() {
            if (typeof _MetricalShopify !== "undefined") {
                setupMetricalAC(_MetricalShopify);
            }
        }, 1000);
    }

} catch (error) {
    console.error(error);
}