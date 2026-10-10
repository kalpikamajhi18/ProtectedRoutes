import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import connectDB from './config/db.js';
import userCreates from "./models/user.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables schema & validation
const envSchema = z.object({
    PORT: z.coerce.number().default(5000),
    MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/riteshdb'),
    JWT_SECRET: z.string().default('lalaladfhgdsjgf'),
});

export const env = envSchema.parse(process.env);

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Core Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(
    path.join(import.meta.dirname, "public")
));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/services", (req, res) => {
    res.render("service");
});

app.get("/projects", (req, res) => {
    res.render("project");
});

app.get("/contact", (req, res) => {
    res.render("contact");
});

// Login page
app.get("/login", (req, res) => {
    res.render("login", {
        title: "Login"
    });
});

// Login form submission
app.post("/login", (req, res) => {
    console.log("Login data:", req.body);
    res.redirect("/");
});

// Signup page
app.get("/signup", (req, res) => {
    res.render("signup", {
        title: "Create Account"
    });
});

// Signup form submission
app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
            const userSignup = await userCreates.create({
                name,
                email,
                password: hash
            });
            console.log(userSignup);
            const token = jwt.sign({email:email}, process.env.JWT_SECRET);
            res.cookie(token);

         



        });
    });


    res.redirect("/login");
});



// 404 Handler (for non-existing routes)
app.use((req, res, next) => {
    res.status(404).send(`Route not found: ${req.url}`);
});


// Server Listen
app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});


