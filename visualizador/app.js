'use strict';

// Función auxiliar para obtener elementos por ID
function $(id){ return document.getElementById(id); }

var canvas = null, ctx = null, DPR = 1;

/**
 * Asegura que el canvas esté inicializado y dimensionado correctamente.
 * Se llama al inicio y al redimensionar la ventana.
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
 * Reparte 'total' en 'n' enteros que suman exactamente 'total',
 * minimizando errores de redondeo.
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

// ===== Estado de la aplicación =====
var state = {
  mode: 'bars',
  items: [],
  original: [], // Copia del estado inicial para el botón Reset
  running: false,
  speed: 50,
  highlight: {a:null,b:null}, // Índices a resaltar
  imageBitmap: null // Canvas/Imagen fuente para el modo columnas
};

// ===== Helpers =====
function randInt(min,max){ return (Math.random()*(max-min+1)+min)|0; }
function shuffleArray(a){ for(var i=a.length-1;i>0;i--){ var j=randInt(0,i), t=a[i]; a[i]=a[j]; a[j]=t; } }

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
      // Generar una imagen por defecto si no se ha cargado una
      var off = document.createElement('canvas');
      off.width = 800; off.height = 500;
      var octx = off.getContext('2d');
      octx.imageSmoothingEnabled = false;
      var grad = octx.createLinearGradient(0,0,off.width,off.height);
      grad.addColorStop(0,'#38bdf8'); grad.addColorStop(1,'#a78bfa');
      octx.fillStyle = grad; octx.fillRect(0,0,off.width,off.height);
      state.imageBitmap = off; // canvas fuente
    }
    var img = state.imageBitmap, W = img.width, H = img.height;
    var colW = Math.max(1, Math.floor(W / n));
    var pieces = [];
    for(var i=0;i<n;i++){
      var slice = document.createElement('canvas');
      slice.width = colW; slice.height = H;
      var sctx = slice.getContext('2d');
      sctx.imageSmoothingEnabled = false;
      // Dibujar la porción de la imagen original en el nuevo canvas (slice)
      sctx.drawImage(img, i*colW,0,colW,H, 0,0,colW,H);
      pieces.push({ originalIndex:i, slice:slice });
    }
    shuffleArray(pieces);
    var out = new Array(n);
    // El 'value' es el índice original, que es lo que se ordenará
    for(var j=0;j<n;j++) out[j] = { value: pieces[j].originalIndex, bitmap: pieces[j].slice, originalIndex: pieces[j].originalIndex };
    resolve(out);
  });
}

// ===== Dibujo (Renderizado) =====
function draw(){
  if(!ctx) return;
  clearCanvas();

  var W = canvas.width, H = canvas.height;

  if(state.mode === 'bars'){
    // --- Modo Barras ---
    var n = state.items.length; if(!n) return;
    var gap = Math.round(2 * DPR);
    var usable = W - gap*(n+1);
    if (usable < 1) return;

    var widths = columnWidths(n, usable);
    var maxVal = 1;
    // Buscar el valor máximo para normalizar la altura
    for(var i=0;i<n;i++) if(state.items[i].value > maxVal) maxVal = state.items[i].value;

    var x = gap;
    for(var k=0;k<n;k++){
      var it = state.items[k];
      var w  = widths[k] | 0;
      var h  = Math.max(2*DPR, (it.value/maxVal) * (H - 10*DPR)) | 0;
      var y  = (H - h) | 0;
      var hi = (state.highlight.a===k || state.highlight.b===k);
      // Colores de las barras
      ctx.fillStyle = hi ? '#22d3ee' : '#334155';
      ctx.fillRect(x|0, y|0, w|0, h|0);
      x += w + gap;
    }

  } else {
    // --- Modo Imagen ---
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
      // Dibujar el slice de la imagen
      ctx.drawImage(bmp, 0,0,bmp.width,bmp.height, xx,yy, w2, Himg);
      // Dibujar borde resaltado
      if(state.highlight.a===m || state.highlight.b===m){
        ctx.strokeStyle='#22d3ee'; ctx.lineWidth=2*DPR;
        ctx.strokeRect(xx+1*DPR,yy+1*DPR,w2-2*DPR,Himg-2*DPR);
      }
      x2 += w2;
    }
  }
}

// ===== Pyodide (Ejecución de Python) =====
var py = null, pyStepFn = null;

/**
 * Carga Pyodide si no está cargado.
 */
