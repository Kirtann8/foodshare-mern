import ErrorResponse from '../config/ErrorResponse.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';

export const uploadImage = async (req, res, next) => {
  try {
    console.log('Upload request received:', req.file);
    
    if (!req.file) {
      return next(new ErrorResponse('Please upload an image', 400));
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    console.log('File uploaded to Cloudinary:', {
      url: result.secure_url,
      public_id: result.public_id,
      originalname: req.file.originalname
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        originalname: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    next(new ErrorResponse('Error uploading image', 500));
  }
};

export const deleteImage = async (req, res, next) => {
  try {
    const { public_id } = req.params;

    if (!public_id) {
      return next(new ErrorResponse('Please provide image public_id', 400));
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(public_id);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(new ErrorResponse('Error deleting image', 500));
  }
};