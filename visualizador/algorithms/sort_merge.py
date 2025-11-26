# Template genérico — SKELETON
# Contrato: init(vals), step() -> {"a": int, "b": int, "swap": bool, "done": bool}

items = []
n = 0
# Agregá acá tus punteros/estado, p.ej.:
# i = 0; j = 0; fase = "x"; stack = []

def init(vals):
    global items, n
    items = list(vals)
    n = len(items)
    # TODO: inicializar punteros/estado

def step():
    # TODO: implementar UN micro-paso de tu algoritmo y devolver el dict.
    # Recordá:
    # - a, b dentro de [0, n-1]
    # - si swap=True, primero hacé el intercambio en 'items'
    # - cuando termines, devolvé {"done": True}
    return {"done": True}
# =========================================================
# MERGE SORT (In-Place / In-situ) - COMPATIBLE CON JS
# Contrato: {"a": int, "b": int, "swap": bool, "done": bool, "comp_count": int, "swap_count": int}
#
# Esta implementación usa un enfoque "In-Place" que mueve los elementos
# mediante intercambios (swaps) sucesivos.
# =========================================================

# Variables de estado
items = []
n = 0

# Pila de tareas: (start, mid, end)
pending_merges = [] 

# Estado de la fusión actual:
current_merge_state = None 

# Variables de rendimiento
comparison_count = 0 
swap_count = 0      

def init(vals):
    global items, n, pending_merges, current_merge_state, comparison_count, swap_count
    
    items = list(vals)
    n = len(items)
    comparison_count = 0 
    swap_count = 0
    current_merge_state = None

    # Generación de tareas iterativa (Bottom-Up)
    pending_merges = []
    size = 1
    while size < n:
        for start in range(0, n - size, size * 2):
            mid = start + size - 1
            end = min(start + size * 2 - 1, n - 1)
            pending_merges.append((start, mid, end))
        size *= 2
    
def step():
    global items, n, pending_merges, current_merge_state, comparison_count, swap_count
    
    # 1. Si no hay tareas ni estado activo, terminamos
    if not pending_merges and current_merge_state is None:
        return {
            "done": True, "a": None, "b": None, "swap": False, 
            "comp_count": comparison_count, "swap_count": swap_count
        }

    # 2. Iniciar nueva tarea si es necesario
    if current_merge_state is None:
        start, mid, end = pending_merges.pop(0)
        current_merge_state = {
            "start": start, "mid": mid, "end": end,
            "i": start,      # Inicio del sub-array izquierdo
            "j": mid + 1,    # Inicio del sub-array derecho
            "mode": 'compare'
        }
        # Retorno "dummy" para resaltar el inicio
        return {
            "a": start, "b": end, "swap": False, "done": False, 
            "comp_count": comparison_count, "swap_count": swap_count
        }

    # 3. Procesar estado actual
    st = current_merge_state
    
    # Verificar si terminamos esta fusión (cuando i o j salen de sus rangos)
    if st['i'] > st['mid'] or st['j'] > st['end']:
        current_merge_state = None
        return {
            "a": st['end'], "b": st['end'], "swap": False, "done": False,
            "comp_count": comparison_count, "swap_count": swap_count
        }

    # MODO COMPARACIÓN
    if st['mode'] == 'compare':
        comparison_count += 1
        a_idx, b_idx = st['i'], st['j']
        
        # Si el elemento izquierdo es menor o igual, ya está en su sitio
        if items[a_idx] <= items[b_idx]:
            st['i'] += 1
            return {
                "a": a_idx, "b": b_idx, "swap": False, "done": False,
                "comp_count": comparison_count, "swap_count": swap_count
            }
        else:
            # El elemento derecho (j) es menor. Debe moverse a (i).
            # Cambiamos a modo 'shift' para moverlo burbujeando hacia la izquierda.
            st['mode'] = 'shift'
            st['shift_k'] = st['j']
            return {
                "a": a_idx, "b": b_idx, "swap": False, "done": False,
                "comp_count": comparison_count, "swap_count": swap_count
            }

    # MODO DESPLAZAMIENTO (Simula inserción con swaps)
    elif st['mode'] == 'shift':
        # Intercambiamos shift_k con el anterior (shift_k - 1)
        idx = st['shift_k']
        prev = idx - 1
        
        items[idx], items[prev] = items[prev], items[idx]
        swap_count += 1
        
        st['shift_k'] -= 1
        
        # Si el elemento llegó a la posición 'i', el desplazamiento terminó
        if st['shift_k'] == st['i']:
            # Ajustamos punteros:
            st['i'] += 1
            st['mid'] += 1
            st['j'] += 1
            st['mode'] = 'compare'
        
        return {
            "a": idx, "b": prev, "swap": True, "done": False,
            "comp_count": comparison_count, "swap_count": swap_count
        }

    return {"done": True, "comp_count": comparison_count, "swap_count": swap_count} # Fallback