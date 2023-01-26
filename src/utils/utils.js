const parse = require('date-fns/parse');
const qs = require('qs');
const fetch = require("node-fetch");

const parseOrderDataString = (str) => {
    const orderDataArray = [];
    let fieldStr = '';
    let isQuote = false;
    for(let i = 0; i < str.length; i++) {
        if(str[i] === "\"" && isQuote) {
            isQuote = false;
            // orderDataArray.push(fieldStr);
            // fieldStr = '';
            continue;
        }
        if(str[i] === "\"" && !isQuote) {
            isQuote = true;
            continue;
        }
        if(str[i] === ";" && isQuote) {
            fieldStr = fieldStr + ";";
            continue;
        }
        if(str[i] === ";" && !isQuote) {
            orderDataArray.push(fieldStr);
            fieldStr = '';
            continue;
        }
        fieldStr = fieldStr + str[i];
    }
    if(fieldStr.length) {
        orderDataArray.push(fieldStr);
    }
    const orderDataKeys = [
        'Номер заказа',
        'Заведён',
        'Отгрузка',
        'Название',
        'Вид работ',
        'Тираж',
        'Материал',
        'Описание',
        'Доп. инфо',
        'Менеджер',
        'Филиал',
        'Доставка',
        'Заказчик',
        'Дата согласования',
        'Стоимость',
        'Тип-1',
        'Тип-2',
        'Готовность',
        'Инфо по доставке',
        'Нечто',
        'Способ отправки',
        'Согласовано',
        'Причина скидки'
    ];
    const orderDataObj = orderDataKeys.reduce((acc, key, index) => {
        if(orderDataArray[index] !== undefined) {
            acc[key] = orderDataArray[index][0] === "\"" ? orderDataArray[index].slice(1, orderDataArray[index].length - 1) : orderDataArray[index];
        }
        return acc;
    }, {});
    // console.log('Order data obj: ', orderDataObj);
    if('Согласовано' in orderDataObj) {
        orderDataObj['Согласовано'] = orderDataObj['Согласовано'].includes('-') ? 'Да' : 'Нет';
    }
    return orderDataObj;
};

const parseOrderSitesString = (str) => {
    const linesArr= str.trim().split(/\r?\n/);
    const obj = linesArr.reduce((acc, statusStr) => {
        console.log('status string: ', statusStr);
        const fieldsArr = statusStr.split(";");
        console.log('fields: ', fieldsArr);
        const key = fieldsArr[0];
        console.log('key: ', key);
        acc[key] = {
            isDone: !!parseInt(fieldsArr[1])
        }
        if(fieldsArr[2].length) {
            acc[key].doneDate = parse(fieldsArr[2], 'd.M.yyyy H:mm:ss', new Date());
            acc[key].userAccessStr = fieldsArr[3].slice(1, -1);
        }
        return acc;
    }, {});

    console.log('parse order sites result: ', obj);

    return obj;
}

const strToOrderNumber = (str) => {
    try {
        const orderNumber = parseInt(str.replace(/ /g, ''));
        if(orderNumber) {
            console.log('Correct request. Order number: ', orderNumber);
            return orderNumber;
        } else {
            console.log('Incorrect request. No success.');
            return false;
        }
    } catch(e) {
        console.log('Incorrect request. No success.');
        return false;
    }
}

const getParsedOrderData = async (orderNumber, st) => {
    if(!orderNumber) return false;
    const result = await getRawOrderData(orderNumber, st);
    console.log(`[${new Date().toLocaleString()}] orderDataFromDb: `, result);
    let orderObj = {};
    if(("data" in result) && result.data) {
        try {
            orderObj.data = parseOrderDataString(result.data.dataString);
            if(("status" in result) && result.status) {
                orderObj.status = parseOrderSitesString(result.status);
            }
        } catch (e) {
            return false;
        }
    } else {
        return false;
    }
    console.log('parsed order obj: ', orderObj);
    return orderObj;
};

const getRawOrderData = async(orderNumber, st) => {

    const queue = qs.stringify({
        "st": st,
        "orderNumber": orderNumber
    });

    const url = `${process.env.ORDERSWORKER_ADDR}getRawOrderDataAndStatusFromFtp?${queue}`;

    try {
        return await fetch(url)
            .then((response) => {
                // console.log("Order data response: ", response);
                return response.text();
            })
            .then((data) => {
                // console.log("Order data response text: ", data);
                return JSON.parse(data);
            });
    } catch (e) {
        console.log(`[${new Date().toLocaleString()}] getOrderData error: `, e);
        return {};
    }

};

module.exports = {
    parseOrderDataString,
    parseOrderSitesString,
    strToOrderNumber,
    getParsedOrderData,
    getRawOrderData
}