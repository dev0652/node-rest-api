import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { exit } from 'node:process';

import app from './app.js';

// ##################################

dotenv.config();
const { DB_HOST, PORT } = process.env;

mongoose
  .connect(DB_HOST)
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Database connection successful. Server running on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.log(err.message);
    exit(1);
  });
