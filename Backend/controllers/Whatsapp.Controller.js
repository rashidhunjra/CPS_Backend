const axios = require("axios");
const Joi = require("joi");

const {
  WHATSAPP_RECIPIENT_NUMBER,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_TOKEN,
} = require("../config");

// Define validation schema
const contactSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Valid email is required",
    "string.empty": "Email is required",
  }),
  phone: Joi.string().required().messages({
    "string.empty": "Phone number is required",
  }),
  message: Joi.string().required().messages({
    "string.empty": "Message cannot be empty",
  }),
});

async function sendWhatsAppMessage(req, res) {
  const { name, email, phone, message } = req.body;

  // 1. Validate input
  const { error } = contactSchema.validate(
    { name, email, phone, message },
    { abortEarly: false }
  );
  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.context.key,
      message: detail.message,
    }));
    return res.status(400).json({ status: "error", errors });
  }

  // 2. Prepare WhatsApp API payload
  const payload = {
    messaging_product: "whatsapp",
    to: WHATSAPP_RECIPIENT_NUMBER,
    type: "template",
    template: {
      name: "contact_notification", // Your approved WhatsApp template name
      language: { code: "en_US" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: name },
            { type: "text", text: email },
            { type: "text", text: phone },
            { type: "text", text: message },
          ],
        },
      ],
    },
  };

  try {
    const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ WhatsApp template message sent!", response.data);
    return res.status(200).json({
      status: "success",
      message: "WhatsApp message sent successfully!",
      data: response.data,
    });
  } catch (err) {
    console.error(
      "❌ WhatsApp send failed:",
      err.response?.data || err.message
    );
    return res.status(500).json({
      status: "error",
      message: "Failed to send WhatsApp message",
      error: err.response?.data || err.message,
    });
  }
}

module.exports = { sendWhatsAppMessage };
