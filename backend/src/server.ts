import express from "express";
import prisma from "./db"
import path from 'path';
import {request, response, NextFunction} from "express";
import morgan from "morgan";
import cors from "cors";
import {protect, adminOnly, hashPassword} from "./modules/auth"
import {createNewUser, login, logout, checkEmailExists, storeUserInDatabase} from "./handlers/user"
import {artworksAreFetchedFromDB} from "./handlers/art"
import cookieParser from 'cookie-parser';
import helmet from "helmet";
import multer from "multer";
import { Prisma } from '@prisma/client';


interface CommentRequestBody {
  comment: string;
}


import {fetchArt} from "../prisma/seed";


const app = express();

// Serve static files from the frontend/assets/images directory
app.use('/assets/images', express.static(path.join(__dirname, '../../frontend/assets/images')));

const corsOrigins = process.env.CORS_ORIGINS.split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Helmet security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "http://localhost:5500"],
        scriptSrc: ["'self'", "http://localhost:5500"],
        styleSrc: ["'self'", "http://localhost:5500"],
        imgSrc: ["'self'", "data:", "http://localhost:5500"],
        connectSrc: ["'self'", "http://localhost:3002"], // Allow API requests
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: false, // Disable for development
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// http actions logged in the terminal  
app.use(morgan('dev'))

// returns json
app.use(express.json())

// query parameters are json and not strings
app.use(express.urlencoded({extended: true}))

// makes cookie an object innstead of a string to be split
app.use(cookieParser());


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../frontend/assets/images'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// we are currently only using these routes below
// we are currently only using these routes below
// we are currently only using these routes below

// this seeds the db with artwork (we should add an admin and stop seeding every time we start the server)

app.get('/api', async (req: request, res: response) => {
  try {
    const artworks = await fetchArt();
    res.json(artworks);
  } catch (error) {
    console.error("Error fetching artwork:", error);
    res.status(500).json({ error: "Failed to fetch artwork" });
  }
});

// this checks if email exists while creating a new user
app.post("/api/signup", checkEmailExists, storeUserInDatabase);

// this creates a new user when the above request is successful
app.post('/api/user', createNewUser)

// this logs in the user
app.post('/api/login', login)

// this logs out the user
app.post('/api/logout', logout)

// this fetches the artworks from the db to show them in the dashboard if the user is just a user
app.get('/api/artworks', artworksAreFetchedFromDB);

// fetch one artwork based on its id provided by the frontend
app.get('/api/artwork/:id', protect, async (req: request, res: response) => {
  const id = decodeURIComponent(req.params.id);

  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: id },
    });
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' })
    }

    // check if artwork has comments and include them in the response
    const comments = await prisma.comment.findMany({
      where: { artworkId: id },
      include: { user: true },
    });

    // if comments.length > 0, include them in the response
    if (comments.length > 0) {
      res.json({artwork, comments}); 
    } else {
      res.json({artwork});
    }  
  } catch (error) {
    res.status(500).json({ message: 'Error fetching artwork' });
  }

  // 
});

// check user role when accessing the dashboard
app.get('/api/dashboard', protect, (req, res) => {
  const { id, username, role, profilePicture } = req.user;

  // Return the user's details for the frontend to handle
  res.json({ id, username, role, profilePicture });
});

app.get('/api/admin/users', protect, adminOnly, async (req, res) => {
  try {
      const users = await prisma.user.findMany();
      res.json(users);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching users' });
  }
});

// admin can delete a user from issue #26
app.delete('/api/admin/users/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id: id },
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// admin can delete an artwork from issue #27
app.delete('/api/admin/artworks/:id', protect, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.artwork.delete({
      where: { id: id },
    });
    res.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting artwork' });
  }
});

app.post('/api/artwork/:id/comment', protect, async (req: request, res: response) => {
  const { id: artworkId } = req.params;
  const { comment: content } = req.body;
  const { userId } = req.user;

  try {
    // Validate inputs
    if (!artworkId || !content || !userId) {
      return res.status(400).json({ message: 'Artwork ID, user ID, and comment content are required' });
    }

    // Create the comment
    const newComment = await prisma.comment.create({
      data: {
        content,
        user: {
          connect: { id: userId }, // Link to existing User
        },
        artwork: {
          connect: { id: artworkId }, // Link to existing Artwork
        },
      },
      include: {
        user: true,
        artwork: true,
      },
    });

    // Respond with the created comment
    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error posting comment' });
  }
});



// Route to check user session
app.get('/api/usersession', protect, (req, res) => {
  res.status(200).json({ redirect: '/frontend/src/dashboard.html' });
});

// fetch data to populate edit user profile page
app.get('/api/userprofile', protect, async (req, res) => {
  try {
    const { id, username, role, email, profilePicture } = req.user;

    // Return the user's details for the frontend to handle
    res.json({ id, username, role, email });
    
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
}
);

// user can edit their profile
app.put('/api/userprofile/edit', protect, upload.single('profilePicture'), async (req: request, res: response) => {
  try {

    const { userId } = req.user;
    const { username, password, confirmPassword } = req.body;
    const newProfilePicture = req.file ? `/assets/images/${req.file.filename}` : req.user.profilePicture;

    // Check if the new username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username: username },
    });
    if (existingUser){
      return res.status(400).json({ message: 'Username already taken' });
    } else{
      console.log('Username is available');
    }
    // check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    } else {
      console.log('Passwords match');
    }
    // check if password meets requirements
    const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=_]).{8,}$/;
    if (!passwordPattern.test(password)) {
      // tell user password requirements
      return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one number, one uppercase letter, one lowercase letter, and one special character' });
    } else{
      console.log('Password meets requirements');
    }

    // update the users profile with new profile picture, username, and password
    console.log('Preparing to update user profile...');

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: newProfilePicture,
          username: username,
          password: await hashPassword(password),
        },
      });
      console.log('Updated user:', updatedUser);
      res.json({ message: 'User profile updated successfully' });
      //send new user data to the frontend
      res.json(updatedUser);
    } catch (error) {
      console.error('Error during user update:', error);
      return res.status(500).json({ message: 'Database update failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile' });
  }
});



export default app;