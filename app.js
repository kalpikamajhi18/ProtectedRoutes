import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import connectDB from './config/db.js';
import userCreates from "./models/user.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import router from './routes/agency.routes.js';



connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables schema & validation
const envSchema = z.object({
    PORT: z.coerce.number().default(5000),
    MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/kaplikaDb'),
    ACCESS_TOKEN_SECRET: z.string(),
    REFRESH_TOKEN_SECRET: z.string(),
});


const env = envSchema.parse(process.env);

const app = express();

// View engine setup
app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// Core Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(
    path.join(import.meta.dirname, "public")
));


app.use("/", router)

// 404 Handler (for non-existing routes)
app.use((req, res, next) => {
    res.status(404).send(`Route not found: ${req.url}`);
});


// Server Listen
app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});


