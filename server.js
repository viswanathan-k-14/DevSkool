const express = require('express');
const dotenv = require('dotenv');

// include envars
dotenv.config({ path: './config/config.env' });

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.status(200).json({ msg: 'successfull GET request' });
});
app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on PORT ${process.env.PORT} `
  )
);
