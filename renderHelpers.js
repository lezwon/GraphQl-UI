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

function textboxGenerator(object) {
    let textbox = document.createElement("input");
    textbox.setAttribute('id', object['__id'])
    textbox.setAttribute("type", "text");
    return textbox
}

function parseToHtml(object) {
    if (object['__kind'] == 'ENUM') {
        return selectGenerator(object)
    } else if (object['__kind'] == 'SCALAR') {
        return textboxGenerator(object)
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
    let div = document.createElement('div')
    let itemName = document.createTextNode(key + sign)
    div.appendChild(itemName)
    div.appendChild(value)
    return div
}

function renderItems(payload) {
    let elements = []
    if(payload instanceof HTMLElement){
        return payload
    } else if (Array.isArray(payload)){
        elements = payload.map((el) => { return generateDiv('Array', renderItems(el), true) })
    } else if(payload instanceof Object){
        elements = Object.entries(payload).map(([key, value]) => {
            if (value instanceof Object){
                return generateDiv(key, renderItems(value))
            }
        })
    }

    let div = document.createElement('div')
    elements.forEach((el) => { div.appendChild(el) })
    return div
}

function parseInput(payload){
    if(payload instanceof HTMLElement){
        return payload.value
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