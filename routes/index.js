const express = require('express');
const {parseOrderDataString} = require("../src/utils/utils");
const router = express.Router();
const {bot} = require('../src/utils/bot');
const TextMessage = require('viber-bot').Message.Text;

/* GET home page. */
router.post('/sendNonstandardOrder', async(req, res, next) => {

  const parsedOrder = parseOrderDataString(req.body.order.dataString);

  console.log(`${new Date().toLocaleString('ru')} Parsed order from orders watchers:`, parsedOrder);

  if(parsedOrder && parsedOrder["Название"].toLowerCase() === "нестандартный заказ") {
    const usersArr = JSON.parse(process.env.USERS_NONSTANDARD_STR).users;
    for(let i = 0; i < usersArr.length; i++) {
      bot.sendMessage({id: usersArr[i].viber_id}, new TextMessage(`Новый нестандартный заказ: ${parsedOrder['Номер заказа']} ${parsedOrder['Описание']}`));
    }
  }

  if(parsedOrder) {
    res.status(200).send(parsedOrder);
  } else {
    res.status(500).end();
  }
});

module.exports = router;
