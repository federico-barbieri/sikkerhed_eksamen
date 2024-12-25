import express from "express";
import prisma from "./db"
import path from 'path';
import {request, response, NextFunction} from "express";
import morgan from "morgan";
import cors from "cors";
import {protect, adminOnly, hashPassword} from "./modules/auth"
import {login, logout, checkEmailExists, storeUserInDatabase} from "./handlers/user"
import {artworksAreFetchedFromDB} from "./handlers/art"
import cookieParser from 'cookie-parser';
import helmet from "helmet";
import multer from "multer";
import { Prisma } from '@prisma/client';
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../swaggerConfig";


interface CommentRequestBody {
  comment: string;
}


import {fetchArt} from "../prisma/seed";


const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


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
/**
 * @swagger
 * /api:
 *   get:
 *     summary: Fetches the artworks.
 *     responses:
 *       500:
 *         description: Error response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: Failed to fetch artwork
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 artist:
 *                   type: string
 *                 image:
 *                   type: string
 *                 technique:
 *                   type: string
 *                 production_date:
 *                   type: string
 *                 Comment:
 *                   type: array
 * 
 */
app.get('/api', async (req: request, res: response) => {
  try {
    const artworks = await fetchArt();
    // send a 200 ok status code and the artworks to the frontend
    res.status(200).json(artworks);
  } catch (error) {
    console.error("Error fetching artwork:", error);
    res.status(500).json({ error: "Failed to fetch artwork" });
  }
});

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Fetches the artworks.
 *     responses:
 *       500:
 *         description: Error response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: Failed to fetch artwork
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 artist:
 *                   type: string
 *                 image:
 *                   type: string
 *                 technique:
 *                   type: string
 *                 production_date:
 *                   type: string
 *                 Comment:
 *                   type: array
 * 
 */
// this checks if email exists while creating a new user
app.post("/api/signup", checkEmailExists, storeUserInDatabase);

// this logs in the user

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Logs in the user and sets an authentication cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 redirect:
 *                   type: string
 *                   example: /frontend/src/dashboard.html
 *                 message:
 *                   type: string
 *                   example: Login successful
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid email or password
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Login failed. Please try again.
 */
app.post('/api/login', login)

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Logs out the user by clearing the authentication cookie.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to log out. Please try again.
 */
// this logs out the user
app.post('/api/logout', logout)

// this fetches the artworks from the db to show them in the dashboard if the user is just a user

/**
 * @swagger
 * /api/artworks:
 *   get:
 *     summary: Fetches all artworks from the database.
 *     tags:
 *       - Artworks
 *     responses:
 *       200:
 *         description: Successfully fetched artworks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   artist:
 *                     type: string
 *                   image:
 *                     type: string
 *                   technique:
 *                     type: string
 *                   production_date:
 *                     type: string
 *                   Comment:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         content:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         artworkId:
 *                           type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error fetching artworks
 */
app.get('/api/artworks', artworksAreFetchedFromDB);


// fetch one artwork based on its id provided by the frontend

/**
 * @swagger
 * /api/artwork/{id}:
 *   get:
 *     summary: Fetches a single artwork based on its ID.
 *     tags:
 *       - Artworks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the artwork to fetch
 *     responses:
 *       200:
 *         description: Successfully fetched the artwork
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artwork:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     artist:
 *                       type: string
 *                     image:
 *                       type: string
 *                     technique:
 *                       type: string
 *                     production_date:
 *                       type: string
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       artworkId:
 *                         type: string
 *       404:
 *         description: Artwork not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Artwork not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error fetching artwork
 */
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

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Fetches the user's dashboard details.
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Successfully fetched user details for the dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error fetching user details
 */
app.get('/api/dashboard', protect, (req, res) => {
  const { id, username, role, profilePicture } = req.user;

  // Return the user's details for the frontend to handle
  res.json({ id, username, role, profilePicture });
});


/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Fetches all users for admin.
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Successfully fetched users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   profilePicture:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error fetching users
 */
app.get('/api/admin/users', protect, adminOnly, async (req, res) => {
  try {
      const users = await prisma.user.findMany();
      res.json(users);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching users' });
  }
});


/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Deletes a user by ID (admin only).
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: Successfully deleted the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error deleting user
 */
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

/**
 * @swagger
 * /api/admin/artworks/{id}:
 *   delete:
 *     summary: Deletes an artwork by ID (admin only).
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the artwork to delete
 *     responses:
 *       200:
 *         description: Successfully deleted the artwork
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Artwork deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error deleting artwork
 */
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

/**
 * @swagger
 * /api/artwork/{id}/comment:
 *   post:
 *     summary: Adds a comment to a specific artwork.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the artwork to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 example: "This is a comment"
 *     responses:
 *       201:
 *         description: Successfully added the comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 content:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 artworkId:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Artwork ID, user ID, and comment content are required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error posting comment
 */
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

/**
 * @swagger
 * /api/usersession:
 *   get:
 *     summary: Checks the user session and redirects to the dashboard.
 *     tags:
 *       - Session
 *     responses:
 *       200:
 *         description: Successfully checked user session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 redirect:
 *                   type: string
 *                   example: /frontend/src/dashboard.html
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error checking user session
 */
app.get('/api/usersession', protect, (req, res) => {
  res.status(200).json({ redirect: '/frontend/src/dashboard.html' });
});

// fetch data to populate edit user profile page

/**
 * @swagger
 * /api/userprofile:
 *   get:
 *     summary: Fetches the user's profile details.
 *     tags:
 *       - User Profile
 *     responses:
 *       200:
 *         description: Successfully fetched user profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *                 email:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error fetching user profile
 */
app.get('/api/userprofile', protect, async (req, res) => {
  try {
    const { id, username, role, email, profilePicture } = req.user;

    // Return the user's details for the frontend to handle
    res.json({ id, username, role, email, profilePicture });
    
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
}
);

// user can edit their profile

/**
 * @swagger
 * /api/userprofile/edit:
 *   put:
 *     summary: Edits the user's profile details.
 *     tags:
 *       - User Profile
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Successfully updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User profile updated successfully
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *                 email:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username already taken
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error updating user profile
 */
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