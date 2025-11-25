# Template genérico — SKELETON
# Contrato: init(vals), step() -> {"a": int, "b": int, "swap": bool, "done": bool}

items = []
n = 0
inicio = None
fin = None
i = None
j = None
# Agregá acá tus punteros/estado, p.ej.:
# i = 0; j = 0; fase = "x"; stack = []

def init(vals):
    global items,n,inicio,fin,i,j
    items = list(vals)
    n = len(items)
    inicio = 0
    fin = n-1
    i = None
    j = inicio
    # TODO: inicializar punteros/estado

def step():
    global items, n, inicio, fin, i, j
    #algoritmo quick sort 

    # 1- Agarro el ultimo
    
    #pivot_val = items[fin] ← no lo mezcles con el índice guardado
    pivot = fin
    #2- Recorro desde el primero hasta el ante ultimo
    #items[fin] va a ser pivot_val
    if items[j] > items[pivot]:
        if i == None:
            i = j
        else:
            j=j+1
        return {"a": pivot, "b": j, "swap": False, "done": False}
    #j va a recorrer de inicio a fin-1 
    #si items[j] > pivot_val
    #si i = none, guardo i = j 
    #si i ya tiene valor, no hago nada (avanzo j)

    if items[j] < pivot:
        if i == None:
            j=j+1
        else:
            items[i],items[j] = items[j], items[i]
            temp = i
            i = i+1
        return {"a": temp, "b": j, "swap": True, "done": False}
    #si items[j] <= pivot_val
    #si i es none, no hago nada (avanzo j)
	#si i tiene un valor, hago swap items[i], items[j], guardado y avanzo i en uno, avanzo j en uno

    #3- al terminar de pasar:
    #si i es none, no hago swap al final, el pivot ya esta en el final
    #si i no es none, hago swap(items[i], items[fin] para poner el pivot en i
    return {"Done": True}