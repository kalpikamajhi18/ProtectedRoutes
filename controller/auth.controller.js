import jwt from "jsonwebtoken";
import userCreates from "../models/user.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    // 1. Pehle access token verify karo
    if (accessToken) {
      try {
        const decoded = jwt.verify(
          accessToken,
          process.env.ACCESS_TOKEN_SECRET
        );
       
        req.user = decoded;
        return next();
      } catch (err) {
        // Expired/invalid access token par refresh try hoga
      }
    }
    
    // 2. Refresh token check karo
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
     res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
      return res.redirect("/login");
    }

    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // 3. Database mein refresh token match karo
    const user = await userCreates.findOne({ email: decodedRefresh.email});

    if (!user || user.refreshToken !== refreshToken) {
       res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.redirect("/login");
    }

    // 4. Naya access token generate karo
    const newAccessToken = jwt.sign(
      { email: user.email },process.env.ACCESS_TOKEN_SECRET,{ expiresIn: "30s" }
    );

    // 5. Browser ki access-token cookie update karo
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/"
    });

    // 6. Request ko continue karo
    req.user = {
      _id: user._id,
      email: user.email
    };

    return next();

  } catch (error) {
     res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.redirect("/login");
  }
};