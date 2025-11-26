# Template genérico — SKELETON
# Contrato: init(vals), step() -> {"a": int, "b": int, "swap": bool, "done": bool}

items = []
n = 0
inicio = None
fin = None
i = None
j = None   
stack = []
comparison_count = 0 
swap_count = 0    
# Defino las variables
def init(vals):
    global items,n,inicio,fin,i,j,stack,comparison_count, swap_count
    items = list(vals) #la lista
    n = len(items) # la longitud de la lista
    inicio = 0 #
    fin = n-1 #
    i = None #
    j = inicio #
    # TODO: inicializar punteros/estado
    stack.append([inicio, fin])

def step():
    global items, n, inicio, fin, i, j, stack, comparison_count, swap_count
    
    if len(stack) == 0:
        return {"done": True, "comp_count": comparison_count,"swap_count": swap_count}
    inicioAFin = stack.pop()
       
    comparison_count +=1
    current = inicioAFin[0] + j
    pivot = inicioAFin[1]

    if current < pivot:
        if items[current] > items[pivot]:
            if i == None:
                i = current
            else:
                j=j+1
            stack.append(inicioAFin) #
            print(pivot, current)
            return {"a": pivot, "b": current, "swap": False, "done": False, "comp_count": comparison_count,"swap_count": swap_count}

        if items[current] < items[pivot]:
            if i == None:
                j=j+1
            else:
                items[i],items[current] = items[current], items[i]
                temp = i
                i = i+1
        
                stack.append(inicioAFin)
                swap_count +=1
                return {"a": temp, "b": current, "swap": True, "done": False, "comp_count": comparison_count,"swap_count": swap_count}
  
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
            swap_count +=1
            return {"a": temp, "b": current, "swap": True, "done": False,"comp_count": comparison_count,"swap_count": swap_count}
        else:
            if (inicioAFin[0] < inicioAFin[1]-1):
                stack.append([inicioAFin[0], inicioAFin[1]-1])
            j = 0
    return {"done": False, "comp_count": comparison_count,"swap_count": swap_count}