import svgpath from "https://cdn.jsdelivr.net/npm/svgpath@2.6.0/+esm";
// import Panzoom from "https://cdn.jsdelivr.net/npm/@panzoom/panzoom@4.5.1/+esm";

const htmlLang = document.documentElement.lang;
const ttsLang = getTTSLang(htmlLang);
let correctCount = 0;
const audioContext = new AudioContext();
const audioBufferCache = {};
loadAudio("modified", "/world-map-puzzle/mp3/decision50.mp3");
loadAudio("correct", "/world-map-puzzle/mp3/correct3.mp3");
loadAudio("correctAll", "/world-map-puzzle/mp3/correct1.mp3");
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

async function playAudio(name, volume) {
  const audioBuffer = await loadAudio(name, audioBufferCache[name]);
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    sourceNode.connect(gainNode);
    sourceNode.start();
  } else {
    sourceNode.connect(audioContext.destination);
    sourceNode.start();
  }
}

async function loadAudio(name, url) {
  if (audioBufferCache[name]) return audioBufferCache[name];
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioBufferCache[name] = audioBuffer;
  return audioBuffer;
}

function unlockAudio() {
  audioContext.resume();
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
  const fontSize = canvas.width / countryTextLength;
  countryText = new fabric.Text(countryName, {
    fontSize: fontSize,
    fontFamily: "serif",
    left: canvas.width / 2,
    top: canvas.height / 2,
    originX: "center",
    originY: "center",
    selectable: false,
    fill: "blue",
  });
  canvas.add(countryText);
  canvas.sendToBack(countryText);
  countryTimer = setTimeout(() => {
    canvas.remove(countryText);
  }, 2000);
}

