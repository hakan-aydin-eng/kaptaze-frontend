# KapTaze Restaurant Image Storage - Backend Requirements

## Critical Business Need
- Restaurants need **persistent image storage** for brand identity
- Images must survive server restarts, deployments, user sessions  
- Professional restaurant management platform requirement

## Required API Endpoints

### 1. Image Upload Endpoint
```
POST /restaurant/profile/image
Content-Type: multipart/form-data
Authorization: Bearer {restaurant_token}

Request:
- file: image file (JPG, PNG, WebP)
- Max size: 5MB
- Resize to: 400x400px (square crop)

Response:
{
  "success": true,
  "data": {
    "imageUrl": "https://storage.googleapis.com/kaptaze-images/restaurants/12345/profile.jpg"
  }
}
```

### 2. Profile Update with Image
```
PUT /restaurant/me
Authorization: Bearer {restaurant_token}

Request:
{
  "businessName": "My Restaurant",
  "description": "Best food in town",
  "imageUrl": "https://storage.googleapis.com/kaptaze-images/restaurants/12345/profile.jpg"
}

Response:
{
  "success": true,
  "data": {
    "businessName": "My Restaurant", 
    "description": "Best food in town",
    "imageUrl": "https://storage.googleapis.com/kaptaze-images/restaurants/12345/profile.jpg",
    ...
  }
}
```

### 3. Profile Get with Image
```
GET /restaurant/me
Authorization: Bearer {restaurant_token}

Response:
{
  "success": true,
  "data": {
    "businessName": "My Restaurant",
    "imageUrl": "https://storage.googleapis.com/kaptaze-images/restaurants/12345/profile.jpg",
    ...
  }
}
```

## Implementation Options

### Option 1: Cloud Storage (Recommended)
- **AWS S3** / **Google Cloud Storage** / **Cloudinary**
- CDN distribution for fast loading
- Automatic image optimization
- 99.9% uptime guarantee

### Option 2: Local File Storage  
- Store in `/uploads/restaurants/{id}/profile.jpg`
- Serve via `/static/uploads/restaurants/{id}/profile.jpg`
- Backup strategy required

### Option 3: Database Storage (Not Recommended)
- Store base64 in database
- Performance issues with large datasets
- Use only for MVP testing

## Database Schema

```sql
-- Add to existing restaurant_profiles table
ALTER TABLE restaurant_profiles ADD COLUMN image_url VARCHAR(500);
ALTER TABLE restaurant_profiles ADD COLUMN image_uploaded_at TIMESTAMP;

-- Or create new table
CREATE TABLE restaurant_images (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id),
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(20) DEFAULT 'profile',
    uploaded_at TIMESTAMP DEFAULT NOW(),
    file_size INTEGER,
    mime_type VARCHAR(50)
);
```

## Security Requirements
- Validate file types: JPG, PNG, WebP only
- Max file size: 5MB
- Sanitize file names
- Rate limiting: 10 uploads/hour per restaurant
- Virus scanning for production

## Performance Requirements  
- Image resize on upload (400x400px)
- WebP conversion for modern browsers
- Lazy loading on frontend
- CDN caching headers

## Current Frontend Code Status
✅ Frontend supports all required formats
✅ Error handling implemented
✅ Fallback mechanisms ready
✅ Base64 preview working
✅ Auto-retry logic implemented

## Testing Checklist
- [ ] Upload JPG image → permanent URL
- [ ] Upload PNG image → permanent URL  
- [ ] Profile update preserves image
- [ ] Page refresh shows saved image
- [ ] Multiple restaurants isolated
- [ ] Image deletion/replacement
- [ ] Error handling (file too large, wrong format)

## Production Deployment
1. Setup cloud storage bucket
2. Configure CORS for kaptaze.com domain
3. Add environment variables for storage credentials
4. Test with multiple restaurants
5. Monitor storage costs and optimize

## Cost Estimation
- **AWS S3**: $0.023/GB/month + $0.0004/1000 requests
- **Cloudinary**: Free tier: 25GB, $89/month for 75GB
- **Google Cloud**: $0.020/GB/month

For 1000+ restaurants × 1MB average = ~$25/month storage cost.