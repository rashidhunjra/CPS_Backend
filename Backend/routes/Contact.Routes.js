// routes/contact.js
const express = require("express");
const router = express.Router();
const emailController = require("../controllers/Email.Controller");
const whatsappController = require("../controllers/Whatsapp.Controller");

router.post("/send-email", emailController.handleNewContact);

router.post("/send-whatsapp", whatsappController.sendWhatsAppMessage);

module.exports = router;
