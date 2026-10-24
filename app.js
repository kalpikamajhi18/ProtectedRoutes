import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import connectDB from './config/db.js';
import userCreates from "./models/user.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './controller/auth.controller.js';


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
// app.use(authenticateToken)

app.get("/", authenticateToken, (req, res) => {
    res.render("home");
});

app.get("/about",authenticateToken, (req, res) => {
    res.render("about");
});

app.get("/services",authenticateToken, (req, res) => {
    res.render("service");
});

app.get("/projects",authenticateToken, (req, res) => {
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
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    // 1. User ko email se find karo 
    const user = await userCreates.findOne({ email });
    if (!user) {
        return res.send("User nahi mila! Pehle signup karein.");
    }
    // 2. Direct bcrypt.compare se password match karo 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.send("Galat password!");
    }
    // 3. Dono tokens generate karo   
    const accessToken = jwt.sign({ _id: user._id, email: user.email }, process.env.ACCESS_TOKEN_SECRET || "accessSecret123", { expiresIn: "30s" });
    const refreshToken = jwt.sign({ _id: user._id }, process.env.REFRESH_TOKEN_SECRET || "refreshSecret456", { expiresIn: "2m" });
    // 4. Naya refreshToken database me update karo
    user.refreshToken = refreshToken;
    await user.save();
    // 5. Cookies set karo 
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });
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

    const salt = await bcrypt.genSalt(10);
      const hash = await  bcrypt.hash(password, salt);
    
     const userSignup = await userCreates.create({
                name,
                email,
                password: hash
            });
            console.log(userSignup);
    const acessToken = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30s" });


    const refreshToken = jwt.sign({ email: email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "2m" });

    userSignup.refreshToken = refreshToken;
    await userSignup.save();

    // 5. Dono tokens ko cookie me set karo     
    res.cookie("accessToken", acessToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });
    console.log("cookies created");

    res.redirect("/");
});

app.get("/logout", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    // Database se refresh token hata do   
    if (refreshToken) {
        await userCreates.findOneAndUpdate({ refreshToken: refreshToken }, { $set: { refreshToken: null } });
    }
    // Browser se dono cookies delete kar do   
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
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


