/*__GLOBAL VARIABLES__*/
var eoShAppGlobals = function(){
  EO_SH_APP_BASE_URL = 'https://sf-registrationfields.extendons.com';
  this.EO_SH_APP_STATUS = true;
  EO_SH_PAGE_LOCATION = window.location.pathname;
  EO_SH_APP_HAS_RULES = false;
};
var eoShShopGlobals = function(){
  EO_SH_SHOP_DOMAIN = Shopify.shop;
  EO_SH_THEME_ID = Shopify.theme.theme_store_id;
  EO_SH_MONEY_FORMAT = '';
};

var formData;
var FIELDS_VALIDATION;
var formRedirect='';
var fileErrorMessage = '';
/*_______MAIN DRIVER FUNCTION_______*/
(function(){
  var loadScript = function(url, callback){
    var script = document.createElement("script");
    script.type = "text/javascript";
    if (script.readyState){ 
      script.onreadystatechange = function(){
        if (script.readyState == "loaded" || script.readyState == "complete"){
          script.onreadystatechange = null;
          callback();
        }
      };
    } else {
      script.onload = function(){
        callback();
      };
    }
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script); 
  };
  var loadAppCss = function(path){
    /*loader*/
    var head = document.getElementsByTagName('HEAD')[0];  
    var link = document.createElement('link');  
    link.rel = 'stylesheet';  
    link.type = 'text/css'; 
    link.href = path;
    head.appendChild(link);
  };

  // _________ MAIN EXECUTION OF APP JAVASCRIPT __________
  var myAppJavaScript = function($){

    new eoShAppGlobals();
    new eoShShopGlobals();

    loadAppCss(EO_SH_APP_BASE_URL + '/css/eostorefront.css');
    $('.lds-ring').remove();
    var loading = '<div class="lds-ring app-loader"><div></div><div></div><div></div><div></div></div>';
    $('body').prepend(loading);

    if(EO_SH_SHOP_DOMAIN == 'shopnabe.myshopify.com'){
      $('.overlay').hide();
      $('.eosh_main_Form').css('visibility','visible');
    }
    
    formData = eoShGetFormData();
    if(typeof formData['form-settings']!='undefined'){
      formRedirect = formData['form-settings'];
    }
    if(typeof formData['form-fields']!='undefined'){
      FIELDS_VALIDATION = formData['form-fields'];
    }

    // AUTO COMPLETE OFF 
    if($('form').length > 0){
      $('form').attr('autocomplete', 'off');
      $('form > .eosh_field_row').find('input').attr('autocomplete', 'off'); 
    }

    // REGISTER
    if(window.EO_SH_PAGE_LOCATION == "/account/register"){
      //DISABLE PRE LOGIN BUTTON FROM SUBMIT
      if($('input[name*="_eo_"]').length == 0){
      }else{
        $('.eosh_container input[type="submit"]').attr('type', 'button');
      
        // ON CREATE BUTTON CLICK
        $('.btn').on('click', function (){
          
          $('.lds-ring').show();

          if($('input[name="_method"]').length > 0){
            $('input[name="_method"]').val('post');
          }
          $('.eosh_field_row input[name*="email"], .eosh_field_row input[name*="password"]').removeClass('eosh_error-boundry');
          $('.eosh_field_row input[name*="email"], .eosh_field_row input[name*="password"]').parent().find('.error').remove();

          eoShValidateForm();

          if($('.eosh_field_row .error').length==0){
            createCustomerAndItsMetas();
          } else {
            setTimeout(function(){ $('.lds-ring').hide(); },300)
          }

        });
      }
    }

    // GET FORM DATA AND SETTING - 1st Function
    function eoShGetFormData(){
      var eoShFormFields = [];
      $.ajax({
        url: EO_SH_APP_BASE_URL + '/api/get-form-data',
        type: "GET",
        dataType: 'json',
        async: false,
        crossDomain: true,
        crossOrigin: true,
        data: {
          shop:EO_SH_SHOP_DOMAIN,
        },
        success: function (response) {
          eoShFormFields = response;
        }
      });
      return eoShFormFields;
    }

    // CREATE CUSTOMER AND IT"S META FIELDS
    function createCustomerAndItsMetas(){
      var data = new FormData($('#create_customer')[0]);
      data.append('shop', EO_SH_SHOP_DOMAIN);
      
      $.ajax({
        url: EO_SH_APP_BASE_URL + '/api/create-cust/',
        type: "POST",
        async: false,
        crossDomain: true,
        data: data,
        cache: false,
        contentType: false,
        processData: false,
        success: function (response) {
          $('.lds-ring').hide();
          if ('customer_data' in response){
            if(response['customer_data'].length==2){
              post('/account', {'email': response['customer_data'][0], 'password':response['customer_data'][1]});
            }else{
              alert("Something went wrong, you cannot create account");
              $('.lds-ring').hide()
            }
          } else if('file_size' in response){
            alert(response['file_size']);
          } else if('is_exist' in response){
            alert("customer already exist with this email");
          } else if('not_created' in response){
            alert("2-Something went wrong, you cannot create account");
          }
        }
      });
      $('.lds-ring').hide();
    }
    function post(path, parameters) {
      var form = '<form method="post" action="/account/login" id="customer_login" accept-charset="UTF-8" novalidate="novalidate" autocomplete="off">'+
          '<input type="hidden" name="form_type" value="customer_login">'+
          '<input type="hidden" name="utf8" value="✓">'+
          '<input type="email" name="customer[email]" id="CustomerEmail" value="'+parameters['email']+'" autocomplete="email" autocorrect="off" autocapitalize="off">'+

          '<input type="password" name="customer[password]" value="'+parameters['password']+'" id="CustomerPassword">'+
            
          '<div class="text-center">'+
            '<p>'+
              '<a href="#recover" id="RecoverPassword">Forgot your password?</a>'+
            '</p>'+
            '<input type="submit" class="btn" value="Sign In">'+
          '</div>'+
        '</form>';
      $(document.body).append(form);

      var redirect = formRedirect!='' ? formRedirect : '/account';
      var request = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        redirect: 'manual',
        body: JSON.stringify({ 
              utf8: '✓', 
              form_type: 'customer_login', 
              customer: { email: parameters['email'], password: parameters['password'] }
            })
      }
      fetch('/account/login', request).then(function(res){
        window.location = redirect
      }).catch(err => console.log(err));
      $('.lds-ring').hide()
      //$('#customer_login').submit();
    }

    /* ON SUBMIT FORM VALIDATIONS */
    function eoShValidateForm(){

      $.each(FIELDS_VALIDATION, function(index, formField){
        if(formField['type']!='heading' || formField['type']!='message'){
          
          var fieldClass = formField['type']+'_'+formField['id']

          var requiredStatus = formField['required_status']
          var errorMessage  = formField['error_message'] !=null ? formField['error_message'] : eoQualifierErrors('required')
          var validations   = formField['field_validations']
          var fieldType     = formField['type']

          $('.'+fieldClass).parent().find('.error').remove();
          $('.'+fieldClass).removeClass('eosh_error-boundry');
          if(fieldType == 'multi_select_box'){
            $('.'+fieldClass).next().find('.select2-selection--multiple').removeClass('eosh_error-boundry');
          }

          errorCheck = false;
          if(requiredStatus){
            if(eoShIsNotValidatedField(fieldType, fieldClass, true)){
              applyErrorOnField(fieldClass, errorMessage);
              errorCheck = true;
            }
          }

          if(validations.length > 0 && !errorCheck){
            $.each(validations, function(index, formField){
              var id         = formField['id'],
              qualifier  = formField['qualifier'],
              qualifierValue = formField['qualifier_value'],
              errorMessage   = formField['error_message']

              var selfObj = $('.'+fieldClass);
              if(fieldType == 'file_upload'){

                var errorStatus = eoMeetQualifierCondition(qualifier, qualifierValue, fieldType, selfObj);
                if(errorStatus['key']==1 && errorStatus['value']==true){
                  applyErrorOnField(fieldClass, errorMessage);
                }
              }
            });
          }

        }
        
      });
    }
    function eoShIsNotValidatedField(type, fieldClass, isRequired=null){
      var selfObj = $('.'+fieldClass);
      if(typeof selfObj!='undefined'){
        if(type == 'check_box')        { return (!selfObj.prop('checked')) ? true : false }
        if(type == 'multi_select_box') { return Array.isArray(selfObj.val()) && selfObj.val().length == 0 ? true : false }
        if(type == 'email'){
          if(selfObj.val() == ''){
            return true;
          }
          else{
            $('.eosh_field_row input[name*="email"]').on('keyup', function(){
              var mailformat = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/igm;
              if (mailformat.test($(this).val()) && $(this).val()!='') {
                $(this).parent().find('.error').remove();
                $(this).removeClass('eosh_error-boundry');
              }else{
                if($(this).parent().find('.error').length==0){
                  $('.eosh_field_row input[name*="email"]').addClass('eosh_error-boundry');
                  $('.eosh_field_row input[name*="email"]').parent().append('<div class="error"><span class="eosh_error-text">Invalid email format</span></div>');
                }
                else if($(this).val()==''){
                  $(this).parent().find('.eosh_error-text').text('It is required field');
                }else{
                  $(this).parent().find('.eosh_error-text').text('Invalid email format');
                }
              }
            })
          }
        }
        return (selfObj.val() == '') ? true : false
      }
    }

    function applyErrorOnField(fieldClass, errorMessage){
      var fieldObj = $('.'+fieldClass);
      
      fieldObj.parent().find('.error').remove();
      fieldObj.removeClass('eosh_error-boundry');

      if(fieldClass.includes('multi_select_box')){
        fieldObj.on("select2:open", function() {
          if(fieldObj.parent().find('.error').length > 0){
            $(document).find('.select2-dropdown').addClass('eosh_error-boundry'); 
          }else{
            $(document).find('.select2-dropdown').removeClass('eosh_error-boundry');
          }
        });
        fieldObj.parent().append('<div class="error"><span class="eosh_error-text" style="font-size: 15px;font-family: ui-sans-serif;">'+errorMessage+'</span></div>');
        if(fieldObj.next().find('.select2-selection--multiple').length > 0){
          fieldObj.next('.select2-container--default').find('.select2-selection--multiple').addClass('eosh_error-boundry');
        }
      }
      else{
        if(fieldClass.includes('file_upload') && fileErrorMessage!=''){
          errorMessage = fileErrorMessage;
        }
        if(fieldObj.parents('.eosh_field_row').is(":visible")){
          fieldObj.parent().append('<div class="error"><span class="eosh_error-text" style="font-size: 15px;font-family: ui-sans-serif;">'+errorMessage+'</span></div>');
          fieldObj.addClass('eosh_error-boundry');
        }

        fileErrorMessage = '';
      }
      
    }
    
    // CREATE VALIDATIONS
    function eoShMakeValidationRules(fieldConditions){
      $.fn.extend({
        hasClasses: function (selectors) {
          var self = this;
          for (var i in selectors) {
            if ($(self).hasClass(selectors[i])) 
              return selectors[i];
          }
          return '';
        }
      });
      var formFieldsClassesArray = [];
      var conditions = [];

      if(typeof fieldConditions['field-conditions']!= 'undefined' ){
        conditions = fieldConditions['field-conditions'];
      }

      $.each(fieldConditions['field-conditions'], function(index, item){
        formFieldsClassesArray.push(item['form_fields']['type']+'_'+item['form_fields']['id']);
      });

      var isRadioSame = false;
      if($('form > .eosh_field_row').length > 0){
        $.each($('form > .eosh_field_row').find('input, textarea, select'), function(){
          var selfObj = $(this);
          var matchClass = $(this).hasClasses(formFieldsClassesArray);
          if(typeof matchClass!='undefined' && matchClass!=''){
            var fieldId = matchClass.split('_').pop();

            $.each(conditions, function(index, item){
              if(typeof item['field_id'] != 'undefined' && item['field_id'] == fieldId ){
                var qualifier         = item['qualifier'].trim();
                var qualifierValue    = item['qualifier_value'].trim();
                var fieldType         = item['form_fields']['type'];
                var conditionOperator = eoMeetQualifierCondition(qualifier, qualifierValue, fieldType, selfObj);
              }
            });
          }
        });
      }
    }

    function eoMeetQualifierCondition(qualifier, qualifierValue, fieldType, fieldObj, current=null){
      var fieldValue = Array.isArray(fieldObj.val()) ? fieldObj.val() : fieldObj.val().toLowerCase().trim();
      if(typeof qualifierValue!='undefined' && qualifierValue !=null){
        qualifierValue = qualifierValue.toLowerCase().trim();
      }
      if(fieldType == 'radio_button'){
        var radioNameAttr = fieldObj.attr('name');
        isRadioSame = true;
        fieldValue = $('input[name="'+radioNameAttr+'"]:checked').val();
        fieldValue = fieldValue.toLowerCase().trim();
      }

      var errorMessage;
      var errorStatus={'key': 0, 'value':false};
      switch(qualifier){

        case 'equals':
        case 'numeric_equals':
            if(fieldType == 'color_picker'){
              var rbgValue = fieldObj.parent('.input-wrapper').css('background-color');
              const rgb2hex = (rgb) => `#${rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`
              var hexValue = rgb2hex(rbgValue);
              if(hexValue == qualifierValue){
                errorStatus = {'key': 1, 'value': false};
              } else{
                errorMessage = eoQualifierErrors(qualifier);
                if(fieldObj.parent().parent().parent().find('.error').length == 0){
                  errorStatus = {'key': 1, 'value': true};
                }
              }
            } 
            else if(fieldType == 'radio_button'){
              if(fieldValue === qualifierValue){
                errorStatus = {'key': 1, 'value': false};
              } else{
                errorMessage = eoQualifierErrors(qualifier);
                errorStatus = {'key': 1, 'value': true};
              }
            } 
            else {
              if(fieldValue === qualifierValue){
                errorStatus = {'key': 1, 'value': false};
              } else{
                errorMessage = eoQualifierErrors(qualifier);
                if(fieldObj.parent().find('.error').length == 0){
                  errorStatus = {'key': 1, 'value': true};
                }
              }
            }
            return errorStatus;
            break;
        case 'not_equals':
            if(fieldType == 'color_picker'){
              var rbgValue = fieldObj.parent('.input-wrapper').css('background-color');
              const rgb2hex = (rgb) => `#${rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`
              var hexValue = rgb2hex(rbgValue);
              if(hexValue != qualifierValue){              
                errorStatus = {'key': 1, 'value': false};
              } else{
                errorMessage = eoQualifierErrors(qualifier);
                if(fieldObj.parent().parent().parent().find('.error').length == 0){
                  errorStatus = {'key': 1, 'value': true};
                }
              }
            } else {
              if(fieldValue != qualifierValue){
                errorStatus = {'key': 1, 'value':false};
              } else{
                errorMessage = eoQualifierErrors(qualifier);
                if(fieldObj.parent().find('.error').length == 0){
                  errorStatus = {'key': 1, 'value':true};
                }            
              }
            }
            return errorStatus;
            break;
        case 'blank':
            if(fieldValue == ''){
              errorStatus = {'key': 1, 'value':false};
            } else{
              errorMessage = eoQualifierErrors(qualifier);
              if(fieldObj.parent().find('.error').length == 0){
                errorStatus = {'key': 1, 'value':true};
              }
            }
            return errorStatus;
            break;
        case 'require_field':
        case 'not_blank':
            if(fieldValue != ''){
              errorStatus = {'key': 1, 'value':false};
            } else{
              errorMessage = eoQualifierErrors(qualifier);
              if(fieldObj.parent().find('.error').length == 0){
                errorStatus = {'key': 1, 'value':true};
              }            
            }
            return errorStatus;
            break;
        case 'contains':
            fieldObj.on("select2:open", function() {
              if(fieldObj.parent().find('.error').length > 0){
                errorStatus = {'key': 1, 'value':true};
              }else{
                errorStatus = {'key': 1, 'value':false};
              }
            });

            if(Array.isArray(fieldValue) && fieldValue.length > 0){
              fieldValue = fieldValue.map(function(item) { return item.trim().toLowerCase()});
              qualifierValue = qualifierValue.split(',');
              if(qualifierValue.includes(undefined) == false){
                var difference = qualifierValue.filter(x => !fieldValue.includes(x.trim()));
                if(typeof difference != 'undefined' && difference.length == 0){
                  errorStatus = {'key': 1, 'value':false};
                } else {
                  errorMessage = eoQualifierErrors(qualifier);

                  if(difference.length > 0){
                    errorStatus = {'key': 1, 'value':false};
                    if(fieldObj.prop('disabled') == false){
                      if(fieldObj.next().find('.select2-selection--multiple').length>0){
                        errorStatus = {'key': 1, 'value':true};
                      }
              
                    }
                  }  
                }
              }
            }
            else {
              if(fieldValue.indexOf(qualifierValue) > -1){
                if(fieldObj.next().find('.select2-selection--multiple').length>0){
                  errorStatus = {'key': 1, 'value':false};
                }else{
                  errorStatus = {'key': 1, 'value':false};
                }
              } else{
                errorMessage = eoQualifierErrors(qualifier);
                if(fieldObj.parent().find('.error').length == 0){
                  if(fieldObj.next().find('.select2-selection--multiple').length>0){
                    errorStatus = {'key': 1, 'value':true};
                  }else{
                    errorStatus = {'key': 1, 'value':true};
                  }
                }            
              }
            }
            return errorStatus;
            break;
        case 'excludes':

            fieldObj.on("select2:open", function() {
              if(fieldObj.parent().find('.error').length > 0){
                errorStatus = {'key': 1, 'value':true};
              } else{
                errorStatus = {'key': 1, 'value':false};
              }
            });

            if(Array.isArray(fieldValue) && fieldValue.length > 0){
              fieldValue = fieldValue.map(function(item) { return item.trim().toLowerCase()});
              qualifierValue = qualifierValue.split(',').map(function(item) { return item.trim().toLowerCase()});
              if(qualifierValue.includes(undefined) == false){
                var difference = qualifierValue.filter(x => fieldValue.includes(x.trim()));

                if(typeof difference != 'undefined' && difference.length == 0){
                  errorStatus = {'key': 1, 'value':false};
                  errorStatus = {'key': 1, 'value':false};
                } else {
                  errorMessage = eoQualifierErrors(qualifier);
                  if(difference.length > 0){
                    errorStatus = {'key': 1, 'value':false};
                    if(fieldObj.prop('disabled')==false){
                      if(fieldObj.next().find('.select2-selection--multiple').length > 0){
                        errorStatus = {'key': 1, 'value':true};
                      }
                    }
                  }  
                }
              }
            }
            else {
              if(fieldValue.indexOf(qualifierValue.toLowerCase()) === -1){
                errorStatus = {'key': 1, 'value':false};
                if(fieldObj.next().find('.select2-selection--multiple').length > 0){
                  errorStatus = {'key': 1, 'value':false};
                }else{
                  errorStatus = {'key': 1, 'value':false};
                }
              } else{
                errorMessage = eoQualifierErrors(qualifier);
                if(fieldObj.parent().find('.error').length == 0){
                  if(fieldObj.next().find('.select2-selection--multiple').length > 0){
                    errorStatus = {'key': 1, 'value':true};
                  }else{
                    errorStatus = {'key': 1, 'value':true};
                  }
                }
              }
            }
            return errorStatus;
            break;
        case 'less_than':
            if(fieldType == 'file_upload'){
              var file = fieldObj[0].files.item(0);
              if(file){
                  var fileSize = Math.round((file.size / 1024));
                  if(qualifierValue > 2000){
                    qualifierValue = 2000;
                  }
                  if(fileSize < 2000 && fileSize < parseInt(qualifierValue)){
                    errorStatus = {'key': 1, 'value':false};
                  } else{
                    if(fileSize > 2000){fileErrorMessage = "Please attach file size less than 2000MB";
                    }else{
                      errorMessage = eoQualifierErrors(qualifier);
                    }
                    errorStatus = {'key': 1, 'value':true};
                  }
              }
            }else if(fieldType == 'numeric_field'){
              if(fieldValue < qualifierValue){
                errorStatus = {'key': 1, 'value':false};
              } else{
                errorMessage = eoQualifierErrors(qualifier);
                if(fieldObj.parent().find('.error').length == 0){
                  errorStatus = {'key': 1, 'value':true};
                }            
              }
            } else{
              if(Array.isArray(fieldValue)){
                if(fieldValue.length < qualifierValue){
                  errorStatus = {'key': 1, 'value':false};
                } else {
                  errorMessage = eoQualifierErrors(qualifier);
                  errorMessage = errorMessage.replace('characters', 'options');
                  errorStatus = {'key': 1, 'value':true};
                }
              } else {
                if(fieldValue.toString().length < qualifierValue){
                  errorStatus = {'key': 1, 'value':false};
                } else{
                  errorMessage = eoQualifierErrors(qualifier);
                  if(fieldObj.parent().find('.error').length == 0){
                    errorStatus = {'key': 1, 'value':true};
                  }            
                }
              }
            }
            return errorStatus;
            break;
        case 'greater_than':
            if(fieldType == 'file_upload'){
              var file = fieldObj[0].files.item(0);
              if(file){
                  var fileSize = Math.round((file.size / 1024));
                  if(qualifierValue > 2000){
                    qualifierValue = 2000;
                  }
                  if(fileSize < 2000 && fileSize > parseInt(qualifierValue)){
                    errorStatus = {'key': 1, 'value':false};
                  } else{
                    if(fileSize > 2000){ fileErrorMessage = "File size should be less than 2000MB";
                    }else{
                      errorMessage = eoQualifierErrors(qualifier);
                    }
                    errorStatus = {'key': 1, 'value':true};
                  }
              }
            } 
            else if(fieldType == 'numeric_field'){
              if(fieldValue > qualifierValue){
                errorStatus = {'key': 1, 'value':false};
              } else{
                errorMessage = eoQualifierErrors(qualifier);
                if(fieldObj.parent().find('.error').length == 0){
                  errorStatus = {'key': 1, 'value':true};
                }            
              }
            }
            else{
              if(Array.isArray(fieldValue)){
                if(fieldValue.length > qualifierValue){
                  errorStatus = {'key': 1, 'value':false};
                } else {
                  errorMessage = eoQualifierErrors(qualifier);
                  errorMessage = errorMessage.replace('characters', 'options');
                  errorStatus = {'key': 1, 'value':true};
                }
              } else {  
                if(fieldValue.toString().length > qualifierValue){
                  errorStatus = {'key': 1, 'value':false};
                } else{
                  errorMessage = eoQualifierErrors(qualifier);
                  if(fieldObj.parent().find('.error').length == 0){
                    errorStatus = {'key': 1, 'value':true};
                  }            
                }
              }
            }
            return errorStatus;
            break;
        case 'greater_and_equal':
           if(fieldValue >= qualifierValue){
              errorStatus = {'key': 1, 'value':false};
            } else{
              errorMessage = eoQualifierErrors(qualifier);
              if(fieldObj.parent().find('.error').length == 0){
                errorStatus = {'key': 1, 'value':true};
              }            
            }
            return errorStatus;
            break;
        case 'less_and_equal':
           if(fieldValue <= qualifierValue){
              errorStatus = {'key': 1, 'value':false};
            } else{
              errorMessage = eoQualifierErrors(qualifier);
              if(fieldObj.parent().find('.error').length == 0){
                errorStatus = {'key': 1, 'value':true};
              }            
            }
            return errorStatus;
            break;
        case 'starts_with':
            if(fieldValue.startsWith(qualifierValue)){
              errorStatus = {'key': 1, 'value':false};
            } else{
              errorMessage = eoQualifierErrors(qualifier);
              if(fieldObj.parent().find('.error').length == 0){
                errorStatus = {'key': 1, 'value':true};
              }            
            }
            return errorStatus;
            break;
        case 'ends_with':
            if(fieldValue.endsWith(qualifierValue)){
              errorStatus = {'key': 1, 'value':false};
            } else{
              errorMessage = eoQualifierErrors(qualifier);
              if(fieldObj.parent().find('.error').length == 0){
                errorStatus = {'key': 1, 'value':true};
              }            
            }
            return errorStatus;
            break;
        case 'extension':
            if(typeof qualifierValue == 'string'){
              var validatedExtensions = qualifierValue.split(',').map(function(item) { return item.trim();});
              var fileExtension = fieldValue.split('.').pop();
              if(typeof fileExtension!='undefined' && fileExtension!=''){
                if(validatedExtensions.includes(fileExtension.trim())){
                  errorStatus = {'key': 1, 'value':false};
                }else{
                  errorMessage = eoQualifierErrors(qualifier);
                  if(fieldObj.parent().find('.error').length == 0){
                    errorStatus = {'key': 1, 'value':true};
                  }
                }
              }
            }
            return errorStatus;
            break;
        case 'checked':
            if(fieldObj.prop('checked')){
              errorStatus = {'key': 1, 'value':false};
            } else{
              errorMessage = eoQualifierErrors(qualifier);
              if(fieldObj.parent().find('.error').length == 0){
                errorStatus = {'key': 1, 'value':true};
              }            
            }
            return errorStatus;
            break;
        case 'not_checked':
            if(!fieldObj.prop('checked')){
              errorStatus = {'key': 1, 'value':false};
            } else{
              errorMessage = eoQualifierErrors(qualifier);
              if(fieldObj.parent().find('.error').length == 0){
                errorStatus = {'key': 1, 'value':true};
              }            
            }
            return errorStatus;
            break;
        case 'on':
        case 'before':
        case 'on_or_before':
        case 'after':
        case 'on_or_after':
            if(fieldValue && (fieldType == 'time_picker' || fieldType == 'date_picker')){
              var result = (fieldType == 'time_picker') ? getTimeDifference(fieldValue, qualifierValue) : getDateDifference(fieldValue, qualifierValue);
              var varOperator = new VarOperator(qualifier, fieldType); 

              if(typeof result != 'undefined'){
                varOperator.setOperation();
                var booleanCheck = (fieldType == 'time_picker') ? varOperator.evaluate(result, 0) : varOperator.evaluate(result['inputupdated'], result['qualifierupdated']);
                if(booleanCheck) {
                  errorStatus = {'key': 1, 'value':false};
                } else {
                  errorMessage = eoQualifierErrors(qualifier);
                  errorMessage = (fieldType == 'time_picker') ? errorMessage.replace('Field', 'Time') : errorMessage.replace('Field', 'Date');
                  if(fieldObj.parent().find('.error').length == 0){
                    errorStatus = {'key': 1, 'value':true};;
                  }            
                }
              }
            }
            return errorStatus;
            break;
      }
    }

    function fieldLogic(){}
    
    var formFieldsClassesArray = [];
    $.each(formData['field-conditions'], function(index, item){
      formFieldsClassesArray.push(item['form_fields']['type']+'_'+item['form_fields']['id']);
    });

    /* On first time load */
    $(document).ready(function(){
      $.fn.extend({
        hasClasses: function (selectors) {
          var self = this;
          for (var i in selectors) {
            if ($(self).hasClass(selectors[i])) 
              return selectors[i];
          }
          return '';
        }
      });
      $.each(formFieldsClassesArray, function(index, item){
        var fieldTag   = (typeof $('.'+item)!='undefined') ? $('.'+item)[0].tagName : '';
        var matchClass = item;
        var validations='';

        switch(fieldTag){
          case 'INPUT':
              validations = getFieldDependency(matchClass);
              if(typeof $(this).attr('name')!='undefined' && $(this).attr('name').includes('upload_file')){
                passForValidation(validations, matchClass, $(this), this);
              }else{
                passForValidation(validations, matchClass, $(this));
              }
              break;
          case 'SELECT':
              validations = getFieldDependency(matchClass);
              passForValidation(validations, matchClass, $(this));
              break;
          case 'TEXTAREA':
              validations = getFieldDependency(matchClass);
              passForValidation(validations, matchClass, $(this));
              break;
          case '':
              break;
        }
      });
    })

    /* -------------------------------ACTIONS------------------------------- */
    $('form > .eosh_field_row').find('input, select, textarea').on('change keyup focus', function(e){
      var email = '';
      $.fn.extend({
        hasClasses: function (selectors) {
          var self = this;
          for (var i in selectors) {
            if ($(self).hasClass(selectors[i])) 
              return selectors[i];
          }
          return '';
        }
      });

      var fieldTag   = (typeof $(this)!='undefined' && $(this).length > 0) ? $(this)[0].tagName : '';
      var matchClass = $(this).hasClasses(formFieldsClassesArray);
      var validations='';

      switch(fieldTag){
        case 'INPUT':
            validations = getFieldDependency(matchClass);
            if(typeof $(this).attr('name')!='undefined' && $(this).attr('name').includes('upload_file')){
              passForValidation(validations, matchClass, $(this), this);
            }else{
              passForValidation(validations, matchClass, $(this));
            }
            break;
        case 'SELECT':
            validations = getFieldDependency(matchClass);
            passForValidation(validations, matchClass, $(this));
            break;
        case 'TEXTAREA':
            validations = getFieldDependency(matchClass);
            passForValidation(validations, matchClass, $(this));
            break;
        case '':
            break;
      }
    })

    function getFieldDependency(matchClass){
      var fieldId    = matchClass.split('_').pop();
      var fieldType  = matchClass.substring(0, matchClass.lastIndexOf("_"));
      var parentField = [];
      if(typeof matchClass!='undefined'){
  
        var currentFieldInConditions = formData['field-conditions'].filter(obj => obj['field_id'] == fieldId);        
        if(currentFieldInConditions.length > 0){
          parentField.push({'current':currentFieldInConditions});

          $.each(currentFieldInConditions, function(index, item){
            var dependencyObj = {};
            if(item['parent_id'] == null){
              var childArray = formData['field-conditions'].filter(obj => obj['parent_id'] == item['id']);
              dependencyObj['parent'] = item;
              dependencyObj['child']  = childArray;
              parentField.push(dependencyObj);
            }else{
              var foundParent = formData['field-conditions'].filter(obj => obj['id'] == item['parent_id']);
              var duplicateParent = parentField.filter(function(obj){
                if(typeof obj != 'undefined'){
                  if(typeof obj['parent']!= 'undefined'){
                    return obj['parent']['field_id'] == foundParent[0]['field_id'];
                  }
                }
              }) 

              if(duplicateParent.length == 0){
                var parent = formData['field-conditions'].filter(obj => obj['id'] == item['parent_id']);
                if(typeof parent!= 'undefined' && parent.length > 0){
                  var childArray = formData['field-conditions'].filter(obj => obj['parent_id'] == parent[0]['id']);
                  dependencyObj.parent = parent;
                  dependencyObj.child  = childArray;
                  parentField.push(dependencyObj);
                }
              }
            }
          })
        }
      }
      //return false;
      return parentField;
    }

    var globalRevertValidationsRules = [];
    function passForValidation(validations, matchClass, fieldObj, current=null){

      var fieldId    = matchClass.split('_').pop();
      var fieldType      = matchClass.substring(0, matchClass.lastIndexOf('_'));

      var conditionErrorCheck = false;
      var parentLoopBreakException = {};
      //try{
        $.each(validations, function(index, item){
          if(index == 0){ } 
          else {
            conditionErrorCheck = false;
            var parent = item['parent'];
            if(typeof item['parent']!= 'undefined'){
              if(Array.isArray(parent)){ parent = parent[0] }

              var qualifier      = parent['qualifier'];
              var qualifierValue = parent['qualifier_value'];
              var child          = item['child'];
              var actions        = parent['field_actions'];
              
              var pFieldType     = parent['form_fields']['type'];
              var pFieldClass    = parent['form_fields']['type']+'_'+parent['form_fields']['id'];
              var pFieldObj      = (pFieldClass!='undefined') ? $('.'+pFieldClass) : 'undefined';
              
              if(EO_SH_SHOP_DOMAIN == 'shopnabe.myshopify.com'){
                actionsPart(actions);
              }

              if(pFieldType =='radio_button'){
                pFieldObj = $('input[class='+pFieldClass+']:checked');
              }

              var condtionalCheck = parent['conditional_check'];

              var errorStatus = eoMeetQualifierCondition(qualifier, qualifierValue, pFieldType, pFieldObj, current);
              if(typeof errorStatus != 'undefined' && (errorStatus['key'] == 1)){
                if(errorStatus['value'] == false || (errorStatus['key'] == 1 && errorStatus['value'] == true && condtionalCheck=='any')){
                  // CHILD LOOP START
                  var loopBreakException = {};

                  try {
                    if(errorStatus['value'] == false && condtionalCheck =='any'){
                      throw loopBreakException;
                    }

                    $.each(child, function(childIndex, childItem) {
                      var cQualifier      = childItem['qualifier'];
                      var cQualifierValue = childItem['qualifier_value'];
                      var fieldClass      = childItem['form_fields']['type']+'_'+childItem['form_fields']['id'];
                      var cFieldObj       = (fieldClass!='undefined') ? $('.'+fieldClass) : 'undefined';


                      var cFieldType      = childItem['form_fields']['type'];
                      if(typeof cFieldType!='undefined' && (typeof cFieldObj!='undefined' && cFieldObj.length==1)){
                        var cErrorStatus = eoMeetQualifierCondition(cQualifier, cQualifierValue, cFieldType, cFieldObj, current);
                        if(typeof cErrorStatus != 'undefined' && cErrorStatus['key'] == 1 && cErrorStatus['value'] == true && condtionalCheck=='all'){
                          cFieldObj.parent().find('.error').remove();
                          cFieldObj.removeClass('eosh_error-boundry');
                          conditionErrorCheck = true;
                          throw loopBreakException;
                        } else if(typeof cErrorStatus != 'undefined' && cErrorStatus['key'] == 1 && cErrorStatus['value'] == false && condtionalCheck=='any'){
                          errorStatus = {'key': 1, 'value':false};
                          conditionErrorCheck = false;
                          throw loopBreakException;
                        } else if(typeof cErrorStatus != 'undefined' && cErrorStatus['key'] == 0 && cErrorStatus['value'] == false && condtionalCheck=='all'){
                          conditionErrorCheck = true;
                          throw loopBreakException;
                        }
                      }
                    });
                  } catch (e) {
                    if (e !== loopBreakException) throw e;
                  }
                  //ACTIONS PART START
                  if(conditionErrorCheck == false){
                    $.each(actions, function(actionIndex, actionItem){
                      var targetFieldId       = actionItem['target_field'];
                      var targetFieldAction   = actionItem['field_action'];
                      var targetFieldNewValue = actionItem['field_new_value'];
                      if(typeof formFieldsClassesArray != 'undefined' ){
                        if(typeof targetFieldId != 'undefined'){
                          var fieldsSelectors = formFieldsClassesArray.filter(obj => obj.split('_').pop() == targetFieldId);

                          if(fieldsSelectors.length > 0){
                            performConditionActions(fieldsSelectors, targetFieldAction, targetFieldNewValue, errorStatus);
                          }else{
                            var targetField = $('form').find('.eosh_field_row [class*=_'+targetFieldId+']');
                            var targetIsRadio = false;
                            if(targetField.length > 1){
                              if($('form').find('.eosh_field_row [class*=radio_button_'+targetFieldId+']').length == targetField.length){
                                targetIsRadio = true;
                              }
                            }
                            if(typeof targetField!='undefined' && (targetField.length == 1 || targetIsRadio)){
                              fieldsSelectors = targetField.attr('class').split(' ');
                              fieldsSelectors = fieldsSelectors.filter(obj=> obj.includes(targetFieldId));
                              performConditionActions(fieldsSelectors, targetFieldAction, targetFieldNewValue, errorStatus);
                            }
                          }
                        }
                      }
                    }) //ACTIONS PART END
                    // POPULATE ARRAY PARENT WITH CHANGED VALUES
                    if(globalRevertValidationsRules.findIndex(x => x.id == parent['id']) == -1){
                      globalRevertValidationsRules.push({'id':parent['id']});
                    }
                  }
                } else {

                  conditionErrorCheck = true;
                  var fieldNameAttr = pFieldObj.attr('name');
                  if(!fieldNameAttr.includes("upload_file")){
                    pFieldObj.parent().find('.error').remove();
                    pFieldObj.removeClass('eosh_error-boundry');
                  }
                  // REVERT FILED ACTIONS
                  if(globalRevertValidationsRules.findIndex(x => x.id == parent['id']) != -1){

                    revertConditionFieldActions(actions, errorStatus, true);
                    
                    // REMOVE PARENT ID
                    var indexToRemove = globalRevertValidationsRules.map(function(item) { return item.id; }).indexOf(parent['id']);
                  }
                  //throw parentLoopBreakException;
                }              
              }
            }
          }
        })
      //conditionErrorCheck == false ? console.log('Matched All Condtitions...') : console.log('Failed All Condtitions...')   
    }

    function actionsPart(actions){
      $.each(actions, function(actionIndex, actionItem){
        var targetFieldId       = actionItem['target_field'];
        var targetFieldAction   = actionItem['field_action'];
        var targetFieldNewValue = actionItem['field_new_value'];
        
        if(typeof formFieldsClassesArray != 'undefined' ){
          if(typeof targetFieldId != 'undefined'){
            
            var fieldsSelectors = formFieldsClassesArray.filter(obj => obj.split('_').pop() == targetFieldId);
            errorStatus = {'key': 0, 'value':false}; 
            
            if(fieldsSelectors.length > 0){
              performConditionActions(fieldsSelectors, targetFieldAction, targetFieldNewValue, errorStatus);
            }else{
              var targetField = $('form').find('.eosh_field_row [class*=_'+targetFieldId+']');
              var targetIsRadio = false;
              if(targetField.length > 1){
                if($('form').find('.eosh_field_row [class*=radio_button_'+targetFieldId+']').length == targetField.length){
                  targetIsRadio = true;
                }
              }
              if(typeof targetField!='undefined' && (targetField.length == 1 || targetIsRadio)){
                fieldsSelectors = targetField.attr('class').split(' ');
                fieldsSelectors = fieldsSelectors.filter(obj=> obj.includes(targetFieldId));
                //console.log('fieldsSelectors', fieldsSelectors+" - "+targetFieldAction+" - "+targetFieldNewValue);
                performConditionActions(fieldsSelectors, targetFieldAction, targetFieldNewValue, errorStatus, true);
              }
            }
          }
        }
      })
    }

    // JUST FOR DISABLED FIELDS
    function revertConditionFieldActions(actions, errorStatus, isRevert = null){
      $.each(actions, function(actionIndex, actionItem){
        var targetFieldId       = actionItem['target_field'];
        var targetFieldAction   = actionItem['field_action'];
        var targetFieldNewValue = actionItem['field_new_value'];
        //REVERT ACTION

        if(typeof targetFieldAction!='undefined'){

          if(typeof formFieldsClassesArray != 'undefined' ){
            
            if(typeof targetFieldId != 'undefined'){
              var fieldsSelectors = formFieldsClassesArray.filter(obj => obj.split('_').pop() == targetFieldId);

              if(fieldsSelectors.length > 0){
                performConditionActions(fieldsSelectors, targetFieldAction, targetFieldNewValue, {'key': 1, 'value':false}, isRevert);
              }else{
                var targetField = $('form').find('.eosh_field_row [class*=_'+targetFieldId+']');
                var targetIsRadio = false;
                if(targetField.length > 1){
                  if($('form').find('.eosh_field_row [class*=radio_button_'+targetFieldId+']').length == targetField.length){
                    targetIsRadio = true;
                  }
                }
                if(typeof targetField!='undefined' && (targetField.length == 1 || targetIsRadio)){
                  fieldsSelectors = targetField.attr('class').split(' ');
                  fieldsSelectors = fieldsSelectors.filter(obj=> obj.includes(targetFieldId));

                  performConditionActions(fieldsSelectors, targetFieldAction, targetFieldNewValue, errorStatus, isRevert);
                }
              }
            }
          }
        }

      })
    }

    // CONDITIONS ACTIONS 
    function performConditionActions(fieldSelectors, action, targetValue, errorStatus, isRevert){
      if(Array.isArray(fieldSelectors) && fieldSelectors.length > 0){
        var fieldClass = (typeof fieldSelectors[0]!='undefined') ? fieldSelectors[0] : '';

        var fieldType = fieldClass.substring(0, fieldClass.lastIndexOf('_'));

        switch(action){
          case 'hide_field':
            //(errorStatus['value'] == false) ? $('.'+fieldClass).parents('.eosh_field_row').addClass('eosh_hide') : $('.'+fieldClass).parents('.eosh_field_row').removeClass('eosh_hide');
            if(isRevert){
              (errorStatus['value'] == false || errorStatus['value'] == true) ? $('.'+fieldClass).parents('.eosh_field_row').show() : $('.'+fieldClass).parents('.eosh_field_row').hide();
            }else{
              (errorStatus['value'] == false) ? $('.'+fieldClass).parents('.eosh_field_row').hide() : $('.'+fieldClass).parents('.eosh_field_row').show();
            }
            break;

          case 'show_field':
            if(isRevert){
              (errorStatus['value'] == false || errorStatus['value'] == true) ? $('.'+fieldClass).parents('.eosh_field_row').hide() : $('.'+fieldClass).parents('.eosh_field_row').show();
            }else {
              (errorStatus['value'] == false) ? $('.'+fieldClass).parents('.eosh_field_row').show() : $('.'+fieldClass).parents('.eosh_field_row').hide();
            }
            break;

          case 'enable_field':
            if(isRevert){
              (errorStatus['value'] == false || errorStatus['value'] == true) ? $('.'+fieldClass).prop('disabled', true) : $('.'+fieldClass).prop('disabled', false);
            }else{
              (errorStatus['value'] == false) ? $('.'+fieldClass).prop('disabled', false) : $('.'+fieldClass).prop('disabled', true);
            }
            
            break;

          case 'disable_field':
            if(fieldType == 'multi_select_box'){
              if(errorStatus['value'] == false && $('.'+fieldClass).prop('disabled') == false){
                $('.'+fieldClass).prop('disabled', true).trigger('change');
                $('.'+fieldClass).parent().find('.error').remove();
                $('.'+fieldClass).next().find('.select2-selection--multiple').removeClass('eosh_error-boundry');
              }else if(errorStatus['value'] == true && $('.'+fieldClass).prop('disabled') == true){
                $('.'+fieldClass).prop('disabled', false).trigger('change');
              }
            }else if(fieldType=='select_box' || fieldType=='text_box' || fieldType=='text_area' || fieldType=='date_picker' || fieldType=='time_picker' || fieldType=='radio_button' || fieldType=='check_box' || 'numeric_field'){
              if(isRevert){
                (errorStatus['value'] == false || errorStatus['value'] == true) ? $('.'+fieldClass).prop('disabled', false) : $('.'+fieldClass).prop('disabled', true);
              }else{
                (errorStatus['value'] == false) ? $('.'+fieldClass).prop('disabled', true) : $('.'+fieldClass).prop('disabled', false);
              }
            }
            break;

          case 'require_field':

            break;
          case 'unrequire_field':

            break;
          case 'set_column_value':
            //(errorStatus['value'] == false && !($('.'+fieldClass).prop('disabled'))) ? $('.'+fieldClass).val(targetValue) : $('.'+fieldClass).val();
            if (fieldType=='text_box' || fieldType=='text_area' || fieldType=='date_picker' || fieldType=='time_picker') {
              (errorStatus['value'] == false && !($('.'+fieldClass).prop('disabled'))) ? $('.'+fieldClass).val(targetValue) : $('.'+fieldClass).val() ;
            } else{ 
              if(errorStatus['value'] == false && fieldType=='select_box' && !($('.'+fieldClass).prop('disabled'))){
                $('.'+fieldClass).val(targetValue);
              }else if (errorStatus['value'] == false &&  fieldType=='multi_select_box' && !($('.'+fieldClass).prop('disabled'))){
                var data = [];
                data.push(targetValue);
                $('.'+fieldClass).select2('val', data);
              } else{
                $('.'+fieldClass).val(null).trigger('change');
              }
            }
            break;
          case 'clear_field_value':
            if (fieldType=='text_box' || fieldType=='text_area' || fieldType=='date_picker' || fieldType=='time_picker') {
              (errorStatus['value'] == false && !($('.'+fieldClass).prop('disabled'))) ? $('.'+fieldClass).val('') : $('.'+fieldClass).val() ;
            } else{ 
              if(fieldType=='select_box'){
                $('.'+fieldClass).val('');
              }else if (fieldType=='multi_select_box'){
                $('.'+fieldClass).val(null).trigger('change');
              }
            }
            break;
        }
      }
    }

    /* ____________________ HELPER FUNCTIONS ___________________ */ 
    // GET ERROS FROM QUALIFIER
    function eoQualifierErrors(qualifier){
      var errorsListObj = [ 
        {  'value' : 'Field is required',                       'text' : 'required'     },
        {  'value' : 'Field value should be equal to',          'text' : 'equals'       },
        {  'value' : 'Field value should not be equal to',      'text' : 'not_equals'   },
        {  'value' : 'Field should be blank',                   'text' : 'blank'        },
        {  'value' : 'Field should not be blank',               'text' : 'not_blank'    },
        {  'value' : 'Field should have',                       'text' : 'contains'     },
        {  'value' : 'Field should not have',                   'text' : 'excludes'     },
        {  'value' : 'Field characters should be less than',    'text' : 'less_than'    },
        {  'value' : 'Field characters should be greater than', 'text' : 'greater_than' },
        {  'value' : 'Field should be greater or equal than',   'text' : 'greater_and_equal'},
        {  'value' : 'Field should be less or equal than',      'text' : 'less_and_equal'},
        {  'value' : 'Field should Starts with',                'text' : 'starts_with'  },
        {  'value' : 'File should have extension',              'text' : 'extension'    },
        {  'value' : 'Field should ends with',                  'text' : 'ends_with'    }, 
        {  'value' : 'Field should be equal to',                'text' : 'on'           }, //done
        {  'value' : 'Field should be less than',               'text' : 'before'       }, //done
        {  'value' : 'Field should be equal or less than',      'text' : 'on_or_before' }, //done
        {  'value' : 'Field should be greater than',            'text' : 'after'        }, //done
        {  'value' : 'Field should be equal or greater than',   'text' : 'on_or_after'  },  //done
      ];
      if(typeof qualifier != 'undefined' && qualifier != ''){
        var matchedObj = $.grep(errorsListObj, function(singleObj){
                            return singleObj.text === qualifier;
                          })[0];
        if(typeof matchedObj != 'undefined'){ return matchedObj.value; } 
        else{ return false; }
      }
    }
    // TIME DIFFERENCE 
    function getTimeDifference(inputTime, qualifierTime){
      inputTime = inputTime.split(":");
      qualifierTime = qualifierTime.split(":");
      var inputTimeObj = new Date(0, 0, 0, inputTime[0], inputTime[1], 0);
      var qualifierTimeObj = new Date(0, 0, 0, qualifierTime[0], qualifierTime[1], 0);
      var diff = qualifierTimeObj.getTime() - inputTimeObj.getTime();
      if (typeof diff!='undefined' && diff!='NaN'){
        return diff;
      } else {
        return false;
      }
    }
    // DATE DIFFERENCE
    function getDateDifference(inputDate, qualifierDate){
      var inputDateUpdated     = new Date(inputDate.replace(/-/g,'/'));  
      var qualifierDateUpdated = new Date(qualifierDate.replace(/-/g,'/'));
      var result = { 'inputupdated' : inputDateUpdated, 'qualifierupdated' : qualifierDateUpdated }
      return result;
    }
    // GET CALCULATIONS RESULT FROM OPERATOR
    function VarOperator(qualifier, type) {
      this.qualifier = qualifier;
      this.fieldType = type;
      this.operation = '';

      this.setOperation = function setOperation(){
        switch(this.qualifier) {
          case "on":
              (this.fieldType == 'time_picker') ? (this.operation = '===') : (this.operation = '===');  break;
          case "before":
              (this.fieldType == 'time_picker') ? (this.operation = '>')   : (this.operation = '<');    break;
          case "on_or_before":
              (this.fieldType == 'time_picker') ? (this.operation = '>=')  : (this.operation = '<=');   break;
          case "after":
              (this.fieldType == 'time_picker') ? (this.operation = '<')   : (this.operation = '>');    break;
          case "on_or_after":
              (this.fieldType == 'time_picker') ? (this.operation = '<=')  : (this.operation = '>=');   break;
        }
      }
      this.evaluate = function evaluate(param1, param2){
        switch(this.operation) {
          case "===": //Type Convert to integer -  Unary operator (+)
              return (this.fieldType == 'time_picker') ? (param1 === param2) : (+param1 === +param2);
          case ">":
              return param1 > param2;
          case ">=":
              return param1 >= param2;
          case "<":
              return param1 < param2;
          case "<=":
              return param1 <= param2;
        }
      }
    }
    
  /*_______APP UTILITY FUNCTIONS END______*/      
};
if ((typeof jQuery === 'undefined') || (parseFloat(jQuery.fn.jquery) < 1.7)) {
  loadScript('//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js', function(){
    jQuery191 = jQuery.noConflict(true);
    myAppJavaScript(jQuery191);

  });
} else {
  myAppJavaScript(jQuery);
}
})();

