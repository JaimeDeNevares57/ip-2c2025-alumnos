'use strict';

// Función auxiliar para obtener elementos por ID
function $(id){ return document.getElementById(id); }

var canvas = null, ctx = null, DPR = 1;
var py = null, pyStepFn = null;
var audio = null; // Variable para el elemento de audio

// ===== Estado de la aplicación =====
var state = {
  mode: 'bars',
  items: [],
  original: [], // Copia del estado inicial para el botón Reset
  running: false,
  speed: 50,
  highlight: {a:null,b:null}, // Índices a resaltar
  imageBitmap: null, // Canvas/Imagen fuente para el modo columnas
  
  // NUEVOS CONTADORES Y TIEMPO
  timeStart: 0,
  compCount: 0,
  swapCount: 0,
  timerInterval: null
};


// ===================================
// 1. Funciones de Canvas y Utilitarios
// ===================================

/**
 * Asegura que el canvas esté inicializado y dimensionado correctamente.
 */
function ensureCanvas(){
  var wrap = $('canvasWrap');
  if(!canvas){
    canvas = document.createElement('canvas');
    canvas.id = 'view';
    wrap.appendChild(canvas);
  }
  DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  var rect = wrap.getBoundingClientRect();
  canvas.width  = Math.floor(rect.width * DPR);
  canvas.height = Math.floor(rect.height * DPR);
  canvas.style.width  = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
}

/**
 * Limpia el canvas.
 */
function clearCanvas(){
  if(!ctx) return;
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}

/**
 * Reparte 'total' en 'n' enteros que suman exactamente 'total'.
 */
function columnWidths(n, total){
  var widths = new Array(n), accPrev = 0;
  for(var i=0;i<n;i++){
    var accNext = Math.round(((i+1) * total) / n);
    widths[i] = accNext - accPrev;
    accPrev = accNext;
  }
  return widths;
}

// ===== Helpers =====
function randInt(min,max){ return (Math.random()*(max-min+1)+min)|0; }

/**
 * Mezcla un array en su lugar (in-place) utilizando el algoritmo Fisher-Yates.
 */
function shuffleArray(a){ 
    for(var i=a.length-1;i>0;i--){ 
        var j=randInt(0,i); 
        var t=a[i]; 
        a[i]=a[j]; 
        a[j]=t; 
    } 
}

// ===== Barras (Dataset) =====
function makeBars(n){
  var vals = new Array(n);
  for(var i=0;i<n;i++) vals[i]=i+1;
  shuffleArray(vals);
  var out = new Array(n);
  for(var k=0;k<n;k++) out[k]={ value: vals[k], originalIndex: vals[k]-1 };
  return out;
}

// ===== Imagen por columnas (Dataset) =====
function makeImageColumns(n){
  return new Promise(function(resolve){
    if(!state.imageBitmap){
      var off = document.createElement('canvas');
      off.width = 800; off.height = 500;
      var octx = off.getContext('2d');
      octx.imageSmoothingEnabled = false;
      var grad = octx.createLinearGradient(0,0,off.width,off.height);
      grad.addColorStop(0,'#38bdf8'); grad.addColorStop(1,'#a78bfa');
      octx.fillStyle = grad; octx.fillRect(0,0,off.width,off.height);
      state.imageBitmap = off;
    }
    var img = state.imageBitmap, W = img.width, H = img.height;
    var colW = Math.max(1, Math.floor(W / n));
    var pieces = [];
    for(var i=0;i<n;i++){
      var slice = document.createElement('canvas');
      slice.width = colW; slice.height = H;
      var sctx = slice.getContext('2d');
      sctx.imageSmoothingEnabled = false;
      sctx.drawImage(img, i*colW,0,colW,H, 0,0,colW,H);
      pieces.push({ originalIndex:i, slice:slice });
    }
    shuffleArray(pieces);
    var out = new Array(n);
    for(var j=0;j<n;j++) out[j] = { value: pieces[j].originalIndex, bitmap: pieces[j].slice, originalIndex: pieces[j].originalIndex };
    resolve(out);
  });
}


