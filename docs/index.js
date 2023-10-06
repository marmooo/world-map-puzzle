import svgpath from"https://cdn.jsdelivr.net/npm/svgpath@2.6.0/+esm";const htmlLang=document.documentElement.lang,ttsLang=getTTSLang(htmlLang);let correctCount=0;const audioContext=new AudioContext,audioBufferCache={};loadAudio("modified","/world-map-puzzle/mp3/decision50.mp3"),loadAudio("correct","/world-map-puzzle/mp3/correct3.mp3"),loadAudio("correctAll","/world-map-puzzle/mp3/correct1.mp3");let ttsVoices=[];loadVoices(),loadConfig();function loadConfig(){localStorage.getItem("darkMode")==1&&document.documentElement.setAttribute("data-bs-theme","dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),document.documentElement.setAttribute("data-bs-theme","light")):(localStorage.setItem("darkMode",1),document.documentElement.setAttribute("data-bs-theme","dark"))}async function playAudio(b,c){const d=await loadAudio(b,audioBufferCache[b]),a=audioContext.createBufferSource();if(a.buffer=d,c){const b=audioContext.createGain();b.gain.value=c,b.connect(audioContext.destination),a.connect(b),a.start()}else a.connect(audioContext.destination),a.start()}async function loadAudio(a,c){if(audioBufferCache[a])return audioBufferCache[a];const d=await fetch(c),e=await d.arrayBuffer(),b=await audioContext.decodeAudioData(e);return audioBufferCache[a]=b,b}function unlockAudio(){audioContext.resume()}function loadVoices(){const a=new Promise(b=>{let a=speechSynthesis.getVoices();if(a.length!==0)b(a);else{let c=!1;speechSynthesis.addEventListener("voiceschanged",()=>{c=!0,a=speechSynthesis.getVoices(),b(a)}),setTimeout(()=>{c||document.getElementById("noTTS").classList.remove("d-none")},1e3)}});a.then(a=>{ttsVoices=a.filter(a=>a.lang==ttsLang)})}function speak(b){speechSynthesis.cancel();const a=new SpeechSynthesisUtterance(b);return a.voice=ttsVoices[Math.floor(Math.random()*ttsVoices.length)],a.lang=ttsLang,speechSynthesis.speak(a),a}function getRandomInt(a,b){return a=Math.ceil(a),b=Math.floor(b),Math.floor(Math.random()*(b-a))+a}function getCountryId(b){const a=b.id.toUpperCase();return a.endsWith("-")?a.slice(0,-1):a}function movePathPoints(a,c,d){a=a.cloneNode(!0);const b=svgpath(a.getAttribute("d"));return b.translate(-c,-d),a.setAttribute("d",b.toString()),a}function movePolygonPoints(a,b,c){a=a.cloneNode(!0);const d=a.getAttribute("points").split(" ").map(Number),e=d.map((a,d)=>d%2==0?a-c:a-b);return a.setAttribute("points",e.join(" ")),a}function moveGroupPoints(a,b,c){return a=a.cloneNode(!0),a.querySelectorAll("path, polygon").forEach(a=>{switch(a.tagName){case"path":a.replaceWith(movePathPoints(a,b,c));break;case"polygon":a.replaceWith(movePolygonPoints(a,b,c));break}}),a}function movePoints(a,b,c){switch(a.tagName){case"path":return movePathPoints(a,b,c);case"polygon":return movePolygonPoints(a,b,c);case"g":return moveGroupPoints(a,b,c);default:throw new Error("not supported")}}function getPieceSvg(b,c){const i="http://www.w3.org/2000/svg",a=document.createElementNS(i,"svg"),f=b.getBBox(),{x:g,y:h,width:e,height:d}=f;a.setAttribute("width",e*c),a.setAttribute("height",d*c),a.setAttribute("viewBox",`0 0 ${e} ${d}`),a.setAttribute("fill","black"),a.setAttribute("opacity","0.8");const j=movePoints(b,g,h);return a.appendChild(j),a}function checkSpinnedPosition(g,b,c){let d=Math.abs(c.angle+b.angle);if(d>180&&(d=360-d),d>angleThreshold)return!1;const e=b.getCenterPoint(),a=g.getBoundingClientRect(),h=a.left+a.width/2,i=a.top+a.height/2,f=c.width/a.width,j=f*c.scaleX*b.scaleX,k=f*c.scaleY*b.scaleY;return!(Math.abs(e.x-h)>positionThreshold)&&(!(Math.abs(e.y-i)>positionThreshold)&&(!(Math.abs(j-1)>scaleThreshold)&&(!(Math.abs(k-1)>scaleThreshold))))}function checkPosition(e,a){const b=e.getBoundingClientRect(),c=a.width*a.scaleX,d=a.height*a.scaleY,f=a.left-c/2,g=a.top-d/2;return!(Math.abs(f-b.x)>positionThreshold)&&(!(Math.abs(g-b.y)>positionThreshold)&&(!(Math.abs(c-b.width)>positionThreshold)&&(!(Math.abs(d-b.height)>positionThreshold))))}function addCountryText(b){clearTimeout(countryTimer),canvas.remove(countryText);const a=canvas.getZoom(),c=canvas.width/countryTextLength;countryText=new fabric.Text(b,{fontSize:c,fontFamily:"serif",left:(canvas.width/2-dx1)/a,top:(canvas.height/2-dy1)/a,originX:"center",originY:"center",selectable:!1,fill:"blue"}),canvas.add(countryText),canvas.sendToBack(countryText),countryTimer=setTimeout(()=>{canvas.remove(countryText)},2e3)}function setMovableOption(a,b){switch(b){case 0:case 1:case 2:a.setControlsVisibility({bl:!1,br:!1,ml:!1,mt:!1,mr:!1,mb:!1,tl:!1,tr:!1,mtr:!1}),a.hasBorders=!1;break;case 3:case 4:case 5:{const b=a.left+a.width/2,c=a.top+a.height/2;a.set({originX:"center",originY:"center",left:b,top:c,angle:Math.random()*360,selectable:!1});break}case 6:case 7:case 8:{a.setControlsVisibility({mtr:!1});const b=(.5+Math.random())*canvas.width/20,c=(.5+Math.random())*canvas.height/20;a.set({scaleX:b/a.width,scaleY:c/a.height});break}case 9:case 10:case 11:{const b=(.5+Math.random())*canvas.width/20,c=(.5+Math.random())*canvas.height/20;a.set({scaleX:b/a.width,scaleY:c/a.height});const d=a.left+a.width/2,e=a.top+a.height/2;a.set({originX:"center",originY:"center",left:d,top:e,angle:Math.random()*360,selectable:!1});break}}}function addControlRect(a,f){a.setCoords();const d=a.getBoundingRect(),b=Math.max(d.width,d.height),e=new fabric.Rect({originX:"center",originY:"center",left:a.left,top:a.top,width:b,height:b,opacity:0,selectable:!1});canvas.add(e);const c=new fabric.Group([e,a],{originX:"center",originY:"center",width:b,height:b,opacity:a.opacity,transparentCorners:!1,cornerStyle:"circle"});return f<9&&c.setControlsVisibility({bl:!1,br:!1,ml:!1,mt:!1,mr:!1,mb:!1,tl:!1,tr:!1}),canvas.add(c),c}function addScoreText(){const a=((Date.now()-startTime)*1e3/1e6).toFixed(3),b=`${a} sec!`,c=canvas.width/8;scoreText=new fabric.Text(b,{fontSize:c,left:canvas.width/2,top:canvas.height/2,originX:"center",originY:"center",selectable:!1,fill:"blue"}),setTimeout(()=>{canvas.add(scoreText),canvas.sendToBack(scoreText)},2e3)}function setCorrectPiece(a){a.style.fill="violet",correctCount+=1,correctCount==problemNum?(playAudio("correctAll"),addScoreText()):playAudio("correct");const c=getCountryId(a),b=countryInfos.get(c).name;addCountryText(b),speak(b)}function adjustElementPosition(a){const d=a.width*a.scaleX,e=a.height*a.scaleY,b=d/2,c=e/2;if(a.left<b)a.set({left:b});else if(canvas.width<a.left+b){const c=canvas.width-b;a.set({left:c})}if(a.top<c)a.set({top:c});else if(canvas.height<a.top+c){const b=canvas.height-c;a.set({top:b})}a.setCoords()}function setPieceGuideEvent(b,c){let a=0;c.on("mousedown",e=>{const c=document.getElementById("pieceGuide");c&&c.remove();const d=Date.now();if(d-a<200){const a=e.e,c=a instanceof TouchEvent?a.touches[0]:a,d=c.pageX,f=c.pageY-30,g=getCountryId(b),h=countryInfos.get(g).name,i=`
        <div id="pieceGuide" class="tooltip show" role="tooltip"
          style="position:absolute; inset:0px auto auto 0px; transform:translate(${d}px,${f}px);">
          <div class="tooltip-inner">${h}</div>
        </div>
      `;document.getElementById("guide").insertAdjacentHTML("beforeend",i)}a=d})}function setMovable(a,c,b){new fabric.loadSVGFromString(c.outerHTML,(d,e)=>{const c=fabric.util.groupSVGElements(d,e);if(c.set({left:getRandomInt(0,canvas.width/2),top:getRandomInt(0,canvas.height/2)}),c.set({left:c.left+c.width/2,top:c.top+c.height/2,originX:"center",originY:"center",transparentCorners:!1,cornerStyle:"circle"}),setMovableOption(c,b),canvas.add(c),c.selectable)setPieceGuideEvent(a,c),c.on("modified",()=>{playAudio("modified"),checkPosition(a,c)?(canvas.remove(c),setCorrectPiece(a)):adjustElementPosition(c)});else{const d=addControlRect(c,b);setPieceGuideEvent(a,c),d.on("modified",()=>{playAudio("modified"),c.set("angle",c.angle+d.angle),c.setCoords();const b=c.getBoundingRect(),e=Math.max(b.width,b.height);d.set({angle:0,width:e,height:e}),checkSpinnedPosition(a,d,c)?(d.getObjects().forEach(a=>{canvas.remove(a)}),canvas.remove(d),setCorrectPiece(a)):adjustElementPosition(d)})}})}function getSVGScale(a,b){const c=b.querySelector("svg"),d=c.getAttribute("viewBox").split(" ")[2],e=a.getBoundingClientRect();return e.width/Number(d)}function shuffleSVG(){canvas.clear();const c=document.getElementById("courseOption"),d=c.options[c.selectedIndex].value,e=document.getElementById("gradeOption").selectedIndex,b=map.contentDocument,f=getSVGScale(map,b);b.querySelectorAll(".not-piece").forEach(a=>{a.style.fill="#e0e0e0"});const a=[...b.querySelectorAll(".piece")].filter(a=>{if(d=="ALL")return!0;const b=getCountryId(a),c=countryInfos.get(b).area;if(d.includes(c))return!0;a.style.fill="#e0e0e0"});problemNum=a.length;for(const b of a){b.style.fill="black";const c=getPieceSvg(b,f);setMovable(b,c,e)}switch(e%3){case 0:a.forEach(a=>{a.style.fill="#fefee4",a.style.strokeWidth=1});break;case 1:a.forEach(a=>{a.style.fill="#fefee4",a.style.strokeWidth=0});break;case 2:a.forEach(a=>{a.style.fill="#fefee4",a.style.strokeWidth=0});break}}function startGame(){canvas||(canvas=initCanvas()),canvas.remove(scoreText),shuffleSVG(),correctCount=0,startTime=Date.now()}function calcLimitedPoint(a,b){const c=-canvas.width/2,d=-canvas.height/2,e=-c,f=-d;return a<=c&&(a=c),b<=d&&(b=d),e<=a&&(a=e),f<=b&&(b=f),[a,b]}function initCanvasMouseEvent(a){let b=!1,c=0,d=0;a.on("mouse:wheel",d=>{const c=d.e;if(!b){const b=c.deltaY,d=a.getZoom();zoom=d*.999**b,zoom>maxScale&&(zoom=maxScale),zoom<minScale&&(zoom=minScale);const e=new fabric.Point(a.width/2,a.height/2);a.zoomToPoint(e,zoom),dx1=a.viewportTransform[4],dy1=a.viewportTransform[5],map.style.transform=`scale(${zoom}) translate(${dx2}px,${dy2}px)`,document.getElementById("guide").replaceChildren()}c.preventDefault(),c.stopPropagation()}),a.on("mouse:up",f=>{if(!b)return;b=!1;const e=f.e,g=dx2+(e.clientX-c)/zoom,h=dy2+(e.clientY-d)/zoom;[dx2,dy2]=calcLimitedPoint(g,h),dx1=a.viewportTransform[4],dy1=a.viewportTransform[5]}),a.on("mouse:down",a=>{if(!a.target){b=!0;const e=a.e;c=e.clientX,d=e.clientY}}),a.on("mouse:move",l=>{if(!b)return;const f=l.e,g=f.clientX-c,h=f.clientY-d,i=g/zoom+dx2,j=h/zoom+dy2,[e,k]=calcLimitedPoint(i,j);map.style.transform=`scale(${zoom}) translate(${e}px,${k}px)`;const m=g+dx1+(e-i)*zoom,n=h+dy1+(k-j)*zoom,o=new fabric.Point(-m,-n);a.absolutePan(o),document.getElementById("guide").replaceChildren()})}function initCanvasTouchEvent(a){let e=!1,f=!1,c=0,d=0,b,g=zoom;a.wrapperEl.addEventListener("touchstart",g=>{switch(g.touches.length){case 1:{const f=g.touches[0],h=a.findTarget(f);h||(e=!0,c=f.clientX,d=f.clientY,b=f.identifier);break}case 2:{if(f=!0,b){{const e=g.touches;for(let f=0;f<e.length;f++){const g=e[f];if(b==g.identifier){const b=dx2+(g.clientX-c)/zoom,e=dy2+(g.clientY-d)/zoom;[dx2,dy2]=calcLimitedPoint(b,e),dx1=a.viewportTransform[4],dy1=a.viewportTransform[5];break}}}}else{e=!0;const a=g.touches[0];c=a.clientX,d=a.clientY,b=a.identifier}break}}}),a.wrapperEl.addEventListener("touchend",h=>{if(!e)return;if(h.touches.length==0){if(e=!1,!f){const e=h.changedTouches;for(let f=0;f<e.length;f++){const g=e[f];if(b==g.identifier){const b=dx2+(g.clientX-c)/zoom,e=dy2+(g.clientY-d)/zoom;[dx2,dy2]=calcLimitedPoint(b,e),dx1=a.viewportTransform[4],dy1=a.viewportTransform[5];break}}}b=null}else{const a=h.changedTouches;for(let e=0;e<a.length;e++){const g=a[e];if(b==g.identifier){const a=h.touches[0];c=a.clientX,d=a.clientY,b=a.identifier;break}const f=h.touches[0];c=f.clientX,d=f.clientY;break}}f=!1,g=zoom}),a.wrapperEl.addEventListener("touchmove",b=>{if(!e)return;switch(b.touches.length){case 1:{const e=b.touches[0],f=e.clientX-c,g=e.clientY-d,h=f/zoom+dx2,i=g/zoom+dy2,[j,k]=calcLimitedPoint(h,i);map.style.transform=`scale(${zoom}) translate(${j}px,${k}px)`;const l=f+dx1+(j-h)*zoom,m=g+dy1+(k-i)*zoom,n=new fabric.Point(-l,-m);a.absolutePan(n),document.getElementById("guide").replaceChildren();break}case 2:{if(zoom=g*b.scale,zoom>maxScale&&(zoom=maxScale),zoom<minScale&&(zoom=minScale),zoom==1){const b=new fabric.Point(0,0);a.absolutePan(b),a.setZoom(1),dx2=dy2=0}else{const b=new fabric.Point(a.width/2,a.height/2);a.zoomToPoint(b,zoom)}dx1=a.viewportTransform[4],dy1=a.viewportTransform[5],map.style.transform=`scale(${zoom}) translate(${dx2}px,${dy2}px)`,document.getElementById("guide").replaceChildren();break}default:break}})}function setMapGuideMouseEvent(a){let b=0;a.on("mouse:down",c=>{const d=Date.now();if(d-b<200){const b=a.getPointer(c),d=findPieceNodes(b.x,b.y);d.forEach(a=>setMapGuideTooltip(c.e,a))}b=d})}function setMapGuideTouchEvent(a){let b=0;a.wrapperEl.addEventListener("touchstart",c=>{const d=Date.now();if(d-b<200){const b=a.getPointer(c),d=findPieceNodes(b.x,b.y),e=c.changedTouches[0];d.forEach(a=>setMapGuideTooltip(e,a))}b=d})}function findPieceNodes(a,b){const c=map.contentDocument.elementsFromPoint(a,b),d=c.map(a=>{if(a.tagName=="svg")return!1;if(a.classList.contains("piece"))return a;const b=a.parentNode;return!!b.classList.contains("piece")&&b}).filter(a=>a);return d}function setMapGuideTooltip(a,h){const i=a.pageX,d=a.pageY-30,e=getCountryId(h),f=countryInfos.get(e).name,g=`
    <div class="tooltip show" role="tooltip"
      style="position:absolute; inset:0px auto auto 0px; transform:translate(${i}px,${d}px);">
      <div class="tooltip-inner">${f}</div>
    </div>
  `,b=document.getElementById("guide");b.insertAdjacentHTML("beforeend",g);const c=b.lastElementChild;c.onclick=()=>{c.remove()}}function initCanvas(){const b=map.getBoundingClientRect(),a=new fabric.Canvas("canvas",{left:b.left,top:b.top,width:b.width,height:b.height});return fabric.isTouchSupported?(initCanvasTouchEvent(a),setMapGuideTouchEvent(a)):(initCanvasMouseEvent(a),setMapGuideMouseEvent(a)),a.selection=!1,document.getElementById("canvas").parentNode.style.position="absolute",a}function resizePieces(){const b=map.offsetWidth,a=b/canvas.width;if(a!=1){canvas.setDimensions({width:b,height:map.offsetHeight}),canvas.getObjects().forEach(b=>{b.left*=a,b.top*=a,b.scaleX*=a,b.scaleY*=a,b.setCoords()});const c=new fabric.Point(-dx1*a,-dy1*a);canvas.absolutePan(c),dx1=canvas.viewportTransform[4],dy1=canvas.viewportTransform[5],dx2*=a,dy2*=a,map.style.transform=`scale(${zoom}) translate(${dx2}px,${dy2}px)`}}function calcCountryTextLength(b,c){const d=Array.from(c.values()),e=d.map(a=>a.name),a=Math.max(...e.map(a=>a.length));switch(b){case"ja":return a;case"en":return Math.ceil(a/1.5)}}function changeLang(){const a=document.getElementById("lang"),b=a.options[a.selectedIndex].value;location.href=`/world-map-puzzle/${b}/`}function getTTSLang(a){switch(a){case"en":return"en-US";case"ja":return"ja-JP"}}async function initCountriesInfo(a){const b=await fetch(`/world-map-puzzle/data/${a}.csv`),c=await b.text();c.trimEnd().split("\n").forEach(b=>{const[e,c,a,d]=b.split(",");if(!a.startsWith("#")){const b={name:a,area:d};countryInfos.set(c,b)}}),countryTextLength=calcCountryTextLength(a,countryInfos)}const map=document.getElementById("map"),positionThreshold=20,scaleThreshold=.3,angleThreshold=20,maxScale=20,minScale=1,countryInfos=new Map;let problemNum,canvas,countryText,countryTextLength,countryTimer,startTime,scoreText,zoom=1,dx1=0,dy1=0,dx2=0,dy2=0;initCountriesInfo(htmlLang),document.getElementById("startButton").onclick=startGame,document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("lang").onchange=changeLang,document.addEventListener("click",unlockAudio,{once:!0,useCapture:!0}),globalThis.addEventListener("resize",()=>{if(!canvas)return;resizePieces(),countryText&&countryText.set({left:canvas.width/2,top:canvas.height/2}),scoreText&&scoreText.set({left:canvas.width/2,top:canvas.height/2})})