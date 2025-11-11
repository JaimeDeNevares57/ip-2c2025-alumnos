# Contrato: init(vals), step() -> {"a": int, "b": int, "swap": bool, "done": bool}

#items2 = [4,5,6,7,1,8,10]
items=[]
n = 0
i = 0
j = 0

def init(vals):
    global items, n, i, j
    items = list(vals) #copia la lista de valores
    n = len(items)
    i = 0 #cantidad de pasadas por la lista
    j = 0 #indices a comparar

def step():
    global items, n, i, j
    # 1. Revisar si terminamos todas las pasadas dentro de la lista (n-1 final de la lista)
    if i >= n - 1:
        return {"done": True}

    swap = False # 2. Definir estado por defecto para este paso
    
    # 3. Definir los índices 'a' y 'b' a comparar (según el contrato)
    a = j            # Siempre comparamos j y j+1 (dos indices)
    b = j + 1

    # 4. Ejecutar la lógica de Bubble Sort
    if items[a] > items[b]:
        items[a], items[b] = items[b], items[a]  # Intercambiar
        swap = True #mando swap=true para visualizar el intercambio

    # 5. Avanzar los punteros (índices) para el próximo paso
    j += 1

    # 6. Revisar si la "burbuja" (j) llegó al final de la parte no ordenada
    # La parte no ordenada es n - 1 - i (i es lo que ya ordenamos)
    if j >= n - 1 - i:
        j = 0      # Reiniciamos la burbuja para la siguiente pasada
        i += 1     # Avanzamos a la siguiente pasada

    # Devolvemos los índices 'a' y 'b' que acabamos de comparar
    return {"a": a, "b": b, "swap": swap, "done": False}