// ===================================
// 2. Funciones de Rendimiento y UI
// ===================================

/**
 * Reinicia los contadores de tiempo y operaciones.
 */
function resetCounters(){
  state.compCount = 0;
  state.swapCount = 0;
  state.timeStart = 0;
  
  if(state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = null;
  
  updateCounters(0, 0, 0);
}

/**
 * Actualiza los elementos HTML con los valores del estado.
 */
function updateCounters(time, comp, swap){
  if(!$('countTime')) return; 
  $('countTime').textContent = time.toFixed(3);
  // Verificar que comp y swap sean números antes de formatear
  $('countComp').textContent = (comp || 0).toLocaleString();
  $('countSwap').textContent = (swap || 0).toLocaleString();
}

/**
 * Inicia el cronómetro.
 */
function startTimer(){
  state.timeStart = performance.now();
  state.timerInterval = setInterval(function(){
    if(!state.running) return;
    var elapsed = (performance.now() - state.timeStart) / 1000;
    $('countTime').textContent = elapsed.toFixed(3);
  }, 50); 
}


// ===================================
// 3. Pyodide (Ejecución de Python)
// ===================================

/**
 * Carga Pyodide si no está cargado.
 */
function ensurePy(){
  return new Promise(function(resolve){
    if(py){ resolve(py); return; }
    loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.0/full/' })
      .then(function(p){ py = p; resolve(py); })
      .catch(function(e){ console.warn('Pyodide no disponible:', e); resolve(null); });
  });
}

/**
 * Carga el código del algoritmo de ordenamiento desde un archivo .py.
 */
function loadStudentCode(path){
  return fetch(path, { cache:'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('fetch '+path+' '+r.status); return r.text(); })
    .then(function(code){ return py.runPythonAsync(code).then(function(){ return true; }); })
    .catch(function(e){ console.warn('Error cargando .py:', e); return false; });
}

/**
 * Inicializa el estado en el código Python llamando a init(initial_values).
 */
function pyInit(values){
  if(!py) return Promise.resolve();
  resetCounters(); // Reinicia contadores al iniciar o recargar
  py.globals.set('initial_values', values);
  return py.runPythonAsync('init(initial_values)').then(function(){
    pyStepFn = py.globals.get('step');
  });
}

/**
 * Ejecuta un paso del algoritmo de Python, capta los contadores.
 */
function pyStep(){
  if(!pyStepFn) return { done:true };
  var res = pyStepFn();
  try { 
    var act = res.toJs({ dict_converter: Object.fromEntries });
    
    // Captura y actualiza los contadores desde Python
    // CORRECCIÓN CRÍTICA: Se usan las claves "comp_count" y "swap_count" (snake_case)
    if(act.comp_count !== undefined) state.compCount = act.comp_count;
    if(act.swap_count !== undefined) state.swapCount = act.swap_count; 
    
    updateCounters((performance.now() - state.timeStart) / 1000, state.compCount, state.swapCount);
    
    return act;
  }
  finally { 
    if(res && res.destroy) res.destroy(); 
  }
}


// ===================================
// 4. Dibujo (Renderizado)
// ===================================

function draw(){
  if(!ctx) return;
  clearCanvas();

  var W = canvas.width, H = canvas.height;
  var canvasWrap = $('canvasWrap');
  document.querySelectorAll('.bar-value').forEach(function(el){ el.remove(); });

  if(state.mode === 'bars'){
    var n = state.items.length; if(!n) return;
    var gap = Math.round(2 * DPR);
    var usable = W - gap*(n+1);
    if (usable < 1) return;

    var widths = columnWidths(n, usable);
    var maxVal = 1;
    for(var i=0;i<n;i++) if(state.items[i].value > maxVal) maxVal = state.items[i].value;

    var x = gap;
    for(var k=0;k<n;k++){
      var it = state.items[k];
      var w = widths[k] | 0;
      var h = Math.max(2*DPR, (it.value/maxVal) * (H - 10*DPR)) | 0;
      var y = (H - h) | 0;
      var hi = (state.highlight.a===k || state.highlight.b===k);
      
      ctx.fillStyle = hi ? '#22d3ee' : '#334155';
      ctx.fillRect(x|0, y|0, w|0, h|0);

      if (w > 15) {
          var valEl = document.createElement('div');
          valEl.className = 'bar-value';
          valEl.textContent = it.value;
          valEl.style.left = ((x + w/2) / W) * 100 + '%';
          valEl.style.top = ((y - 10) / H) * 100 + '%'; 
          canvasWrap.appendChild(valEl);
      }
      x += w + gap;
    }

  } else {
    // Modo Imagen
    var n2 = state.items.length; if(!n2) return;
    var Himg = Math.floor(canvas.height * 0.9);
    var src = state.imageBitmap;
    var ratio = src ? (src.width/src.height) : (16/9);
    var Wimg = Math.floor(Himg * ratio);
    var startX = Math.floor((canvas.width - Wimg)/2);
    var startY = Math.floor((canvas.height - Himg)/2);

    var widths2 = columnWidths(n2, Wimg);
    var x2 = startX;

    ctx.imageSmoothingEnabled = false;

    for(var m=0;m<n2;m++){
      var bmp = state.items[m].bitmap;
      var w2  = widths2[m] | 0;
      var xx  = x2 | 0;
      var yy  = startY | 0;
      ctx.drawImage(bmp, 0,0,bmp.width,bmp.height, xx,yy, w2, Himg);
      if(state.highlight.a===m || state.highlight.b===m){
        ctx.strokeStyle='#22d3ee'; ctx.lineWidth=2*DPR;
        ctx.strokeRect(xx+1*DPR,yy+1*DPR,w2-2*DPR,Himg-2*DPR);
      }
      x2 += w2;
    }
  }
}


// ===================================
// 5. Control de Algoritmos y Eventos
// ===================================

function getAlgoPyPath(){
  var name = $('algorithm').value.toLowerCase().replace(/[^a-z0-9_]/g,'');
  return 'algorithms/sort_' + name + '.py';
}

function rebuildData(){
  if (!$('sizeVal')) return; 

  var n = parseInt($('size').value, 10);
  $('imgCols').textContent = String(n);
  $('imageCard').style.display = state.mode === 'imageCols' ? '' : 'none';

  var afterData = function(){
    state.original = JSON.parse(JSON.stringify(state.items)); 
    state.highlight = {a:null,b:null};
    draw();

    ensurePy().then(function(p){
      if(!p){ $('modeExec').textContent = 'Demo JS'; return; }
      var path = getAlgoPyPath();
      loadStudentCode(path).then(function(ok){
        if(ok){
          pyInit(state.items.map(function(it){return it.value;})).then(function(){
            $('modeExec').textContent = 'Python: ' + path;
          });
        } else {
          $('modeExec').textContent = 'Demo JS';
        }
      });
    });
  };

  if(state.mode === 'bars'){
    state.items = makeBars(n);
    afterData();
  } else {
    makeImageColumns(n).then(function(items){
      state.items = items;
      afterData();
    });
  }
}

function onShuffle(){
  var after = function(){
    state.original = JSON.parse(JSON.stringify(state.items));
    state.highlight = {a:null,b:null};
    draw();
    ensurePy().then(function(p){
      if(!p) return;
      loadStudentCode(getAlgoPyPath()).then(function(ok){
        if(ok) pyInit(state.items.map(function(it){return it.value;}));
      });
    });
  };
  if(state.mode === 'bars'){
    shuffleArray(state.items); after();
  } else {
    makeImageColumns(state.items.length).then(function(items){
      state.items = items; after();
    });
  }
}

function run(){
  if(!pyStepFn) return;
  
  if(audio) audio.play().catch(e => console.log("Error al reproducir audio:", e));
  
  startTimer();
  state.running = true;
  
  (function loop(){
    if(!state.running) {
        clearInterval(state.timerInterval);
        return;
    }
    
    var t0 = performance.now();
    var act = pyStep(); 

    if(act.done){
      state.running=false;
      state.highlight = {a:null,b:null};
      clearInterval(state.timerInterval); 
      draw();
      if(audio) audio.pause();
      return;
    }
    
    state.highlight = { a: act.a, b: act.b };
    if(act.swap){
      var a=act.a, b=act.b, tmp=state.items[a];
      state.items[a]=state.items[b]; state.items[b]=tmp;
    }
    
    draw();
    var wait = Math.max(5, parseInt($('speed').value,10) - (performance.now()-t0));
    setTimeout(loop, wait);
  })();
}

function stepOnce(){
  if(!pyStepFn) return;
  var act = pyStep(); 
  
  if(act.done){
    state.running=false;
    state.highlight = {a:null,b:null};
    draw();
    return;
  }
  
  state.highlight = { a: act.a, b: act.b };
  if(act.swap){
    var a=act.a, b=act.b, tmp=state.items[a];
    state.items[a]=state.items[b]; state.items[b]=tmp;
  }
  draw();
}

function pause(){
    state.running=false;
    state.highlight = {a:null,b:null};
    if(state.timerInterval) clearInterval(state.timerInterval);
    if(audio) audio.pause();
    draw();
}

function reset(){
  state.running=false;
  state.highlight = {a:null,b:null};
  if(state.timerInterval) clearInterval(state.timerInterval);
  if(audio) audio.pause();
  state.items = JSON.parse(JSON.stringify(state.original));
  draw();
  rebuildData(); 
}

// ===== Inicialización y Listeners =====

document.addEventListener('DOMContentLoaded', function(){
  if (!document.getElementById('canvasWrap')) {
    return; 
  }
  
  ensureCanvas();

  audio = $('music'); 

  window.addEventListener('resize', function(){ ensureCanvas(); draw(); });
  $('mode').addEventListener('change', function(){ state.mode = this.value; rebuildData(); });
  $('algorithm').addEventListener('change', function(){ rebuildData(); });
  $('size').addEventListener('input', function(){ $('sizeVal').textContent = String(this.value); rebuildData(); });
  $('speed').addEventListener('input', function(){ $('speedVal').textContent = String(this.value)+' ms'; state.speed = parseInt(this.value,10); });

  $('shuffle').addEventListener('click', onShuffle);
  $('play').addEventListener('click', function(){ if(!state.running) run(); });
  $('pause').addEventListener('click', pause);
  $('step').addEventListener('click', stepOnce);
  $('reset').addEventListener('click', reset);
  
  $('reloadPy').addEventListener('click', function(){
    ensurePy().then(function(p){
      if(!p) return alert('Pyodide no disponible');
      loadStudentCode(getAlgoPyPath()).then(function(ok){
        if(ok){ pyInit(state.items.map(function(it){return it.value;})).then(function(){ alert('Python recargado'); }); }
        else { alert('No se pudo cargar el .py'); }
      });
    });
  });

  $('imageFile').addEventListener('change', function(e){
    var files = e && e.target ? e.target.files : null;
    var file = files && files[0]; if(!file) return;
    file.arrayBuffer().then(function(arr){
      var blob = new Blob([arr]); var img = new Image(); var url = URL.createObjectURL(blob);
      img.onload = function(){ URL.revokeObjectURL(url);
        var c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        var cctx = c.getContext('2d'); cctx.imageSmoothingEnabled = false;
        cctx.drawImage(img,0,0); state.imageBitmap = c; rebuildData();
      };
      img.src = url;
    });
  });

  $('sizeVal').textContent = $('size').value;
  $('speedVal').textContent = $('speed').value + ' ms';
  rebuildData();
});