import express from 'express';
import { uploadImage, deleteImage } from '../controllers/uploadController.js';
import upload from '../config/cloudinary.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Upload image route
router.post('/', upload.single('image'), uploadImage);

// Delete image route
router.delete('/:public_id', deleteImage);

export default router;