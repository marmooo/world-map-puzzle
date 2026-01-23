import {
  Canvas,
  Group,
  loadSVGFromString,
  Point,
  Rect,
  Text,
  util,
} from "https://cdn.jsdelivr.net/npm/fabric@7.1.0/+esm";
import svgpath from "https://cdn.jsdelivr.net/npm/svgpath@2.6.0/+esm";
import { createWorker } from "https://cdn.jsdelivr.net/npm/emoji-particle@0.0.4/+esm";

const htmlLang = document.documentElement.lang;
const ttsLang = getTTSLang(htmlLang);
const emojiParticle = initEmojiParticle();
let correctCount = 0;
let audioContext;
const audioBufferCache = {};
let ttsVoices = [];
loadVoices();
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function createAudioContext() {
  if (globalThis.AudioContext) {
    return new globalThis.AudioContext();
  } else {
    console.error("Web Audio API is not supported in this browser");
    return null;
  }
}

function unlockAudio() {
  const uttr = new SpeechSynthesisUtterance("");
  uttr.lang = ttsLang;
  speechSynthesis.speak(uttr);

  if (audioContext) {
    audioContext.resume();
  } else {
    audioContext = createAudioContext();
    loadAudio("modified", "/world-map-puzzle/mp3/decision50.mp3");
    loadAudio("correct", "/world-map-puzzle/mp3/correct3.mp3");
    loadAudio("correctAll", "/world-map-puzzle/mp3/correct1.mp3");
  }
  document.removeEventListener("click", unlockAudio);
  document.removeEventListener("keydown", unlockAudio);
}

