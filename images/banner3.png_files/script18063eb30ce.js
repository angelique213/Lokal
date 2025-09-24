(function () {
        const a = [];const b = [];const c = {"cssIdToAttachPdfList":"","pdfListOptions":{"listPixelHeight":370,"boxRadius":8,"boxBorderWidth":0.1,"everyOtherBgColor":{"saturation":0.91,"brightness":0.56,"alpha":1,"hue":36},"nameBold":400,"borderColor":{"alpha":1,"brightness":0,"saturation":0.99,"hue":100},"nameTextDeco":["none"],"nameFontColor":{"saturation":0.99,"hue":100,"brightness":0,"alpha":1},"listStyleArr":["listThumbDesc"],"borderRadius":8,"listContentJustify":["flex-start"]},"classToAttachPdfList":"product-single__description","loadScriptTagsOnWebpage":true};const d = /(variant=)(.*$)/i;const e = "smkulturaph";const rege3 = /(.*\.com)(.*)/; 
  
        return (async function dyna() {
          var loadScript = function (url, callback) {
            var myScript = document.createElement("script");
            myScript.type = "text/javascript";
  
            if (myScript.readyState) {
              script.onreadystatechange = function () {
                if (
                  myScript.readyState == "loaded" ||
                  myScript.readyState == "complete"
                ) {
                  myScript.onreadystatechange = null;
                  callback();
                }
                myScript;
              };
              // For any other browser.
            } else {
              myScript.onload = function () {
                callback();
              };
            }
            myScript.src = url;
  
            document.getElementsByTagName("head")[0].appendChild(myScript);
            // document.body.appendChild(myScript);
            // myScript.addEventListener("load", callback, false);
          };
  
          loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0/jquery.min.js",
            () => {
              // jQuery191 = jQuery.noConflict(true);
              var $j = jQuery.noConflict();
              myAppJavaScript($j, a, b, c, d);
            }
          );
  
          const myAppJavaScript = ($, a, b, c, d) => {
            if (a === "empty") {
              console.log("NO Pdfs");
              return;
            }
            if (b === "empty") {
              b = [];
            }
            var css =
            "#pdf-main-container{width:100%;margin:2px auto}#pdf-contents{display:none}#pdf-meta{overflow:hidden;margin:0 0 20px 0}#pdf-canvas{border:1px;border-style:solid;box-sizing:border-box}.spinner{margin:100px auto 0;width:70px;text-align:center}.spinner>div{width:18px;height:18px;background-color:#333;border-radius:100%;display:inline-block;-webkit-animation:sk-bouncedelay 1.4s infinite ease-in-out both;animation:sk-bouncedelay 1.4s infinite ease-in-out both}.spinner .bounce1{-webkit-animation-delay:-.32s;animation-delay:-.32s}.spinner .bounce2{-webkit-animation-delay:-.16s;animation-delay:-.16s}@-webkit-keyframes sk-bouncedelay{0%,100%,80%{-webkit-transform:scale(0)}40%{-webkit-transform:scale(1)}}@keyframes sk-bouncedelay{0%,100%,80%{-webkit-transform:scale(0);transform:scale(0)}40%{-webkit-transform:scale(1);transform:scale(1)}}";

          var pdfModalCss =
            ".open-pdfModal{cursor:pointer;font-weight:700;color:rgb(255, 255, 255);padding-left:.75rem;padding-right:.75rem;border-radius:5px}.pdfModal{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:1rem;background: rgba(0, 0, 0, 0.6);cursor:pointer;visibility:hidden;opacity:0;transition:all .35s ease-in}.pdfModal.is-visible{visibility:visible;opacity:1;z-index: 99999}.pdfModal-dialog{position:relative;width:90vw;max-width:1900px;display:block; margin: auto; max-height:100vh;border-radius:5px;background:rgb(255, 255, 255);overflow:auto;cursor:default}.pdfModal-dialog>*{padding:0.5rem}.pdfModal-footer,.pdfModal-header{background:rgb(245, 245, 245)}.pdfModal-header{display:flex;align-items:center;justify-content:space-between}.pdfModal-header .close-pdfModal{font-size:1rem}.pdfModal p+p{margin-top:1rem}";
  
            var style = document.createElement("style");
            style.type = "text/css";
            document.getElementsByTagName("head")[0].appendChild(style);
            if (style.styleSheet) {
              // This is required for IE8 and below.
              style.styleSheet.cssText = css;
            } else {
              style.appendChild(document.createTextNode(css));
            }
  
            var style2 = document.createElement("style");
            style2.type = "text/css";
            document.getElementsByTagName("head")[0].appendChild(style2);
            if (style2.styleSheet) {
              // This is required for IE8 and below.
              style2.styleSheet.cssText = pdfModalCss;
            } else {
              style2.appendChild(document.createTextNode(pdfModalCss));
            }
  
            const removePdfListWrapperFromDom = () => {
              // remove old pdfContainerWrapper should there be any
              let obj = document.getElementsByClassName("pdfContainerWrapper");
              let i = obj.length;
              while (i--) {
                obj[i].remove();
              }
            };
  
            const removeModalWrapperFromDom = () => {
              let obj1 = document.getElementsByClassName(
                "pdfModalContainerWrapper"
              );
              let y = obj1.length;
              while (y--) {
                obj1[y].remove();
              }
            };
  
            var __ALL_PDFS = [];
            let __CUR_PDF_URL = "";
            // find
            function findAndReplace(searchText, replacement, searchNode) {
              // console.log("inside find and replace=>",searchText)
              if (!searchText || typeof replacement === "undefined") {
                // Throw error here if you want...
                return;
              }
              var regex =
                  typeof searchText === "string"
                    ? new RegExp(searchText, "g")
                    : searchText,
                pdfOpen = new RegExp(/#o#|#O#/),
                childNodes = (searchNode || document.body).childNodes,
                cnLength = childNodes.length,
                excludes = "html,head,style,title,link,meta,script,object,iframe";
              while (cnLength--) {
                var currentNode = childNodes[cnLength];
                if (
                  currentNode.nodeType === 1 &&
                  (excludes + ",").indexOf(
                    currentNode.nodeName.toLowerCase() + ","
                  ) === -1
                ) {
                  findAndReplace(searchText, replacement, currentNode);
                }
                if (currentNode.nodeType !== 3 || !regex.test(currentNode.data)) {
                  continue;
                }
                let html;
                let rep;
                var parent = currentNode.parentNode,
                  frag = (function () {
                    //if name is surrounded ending with o# we want to embed the iframe in the page
                    if (pdfOpen.test(currentNode.data)) {
                      html =
                        '<iframe style="width:90vw;height:90vh;width:100%;max-height:1000px;object-fit:fill;" id="pdfIframe" title="Inline Frame Example" src="https://pdf-uploader-v2.appspot.com.storage.googleapis.com/web/viewer.html?file=' + replacement.pdfUrl + '"></iframe>'
                    } else {
                      // otherwise we want to make the name a clickable link and display the pdf in our existing iframe modal
                      rep = text => {
                        console.log("found=>", text)
                        console.log("replacement.pdfUrl=>", replacement.pdfUrl)
                        text = text.replaceAll(/(^#)|(#$)/g, "");
                        return (
                          "<a data-open-inline=pdfModal data-position=1 data-url=" +
                          replacement.pdfUrl +
                          ' ><span style="text-decoration: underline;font-weight: bold;cursor:pointer">' +
                          text +
                          "</span></a>"
                        );
                      };
                      html = currentNode.data.replace(regex, rep);
                    }
                    (wrap = document.createElement("div")),
                      (frag = document.createDocumentFragment());
                    wrap.innerHTML = html;
                    while (wrap.firstChild) {
                      frag.appendChild(wrap.firstChild);
                    }
                    return frag;
                  })();
                parent.insertBefore(frag, currentNode);
                parent.removeChild(currentNode);
                parent.parntNode;
              }
            }

            function findAndReplacePdfId(searchText, replacement, searchNode) {
              // console.log("inside find and replace=>",searchText)
              if (!searchText || typeof replacement === "undefined") {
                // Throw error here if you want...
                return;
              }
              var regex =
                  typeof searchText === "string"
                    ? new RegExp(searchText, "g")
                    : searchText,
                pdfOpen = new RegExp(/E.{25}E/),
                oldOpen = new RegExp(/#o#|#O#/),
                oldInline = new RegExp(/#.{25}#/),
                childNodes = (searchNode || document.body).childNodes,
                cnLength = childNodes.length,
                excludes = "html,head,style,title,link,meta,script,object,iframe";
              while (cnLength--) {
                var currentNode = childNodes[cnLength];
                if (
                  currentNode.nodeType === 1 &&
                  (excludes + ",").indexOf(
                    currentNode.nodeName.toLowerCase() + ","
                  ) === -1
                ) {
                  findAndReplacePdfId(searchText, replacement, currentNode);
                }
                if (currentNode.nodeType !== 3 || !regex.test(currentNode.data)) {
                  continue;
                }
                // console.log("should see somehting=>",currentNode)
                let html;
                let rep;
                var parent = currentNode.parentNode,
                  frag = (function () {
                    console.log("currentNode.data=>",currentNode.data)
                    //if name is surrounded ending with o# we want to embed the iframe in the page
                    if (oldOpen.test(currentNode.data)) {
                      html =
                        '<iframe style="width:90vw;height:90vh;width:100%;max-height:1000px;object-fit: fill;" id="pdfIframe" title="Inline Frame Example" src="https://pdf-uploader-v2.appspot.com.storage.googleapis.com/web/viewer.html?file=' + replacement.pdfUrl + '"></iframe>'
                    } else if (pdfOpen.test(currentNode.data)) {
                      html =
                        '<iframe style="width:90vw;height:90vh;width:100%;max-height:1000px;object-fit: fill;" id="pdfIframe" title="Inline Frame Example" src="https://pdf-uploader-v2.appspot.com.storage.googleapis.com/web/viewer.html?file=' + replacement.pdfUrl + '"></iframe>'
                    } else if (oldInline.test(currentNode.data)) {

                      console.log("oldInline=>",currentNode.data)
                      currentNode.data = currentNode.data.replaceAll("#","")
                      // otherwise we want to make the name a clickable link and display the pdf in our existing iframe modal
                      rep = text => {
                        console.log("found Id=>", text)
                        text = replacement.name;
                        console.log("named it to=>", text)
                        return (
                          "<a data-open-inline=pdfModal data-position=1 data-url=" +
                          replacement.pdfUrl +
                          ' ><span style="font-weight: bold;cursor:pointer">' +
                          text +
                          "</span></a>"
                        );
                      };
                      html = currentNode.data.replace(regex, rep);
                    } else {
                      // otherwise we want to make the name a clickable link and display the pdf in our existing iframe modal
                      rep = text => {
                        console.log("found Id=>", text)
                        text = replacement.name;
                        console.log("named it to=>", text)
                        return (
                          "<a data-open-inline=pdfModal data-position=1 data-url=" +
                          replacement.pdfUrl +
                          ' ><span style="font-weight: bold;cursor:pointer">' +
                          text +
                          "</span></a>"
                        );
                      };
                      html = currentNode.data.replace(regex, rep);
                    }
                    (wrap = document.createElement("div")),
                      (frag = document.createDocumentFragment());
                    wrap.innerHTML = html;
                    while (wrap.firstChild) {
                      frag.appendChild(wrap.firstChild);
                    }
                    return frag;
                  })();
                parent.insertBefore(frag, currentNode);
                parent.removeChild(currentNode);
                parent.parntNode;
              }
            }
  
            const searchDomForPdfNameOccurrences = () => {
              //we search the whole dome if there are Occurrences of any pdf names
              a.map(pdf => {
                
                //We pass in the PDF name and the PDF itself
                if(pdf.name.length > 100){
                  console.log("Inline PDF display might not work, PDF name to long",pdf.name.length, pdf.name )
                  return
                }
                findAndReplace("#" + pdf.name + "#", pdf);
                findAndReplacePdfId(pdf.id, pdf);

              });
  
              //add selectors to make the found occurances clickable
              const openEls = document.querySelectorAll("[data-open-inline]");
              const closeEls = document.querySelectorAll("[data-close]");
              const isVisible = "is-visible";
  
              for (const el of openEls) {
                el.addEventListener("click", function (e) {
                  const pdfModalId = this.dataset.openInline;
                  // console.log("pdfModalId", pdfModalId);
                  // console.log("position", __ALL_PDFS[this.dataset.position].pdfUrl);
                  showPDF(this.dataset.url);
                  document.getElementById(pdfModalId).classList.add(isVisible);
                });
              }
              for (const el of closeEls) {
                el.addEventListener("click", function () {
                  // $("#pdf-contents").hide();
                  // $("#pdf-canvas").hide();
                  this.parentElement.parentElement.parentElement.classList.remove(
                    isVisible
                  );
                });
              }
  
              document.addEventListener("click", e => {
                // console.log("clicked pdfModal.is-visible")
                // $("#pdf-contents").hide();
                // $("#pdf-canvas").hide();
                if (e.target == document.querySelector(".pdfModal.is-visible")) {
                  document
                    .querySelector(".pdfModal.is-visible")
                    .classList.remove(isVisible);
                }
              });
  
              document.addEventListener("keyup", e => {
                // if we press the ESC
                if (
                  e.key == "Escape" &&
                  document.querySelector(".pdfModal.is-visible")
                ) {
                  document
                    .querySelector(".pdfModal.is-visible")
                    .classList.remove(isVisible);
                }
              });
            };
  
            //adds I frame with PDF to canvas in modal make modal visable
            async function showPDF(pdf_url) {
              try {
                console.log("pdf_url IN=>",pdf_url)
                let pdfFurl ="https://pdf-uploader-v2.appspot.com.storage.googleapis.com/web/viewer.html?file=" + pdf_url;
                
                const found = rege3.exec(pdf_url);
                pdf_url = found[2]
                // console.log(found[1]);
  
                // console.log("pdf_url => ",pdfFurl)
                console.log("pdf_url=>",pdf_url)
                // console.log("__CUR_PDF_URL=>",__CUR_PDF_URL)
                if (pdf_url !== __CUR_PDF_URL) {
                  // remove all old iframes
                  let objF = document.getElementsByClassName("pdfIframe");
                  let i = objF.length;
                  while (i--) {
                    objF[i].remove();
                  }
                  let olCan = document.getElementById("pdf-canvas");
                  var iframePDF = document.createElement("iframe");
                  // iframe.style.display = "none";
                  iframePDF.src = "https://pdf-uploader-v2.appspot.com.storage.googleapis.com/web/viewer.html?file=" + pdf_url;
                  iframePDF.classList.add("pdfIframe");
                  iframePDF.style.width = "100%";
                  iframePDF.style.maxWidth = "1900px";
                  iframePDF.style.display = "block";
                  iframePDF.style.margin = "auto";
                  iframePDF.style.objectFit =  "fill";
                  iframePDF.style.height = "calc(90vh - 85px)";
                  olCan.appendChild(iframePDF);
  
                  __CUR_PDF_URL = pdf_url;
                }
                $(".spinner").hide();
                $("#pdf-contents").show();
                $("#pdf-canvas").show();
              } catch (error) {
                console.log("ERROR", error);
              }
            }
  
            // create one invisible container for the pdfModal and attach it to the body, we will make it visable as needed.
            const createPdfModal = () => {
              var pdfModalContainerWrapper = document.createElement("div");
              pdfModalContainerWrapper.className = "pdfModalContainerWrapper";
  
              var pdfModal = document.createElement("div");
                pdfModal.innerHTML =
                '<div class="pdfModal-dialog"> <header class="pdfModal-header"><button aria-label="close pdfModal" data-close>✕</button> </header> <section class="pdfModal-content"> <div id="pdf-main-container"><div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div><div id="pdf-contents"><div id="pdf-canvas" style="100%"></div> </div></div></section> <footer class="pdfModal-footer"><a style="text-decoration:none;font-size:xx-small;color: #cbcbcb;" target="_blank" href="https://apps.shopify.com/pdf-uploader">PDF Uploader</a></footer> </div>';
              pdfModal.className = "pdfModal";
              pdfModal.id = "pdfModal";
  
              //attach the pdfModals to the pdfModal div
              pdfModalContainerWrapper.appendChild(pdfModal);
  
              //attach the pdfModalContainerWrapper to the dom after the
              document.body.appendChild(pdfModalContainerWrapper);
            };
  
            //create list of available PDFs of current product and attach it to after the selected option into the Dom
            const addPdfList = data => {
              var collator = new Intl.Collator(undefined, {
                numeric: true,
                sensitivity: "base",
              });
  
              let sorted = data.sort(collator.compare);
              __ALL_PDFS = sorted;
              const len = data.length;
  
              // Crete PdfContainerWrapper to hold the list with available pdfs
              var pdfContainerWrapper = document.createElement("div");
              pdfContainerWrapper.innerHTML =
                '<div style="display: table;clear: both;"></div>';
              pdfContainerWrapper.className = "pdfContainerWrapper";
    
              // create container for pdf list with dynamic size
              var container = document.createElement("div");
              container.className = "pdfContainer";
              if(!!c.pdfListOptions){
                container.style =
                'max-height:'+ c.pdfListOptions?.listPixelHeight
                +'px;overflow:auto;margin:'+ (c.pdfListOptions?.listMarginX || "0") +'px '+ (c.pdfListOptions?.listMarginY || "0") +'px;border-style:solid;border-width:'+c.pdfListOptions?.boxBorderWidth +'px;border-color:hsla('+ c.pdfListOptions?.borderColor?.hue +', ' + Math.floor(
                  c.pdfListOptions?.borderColor?.saturation * 100
                ) +'%, ' + Math.floor(c.pdfListOptions?.borderColor?.brightness * 100) +'%,'+
                c.pdfListOptions?.borderColor?.alpha
                +'); border-radius:'+ c.pdfListOptions?.boxRadius+'px;display:block';
                var unorderdList = document.createElement('ul');
                unorderdList.style = 'margin:0px;padding:0px';
              } else {
                container.style =
                  "max-height:250px;overflow:scroll;margin:0px 0px;border-style:solid;border-width:1px;border-color:#969393";
    
                  var unorderdList = document.createElement("ul");
                  unorderdList.style =
                    "li:nth-child(odd){background: #e9e9e9;}; margin:0px;padding:0px";
              }
               
  
             
  
              //put container in PDFContainerWrapper
              pdfContainerWrapper.appendChild(container);
              container.appendChild(unorderdList);
              if(!!c.pdfListOptions){
                sorted.map((pdf, y)=> {
                  var elem = document.createElement("li");
                // console.log("test=>")
                if(c.pdfListOptions?.everyOtherBgColor){
                  if(y % 2 === 0){
                    elem.style = 'background:hsla('+ c.pdfListOptions?.everyOtherBgColor?.hue +', ' + Math.floor(
                      c.pdfListOptions?.everyOtherBgColor?.saturation * 100
                    ) +'%, ' + Math.floor(c.pdfListOptions?.everyOtherBgColor?.brightness * 100) +'%,'+
                    c.pdfListOptions?.everyOtherBgColor?.alpha
                    +');list-style: none; border-bottom: 0px,solid rgb(192,192,192); margin-bottom: 2px; display: flex; justify-content:'+ c.pdfListOptions?.listContentJustify+';min-height:40px;padding:0px; border-radius:'+ (c.pdfListOptions?.listItemRadius || "0") +'px'
                    // elem.innerHTML= '<div>hello'+ y +'</div>'
                  } else {
                    elem.style ='list-style: none; border-bottom: 0px,solid rgb(192,192,192); margin-bottom: 2px; display: flex; justify-content:'+ c.pdfListOptions?.listContentJustify+';min-height:40px;padding:0px; border-radius:'+ (c.pdfListOptions?.listItemRadius || "0") +'px'
                  }
                }
                  if(c.pdfListOptions?.oddListItemBackgroundColor){
                  if(y % 2 === 0){
                    elem.style = 'background:hsla('+ c.pdfListOptions?.oddListItemBackgroundColor?.hue +', ' + Math.floor(
                      c.pdfListOptions?.oddListItemBackgroundColor?.saturation * 100
                    ) +'%, ' + Math.floor(c.pdfListOptions?.oddListItemBackgroundColor?.brightness * 100) +'%,'+
                    c.pdfListOptions?.oddListItemBackgroundColor?.alpha
                    +');list-style: none; border-bottom: 0px,solid rgb(192,192,192); margin-bottom: 2px; display: flex; justify-content:'+ c.pdfListOptions?.listContentJustify+';min-height:40px;padding:0px; border-radius:'+ (c.pdfListOptions?.listItemRadius || "0") +'px'
                    // elem.innerHTML= '<div>hello'+ y +'</div>'
                  } else {
                    elem.style = 'background:hsla('+ c.pdfListOptions?.evenListItemBackgroundColor?.hue +', ' + Math.floor(
                      c.pdfListOptions?.evenListItemBackgroundColor?.saturation * 100
                    ) +'%, ' + Math.floor(c.pdfListOptions?.evenListItemBackgroundColor?.brightness * 100) +'%,'+
                    c.pdfListOptions?.evenListItemBackgroundColor?.alpha
                    +');list-style: none; border-bottom: 0px,solid rgb(192,192,192); margin-bottom: 2px; display: flex; justify-content:'+ c.pdfListOptions?.listContentJustify+';min-height:40px;padding:0px; border-radius:'+ (c.pdfListOptions?.listItemRadius || "0") +'px'
                  }
                }
                
               
                  if(c.pdfListOptions?.listStyleArr && c.pdfListOptions?.listStyleArr[0]==="listThumbDesc"){
                    elem.innerHTML= '<a class=open-pdfModal style="border:none" id=upload-button' + y + 'type=button data-open=pdfModal data-position=' + y +
                    '><div style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center;"><div style="margin:4px"><img src=' +
                    pdf.imagesUrls[0] +
                    '  style="display:block;height:'+(c.pdfListOptions?.thumbSize || "60" )+'px;width:'+( c.pdfListOptions.thumbSize * 0.77 || "46px")+'px;margin:0px"></div><div style="margin: 2px; flex-grow: 1"><p style="margin:2px; font-size: '+ (c.pdfListOptions?.nameFontSize || "19") +'px; color:hsla('+ c.pdfListOptions?.nameFontColor?.hue +', ' + Math.floor(
                    c.pdfListOptions?.nameFontColor?.saturation * 100
                  ) +'%, ' + Math.floor(c.pdfListOptions?.nameFontColor?.brightness * 100) +'%,'+
                  c.pdfListOptions?.nameFontColor?.alpha
                  +');font-weight:'+ c.pdfListOptions?.nameBold +'; text-decoration:'+ c.pdfListOptions?.nameTextDeco +'">' + pdf.name + '</p><p style="margin: 2px">'+ pdf.description +'</p> </div></div></a>'
                  }
                  if(c.pdfListOptions?.listStyleArr && c.pdfListOptions?.listStyleArr[0]==="listTumb"){
                    elem.innerHTML= '<a class=open-pdfModal style="border:none" id=upload-button' + y + 'type=button data-open=pdfModal data-position=' + y +
                    '><div style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center;"><div style="margin:4px"><img src=' +
                    pdf.imagesUrls[0] +
                    '  style="display:block;height:'+(c.pdfListOptions?.thumbSize || "60" )+'px;width:'+( c.pdfListOptions.thumbSize * 0.77|| "46")+'px;margin:0px"></div><div style="margin: 2px; flex-grow: 1"><p style="margin:2px; font-size:'+ (c.pdfListOptions?.nameFontSize || "19") +'px; color:hsla('+ c.pdfListOptions?.nameFontColor?.hue +', ' + Math.floor(
                    c.pdfListOptions?.nameFontColor?.saturation * 100
                  ) +'%, ' + Math.floor(c.pdfListOptions?.nameFontColor?.brightness * 100) +'%,'+
                  c.pdfListOptions?.nameFontColor?.alpha
                  +');font-weight:'+ c.pdfListOptions?.nameBold +'; text-decoration:'+ c.pdfListOptions?.nameTextDeco +'">' + pdf.name + '</p></div></div></a>'
                  }
                  if(c.pdfListOptions?.listStyleArr && c.pdfListOptions?.listStyleArr[0]==="list"){
                    elem.innerHTML= '<a class=open-pdfModal style="border:none" id=upload-button' + y + 'type=button data-open=pdfModal data-position=' + y +
                    '><div style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center;"><div style="margin: 2px; flex-grow: 1"><p style="margin:2px; font-size:'+ (c.pdfListOptions?.nameFontSize || "19") +'px; color:hsla('+ c.pdfListOptions?.nameFontColor?.hue +', ' + Math.floor(
                    c.pdfListOptions?.nameFontColor?.saturation * 100
                  ) +'%, ' + Math.floor(c.pdfListOptions?.nameFontColor?.brightness * 100) +'%,'+
                  c.pdfListOptions?.nameFontColor?.alpha
                  +');font-weight:'+ c.pdfListOptions?.nameBold +'; text-decoration:'+ c.pdfListOptions?.nameTextDeco +'">' + pdf.name + '</p></div></div></a>'
                  }
      
             
                unorderdList.appendChild(elem);
                })
                
              } else{
              sorted.map((pdf, y) => {
                var elem = document.createElement("li");
                // elem.className = "pdfClass";
                if (y % 2 === 0) {
                  elem.style =
                    "background:#d4d4d4; border-bottom: 1px;border-bottom-color: #c1c0c0;border-bottom-style: solid;margin-bottom: 2px; list-style: none";
                }
                elem.innerHTML =
                  '<div style="display: flex;flex-direction: row;justify-content:flex-start;align-items: center;"><a class=open-pdfModal id=upload-button' +
                  y +
                  "type=button data-open=pdfModal data-position=" +
                  y +
                  "><img src=" +
                  pdf.imagesUrls[0] +
                  '  style="margin:4px;height:60px;width:50px"></a><div style="margin:2px;flex-grow:1"><p style="margin:2px;font-size: 19px;">' +
                  pdf.name +
                  '</p><p style="margin:2px">' +
                  pdf.description +
                  "</p></div>";
                unorderdList.appendChild(elem);
              });
            }
              //attach the list to the dom after the anchor
              // $(pdfContainerWrapper).append(".shopify-payment-button");
              let cssClass = c.classToAttachPdfList;
              let cssId = c.cssIdToAttachPdfList;
              let cssClassNbr = 0;
              const codePasted = document.querySelector("#pdfUploader3x43");
  
              if (c.classNbrToAttachPdfList) {
                cssClassNbr = parseInt(c.classNbrToAttachPdfList, 10) - 1;
              }
              //find the from customer choosen element or pasted code snippet and attach PDF list after the element
              console.log("cssclass", c.classToAttachPdfList);
              console.log("cssId", c.cssIdToAttachPdfList);
              if (codePasted) {
                $(pdfContainerWrapper).insertAfter(codePasted);
              } else if (cssId.length > 0) {
                //$(pdfContainerWrapper).append("#" + cssId);
                $("#" + cssId).append(pdfContainerWrapper);
              } else if (cssClass.length > 0) {
                var body = document.getElementsByTagName("body")[0];
                body.appendChild(pdfContainerWrapper);
  
                var s = document.getElementsByClassName(cssClass)[cssClassNbr];
                var h = document.getElementsByClassName("pdfContainerWrapper")[0];
                s.insertAdjacentElement("beforeend", h);
                // $(pdfContainerWrapper).append("." + cssClass);
              } else {
                $("body").append(pdfContainerWrapper);
              }
  
              //add selectors for funtionality
              const openEls = document.querySelectorAll("[data-open]");
              const closeEls = document.querySelectorAll("[data-close]");
              const isVisible = "is-visible";
  
              for (const el of openEls) {
                el.addEventListener("click", function (e) {
                  const pdfModalId = this.dataset.open;
                  console.log("pdfModalId", pdfModalId);
                  console.log("position", __ALL_PDFS[this.dataset.position].pdfUrl);
                  showPDF(__ALL_PDFS[this.dataset.position].pdfUrl);
                  document.getElementById(pdfModalId).classList.add(isVisible);
                });
              }
  
              for (const el of closeEls) {
                el.addEventListener("click", function () {
                  // $("#pdf-contents").hide();
                  // $("#pdf-canvas").hide();
                  this.parentElement.parentElement.parentElement.classList.remove(
                    isVisible
                  );
                });
              }
  
              document.addEventListener("click", e => {
                // console.log("clicked pdfModal.is-visible")
                // $("#pdf-contents").hide();
                // $("#pdf-canvas").hide();
                if (e.target == document.querySelector(".pdfModal.is-visible")) {
                  document
                    .querySelector(".pdfModal.is-visible")
                    .classList.remove(isVisible);
                }
              });
  
              document.addEventListener("keyup", e => {
                // if we press the ESC
                if (
                  e.key == "Escape" &&
                  document.querySelector(".pdfModal.is-visible")
                ) {
                  document
                    .querySelector(".pdfModal.is-visible")
                    .classList.remove(isVisible);
                }
              });
            };
  
            const checkUrlAndAddPdfList = async () => {
              // const shop = "test-ab-wee.myshopify.com";
              const shop = window.Shopify.shop;
              let url = window.location.href;
              let urlString = "";
              // console.log("%curlSring", "color:green;font-size:14px", urlString);
              // console.log(url === urlString ? "SAME" : "NOT SAME");
  
              // check all PdfVaris if handle is included in url
              let variArr = [];
              let handle = "";
              let incl = b.map(va => {
                if (url.includes(va.handle)) {
                  variArr.push(va);
                  handle = va.handle;
                }
              });
  
              if (variArr.length === 0) {
                return;
              }
  
              removePdfListWrapperFromDom();
  
              //remove old pdfModalContainerWrapper schould there be any
              // removeModalWrapperFromDom();
  
              // createPdfModal();
  
              // script runs everytime the site cahnges. we only care about changes in the url
              if (urlString !== url) {
                if (url.includes("variant=")) {
                  let variantId = url.match(d)[2]; //regex new
                  console.log("variantId=>",variantId)
                  // go through all pdfVaris and look which ones have the varinatID
                  let arr1 = [];
                  let arr2 = [];
                  let isin = b.map(obj => {
                    if (obj.variId === variantId) {
                      arr1.push(obj);
                    }
                  });
                  if (arr1.length === 0) {
                    console.log("no Product Variant Id matches any pdfVaris id");
                    return;
                  } else {
                    a.map(obj => {
                      arr1.map(ob1 => {
                        if (obj.id === ob1.pdfId) {
                          arr2.push(obj);
                        }
                      });
                    });
                    console.log(
                      "hurray we found PDFs based on the product variant",
                      arr2
                    );
                    // console.log("Success:", data);
                    console.log("arr", arr1);
                    console.log("arr2", arr2);
                    addPdfList(arr2);
                  }
                } else {
                  let arr1 = [];
                  let arr2 = [];
                  let isin = b.map(obj => {
                    if (obj.handle === handle && obj.position <= 1) {
                      arr1.push(obj);
                    }
                  });
                  if (arr1.length === 0) {
                    console.log(
                      "no variant found based on handle and pos 1 or 0"
                    );
                    return;
                  } else {
                    a.map(obj => {
                      arr1.map(ob1 => {
                        if (obj.id === ob1.pdfId) {
                          arr2.push(obj);
                        }
                      });
                    });
                    console.log(
                      "hurray found pdfs based on handle and pos 0 or1 ",
                      arr2
                    );
                    // console.log("Success:", data);
                    // console.log("arr", arr1);
                    // console.log("arr2", arr2);
                    addPdfList(arr2);
                  }
                  urlString = window.location.href;
                }
              }
            };
  
            const MutationObserver =
              window.MutationObserver ||
              window.WebKitMutationObserver ||
              window.MozMutationObserver;
  
            let lastUrl = location.href;
            new MutationObserver(() => {
              const url = location.href;
              if (url !== lastUrl) {
                lastUrl = url;
                onUrlChange();
              }
            }).observe(document, { subtree: true, childList: true });
  
            function onUrlChange() {
              //alert("URL changed!", location.href);
              checkUrlAndAddPdfList();
              //debugger
            }
  
  
            $(document).ready(function () {
              createPdfModal();
              checkUrlAndAddPdfList();
              searchDomForPdfNameOccurrences();
              // $(document).change(function (event) {
              //   console.log("EVENT", event);
              //   checkUrlAndAddPdfList();
              // });
            });
          };
        })(a, b, c, d, e);
      })()