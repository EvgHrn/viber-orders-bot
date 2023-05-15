const ViberBot = require('viber-bot').Bot;
const BotEvents = require('viber-bot').Events;
const TextMessage = require('viber-bot').Message.Text;
const {strToOrderNumber, getParsedOrderData} = require('./utils');
require('dotenv').config();

console.log(`${new Date().toLocaleString('ru')} [bot] authToken: `, process.env.TOKEN);
console.log(`${new Date().toLocaleString('ru')} [bot] name: `, process.env.NAME);

const bot = new ViberBot({
    authToken: process.env.TOKEN,
    name: process.env.NAME,
    avatar: process.env.AVATAR
});

bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
    // Echo's back the message to the client. Your bot logic should sit here.
    console.log('----------------------------------------------------------------');
    console.log('New message: ', message.text);
    console.log('From: ', response.userProfile.id, );
    console.log('Name: ', response.userProfile.name);
    bot.sendMessage({id: process.env.ADMIN_ID}, new TextMessage(`New message from user: ${response.userProfile.id} ${response.userProfile.name}: ${message.text}`));
    const usersArr = JSON.parse(process.env.USERS_STR).users;
    // console.log('Users: ', usersArr);
    if(usersArr.some((userObj) => userObj.viber_id === response.userProfile.id)) {
        const orderNumber = strToOrderNumber(message.text.trim());
        if(orderNumber) {
            if(!process.env.ST) {
                console.error('Env variable error');
                response.send(new TextMessage('Ошибка сервера'));
                return;
            }
            getParsedOrderData(orderNumber, process.env.ST)
                .then((orderObj) => {
                    if(orderObj && orderObj.data) {
                        const text = Object.keys(orderObj.data).reduce((acc, key) => {
                            acc = `${acc} *${key}* :  ${orderObj.data[key].trim()}\n`;
                            return acc;
                        }, '');
                        // console.log('Text: ', text);
                        response.send(new TextMessage(text));
                    } else {
                        response.send(new TextMessage('Ошибка сервера. Нет данных о заказе'));
                    }
                    if(orderObj && orderObj.status) {
                        const text = Object.keys(orderObj.status).reduce((acc, key) => {
                            if(orderObj.status[key].isDone) {
                                acc = `${acc} *${key.slice(1, -1)}* :  ${new Date(orderObj.status[key].doneDate).toLocaleString('ru')} ${orderObj.status[key].userAccessStr}\n`;
                            } else {
                                acc = `${acc} ${key.slice(1, -1)} :  -\n`;
                            }
                            return acc;
                        }, '');
                        // console.log('Text: ', text);
                        response.send(new TextMessage(text));
                    } else {
                        response.send(new TextMessage('Ошибка сервера. Нет данных о статусе'));
                    }
                })
        } else {
            response.send(new TextMessage('Неверный номер'));
        }
    } else {
        const message = new TextMessage('Нет доступа');
        console.log(`${new Date().toLocaleString('ru')} Unknown user: `, response.userProfile);
        bot.getUserDetails(response.userProfile)
            .then(userDetails  => {
                bot.sendMessage({id: process.env.ADMIN_ID}, new TextMessage(`Unknown user: ${response.userProfile.id} ${response.userProfile.name}`));
            })
        response.send(message);
    }
});

module.exports = { bot }