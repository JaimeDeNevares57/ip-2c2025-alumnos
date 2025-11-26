# =========================================================
# BUBBLE SORT - IMPLEMENTACIÓN ROBUSTA CON CONTADORES
# Contrato de retorno extendido: 
# {"a": int, "b": int, "swap": bool, "done": bool, "comp_count": int, "swap_count": int}
# =========================================================

# Variables de estado del algoritmo
items = []
n = 0
i = 0  # Índice de pasadas (elementos ya ordenados al final)
j = 0  # Índice de comparación actual (la "burbuja")

# Variables de rendimiento
comparison_count = 0 
swap_count = 0      

def init(vals):
    # Declaramos globales las variables de estado y rendimiento
    global items, n, i, j, comparison_count, swap_count
    
    items = list(vals)
    n = len(items)
    i = 0  # Reiniciar pasadas
    j = 0  # Reiniciar puntero de burbuja
    
    # Reinicialización de contadores
    comparison_count = 0 
    swap_count = 0

def step():
    # Declaramos globales las variables que vamos a modificar
    global items, n, i, j, comparison_count, swap_count
    
    # 1. Revisar si terminamos todas las pasadas (n-1 pasadas son necesarias)
    if i >= n - 1:
        # Fin del algoritmo
        return {
            "done": True, 
            "a": None, "b": None, 
            "swap": False, 
            "comp_count": comparison_count, 
            "swap_count": swap_count
        }

    swap = False 
    
    # Los índices a comparar son j y j+1
    a = j 
    b = j + 1

    # 2. Lógica de Bubble Sort
    
    # INCREMENTO 1: Cada vez que entramos aquí es una comparación de elementos.
    comparison_count += 1
    
    if items[a] > items[b]:
        items[a], items[b] = items[b], items[a]  # Intercambiar en el array interno
        swap = True 
        
        # INCREMENTO 2: Solo incrementamos si realmente hubo un intercambio.
        swap_count += 1 

    # 3. Avanzar los punteros (índices) para el próximo paso
    j += 1

    # 4. Revisar si la burbuja (j) llegó al final de la parte no ordenada
    # El final de la pasada es (n - 1 - i)
    if j >= n - 1 - i:
        j = 0     # Reiniciamos la burbuja al inicio del array
        i += 1    # Avanzamos a la siguiente pasada (la última posición ya está ordenada)

    # 5. Devolver los resultados del paso
    return {"a": a,"b": b, "swap": swap, "done": False, "comp_count": comparison_count, "swap_count": swap_count}