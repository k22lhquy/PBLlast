import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import database from "./lib/db.js";

import authRouter from "./routers/auth.router.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    database();
});
