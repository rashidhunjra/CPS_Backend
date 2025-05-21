const axios = require("axios");
const Joi = require("joi");
const {
  WHATSAPP_RECIPIENT_NUMBER,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_TOKEN,
} = require("../config");

// Utility to sanitize input strings for WhatsApp API
const clean = (str) =>
  String(str)
    .replace(/[\r\n\t]+/g, " ") // replace newlines/tabs with space
    .replace(/ {2,}/g, " ") // collapse multiple spaces
    .trim(); // trim edges

// Ensure no disallowed characters/spaces in parameters
const validateParam = (text, fieldName) => {
  if (/[]/.test(text)) {
    throw new Error(`${fieldName} contains newline/tab characters`);
  }
  if (/ {5,}/.test(text)) {
    throw new Error(`${fieldName} contains more than 4 consecutive spaces`);
  }
};
// Define validation schema for incoming form data
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

/**
 * Express handler: validate payload, sanitize inputs,
 * send templated WhatsApp message via Graph API
 */
async function sendWhatsAppMessage(req, res) {
  // 1. Validate incoming request body
  const { name, email, phone, message } = req.body;
  const { error } = contactSchema.validate(
    { name, email, phone, message },
    { abortEarly: false }
  );
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.context.key,
      message: d.message,
    }));
    return res.status(400).json({ status: "error", errors });
  }

  // 2. Build and sanitize WhatsApp payload
  const payload = {
    messaging_product: "whatsapp",
    to: WHATSAPP_RECIPIENT_NUMBER,
    type: "template",
    template: {
      name: "contact_notification",
      language: { code: "en_US" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: clean(name) },
            { type: "text", text: clean(email) },
            { type: "text", text: clean(phone) },
            { type: "text", text: clean(message) },
          ],
        },
      ],
    },
  };

  // Log final payload for debugging
  console.log("▶️ WhatsApp payload:", JSON.stringify(payload));

  // 3. Send request to Meta Graph API
  try {
    const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const resp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ WhatsApp template message sent!", resp.data);
    return res.status(200).json({
      status: "success",
      message: "WhatsApp message sent successfully!",
      data: resp.data,
    });
  } catch (err) {
    const info = err.response?.data || err.message;
    console.error("❌ WhatsApp send failed:", info);
    return res.status(500).json({
      status: "error",
      message: "Failed to send WhatsApp message",
      error: info,
    });
  }
}

module.exports = { sendWhatsAppMessage };
