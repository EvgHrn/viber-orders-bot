const express = require('express');
const {parseOrderDataString} = require("../src/utils/utils");
const router = express.Router();
const {bot} = require('../src/utils/bot');
const TextMessage = require('viber-bot').Message.Text;

require('dotenv').config();

/* GET home page. */
router.post('/sendNonstandardOrder', async(req, res, next) => {

  console.log(`${new Date().toLocaleString('ru')} Got NonstandardOrder request with body:`, req.body);

  const parsedOrder = parseOrderDataString(req.body.order.dataString);

  console.log(`${new Date().toLocaleString('ru')} Parsed order:`, parsedOrder);

  if(parsedOrder && parsedOrder["Название"].toLowerCase().includes("нестандартный заказ")) {
    const usersArr = JSON.parse(process.env.USERS_NONSTANDARD_STR).users;
    for(let i = 0; i < usersArr.length; i++) {
      console.log(`${new Date().toLocaleString('ru')} Gonna send nonstandard order to:`, usersArr[i]);
      bot.sendMessage({id: process.env.ADMIN_ID}, new TextMessage(`Новый нестандартный заказ: ${parsedOrder['Номер заказа']} \n ${parsedOrder['Название']} \n ${parsedOrder['Описание']}`));
      bot.sendMessage({id: usersArr[i].viber_id}, new TextMessage(`Новый нестандартный заказ: ${parsedOrder['Номер заказа']} \n ${parsedOrder['Название']} \n ${parsedOrder['Описание']}`));
    }
  }

  if(parsedOrder) {
    res.status(200).send(parsedOrder);
  } else {
    res.status(500).end();
  }
});

module.exports = router;
