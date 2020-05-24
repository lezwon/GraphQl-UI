function selectGenerator(object) {
    let selectNode = document.createElement('select')
    selectNode.setAttribute('id', object['__id'])

    object['__values'].map((el) => {
        let optionNode = document.createElement("option");
        optionNode.setAttribute("value", el);
        let textNode = document.createTextNode(el);
        optionNode.appendChild(textNode);
        selectNode.appendChild(optionNode);
    })
    return selectNode
}

function checkboxGenerator(object) {
    let input = document.createElement("input");
    input.setAttribute('id', object['__id'])
    input.setAttribute("type", "checkbox");
    return input
}

function numberboxGenerator(object) {
    let input = document.createElement("input");
    input.setAttribute('id', object['__id'])
    input.setAttribute("type", "number");
    return input
}

function textboxGenerator(object) {
    let input = document.createElement("input");
    input.setAttribute('id', object['__id'])
    input.setAttribute("type", "text");
    return input
}

function accordionGenerator(object) {
    let panel = document.createElement("div");
    panel.className = "panel panel-default"
    let panelHeading = document.createElement("div");
    panelHeading.className = "panel-heading"
    let panelTitle = document.createElement("h4");
    panelTitle.className = "panel-title"
    let linkTitle = document.createElement("a");
    linkTitle.innerText = object['__name']
    linkTitle.href = "#" + object['__id']
    linkTitle.setAttribute("data-toggle","collapse")
    let panelCollapse = document.createElement("div");
    panelCollapse.className = "panel-collapse collapse"
    panelCollapse.id = object['__id']
    let panelBody = document.createElement("div");
    panelBody.className = "panel-body"

    panelTitle.appendChild(linkTitle)
    panelHeading.appendChild(panelTitle)
    panel.appendChild(panelHeading)
    panel.appendChild(panelCollapse)
    panelCollapse.appendChild(panelBody)
    
    return panel
}

function parseToHtml(object) {
    if (object['__kind'] == 'ENUM') {
        return selectGenerator(object)
    } else if (object['__kind'] == 'SCALAR') {
        switch(object['__name']){
            case 'Boolean':
                return checkboxGenerator(object)
                break;
            case 'Int':
                return numberboxGenerator(object)
                break;
            default:
                return textboxGenerator(object)
        }
        
    } else if (object['__kind'] == 'INPUT_OBJECT' || object['__kind'] == 'OBJECT'){
        return accordionGenerator(object)
    }
}

function parseObject(payload) {
    let newPayload = {}
    if (!Array.isArray(payload) && payload['__type'] == 'system') {
        let element = parseToHtml(payload)
        return element
    }

    for (let [key, value] of Object.entries(payload)) {
        if (value instanceof Object && !Array.isArray(value)) {
            newPayload[key] = parseObject(value)
        } else if (Array.isArray(value)) {
            newPayload[key] = value.map((el) => {
                return parseObject(el)
            })
        }
    }
    return newPayload
}

function generateDiv(key, value, array = false){
    let sign = array ? '[]' : '->'
    let tr = document.createElement('tr')
    let td_1 = document.createElement('td')
    let td_2 = document.createElement('td')
    let itemName = document.createTextNode(key + sign)
    td_1.appendChild(itemName)
    td_2.appendChild(value)
    tr.appendChild(td_1)
    tr.appendChild(td_2)
    return tr
}

function renderItems(payload) {
    let elements = []
    if(payload instanceof HTMLElement){
        return payload
    } else if (Array.isArray(payload)){
        return payload[0]
    } else if(payload instanceof Object){
        elements = Object.entries(payload).map(([key, value]) => {
            if (value instanceof Object){
                return generateDiv(key, renderItems(value))
            }
        })
    }
    table = document.createElement('table')
    elements.forEach((el) => { table.appendChild(el) })
    return table
}

function parseInput(payload){
    if(payload instanceof HTMLElement){
        if (payload.tagName == "DIV"){
            panelBody = payload.lastElementChild.firstElementChild
            if (panelBody.children.length > 0){
                let children = {}
                for (tr of panelBody.firstChild.children){
                    let [key, ..._] = tr.firstChild.innerText.split("->")
                    children[key] = parseInput(tr.lastChild.firstChild)
                }
                return children
            }else{
                return null
            }
        }
        else {
            value = payload.value
            switch (payload.type){
                case "checkbox":
                    return payload.checked
                case "number":
                    return parseInt(value)
                default:
                    return value
            }
        }
    } else if (Array.isArray(payload)){
        return payload.map((el) => { return parseInput(el) })
    } else if(payload instanceof Object){
        let newCopy = {}
        Object.entries(payload).forEach(([key, value]) => {
            if (value instanceof Object){
                newCopy[key] = parseInput(value)
            }
        })
        return newCopy
    }
}