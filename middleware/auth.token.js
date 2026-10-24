import jwt from 'jsonwebtoken';
export const verifyToken = async(req, res, next)=>{
    const token = req.cookies.user;
    if(!token){
        req.user = null;
        res.send("first you login then access this page");       
    }
    try{
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodeToken;
        console.log("req.user", req.user);
        return next()      
    }
    catch(err){
        req.user = null;
    }

}