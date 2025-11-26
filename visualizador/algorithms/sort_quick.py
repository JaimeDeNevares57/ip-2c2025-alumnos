# Template genérico — SKELETON
# Contrato: init(vals), step() -> {"a": int, "b": int, "swap": bool, "done": bool}

items = []
n = 0
inicio = None
fin = None
i = None
j = None   
# Agregá acá tus punteros/estado, p.ej.:
# i = 0; j = 0; fase = "x"; 
stack = []


def init(vals):
    global items,n,inicio,fin,i,j,stack
    items = list(vals)
    n = len(items)
    inicio = 0
    fin = n-1
    i = None
    j = inicio
    # TODO: inicializar punteros/estado
    stack.append([inicio, fin])

def step():
    global items, n, inicio, fin, i, j, stack
    
    if len(stack) == 0:
        return {"done": True}
    #algoritmo quick sort 
    inicioAFin = stack.pop()
    # 1- Agarro el ultimo
    
    #pivot_val = items[fin] ← no lo mezcles con el índice guardado
    
    current = inicioAFin[0] + j
    pivot = inicioAFin[1]

    if current < pivot:
    #2- Recorro desde el primero hasta el ante ultimo
    #items[fin] va a ser pivot_val
        if items[current] > items[pivot]:
            if i == None:
                i = current
            else:
                j=j+1
            stack.append(inicioAFin) #
            print(pivot, current)
            return {"a": pivot, "b": current, "swap": False, "done": False}
        #j va a recorrer de inicio a fin-1 
        #si items[j] > pivot_val
        #si i = none, guardo i = j 
        #si i ya tiene valor, no hago nada (avanzo j)

        if items[current] < items[pivot]:
            if i == None:
                j=j+1
            else:
                items[i],items[current] = items[current], items[i]
                temp = i
                i = i+1
        
                stack.append(inicioAFin)
                return {"a": temp, "b": current, "swap": True, "done": False}
    #si items[j] <= pivot_val
    #si i es none, no hago nada (avanzo j)
	#si i tiene un valor, hago swap items[i], items[j], guardado y avanzo i en uno, avanzo j en uno

    #3- al terminar de pasar:
    #si i es none, no hago swap al final, el pivot ya esta en el final
    #si i no es none, hago swap(items[i], items[fin] para poner el pivot en i
    
        stack.append(inicioAFin)
    else:
        if i != None:
        #Particion de mitades y ordenar pivot
            items[pivot], items[i] = items[i], items[pivot]
            if (inicioAFin[0] < i-1):
                stack.append([inicioAFin[0], i-1])
            
            if (inicioAFin[1] > i+1):
                stack.append([i+1, inicioAFin[1]])
            
            temp = i
            #reinicio las variables
            j = 0
            i = None
            return {"a": temp, "b": current, "swap": True, "done": False}
        else:
            if (inicioAFin[0] < inicioAFin[1]-1):
                stack.append([inicioAFin[0], inicioAFin[1]-1])
            j = 0
    return {"done": False}