import svgpath from"https://cdn.jsdelivr.net/npm/svgpath@2.6.0/+esm";const htmlLang=document.documentElement.lang,ttsLang=getTTSLang(htmlLang);let correctCount=0;const audioContext=new AudioContext,audioBufferCache={};loadAudio("modified","/world-map-puzzle/mp3/decision50.mp3"),loadAudio("correct","/world-map-puzzle/mp3/correct3.mp3"),loadAudio("correctAll","/world-map-puzzle/mp3/correct1.mp3");let ttsVoices=[];loadVoices(),loadConfig();function loadConfig(){localStorage.getItem("darkMode")==1&&document.documentElement.setAttribute("data-bs-theme","dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),document.documentElement.setAttribute("data-bs-theme","light")):(localStorage.setItem("darkMode",1),document.documentElement.setAttribute("data-bs-theme","dark"))}async function playAudio(e,t){const s=await loadAudio(e,audioBufferCache[e]),n=audioContext.createBufferSource();if(n.buffer=s,t){const e=audioContext.createGain();e.gain.value=t,e.connect(audioContext.destination),n.connect(e),n.start()}else n.connect(audioContext.destination),n.start()}async function loadAudio(e,t){if(audioBufferCache[e])return audioBufferCache[e];const s=await fetch(t),o=await s.arrayBuffer(),n=await audioContext.decodeAudioData(o);return audioBufferCache[e]=n,n}function unlockAudio(){audioContext.resume()}function loadVoices(){const e=new Promise(e=>{let t=speechSynthesis.getVoices();if(t.length!==0)e(t);else{let n=!1;speechSynthesis.addEventListener("voiceschanged",()=>{n=!0,t=speechSynthesis.getVoices(),e(t)}),setTimeout(()=>{n||document.getElementById("noTTS").classList.remove("d-none")},1e3)}});e.then(e=>{ttsVoices=e.filter(e=>e.lang==ttsLang)})}function speak(e){speechSynthesis.cancel();const t=new SpeechSynthesisUtterance(e);return t.voice=ttsVoices[Math.floor(Math.random()*ttsVoices.length)],t.lang=ttsLang,speechSynthesis.speak(t),t}function getRandomInt(e,t){return e=Math.ceil(e),t=Math.floor(t),Math.floor(Math.random()*(t-e))+e}function getCountryId(e){const t=e.id.toUpperCase();return t.endsWith("-")?t.slice(0,-1):t}function movePathPoints(e,t,n){e=e.cloneNode(!0);const s=svgpath(e.getAttribute("d"));return s.translate(-t,-n),e.setAttribute("d",s.toString()),e}function movePolygonPoints(e,t,n){e=e.cloneNode(!0);const s=e.getAttribute("points").split(" ").map(Number),o=s.map((e,s)=>s%2==0?e-n:e-t);return e.setAttribute("points",o.join(" ")),e}function moveGroupPoints(e,t,n){return e=e.cloneNode(!0),e.querySelectorAll("path, polygon").forEach(e=>{switch(e.tagName){case"path":e.replaceWith(movePathPoints(e,t,n));break;case"polygon":e.replaceWith(movePolygonPoints(e,t,n));break}}),e}function movePoints(e,t,n){switch(e.tagName){case"path":return movePathPoints(e,t,n);case"polygon":return movePolygonPoints(e,t,n);case"g":return moveGroupPoints(e,t,n);default:throw new Error("not supported")}}function getPieceSvg(e,t){const i="http://www.w3.org/2000/svg",n=document.createElementNS(i,"svg"),a=e.getBBox(),{x:r,y:c,width:s,height:o}=a;n.setAttribute("width",s*t),n.setAttribute("height",o*t),n.setAttribute("viewBox",`0 0 ${s} ${o}`),n.setAttribute("fill","black"),n.setAttribute("opacity","0.8");const l=movePoints(e,r,c);return n.appendChild(l),n}function checkSpinnedPosition(e,t,n){let o=Math.abs(n.angle+t.angle);if(o>180&&(o=360-o),o>angleThreshold)return!1;const i=t.getCenterPoint(),s=e.getBoundingClientRect(),r=s.left+s.width/2,c=s.top+s.height/2,a=n.width/s.width,l=a*n.scaleX*t.scaleX,d=a*n.scaleY*t.scaleY;return!(Math.abs(i.x-r)>positionThreshold)&&!(Math.abs(i.y-c)>positionThreshold)&&!(Math.abs(l-1)>scaleThreshold)&&!(Math.abs(d-1)>scaleThreshold)}function checkPosition(e,t){const n=e.getBoundingClientRect(),s=t.width*t.scaleX,o=t.height*t.scaleY,i=t.left-s/2,a=t.top-o/2;return!(Math.abs(i-n.x)>positionThreshold)&&!(Math.abs(a-n.y)>positionThreshold)&&!(Math.abs(s-n.width)>positionThreshold)&&!(Math.abs(o-n.height)>positionThreshold)}function addCountryText(e){clearTimeout(countryTimer),canvas.remove(countryText);const t=canvas.getZoom(),n=canvas.width/countryTextLength;countryText=new fabric.Text(e,{fontSize:n,fontFamily:"serif",left:(canvas.width/2-dx1)/t,top:(canvas.height/2-dy1)/t,originX:"center",originY:"center",selectable:!1,fill:"blue"}),canvas.add(countryText),canvas.sendToBack(countryText),countryTimer=setTimeout(()=>{canvas.remove(countryText)},2e3)}function setMovableOption(e,t){switch(t){case 0:case 1:case 2:e.setControlsVisibility({bl:!1,br:!1,ml:!1,mt:!1,mr:!1,mb:!1,tl:!1,tr:!1,mtr:!1}),e.hasBorders=!1;break;case 3:case 4:case 5:{const t=e.left+e.width/2,n=e.top+e.height/2;e.set({originX:"center",originY:"center",left:t,top:n,angle:Math.random()*360,selectable:!1});break}case 6:case 7:case 8:{e.setControlsVisibility({mtr:!1});const t=(.5+Math.random())*canvas.width/20,n=(.5+Math.random())*canvas.height/20;e.set({scaleX:t/e.width,scaleY:n/e.height});break}case 9:case 10:case 11:{const t=(.5+Math.random())*canvas.width/20,n=(.5+Math.random())*canvas.height/20;e.set({scaleX:t/e.width,scaleY:n/e.height});const s=e.left+e.width/2,o=e.top+e.height/2;e.set({originX:"center",originY:"center",left:s,top:o,angle:Math.random()*360,selectable:!1});break}}}function addControlRect(e,t){e.setCoords();const o=e.getBoundingRect(),n=Math.max(o.width,o.height),i=new fabric.Rect({originX:"center",originY:"center",left:e.left,top:e.top,width:n,height:n,opacity:0,selectable:!1});canvas.add(i);const s=new fabric.Group([i,e],{originX:"center",originY:"center",width:n,height:n,opacity:e.opacity,transparentCorners:!1,cornerStyle:"circle"});return t<9&&s.setControlsVisibility({bl:!1,br:!1,ml:!1,mt:!1,mr:!1,mb:!1,tl:!1,tr:!1}),canvas.add(s),s}function addScoreText(){const e=((Date.now()-startTime)*1e3/1e6).toFixed(3),t=`${e} sec!`,n=canvas.width/8;scoreText=new fabric.Text(t,{fontSize:n,left:canvas.width/2,top:canvas.height/2,originX:"center",originY:"center",selectable:!1,fill:"blue"}),setTimeout(()=>{canvas.add(scoreText),canvas.sendToBack(scoreText)},2e3)}function setCorrectPiece(e){e.style.fill="violet",correctCount+=1,correctCount==problemNum?(playAudio("correctAll"),addScoreText()):playAudio("correct",.3);const n=getCountryId(e),t=countryInfos.get(n).name;addCountryText(t),speak(t)}function adjustElementPosition(e){const s=e.width*e.scaleX,o=e.height*e.scaleY,t=s/2,n=o/2;if(e.left<t)e.set({left:t});else if(canvas.width<e.left+t){const n=canvas.width-t;e.set({left:n})}if(e.top<n)e.set({top:n});else if(canvas.height<e.top+n){const t=canvas.height-n;e.set({top:t})}e.setCoords()}function setPieceGuideEvent(e,t){let n=0;t.on("mousedown",t=>{const s=document.getElementById("pieceGuide");s&&s.remove();const o=Date.now();if(o-n<200){const n=t.e,s=n instanceof TouchEvent?n.touches[0]:n,o=s.pageX,i=s.pageY-30,a=getCountryId(e),r=countryInfos.get(a).name,c=`
        <div id="pieceGuide" class="tooltip show" role="tooltip"
          style="position:absolute; inset:0px auto auto 0px; transform:translate(${o}px,${i}px);">
          <div class="tooltip-inner">${r}</div>
        </div>
      `;document.getElementById("guide").insertAdjacentHTML("beforeend",c)}n=o})}function setMovable(e,t,n){new fabric.loadSVGFromString(t.outerHTML,(t,s)=>{const o=fabric.util.groupSVGElements(t,s);if(o.set({left:getRandomInt(0,canvas.width/2),top:getRandomInt(0,canvas.height/2)}),o.set({left:o.left+o.width/2,top:o.top+o.height/2,originX:"center",originY:"center",transparentCorners:!1,cornerStyle:"circle"}),setMovableOption(o,n),canvas.add(o),o.selectable)setPieceGuideEvent(e,o),o.on("modified",()=>{playAudio("modified"),checkPosition(e,o)?(canvas.remove(o),setCorrectPiece(e)):adjustElementPosition(o)});else{const t=addControlRect(o,n);setPieceGuideEvent(e,o),t.on("modified",()=>{playAudio("modified"),o.set("angle",o.angle+t.angle),o.setCoords();const n=o.getBoundingRect(),s=Math.max(n.width,n.height);t.set({angle:0,width:s,height:s}),checkSpinnedPosition(e,t,o)?(t.getObjects().forEach(e=>{canvas.remove(e)}),canvas.remove(t),setCorrectPiece(e)):adjustElementPosition(t)})}})}function getSVGScale(e,t){const n=t.querySelector("svg"),s=n.getAttribute("viewBox").split(" ")[2],o=e.getBoundingClientRect();return o.width/Number(s)}function shuffleSVG(){canvas.clear();const n=document.getElementById("courseOption"),s=n.options[n.selectedIndex].value,o=document.getElementById("gradeOption").selectedIndex,t=map.contentDocument,i=getSVGScale(map,t);t.querySelectorAll(".not-piece").forEach(e=>{e.style.fill="#e0e0e0"});const e=[...t.querySelectorAll(".piece")].filter(e=>{if(s=="ALL")return!0;const t=getCountryId(e),n=countryInfos.get(t).area;if(s.includes(n))return!0;e.style.fill="#e0e0e0"});problemNum=e.length;for(const t of e){t.style.fill="black";const n=getPieceSvg(t,i);setMovable(t,n,o)}switch(o%3){case 0:e.forEach(e=>{e.style.fill="#fefee4",e.style.strokeWidth=1});break;case 1:e.forEach(e=>{e.style.fill="#fefee4",e.style.strokeWidth=0});break;case 2:e.forEach(e=>{e.style.fill="#fefee4",e.style.strokeWidth=0});break}}function startGame(){canvas||(canvas=initCanvas()),canvas.remove(scoreText),shuffleSVG(),correctCount=0,startTime=Date.now()}function calcLimitedPoint(e,t){const n=-canvas.width/2,s=-canvas.height/2,o=-n,i=-s;return e<=n&&(e=n),t<=s&&(t=s),o<=e&&(e=o),i<=t&&(t=i),[e,t]}function initCanvasMouseEvent(e){let t=!1,n=0,s=0;e.on("mouse:wheel",n=>{const s=n.e;if(!t){const t=s.deltaY,n=e.getZoom();zoom=n*.999**t,zoom>maxScale&&(zoom=maxScale),zoom<minScale&&(zoom=minScale);const o=new fabric.Point(e.width/2,e.height/2);e.zoomToPoint(o,zoom),dx1=e.viewportTransform[4],dy1=e.viewportTransform[5],map.style.transform=`scale(${zoom}) translate(${dx2}px,${dy2}px)`,document.getElementById("guide").replaceChildren()}s.preventDefault(),s.stopPropagation()}),e.on("mouse:up",o=>{if(!t)return;t=!1;const i=o.e,a=dx2+(i.clientX-n)/zoom,r=dy2+(i.clientY-s)/zoom;[dx2,dy2]=calcLimitedPoint(a,r),dx1=e.viewportTransform[4],dy1=e.viewportTransform[5]}),e.on("mouse:down",e=>{if(!e.target){t=!0;const o=e.e;n=o.clientX,s=o.clientY}}),e.on("mouse:move",o=>{if(!t)return;const i=o.e,a=i.clientX-n,r=i.clientY-s,c=a/zoom+dx2,l=r/zoom+dy2,[d,u]=calcLimitedPoint(c,l);map.style.transform=`scale(${zoom}) translate(${d}px,${u}px)`;const h=a+dx1+(d-c)*zoom,m=r+dy1+(u-l)*zoom,f=new fabric.Point(-h,-m);e.absolutePan(f),document.getElementById("guide").replaceChildren()})}function initCanvasTouchEvent(e){let o=!1,i=!1,n=0,s=0,t,a=zoom;e.wrapperEl.addEventListener("touchstart",a=>{switch(a.touches.length){case 1:{const i=a.touches[0],r=e.findTarget(i);r||(o=!0,n=i.clientX,s=i.clientY,t=i.identifier);break}case 2:{if(i=!0,t){{const o=a.touches;for(let i=0;i<o.length;i++){const a=o[i];if(t==a.identifier){const t=dx2+(a.clientX-n)/zoom,o=dy2+(a.clientY-s)/zoom;[dx2,dy2]=calcLimitedPoint(t,o),dx1=e.viewportTransform[4],dy1=e.viewportTransform[5];break}}}}else{o=!0;const e=a.touches[0];n=e.clientX,s=e.clientY,t=e.identifier}break}}}),e.wrapperEl.addEventListener("touchend",r=>{if(!o)return;if(r.touches.length==0){if(o=!1,!i){const o=r.changedTouches;for(let i=0;i<o.length;i++){const a=o[i];if(t==a.identifier){const t=dx2+(a.clientX-n)/zoom,o=dy2+(a.clientY-s)/zoom;[dx2,dy2]=calcLimitedPoint(t,o),dx1=e.viewportTransform[4],dy1=e.viewportTransform[5];break}}}t=null}else{const e=r.changedTouches;for(let o=0;o<e.length;o++){const a=e[o];if(t==a.identifier){const e=r.touches[0];n=e.clientX,s=e.clientY,t=e.identifier;break}const i=r.touches[0];n=i.clientX,s=i.clientY;break}}i=!1,a=zoom}),e.wrapperEl.addEventListener("touchmove",t=>{if(!o)return;switch(t.touches.length){case 1:{const o=t.touches[0],i=o.clientX-n,a=o.clientY-s,r=i/zoom+dx2,c=a/zoom+dy2,[l,d]=calcLimitedPoint(r,c);map.style.transform=`scale(${zoom}) translate(${l}px,${d}px)`;const u=i+dx1+(l-r)*zoom,h=a+dy1+(d-c)*zoom,m=new fabric.Point(-u,-h);e.absolutePan(m),document.getElementById("guide").replaceChildren();break}case 2:{if(zoom=a*t.scale,zoom>maxScale&&(zoom=maxScale),zoom<minScale&&(zoom=minScale),zoom==1){const t=new fabric.Point(0,0);e.absolutePan(t),e.setZoom(1),dx2=dy2=0}else{const t=new fabric.Point(e.width/2,e.height/2);e.zoomToPoint(t,zoom)}dx1=e.viewportTransform[4],dy1=e.viewportTransform[5],map.style.transform=`scale(${zoom}) translate(${dx2}px,${dy2}px)`,document.getElementById("guide").replaceChildren();break}default:break}})}function setMapGuideMouseEvent(e){let t=0;e.on("mouse:down",n=>{const s=Date.now();if(s-t<200){const t=e.getPointer(n),s=findPieceNodes(t.x,t.y);s.forEach(e=>setMapGuideTooltip(n.e,e))}t=s})}function setMapGuideTouchEvent(e){let t=0;e.wrapperEl.addEventListener("touchstart",n=>{const s=Date.now();if(s-t<200){const t=e.getPointer(n),s=findPieceNodes(t.x,t.y),o=n.changedTouches[0];s.forEach(e=>setMapGuideTooltip(o,e))}t=s})}function findPieceNodes(e,t){const n=map.contentDocument.elementsFromPoint(e,t),s=n.map(e=>{if(e.tagName=="svg")return!1;if(e.classList.contains("piece"))return e;const t=e.parentNode;return!!t.classList.contains("piece")&&t}).filter(e=>e);return s}function setMapGuideTooltip(e,t){const o=e.pageX,i=e.pageY-30,a=getCountryId(t),r=countryInfos.get(a).name,c=`
    <div class="tooltip show" role="tooltip"
      style="position:absolute; inset:0px auto auto 0px; transform:translate(${o}px,${i}px);">
      <div class="tooltip-inner">${r}</div>
    </div>
  `,n=document.getElementById("guide");n.insertAdjacentHTML("beforeend",c);const s=n.lastElementChild;s.onclick=()=>{s.remove()}}function initCanvas(){const t=map.getBoundingClientRect(),e=new fabric.Canvas("canvas",{left:t.left,top:t.top,width:t.width,height:t.height});return fabric.isTouchSupported?(initCanvasTouchEvent(e),setMapGuideTouchEvent(e)):(initCanvasMouseEvent(e),setMapGuideMouseEvent(e)),e.selection=!1,document.getElementById("canvas").parentNode.style.position="absolute",e}function resizePieces(){const t=map.offsetWidth,e=t/canvas.width;if(e!=1){canvas.setDimensions({width:t,height:map.offsetHeight}),canvas.getObjects().forEach(t=>{t.left*=e,t.top*=e,t.scaleX*=e,t.scaleY*=e,t.setCoords()});const n=new fabric.Point(-dx1*e,-dy1*e);canvas.absolutePan(n),dx1=canvas.viewportTransform[4],dy1=canvas.viewportTransform[5],dx2*=e,dy2*=e,map.style.transform=`scale(${zoom}) translate(${dx2}px,${dy2}px)`}}function calcCountryTextLength(e,t){const s=Array.from(t.values()),o=s.map(e=>e.name),n=Math.max(...o.map(e=>e.length));switch(e){case"ja":return n;case"en":return Math.ceil(n/1.5)}}function changeLang(){const e=document.getElementById("lang"),t=e.options[e.selectedIndex].value;location.href=`/world-map-puzzle/${t}/`}function getTTSLang(e){switch(e){case"en":return"en-US";case"ja":return"ja-JP"}}async function initCountriesInfo(e){const t=await fetch(`/world-map-puzzle/data/${e}.csv`),n=await t.text();n.trimEnd().split(`
`).forEach(e=>{const[o,n,t,s]=e.split(",");if(!t.startsWith("#")){const e={name:t,area:s};countryInfos.set(n,e)}}),countryTextLength=calcCountryTextLength(e,countryInfos)}const map=document.getElementById("map"),positionThreshold=20,scaleThreshold=.3,angleThreshold=20,maxScale=20,minScale=1,countryInfos=new Map;let problemNum,canvas,countryText,countryTextLength,countryTimer,startTime,scoreText,zoom=1,dx1=0,dy1=0,dx2=0,dy2=0;initCountriesInfo(htmlLang),document.getElementById("startButton").onclick=startGame,document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("lang").onchange=changeLang,document.addEventListener("click",unlockAudio,{once:!0,useCapture:!0}),globalThis.addEventListener("resize",()=>{if(!canvas)return;resizePieces(),countryText&&countryText.set({left:canvas.width/2,top:canvas.height/2}),scoreText&&scoreText.set({left:canvas.width/2,top:canvas.height/2})})