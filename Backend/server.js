const express = require("express");
const cors = require("cors");
const app = express();
const { PORT } = require("./config/index");
const ContactRouter = require("./routes/Contact.Routes");
app.use(cors());
app.use(express.json());
app.use(ContactRouter);
app.listen(PORT, () => console.log(`The backend is running on: ${PORT}`));
