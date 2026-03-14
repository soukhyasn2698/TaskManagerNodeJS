const express = require('express');
const mysql = require('mysql2/promise');
const cors = require("cors");
const app = express();


app.use(cors());
app.use(express.json());
app.use(express.static("public"));


// Health check endpoint

app.get('/', (req, res) => {
    res.status(200).send('OK');
});



const PORT = 80;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
