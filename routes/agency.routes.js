import {Router} from 'express'
import { authenticateToken } from '../controller/auth.controller.js';
import userCreates from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router()

router.get("/", authenticateToken, (req, res) => {
    res.render("home");
});

router.get("/about",authenticateToken, (req, res) => {
    res.render("about");
});

router.get("/services",authenticateToken, (req, res) => {
    res.render("service");
});

router.get("/projects",authenticateToken, (req, res) => {
    res.render("project");
});

router.get("/contact", (req, res) => {
    res.render("contact");
});

// Login page
router.get("/login", (req, res) => {
    res.render("login", {
        title: "Login"
    });
});

// Login form submission
router.post("/login", async (req, res) => {
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
    const accessToken = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET || "accessSecret123", { expiresIn: "30s" });
    const refreshToken = jwt.sign({ email: user.email}, process.env.REFRESH_TOKEN_SECRET || "refreshSecret456", { expiresIn: "1m" });
    // 4. Naya refreshToken database me update karo
    user.refreshToken = refreshToken;
    await user.save();
    // 5. Cookies set karo 
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });
    res.redirect("/");
});

// Signup page
router.get("/signup", (req, res) => {
    res.render("signup", {
        title: "Create Account"
    });
});

// Signup form submission
router.post("/signup", async (req, res) => {
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


    const refreshToken = jwt.sign({ email: email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1m" });

    userSignup.refreshToken = refreshToken;
    await userSignup.save();

    // 5. Dono tokens ko cookie me set karo     
    res.cookie("accessToken", acessToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });
    console.log("cookies created");

    res.redirect("/");
});

router.get("/logout", async (req, res) => {
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

export default router