function ensurePy(){
  return new Promise(function(resolve){
    if(py){ resolve(py); return; }
    // Asume que loadPyodide ya está disponible globalmente por la etiqueta <script>
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
  py.globals.set('initial_values', values);
  return py.runPythonAsync('init(initial_values)').then(function(){
    // Guarda la referencia a la función step() de Python
    pyStepFn = py.globals.get('step');
  });
}

/**
 * Ejecuta un paso del algoritmo de Python llamando a step().
 */
function pyStep(){
  if(!pyStepFn) return { done:true };
  var res = pyStepFn();
  try { 
    // Convierte el resultado de Python (un diccionario) a un objeto JS
    return res.toJs({ dict_converter: Object.fromEntries }); 
  }
  finally { 
    // Limpia el objeto Pyodide para liberar memoria
    if(res && res.destroy) res.destroy(); 
  }
}

// ===== Utilidades de Control =====

/**
 * Obtiene la ruta del archivo Python basada en el selector de algoritmo.
 */
function getAlgoPyPath(){
  var name = $('algorithm').value.toLowerCase().replace(/[^a-z0-9_]/g,'');
  return 'algorithms/sort_' + name + '.py';
}

/**
 * Genera el nuevo dataset, reinicia el estado y carga el código Python.
 */
function rebuildData(){
  var n = parseInt($('size').value, 10);
  $('imgCols').textContent = String(n);
  $('imageCard').style.display = state.mode === 'imageCols' ? '' : 'none';

  var afterData = function(){
    state.original = JSON.parse(JSON.stringify(state.items)); // Guardar para reset
    state.highlight = {a:null,b:null};
    draw();

    // Intentar leer Python
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

/**
 * Mezcla el dataset actual y reinicia el estado de Python.
 */
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

/**
 * Inicia la ejecución automática del algoritmo.
 */
function run(){
  if(!pyStepFn) return;
  state.running = true;
  (function loop(){
    if(!state.running) return;
    var t0 = performance.now();
    var act = pyStep();

    if(act.done){
      state.running=false;
      state.highlight = {a:null,b:null};
      draw();
      return;
    }
    state.highlight = { a: act.a, b: act.b };
    if(act.swap){
      // Intercambio visual de los elementos en JavaScript
      var a=act.a, b=act.b, tmp=state.items[a];
      state.items[a]=state.items[b]; state.items[b]=tmp;
    }
    draw();
    // Cálculo del tiempo de espera para respetar el slider de velocidad
    var wait = Math.max(5, parseInt($('speed').value,10) - (performance.now()-t0));
    setTimeout(loop, wait);
  })();
}

/**
 * Ejecuta un solo paso del algoritmo.
 */
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

/**
 * Restaura los datos al estado inicial desordenado.
 */
function reset(){
  state.running=false;
  state.highlight = {a:null,b:null};
  state.items = JSON.parse(JSON.stringify(state.original));
  draw();
}

// ===== Inicialización y Listeners =====

document.addEventListener('DOMContentLoaded', function(){
  ensureCanvas();

  // Redimensionar canvas al cambiar la ventana
  window.addEventListener('resize', function(){ ensureCanvas(); draw(); });

  // Listener para selectores de modo/algoritmo
  $('mode').addEventListener('change', function(){ state.mode = this.value; rebuildData(); });
  $('algorithm').addEventListener('change', function(){ rebuildData(); });

  // Listeners para sliders
  $('size').addEventListener('input', function(){ $('sizeVal').textContent = String(this.value); rebuildData(); });
  $('speed').addEventListener('input', function(){ $('speedVal').textContent = String(this.value)+' ms'; state.speed = parseInt(this.value,10); });

  // Listeners para botones de acción
  $('shuffle').addEventListener('click', function(){ onShuffle(); });
  $('play').addEventListener('click', function(){ if(!state.running) run(); });
  $('pause').addEventListener('click', function(){
    state.running=false;
    state.highlight = {a:null,b:null};
    draw();
  });
  $('step').addEventListener('click', function(){ stepOnce(); });
  $('reset').addEventListener('click', function(){ reset(); });
  $('reloadPy').addEventListener('click', function(){
    ensurePy().then(function(p){
      if(!p) return alert('Pyodide no disponible');
      loadStudentCode(getAlgoPyPath()).then(function(ok){
        if(ok){ pyInit(state.items.map(function(it){return it.value;})).then(function(){ alert('Python recargado'); }); }
        else { alert('No se pudo cargar el .py'); }
      });
    });
  });

  // Listener para la carga de archivos de imagen
  $('imageFile').addEventListener('change', function(e){
    var files = e && e.target ? e.target.files : null;
    var file = files && files[0]; if(!file) return;
    file.arrayBuffer().then(function(arr){
      var blob = new Blob([arr]); var img = new Image(); var url = URL.createObjectURL(blob);
      img.onload = function(){ URL.revokeObjectURL(url);
        // Dibujar la imagen en un canvas intermedio para tener un 'bitmap' uniforme
        var c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        var cctx = c.getContext('2d'); cctx.imageSmoothingEnabled = false;
        cctx.drawImage(img,0,0); state.imageBitmap = c; rebuildData();
      };
      img.src = url;
    });
  });

  // Inicialización de valores mostrados y carga de datos iniciales
  $('sizeVal').textContent = $('size').value;
  $('speedVal').textContent = $('speed').value + ' ms';
  rebuildData();
});