function setMovableOption(group, course) {
  switch (course) {
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
      const width = (0.5 + Math.random()) * canvas.width / 10;
      const height = (0.5 + Math.random()) * canvas.height / 10;
      group.set({
        scaleX: width / group.width,
        scaleY: height / group.height,
      });
      break;
    }
    case 9:
    case 10:
    case 11: {
      const width = (0.5 + Math.random()) * canvas.width / 10;
      const height = (0.5 + Math.random()) * canvas.height / 10;
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

function addControlRect(group, course) {
  group.setCoords();
  const rect = group.getBoundingRect();
  const rectLength = Math.max(rect.width, rect.height);
  const controlRect = new fabric.Rect({
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

  const wrapper = new fabric.Group([controlRect, group], {
    originX: "center",
    originY: "center",
    width: rectLength,
    height: rectLength,
    opacity: group.opacity,
    transparentCorners: false,
    cornerStyle: "circle",
  });
  if (course < 9) {
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
  scoreText = new fabric.Text(text, {
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
    canvas.sendToBack(scoreText);
  }, 2000);
}

function setCorrectPiece(island) {
  island.style.fill = "silver";
  correctCount += 1;
  if (correctCount == countryNames.size) {
    playAudio("correctAll");
    addScoreText();
  } else {
    playAudio("correct");
  }
  const id = getCountryId(island);
  const countryName = countryNames.get(id);
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

function setMovable(island, svg, course) {
  new fabric.loadSVGFromString(svg.outerHTML, (objects, options) => {
    const group = fabric.util.groupSVGElements(objects, options);
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
      cornerStyle: "circle",
    });
    setMovableOption(group, course);
    canvas.add(group);

    if (group.selectable) {
      group.on("modified", () => {
        playAudio("modified");
        if (checkPosition(island, group)) {
          canvas.remove(group);
          setCorrectPiece(island);
        } else {
          adjustElementPosition(group);
        }
      });
    } else {
      const wrapper = addControlRect(group, course);
      wrapper.on("modified", () => {
        playAudio("modified");
        group.set("angle", group.angle + wrapper.angle);
        group.setCoords();
        const rect = group.getBoundingRect();
        const rectLength = Math.max(rect.width, rect.height);
        wrapper.set({
          angle: 0,
          width: rectLength,
          height: rectLength,
        });
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
  });
}

function getSVGScale(map, doc) {
  const svg = doc.querySelector("svg");
  const width = svg.getAttribute("viewBox").split(" ")[2];
  const rect = map.getBoundingClientRect();
  return rect.width / Number(width);
}

function shuffleSVG() {
  canvas.clear();
  const course = document.getElementById("courseOption").selectedIndex;
  const doc = map.contentDocument;
  const scale = getSVGScale(map, doc);
  doc.querySelectorAll(".not-piece").forEach((country) => {
    country.style.fill = "silver";
  });
  const countries = doc.querySelectorAll(".piece");
  for (const country of countries) {
    country.style.fill = "black";
    const svg = getPieceSvg(country, scale);
    setMovable(country, svg, course);
  }
  switch (course % 3) {
    case 0:
      countries.forEach((country) => {
        country.style.fill = "#eee";
        country.style.strokeWidth = 1;
      });
      break;
    case 1:
      countries.forEach((country) => {
        country.style.fill = "#eee";
        country.style.strokeWidth = 0;
      });
      break;
    case 2:
      countries.forEach((country) => {
        country.style.fill = "none";
        country.style.strokeWidth = 0;
      });
      break;
  }
}

function _initMap() {
  map.style.pointerEvents = "none";
  const panzoom = Panzoom(map, {
    canvas: true,
    maxScale: maxScale,
    minScale: minScale,
  });
  // map.parentNode.addEventListener("wheel", panzoom.zoomWithWheel);
  return panzoom;
}

function startGame() {
  if (!canvas) canvas = initCanvas();
  canvas.remove(scoreText);
  shuffleSVG();
  correctCount = 0;
  startTime = Date.now();
}

function initCanvas() {
  const rect = map.getBoundingClientRect();
  const canvas = new fabric.Canvas("canvas", {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  });

  let panning = false;
  let px = 0;
  let py = 0;
  let dx1 = 0;
  let dy1 = 0;
  let dx2 = 0;
  let dy2 = 0;
  canvas.on("mouse:wheel", (event) => {
    const e = event.e;
    if (!panning) {
      const delta = e.deltaY;
      const prevZoom = canvas.getZoom();
      zoom = prevZoom * 0.999 ** delta;
      if (zoom > maxScale) zoom = maxScale;
      if (zoom < minScale) zoom = minScale;
      const point = new fabric.Point(e.offsetX, e.offsetY);
      canvas.zoomToPoint(point, zoom);
      dx1 = canvas.viewportTransform[4];
      dy1 = canvas.viewportTransform[5];
      // TODO: error due to mass transmission
      // const zoomValue = panzoom.zoomToPoint(zoom, e);
      // dx2 = zoomValue.x;
      // dy2 = zoomValue.y;
      const pointer = canvas.getPointer(e);
      dx2 += (pointer.x - canvas.width / 2) * (prevZoom - zoom);
      dy2 += (pointer.y - canvas.height / 2) * (prevZoom - zoom);
      map.style.transform = `translate(${dx2}px,${dy2}px) scale(${zoom})`;
    }
    e.preventDefault();
    e.stopPropagation();
  });
  canvas.on("mouse:up", (event) => {
    if (panning) {
      panning = false;
      dx1 = canvas.viewportTransform[4];
      dy1 = canvas.viewportTransform[5];
      // const pan = panzoom.getPan();
      // dx2 = pan.x;
      // dy2 = pan.y;
      const e = event.e;
      dx2 += e.offsetX - px;
      dy2 += e.offsetY - py;
    }
  });
  canvas.on("mouse:down", (event) => {
    if (!event.target) {
      panning = true;
      const e = event.e;
      px = e.offsetX;
      py = e.offsetY;
    }
  });
  canvas.on("mouse:move", (event) => {
    if (panning && !event.target) {
      const e = event.e;
      const x = e.offsetX - px;
      const y = e.offsetY - py;
      const point = new fabric.Point(-x - dx1, -y - dy1);
      canvas.absolutePan(point);
      // panzoom.pan(x / zoom + dx2, y / zoom + dy2);
      const tx = x + dx2;
      const ty = y + dy2;
      map.style.transform = `translate(${tx}px,${ty}px) scale(${zoom})`;
    }
  });
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

function resizePieces(rect) {
  const scale = rect.width / canvas.getWidth();
  canvas.setDimensions({ width: rect.width, height: rect.height });
  canvas.getObjects().forEach((object) => {
    object.left *= scale;
    object.top *= scale;
    object.scaleX *= scale;
    object.scaleY *= scale;
    object.setCoords();
  });
}

function calcCountryTextLength(lang, countryNames) {
  const names = Array.from(countryNames.values());
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
  const names = text.trimEnd().split("\n")
    .map((line) => line.split(",").slice(1))
    .filter((arr) => !arr[1].startsWith("#"));
  countryNames = new Map(names);
  countryTextLength = calcCountryTextLength(htmlLang, countryNames);
}

const map = document.getElementById("map");
const positionThreshold = 20;
const scaleThreshold = 0.3;
const angleThreshold = 20;
const maxScale = 20;
const minScale = 1;
let canvas;
let countryNames;
let countryText;
let countryTextLength;
let countryTimer;
let startTime;
let scoreText;
let zoom = 1;

// const panzoom = initMap();
initCountriesInfo(htmlLang);

document.getElementById("startButton").onclick = startGame;
document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("lang").onchange = changeLang;
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});
globalThis.addEventListener("resize", () => {
  const rect = map.getBoundingClientRect();
  resizePieces(rect);
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
