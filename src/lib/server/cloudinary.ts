import { v2 as cloudinary } from 'cloudinary';
import { env } from '$env/dynamic/private';

const cloudName = env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
const apiSecret = env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true
	});
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface CloudinaryUploadResult {
	url: string;
	publicId: string;
}

/**
 * Uploads an image file to Cloudinary server-side with strict validation
 */
export async function uploadImage(file: File): Promise<CloudinaryUploadResult> {
	// 1. Verify file size
	if (file.size > MAX_FILE_SIZE_BYTES) {
		throw new Error('Image file size exceeds maximum limit of 5MB');
	}

	// 2. Verify MIME type
	if (!ALLOWED_MIME_TYPES.includes(file.type)) {
		throw new Error('Unsupported image format. Allowed formats: JPG, PNG, WEBP');
	}

	// 3. Convert File to buffer & base64 URI
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const base64Data = buffer.toString('base64');
	const dataUri = `data:${file.type};base64,${base64Data}`;

	// 4. Upload to Cloudinary
	const result = await cloudinary.uploader.upload(dataUri, {
		folder: 'campus_marketplace',
		resource_type: 'image',
		transformation: [
			{ width: 1200, height: 1200, crop: 'limit' },
			{ quality: 'auto' },
			{ fetch_format: 'auto' }
		]
	});

	return {
		url: result.secure_url,
		publicId: result.public_id
	};
}

/**
 * Deletes an image asset from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<boolean> {
	if (!publicId) return false;
	try {
		const res = await cloudinary.uploader.destroy(publicId);
		return res.result === 'ok';
	} catch (err) {
		console.error(`Failed to delete Cloudinary asset ${publicId}:`, err);
		return false;
	}
}
