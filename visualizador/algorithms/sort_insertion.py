# =========================================================
# INSERTION SORT - IMPLEMENTACIÓN ROBUSTA CON CONTADORES
# Contrato de retorno extendido: 
# {"a": int, "b": int, "swap": bool, "done": bool, "comp_count": int, "swap_count": int}
# =========================================================

items = []
n = 0
i = 0      # elemento que queremos insertar
j = None   # cursor de desplazamiento hacia la izquierda (None = empezar)

# Variables de rendimiento
comparison_count = 0 
swap_count = 0 

def init(vals):
    # Declaramos globales las variables de estado y rendimiento
    global items, n, i, j, comparison_count, swap_count

    items = list(vals)
    n = len(items)
    i = 1      # común: arrancar en el segundo elemento
    j = None

def step():
    # TODO:
    # Declaramos globales las variables que vamos a modificar
    global items, n, i, j, comparison_count, swap_count

    # - Si i >= n: devolver {"done": True}.
    if i >= n:
        return {"done": True, "comp_count": comparison_count, "swap_count": swap_count}
    # - Si j es None: empezar desplazamiento para el items[i] (p.ej., j = i) y devolver un highlight sin swap.
    if j is None:
        j = i
        return {"a": i, "b": j, "swap": False, "done": False}
    # - Mientras j > 0 y items[j-1] > items[j]: hacer UN swap adyacente (j-1, j) y devolverlo con swap=True.
    comparison_count += 1
    if j > 0:
        while items[j-1] > items[j]:
            items[j], items[j-1] = items[j-1], items[j]
            swap_count += 1       
            return {"a": j, "b": j-1, "swap": True, "done": False, "comp_count": comparison_count, "swap_count": swap_count}
    j = j-1
    # - Si ya no hay que desplazar: avanzar i y setear j=None.
    if items[j] > items[j-1]:
        i = i + 1
        j = None
    return {"done": False, "swap": False}
