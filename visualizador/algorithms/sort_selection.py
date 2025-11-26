# Contrato: init(vals), step() -> {"a": int, "b": int, "swap": bool, "done": bool}

items = []
n = 0
i = 0          # cabeza de la parte no ordenada
j = 0          # cursor que recorre y busca el mínimo
min_idx = 0    # índice del mínimo de la pasada actual
fase = "buscar"  # "buscar" | "swap"
comparison_count = 0 
swap_count = 0  

def init(vals):
    global items, n, i, j, min_idx, fase
    items = list(vals)
    n = len(items)
    i = 0
    j = i + 1
    min_idx = i
    fase = "buscar"

def step():
    global items, n, i, j, min_idx, fase,comparison_count, swap_count 
    # - Fase "buscar": comparar j con min_idx, actualizar min_idx, avanzar j.
    if fase == "buscar":
        comparison_count +=1
        if  j < n:  
            if items[j] < items[min_idx]:
                min_idx = j
            j = j+1
    #   Devolver {"a": min_idx, "b": j_actual, "swap": False, "done": False}.
            return {"a": min_idx, "b": j, "swap": False, "done": False, "comp_count": comparison_count,"swap_count": swap_count}
    #   Al terminar el barrido, pasar a fase "swap".
    
    fase = "swap"
    
    if fase == "swap":
        # if min_idx != i:
            if items[i] > items[min_idx]:
                swap_count +=1
                # aux = items[min_idx]
                # items[min_idx] = items[i]
                # items[i] = aux
                items[min_idx], items[i] = items[i], items[min_idx]
                return {"a": i, "b": min_idx, "swap": True, "done": False, "comp_count": comparison_count,"swap_count": swap_count}
    # - Fase "swap": si min_idx != i, hacer ese único swap y devolverlo.
    #   Luego avanzar i, reiniciar j=i+1 y min_idx=i, volver a "buscar".
    i = i+1
    j = i+1
    min_idx = i
    fase = "buscar"
    if i < n:
        return {"a": min_idx, "b": j, "swap": False, "done": False, "comp_count": comparison_count,"swap_count": swap_count}
    #
    # Cuando i llegue al final, devolvé {"done": True}.
    
    return {"done": True, "comp_count": comparison_count,"swap_count": swap_count}
