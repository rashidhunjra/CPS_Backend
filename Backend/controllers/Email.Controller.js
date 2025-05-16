// controllers/contactController.js
const Contact = require("../models/ContactUs.Model");
const nodemailer = require("nodemailer");
const Joi = require("joi");

const { GMAIL_USER, GMAIL_APP_PASS } = require("../config/index");

// Validation schema using Joi
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

async function handleNewContact(req, res) {
  try {
    const { name, email, phone, message } = req.body;
    console.log(name, email, phone, message);
    // 1) Validate request body
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

    // 2) Save to DB
    // await Contact.create({ name, email, phone, message });

    // 3) Setup Gmail transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASS,
      },
    });

    // 4) Send email
    await transporter.sendMail({
      from: email,
      to: GMAIL_USER,
      subject: `Product Inquiry: Pricing Details for Lighting Equipment from ${name}`,
      html: `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; line-height: 1.6;">
        <h2 style="color: #007BFF;">📩 New Product Inquiry</h2>
        
        <p><strong style="color: #555;">Name:</strong> <span style="color: #000;">${name}</span></p>
        <p><strong style="color: #555;">Email:</strong> <a href="mailto:${email}" style="color: #007BFF;">${email}</a></p>
        <p><strong style="color: #555;">Phone:</strong> <span style="color: #000;">${phone}</span></p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">
        
        <p style="color: #555;"><strong>📝 Message:</strong></p>
        <div style="background: #f9f9f9; border-left: 4px solid #007BFF; padding: 10px 15px; color: #000;">
          ${message}
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #888;">
          This message was sent via your website contact form.
        </p>
      </div>
      `,
    });

    // 5) Respond to client
    return res.status(200).json({
      status: "success",
      message: "Thanks for getting in touch! We’ll reply shortly.",
    });
  } catch (emailError) {
    console.error("Email sending failed:", emailError.message);
    return res.status(500).json({
      status: "error",
      message: "Server is not responding. Please try again later.",
    });
  }
}

module.exports = { handleNewContact };
