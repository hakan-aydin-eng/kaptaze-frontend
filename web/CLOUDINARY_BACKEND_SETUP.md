# Cloudinary Backend Setup - KapTaze Restaurant Images

## 1. Install Dependencies

```bash
npm install cloudinary multer
```

## 2. Environment Variables

```bash
# .env file
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 3. Cloudinary Configuration

```javascript
// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
```

## 4. Image Upload Endpoint

```javascript
// routes/restaurant.js
const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed!'), false);
    }
  }
});

// Restaurant image upload endpoint
router.post('/profile/image', authenticateRestaurant, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `kaptaze/restaurants/${req.user.id}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', format: 'auto' }
          ],
          public_id: `profile_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Update restaurant profile with image URL
    await updateRestaurantProfile(req.user.id, {
      imageUrl: result.secure_url
    });

    res.json({
      success: true,
      data: {
        imageUrl: result.secure_url,
        publicId: result.public_id
      }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Image upload failed'
    });
  }
});

// Update restaurant profile endpoint  
router.put('/me', authenticateRestaurant, async (req, res) => {
  try {
    const { businessName, description, website, specialties, businessHours, imageUrl } = req.body;
    
    const updatedProfile = await updateRestaurantProfile(req.user.id, {
      businessName,
      description, 
      website,
      specialties,
      businessHours,
      imageUrl // Include imageUrl in updates
    });

    res.json({
      success: true,
      message: 'Restaurant profile updated successfully',
      data: updatedProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile update failed'
    });
  }
});

// Get restaurant profile endpoint
router.get('/me', authenticateRestaurant, async (req, res) => {
  try {
    const profile = await getRestaurantProfile(req.user.id);
    
    res.json({
      success: true,
      data: {
        businessName: profile.businessName,
        description: profile.description,
        imageUrl: profile.imageUrl, // Important: Include imageUrl
        website: profile.website,
        specialties: profile.specialties,
        businessHours: profile.businessHours,
        address: profile.address,
        // ... other fields
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

module.exports = router;
```

## 5. Database Functions

```javascript
// models/restaurant.js

async function updateRestaurantProfile(restaurantId, updates) {
  const query = `
    UPDATE restaurant_profiles 
    SET business_name = $2, description = $3, website = $4, 
        specialties = $5, business_hours = $6, image_url = $7,
        updated_at = NOW()
    WHERE restaurant_id = $1
    RETURNING *
  `;
  
  const values = [
    restaurantId,
    updates.businessName,
    updates.description, 
    updates.website,
    JSON.stringify(updates.specialties),
    JSON.stringify(updates.businessHours),
    updates.imageUrl
  ];
  
  const result = await db.query(query, values);
  return result.rows[0];
}

async function getRestaurantProfile(restaurantId) {
  const query = `
    SELECT * FROM restaurant_profiles 
    WHERE restaurant_id = $1
  `;
  
  const result = await db.query(query, [restaurantId]);
  return result.rows[0];
}
```

## 6. Database Migration

```sql
-- Add image_url column to restaurant_profiles table
ALTER TABLE restaurant_profiles 
ADD COLUMN image_url VARCHAR(500),
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX idx_restaurant_profiles_restaurant_id ON restaurant_profiles(restaurant_id);
```

## 7. Test the Setup

```javascript
// Test script
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testImageUpload() {
  const form = new FormData();
  form.append('image', fs.createReadStream('test-image.jpg'));
  
  const response = await axios.post('http://localhost:3000/restaurant/profile/image', form, {
    headers: {
      'Authorization': 'Bearer your-test-token',
      ...form.getHeaders()
    }
  });
  
  console.log('Upload result:', response.data);
}
```

## 8. Error Handling & Security

```javascript
// Add middleware for error handling
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message
  });
});
```

## 9. Frontend Integration Check

Frontend code already supports this! No changes needed.

```javascript
// This will work automatically:
const response = await window.backendService.makeRequest('/restaurant/profile/image', {
  method: 'POST',
  body: formData, // Contains image file
  headers: {} // Let browser set content-type
});

if (response.success) {
  const imageUrl = response.data.imageUrl; // Cloudinary URL
  avatar.src = imageUrl;
}
```

## 10. Production Considerations

- **Rate Limiting**: 10 uploads/hour per restaurant
- **Image Validation**: File type, size, dimensions
- **Monitoring**: Cloudinary usage dashboard
- **Backup**: Cloudinary automatically handles backups
- **CDN**: Automatic global CDN distribution

## Testing Checklist

- [ ] Cloudinary account created
- [ ] Environment variables set
- [ ] Upload endpoint working
- [ ] Profile update includes imageUrl
- [ ] Profile get returns imageUrl  
- [ ] Frontend receives permanent URLs
- [ ] Images persist after page refresh
- [ ] Error handling for large files
- [ ] Authentication working properly