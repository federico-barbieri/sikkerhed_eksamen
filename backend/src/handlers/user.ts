import prisma from "../db"
import {createJWT, hashPassword, comparePasswords} from "../modules/auth"
import {request, response, NextFunction} from "express";
import sanitizeInput from "../utils/sanitize_input"
import bcrypt from "bcrypt"



export const createNewUser = async (req: request, res: response) => {

    // add code to check if user already exists

    // add code to do backend validation

    // create user    
    const user = await prisma.user.create({
        data: {
            username: req.body.username,
            email: req.body.email,
            password: await hashPassword(req.body.password)

        }
    })
    const token = createJWT(user)
    res.json({token: token})
}


export const login = async (req: request, res: response) => {
    const { email, password } = req.body;
  
    try {
  
      // check if body is empty
      if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }
  
      // check if email is valid
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
  
  
      
      // check if user exists
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
      //  return res.status(400).json({ error: 'Invalid email or password' });
        return res.status(400).json({ error: 'Invalid email or password' });
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
       // return res.status(400).json({ error: 'Invalid email or password' });
        return res.status(400).json({ error: 'Invalid password' });
      }

      const token = createJWT(user)
  
      // insert jwt token into a cookie to make it more secure
      res.cookie('token', token, {
        httpOnly: true,      // now javascript cannot access it
        secure: true,// process.env.NODE_ENV === 'production', // rely on https when in production
        maxAge: 1000 * 60 * 60 * 24, // 24 hours for testing
        sameSite: 'None',  // change to lax if we want cross-site cookie usage // backend and frontend have different ports
      });
      
      res.json({
        redirect: '/frontend/src/dashboard.html',
        message: 'Login successful',
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
}

// check if email is already in database

export const checkEmailExists = async (req: request, res: response, next) => {
    const email = req.body.email;

    try {
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (user) {
            return res.status(400).json({ message: "Email already exists. Log in." });
        }

        // Proceed to the next middleware "storeUserInDatabase" if email is available
        next();


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// check if email is already in database

export const storeUserInDatabase = async (req: request, res: response, next) => {
    try {
        const storeNewUser = await prisma.user.create({
            data: {
                username: req.body.username,
                email: req.body.email,
                password: await hashPassword(req.body.password)
            }
        })
    
        // Respond with a success message
        return res.status(201).json({ message: "User created successfully. Please log in to continue." });


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// logout
// logout
// logout

export const logout = async (req: request, res: response) => {
  try {
    // Clear the token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: true, // Ensure this matches how the cookie was set
      sameSite: 'None', // Ensure this matches how the cookie was set
      path: '/', // Ensure this matches how the cookie was set
    });
    // Return a success message
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Failed to log out. Please try again." });
  }
};