async function loadAudio(name, url) {
  if (!audioContext) return;
  if (audioBufferCache[name]) return audioBufferCache[name];
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBufferCache[name] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Loading audio ${name} error:`, error);
    throw error;
  }
}

function playAudio(name, volume) {
  if (!audioContext) return;
  const audioBuffer = audioBufferCache[name];
  if (!audioBuffer) {
    console.error(`Audio ${name} is not found in cache`);
    return;
  }
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  const gainNode = audioContext.createGain();
  if (volume) gainNode.gain.value = volume;
  gainNode.connect(audioContext.destination);
  sourceNode.connect(gainNode);
  sourceNode.start();
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      let supported = false;
      speechSynthesis.addEventListener("voiceschanged", () => {
        supported = true;
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
      setTimeout(() => {
        if (!supported) {
          document.getElementById("noTTS").classList.remove("d-none");
        }
      }, 1000);
    }
  });
  allVoicesObtained.then((voices) => {
    ttsVoices = voices.filter((voice) => voice.lang == ttsLang);
  });
}

function speak(text) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.voice = ttsVoices[Math.floor(Math.random() * ttsVoices.length)];
  msg.lang = ttsLang;
  speechSynthesis.speak(msg);
  return msg;
}

function initEmojiParticle() {
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    pointerEvents: "none",
    top: "0px",
    left: "0px",
  });
  canvas.width = document.documentElement.clientWidth;
  canvas.height = document.documentElement.clientHeight;
  document.body.appendChild(canvas);

  const offscreen = canvas.transferControlToOffscreen();
  const worker = createWorker();
  worker.postMessage({ type: "init", canvas: offscreen }, [offscreen]);

  globalThis.addEventListener("resize", () => {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    worker.postMessage({ type: "resize", width, height });
  });
  return { canvas, offscreen, worker };
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function getCountryId(node) {
  const id = node.id.toUpperCase();
  if (id.endsWith("-")) return id.slice(0, -1);
  return id;
}

function movePathPoints(path, x, y) {
  path = path.cloneNode(true);
  const data = svgpath(path.getAttribute("d"));
  data.translate(-x, -y);
  path.setAttribute("d", data.toString());
  return path;
}

function movePolygonPoints(polygon, x, y) {
  polygon = polygon.cloneNode(true);
  const data = polygon.getAttribute("points").split(" ").map(Number);
  const points = data.map((p, i) => (i % 2 == 0) ? p - y : p - x);
  polygon.setAttribute("points", points.join(" "));
  return polygon;
}

function moveGroupPoints(g, x, y) {
  g = g.cloneNode(true);
  g.querySelectorAll("path, polygon").forEach((node) => {
    switch (node.tagName) {
      case "path":
        node.replaceWith(movePathPoints(node, x, y));
        break;
      case "polygon":
        node.replaceWith(movePolygonPoints(node, x, y));
        break;
    }
  });
  return g;
}

function movePoints(node, x, y) {
  switch (node.tagName) {
    case "path":
      return movePathPoints(node, x, y);
    case "polygon":
      return movePolygonPoints(node, x, y);
    case "g":
      return moveGroupPoints(node, x, y);
    default:
      throw new Error("not supported");
  }
}

function getPieceSvg(island, scale) {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  const rect = island.getBBox();
  const { x, y, width, height } = rect;
  svg.setAttribute("width", width * scale);
  svg.setAttribute("height", height * scale);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("fill", "black");
  svg.setAttribute("opacity", "0.8");
  const piece = movePoints(island, x, y);
  svg.appendChild(piece);
  return svg;
}

function checkSpinnedPosition(island, wrapper, group) {
  let diff = Math.abs(group.angle + wrapper.angle);
  if (diff > 180) diff = 360 - diff;
  if (diff > angleThreshold) return false;
  const center = wrapper.getCenterPoint();
  const original = island.getBoundingClientRect();
  const centerX = original.left + original.width / 2;
  const centerY = original.top + original.height / 2;
  const originalScale = group.width / original.width;
  const scaleX = originalScale * group.scaleX * wrapper.scaleX;
  const scaleY = originalScale * group.scaleY * wrapper.scaleY;
  if (Math.abs(center.x - centerX) > positionThreshold) return false;
  if (Math.abs(center.y - centerY) > positionThreshold) return false;
  if (Math.abs(scaleX - 1) > scaleThreshold) return false;
  if (Math.abs(scaleY - 1) > scaleThreshold) return false;
  return true;
}

function checkPosition(island, rect) {
  const original = island.getBoundingClientRect();
  const width = rect.width * rect.scaleX;
  const height = rect.height * rect.scaleY;
  const left = rect.left - width / 2;
  const top = rect.top - height / 2;
  if (Math.abs(left - original.x) > positionThreshold) return false;
  if (Math.abs(top - original.y) > positionThreshold) return false;
  if (Math.abs(width - original.width) > positionThreshold) return false;
  if (Math.abs(height - original.height) > positionThreshold) return false;
  return true;
}

function addCountryText(countryName) {
  clearTimeout(countryTimer);
  canvas.remove(countryText);
  const zoom = canvas.getZoom();
  const fontSize = canvas.width / countryTextLength;
  countryText = new Text(countryName, {
    fontSize: fontSize,
    fontFamily: "serif",
    left: (canvas.width / 2 - dx1) / zoom,
    top: (canvas.height / 2 - dy1) / zoom,
    originX: "center",
    originY: "center",
    selectable: false,
    fill: "blue",
  });
  canvas.add(countryText);
  canvas.sendObjectToBack(countryText);
  countryTimer = setTimeout(() => {
    canvas.remove(countryText);
  }, 2000);
}

function setMovableOption(group, grade) {
  switch (grade) {
    case 0:
    case 1:
    case 2:
      group.setControlsVisibility({
        bl: false,
        br: false,
        ml: false,
        mt: false,
        mr: false,
        mb: false,
        tl: false,
        tr: false,
        mtr: false,
      });
      group.hasBorders = false;
      break;
    case 3:
    case 4:
    case 5: {
      const centerX = group.left + group.width / 2;
      const centerY = group.top + group.height / 2;
      group.set({
        originX: "center",
        originY: "center",
        left: centerX,
        top: centerY,
        angle: Math.random() * 360,
        selectable: false,
      });
      break;
    }
    case 6:
    case 7:
    case 8: {
      group.setControlsVisibility({
        mtr: false,
      });
      const width = (0.5 + Math.random()) * canvas.width / 20;
      const height = (0.5 + Math.random()) * canvas.height / 20;
      group.set({
        scaleX: width / group.width,
        scaleY: height / group.height,
      });
      break;
    }
    case 9:
    case 10:
    case 11: {
      const width = (0.5 + Math.random()) * canvas.width / 20;
      const height = (0.5 + Math.random()) * canvas.height / 20;
      group.set({
        scaleX: width / group.width,
        scaleY: height / group.height,
      });
      const centerX = group.left + group.width / 2;
      const centerY = group.top + group.height / 2;
      group.set({
        originX: "center",
        originY: "center",
        left: centerX,
        top: centerY,
        angle: Math.random() * 360,
        selectable: false,
      });
      break;
    }
  }
}

function addControlRect(group, grade) {
  group.setCoords();
  const rect = group.getBoundingRect();
  const rectLength = Math.max(rect.width, rect.height);
  const controlRect = new Rect({
    originX: "center",
    originY: "center",
    left: group.left,
    top: group.top,
    width: rectLength,
    height: rectLength,
    opacity: 0,
    selectable: false,
  });
  canvas.add(controlRect);

  const wrapper = new Group([controlRect, group], {
    originX: "center",
    originY: "center",
    width: rectLength,
    height: rectLength,
    opacity: group.opacity,
    transparentCorners: false,
    borderColor: "blue",
    cornerColor: "blue",
    cornerStyle: "circle",
  });
  if (grade < 9) {
    wrapper.setControlsVisibility({
      bl: false,
      br: false,
      ml: false,
      mt: false,
      mr: false,
      mb: false,
      tl: false,
      tr: false,
    });
  }
  canvas.add(wrapper);
  return wrapper;
}

function addScoreText() {
  const time = (((Date.now() - startTime) * 1000) / 1000000).toFixed(3);
  const text = `${time} sec!`;
  const fontSize = canvas.width / 8;
  scoreText = new Text(text, {
    fontSize: fontSize,
    left: canvas.width / 2,
    top: canvas.height / 2,
    originX: "center",
    originY: "center",
    selectable: false,
    fill: "blue",
  });
  setTimeout(() => {
    canvas.add(scoreText);
    canvas.sendObjectToBack(scoreText);
  }, 2000);
}

function setCorrectPiece(island) {
  island.style.fill = "violet";
  correctCount += 1;
  if (correctCount == problemNum) {
    playAudio("correctAll");
    for (let i = 0; i < 10; i++) {
      emojiParticle.worker.postMessage({
        type: "spawn",
        options: {
          particleType: "popcorn",
          originX: Math.random() * emojiParticle.canvas.width,
          originY: Math.random() * emojiParticle.canvas.height,
        },
      });
    }
    addScoreText();
  } else {
    playAudio("correct", 0.3);
    if (correctCount % 10 === 0) {
      for (let i = 0; i < Math.ceil(correctCount / 20); i++) {
        emojiParticle.worker.postMessage({
          type: "spawn",
          options: {
            particleType: "popcorn",
            originX: Math.random() * emojiParticle.canvas.width,
            originY: Math.random() * emojiParticle.canvas.height,
          },
        });
      }
    }
  }
  const id = getCountryId(island);
  const countryName = countryInfos.get(id).name;
  addCountryText(countryName);
  speak(countryName);
}

function adjustElementPosition(element) {
  const width = element.width * element.scaleX;
  const height = element.height * element.scaleY;
  const w2 = width / 2;
  const h2 = height / 2;
  if (element.left < w2) {
    element.set({ left: w2 });
  } else if (canvas.width < element.left + w2) {
    const maxLeft = canvas.width - w2;
    element.set({ left: maxLeft });
  }
  if (element.top < h2) {
    element.set({ top: h2 });
  } else if (canvas.height < element.top + h2) {
    const maxTop = canvas.height - h2;
    element.set({ top: maxTop });
  }
  element.setCoords();
}

function setPieceGuideEvent(island, group) {
  let lastTouchTime = 0;
  group.on("mousedown", (event) => {
    const pieceGuide = document.getElementById("pieceGuide");
    if (pieceGuide) pieceGuide.remove();
    const now = Date.now();
    if (now - lastTouchTime < 200) {
      const e = event.e;
      const touch = (e instanceof TouchEvent) ? e.touches[0] : e;
      const tx = touch.pageX;
      const ty = touch.pageY - 30;
      const id = getCountryId(island);
      const countryName = countryInfos.get(id).name;
      const html = `
        <div id="pieceGuide" class="tooltip show" role="tooltip"
          style="position:absolute; inset:0px auto auto 0px; transform:translate(${tx}px,${ty}px);">
          <div class="tooltip-inner">${countryName}</div>
        </div>
      `;
      document.getElementById("guide").insertAdjacentHTML("beforeend", html);
    }
    lastTouchTime = now;
  });
}

async function setMovable(island, svg, grade) {
  const result = await loadSVGFromString(svg.outerHTML);
  const group = util.groupSVGElements(result.objects, result.options);
  group.set({
    left: getRandomInt(0, canvas.width / 2),
    top: getRandomInt(0, canvas.height / 2),
  });
  group.set({
    left: group.left + group.width / 2,
    top: group.top + group.height / 2,
    originX: "center",
    originY: "center",
    transparentCorners: false,
    borderColor: "blue",
    cornerColor: "blue",
    cornerStyle: "circle",
  });
  setMovableOption(group, grade);
  canvas.add(group);

  if (group.selectable) {
    setPieceGuideEvent(island, group);
    group.on("mouseup", () => {
      playAudio("modified");
      if (checkPosition(island, group)) {
        canvas.remove(group);
        setCorrectPiece(island);
      } else {
        adjustElementPosition(group);
      }
    });
  } else {
    const wrapper = addControlRect(group, grade);
    setPieceGuideEvent(island, wrapper);
    wrapper.on("mouseup", () => {
      playAudio("modified");
      if (checkSpinnedPosition(island, wrapper, group)) {
        wrapper.getObjects().forEach((obj) => {
          canvas.remove(obj);
        });
        canvas.remove(wrapper);
        setCorrectPiece(island);
      } else {
        adjustElementPosition(wrapper);
      }
    });
  }
}

function getSVGScale(map, doc) {
  const svg = doc.querySelector("svg");
  const width = svg.getAttribute("viewBox").split(" ")[2];
  const rect = map.getBoundingClientRect();
  return rect.width / Number(width);
}

async function shuffleSVG() {
  canvas.clear();
  const courseObj = document.getElementById("courseOption");
  const course = courseObj.options[courseObj.selectedIndex].value;
  const grade = document.getElementById("gradeOption").selectedIndex;
  const doc = map.contentDocument;
  const scale = getSVGScale(map, doc);
  doc.querySelectorAll(".not-piece").forEach((node) => {
    node.style.fill = "#e0e0e0";
  });
  const pieces = [...doc.querySelectorAll(".piece")].filter((piece) => {
    if (course == "ALL") return true;
    const id = getCountryId(piece);
    const area = countryInfos.get(id).area;
    if (course.includes(area)) {
      return true;
    } else {
      piece.style.fill = "#e0e0e0";
    }
  });
  problemNum = pieces.length;
  for (const piece of pieces) {
    piece.style.fill = "black";
    const svg = getPieceSvg(piece, scale);
    await setMovable(piece, svg, grade);
  }
  switch (grade % 3) {
    case 0:
      pieces.forEach((piece) => {
        piece.style.fill = "#fefee4";
        piece.style.strokeWidth = 1;
      });
      break;
    case 1:
      pieces.forEach((piece) => {
        piece.style.fill = "#fefee4";
        piece.style.strokeWidth = 0;
      });
      break;
    case 2:
      pieces.forEach((piece) => {
        piece.style.fill = "#fefee4";
        piece.style.strokeWidth = 0;
      });
      break;
  }
}

async function startGame() {
  if (!canvas) canvas = initCanvas();
  canvas.remove(scoreText);
  await shuffleSVG();
  correctCount = 0;
  startTime = Date.now();
}

function calcLimitedPoint(x, y) {
  const left = -canvas.width / 2;
  const top = -canvas.height / 2;
  const right = -left;
  const bottom = -top;
  if (x <= left) x = left;
  if (y <= top) y = top;
  if (right <= x) x = right;
  if (bottom <= y) y = bottom;
  return [x, y];
}

function initCanvasMouseEvent(canvas) {
  let panning = false;
  let px = 0;
  let py = 0;
  canvas.on("mouse:wheel", (event) => {
    const e = event.e;
    if (!panning) {
      const delta = e.deltaY;
      const prevZoom = canvas.getZoom();
      zoom = prevZoom * 0.999 ** delta;
      if (zoom > maxScale) zoom = maxScale;
      if (zoom < minScale) zoom = minScale;
      const point = new Point(canvas.width / 2, canvas.height / 2);
      canvas.zoomToPoint(point, zoom);
      dx1 = canvas.viewportTransform[4];
      dy1 = canvas.viewportTransform[5];
      map.style.transform = `scale(${zoom}) translate(${dx2}px,${dy2}px)`;
      document.getElementById("guide").replaceChildren();
    }
    e.preventDefault();
    e.stopPropagation();
  });
  canvas.on("mouse:up", (event) => {
    if (!panning) return;
    panning = false;
    const e = event.e;
    const tx2 = dx2 + (e.clientX - px) / zoom;
    const ty2 = dy2 + (e.clientY - py) / zoom;
    [dx2, dy2] = calcLimitedPoint(tx2, ty2);

    dx1 = canvas.viewportTransform[4];
    dy1 = canvas.viewportTransform[5];
  });
  canvas.on("mouse:down", (event) => {
    if (!event.target) {
      panning = true;
      const e = event.e;
      px = e.clientX;
      py = e.clientY;
    }
  });
  canvas.on("mouse:move", (event) => {
    if (!panning) return;
    const e = event.e;
    const x = e.clientX - px;
    const y = e.clientY - py;
    const tx2 = x / zoom + dx2;
    const ty2 = y / zoom + dy2;
    const [lx2, ly2] = calcLimitedPoint(tx2, ty2);
    map.style.transform = `scale(${zoom}) translate(${lx2}px,${ly2}px)`;

    const tx1 = x + dx1 + (lx2 - tx2) * zoom;
    const ty1 = y + dy1 + (ly2 - ty2) * zoom;
    const point = new Point(-tx1, -ty1);
    canvas.absolutePan(point);
    document.getElementById("guide").replaceChildren();
  });
}

function initCanvasTouchEvent(canvas) {
  let panning = false;
  let zooming = false;
  let px = 0;
  let py = 0;
  let touchId;
  let initialZoom = zoom;
  canvas.wrapperEl.addEventListener("touchstart", (event) => {
    switch (event.touches.length) {
      case 1: {
        const touch = event.touches[0];
        const target = canvas.findTarget(touch);
        if (!target) {
          panning = true;
          px = touch.clientX;
          py = touch.clientY;
          touchId = touch.identifier;
        }
        break;
      }
      case 2: {
        zooming = true;
        if (!touchId) {
          panning = true;
          const touch = event.touches[0];
          px = touch.clientX;
          py = touch.clientY;
          touchId = touch.identifier;
        } else {
          const touches = event.touches;
          for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            if (touchId == touch.identifier) {
              const tx2 = dx2 + (touch.clientX - px) / zoom;
              const ty2 = dy2 + (touch.clientY - py) / zoom;
              [dx2, dy2] = calcLimitedPoint(tx2, ty2);

              dx1 = canvas.viewportTransform[4];
              dy1 = canvas.viewportTransform[5];
              break;
            }
          }
        }
        break;
      }
    }
  });
  canvas.wrapperEl.addEventListener("touchend", (event) => {
    if (!panning) return;
    if (event.touches.length == 0) {
      panning = false;
      if (!zooming) {
        const changedTouches = event.changedTouches;
        for (let i = 0; i < changedTouches.length; i++) {
          const changedTouch = changedTouches[i];
          if (touchId == changedTouch.identifier) {
            const tx2 = dx2 + (changedTouch.clientX - px) / zoom;
            const ty2 = dy2 + (changedTouch.clientY - py) / zoom;
            [dx2, dy2] = calcLimitedPoint(tx2, ty2);

            dx1 = canvas.viewportTransform[4];
            dy1 = canvas.viewportTransform[5];
            break;
          }
        }
      }
      touchId = null;
    } else {
      const changedTouches = event.changedTouches;
      for (let i = 0; i < changedTouches.length; i++) {
        const changedTouch = changedTouches[i];
        if (touchId == changedTouch.identifier) {
          const touch = event.touches[0];
          px = touch.clientX;
          py = touch.clientY;
          touchId = touch.identifier;
          break;
        } else {
          const touch = event.touches[0];
          px = touch.clientX;
          py = touch.clientY;
          break;
        }
      }
    }
    zooming = false;
    initialZoom = zoom;
  });
  canvas.wrapperEl.addEventListener("touchmove", (event) => {
    if (!panning) return;
    switch (event.touches.length) {
      case 1: {
        const touch = event.touches[0];
        const x = touch.clientX - px;
        const y = touch.clientY - py;
        const tx2 = x / zoom + dx2;
        const ty2 = y / zoom + dy2;
        const [lx2, ly2] = calcLimitedPoint(tx2, ty2);
        map.style.transform = `scale(${zoom}) translate(${lx2}px,${ly2}px)`;

        const tx1 = x + dx1 + (lx2 - tx2) * zoom;
        const ty1 = y + dy1 + (ly2 - ty2) * zoom;
        const point = new Point(-tx1, -ty1);
        canvas.absolutePan(point);
        document.getElementById("guide").replaceChildren();
        break;
      }
      case 2: { // pinch zoom
        zoom = initialZoom * event.scale;
        if (zoom > maxScale) zoom = maxScale;
        if (zoom < minScale) zoom = minScale;
        if (zoom == 1) {
          const point = new Point(0, 0);
          canvas.absolutePan(point);
          canvas.setZoom(1);
          dx2 = dy2 = 0;
        } else {
          const point = new Point(canvas.width / 2, canvas.height / 2);
          canvas.zoomToPoint(point, zoom);
        }
        dx1 = canvas.viewportTransform[4];
        dy1 = canvas.viewportTransform[5];
        map.style.transform = `scale(${zoom}) translate(${dx2}px,${dy2}px)`;
        document.getElementById("guide").replaceChildren();
        break;
      }
      default:
        break;
    }
  });
}

function setMapGuideMouseEvent(canvas) {
  let lastTouchTime = 0;
  canvas.on("mouse:down", (event) => {
    const now = Date.now();
    if (now - lastTouchTime < 200) {
      const pointer = canvas.getPointer(event);
      const islands = findPieceNodes(pointer.x, pointer.y);
      islands.forEach((island) => setMapGuideTooltip(event.e, island));
    }
    lastTouchTime = now;
  });
}

function setMapGuideTouchEvent(canvas) {
  let lastTouchTime = 0;
  canvas.wrapperEl.addEventListener("touchstart", (event) => {
    const now = Date.now();
    if (now - lastTouchTime < 200) {
      const pointer = canvas.getPointer(event);
      const islands = findPieceNodes(pointer.x, pointer.y);
      const touch = event.changedTouches[0];
      islands.forEach((island) => setMapGuideTooltip(touch, island));
    }
    lastTouchTime = now;
  });
}

function findPieceNodes(offsetX, offsetY) {
  const candidates = map.contentDocument.elementsFromPoint(offsetX, offsetY);
  const islands = candidates.map((node) => {
    if (node.tagName == "svg") return false;
    if (node.classList.contains("piece")) return node;
    const parentNode = node.parentNode;
    if (parentNode.classList.contains("piece")) return parentNode;
    return false;
  }).filter((node) => node);
  return islands;
}

function setMapGuideTooltip(event, island) {
  const tx = event.pageX;
  const ty = event.pageY - 30;
  const id = getCountryId(island);
  const countryName = countryInfos.get(id).name;
  const html = `
    <div class="tooltip show" role="tooltip"
      style="position:absolute; inset:0px auto auto 0px; transform:translate(${tx}px,${ty}px);">
      <div class="tooltip-inner">${countryName}</div>
    </div>
  `;
  const guide = document.getElementById("guide");
  guide.insertAdjacentHTML("beforeend", html);
  const tooltip = guide.lastElementChild;
  tooltip.onclick = () => {
    tooltip.remove();
  };
}

function initCanvas() {
  const rect = map.getBoundingClientRect();
  const canvas = new Canvas("canvas", {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  });
  if (navigator.maxTouchPoints > 0) {
    // fabric.js only fires events when the first finger touches the screen,
    // so we need to create custom events to support multi-touch.
    initCanvasTouchEvent(canvas);
    setMapGuideTouchEvent(canvas);
  } else {
    initCanvasMouseEvent(canvas);
    setMapGuideMouseEvent(canvas);
  }
  canvas.selection = false;
  // canvas.on("before:selection:cleared", (event) => {
  //   adjustElementPosition(event.target);
  // });
  // canvas.on("selection:created", (event) => {
  //   if (event.selected.length > 1) {
  //     const selection = canvas.getActiveObject();
  //     selection.set({
  //       left: selection.left + selection.width / 2,
  //       top: selection.top + selection.height / 2,
  //       originX: "center",
  //       originY: "center",
  //     });
  //     selection.setControlsVisibility({
  //       bl: false,
  //       br: false,
  //       ml: false,
  //       mt: false,
  //       mr: false,
  //       mb: false,
  //       tl: false,
  //       tr: false,
  //       mtr: false,
  //     });
  //   }
  // });
  document.getElementById("canvas").parentNode.style.position = "absolute";
  return canvas;
}

function resizePieces() {
  const width = map.offsetWidth;
  const scale = width / canvas.width;
  if (scale != 1) {
    canvas.setDimensions({ width: width, height: map.offsetHeight });
    canvas.getObjects().forEach((object) => {
      object.left *= scale;
      object.top *= scale;
      object.scaleX *= scale;
      object.scaleY *= scale;
      object.setCoords();
    });
    const point = new Point(-dx1 * scale, -dy1 * scale);
    canvas.absolutePan(point);
    dx1 = canvas.viewportTransform[4];
    dy1 = canvas.viewportTransform[5];
    dx2 *= scale;
    dy2 *= scale;
    map.style.transform = `scale(${zoom}) translate(${dx2}px,${dy2}px)`;
  }
}

function calcCountryTextLength(lang, countryInfos) {
  const countries = Array.from(countryInfos.values());
  const names = countries.map((country) => country.name);
  const max = Math.max(...names.map((str) => str.length));
  switch (lang) {
    case "ja":
      return max;
    case "en":
      // consider proportional font
      return Math.ceil(max / 1.5);
  }
}

function changeLang() {
  const langObj = document.getElementById("lang");
  const lang = langObj.options[langObj.selectedIndex].value;
  location.href = `/world-map-puzzle/${lang}/`;
}

function getTTSLang(htmlLang) {
  switch (htmlLang) {
    case "en":
      return "en-US";
    case "ja":
      return "ja-JP";
  }
}

async function initCountriesInfo(htmlLang) {
  const response = await fetch(`/world-map-puzzle/data/${htmlLang}.csv`);
  const text = await response.text();
  text.trimEnd().split("\n").forEach((line) => {
    const [_emoji, id, name, area] = line.split(",");
    if (!name.startsWith("#")) {
      const countryInfo = { name, area };
      countryInfos.set(id, countryInfo);
    }
  });
  countryTextLength = calcCountryTextLength(htmlLang, countryInfos);
}

const map = document.getElementById("map");
const positionThreshold = 20;
const scaleThreshold = 0.3;
const angleThreshold = 20;
const maxScale = 20;
const minScale = 1;
const countryInfos = new Map();
let problemNum;
let canvas;
let countryText;
let countryTextLength;
let countryTimer;
let startTime;
let scoreText;
let zoom = 1;
let dx1 = 0;
let dy1 = 0;
let dx2 = 0;
let dy2 = 0;

initCountriesInfo(htmlLang);

document.getElementById("startButton").onclick = startGame;
document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("lang").onchange = changeLang;
document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });
globalThis.addEventListener("resize", () => {
  if (!canvas) return;
  resizePieces();
  if (countryText) {
    countryText.set({
      left: canvas.width / 2,
      top: canvas.height / 2,
    });
  }
  if (scoreText) {
    scoreText.set({
      left: canvas.width / 2,
      top: canvas.height / 2,
    });
  }
});
