# ImageBB Setup Guide for Festify

## What is ImageBB?
ImageBB is a free image hosting service that provides a simple API for uploading images. We use it to host fest banner images.

## How to Get Your API Key

1. **Visit ImageBB**
   - Go to https://imgbb.com/

2. **Create an Account**
   - Click "Sign up" in the top right
   - Complete the registration process
   - Verify your email address

3. **Get Your API Key**
   - Once logged in, click on your profile/avatar in the top right
   - Select "API" from the dropdown menu
   - You'll see your API key displayed
   - Copy this key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

## Adding the API Key to Your Project

1. Open `src/pages/CreateFest.jsx`

2. Find this line (around line 62):
   ```javascript
   const response = await fetch('https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY', {
   ```

3. Replace `YOUR_IMGBB_API_KEY` with your actual API key:
   ```javascript
   const response = await fetch('https://api.imgbb.com/1/upload?key=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', {
   ```

## Important Notes

- **Free Tier Limits**: ImageBB free tier allows reasonable usage for most applications
- **Image Size**: Our app limits uploads to 5MB per image
- **Supported Formats**: JPG, PNG, GIF, WebP
- **Security**: Never commit your API key to public repositories. Consider using environment variables:
  ```javascript
  const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
  ```

## Using Environment Variables (Recommended)

1. Create a `.env` file in your project root:
   ```
   VITE_IMGBB_API_KEY=your_api_key_here
   ```

2. Update `CreateFest.jsx`:
   ```javascript
   const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
   const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
   ```

3. Add `.env` to your `.gitignore`:
   ```
   .env
   ```

## Alternative: Use Custom Image URLs

If you don't want to use ImageBB, organizers can still use "Option 2" in the banner upload step to provide direct image URLs from any source (Imgur, Google Drive, etc.).

## Testing Your Setup

1. Create a new fest as an organizer
2. Go to Step 2: Banner Upload
3. Try uploading a small test image
4. If successful, you'll see "Image uploaded successfully!" and a preview
5. If failed, check:
   - API key is correct
   - Image is under 5MB
   - Image is a valid format
   - Internet connection is stable

## Troubleshooting

- **403 Forbidden**: API key is invalid
- **400 Bad Request**: Image file format or size issue
- **Network Error**: Check internet connection
- **Upload timeout**: Image may be too large or connection is slow

## Need Help?

If you encounter issues:
1. Verify your API key at https://imgbb.com/
2. Test the API directly using Postman or curl
3. Check browser console for detailed error messages
4. Ensure CORS is not blocking the request (ImageBB handles this automatically)
