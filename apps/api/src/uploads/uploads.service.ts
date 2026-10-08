import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadedImage } from './uploaded-image';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly config: ConfigService) {}

  private configure() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Image uploads are not configured on the server');
    }
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  }

  async uploadImage(file: UploadedImage): Promise<{ url: string; publicId: string }> {
    this.configure();

    try {
      const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'mealrush/products',
            resource_type: 'image',
            // Cloudinary inspects the actual file content, not just the file name
            allowed_formats: ['jpg', 'png', 'webp'],
            // Never store anything larger than 1200x900
            transformation: [{ width: 1200, height: 900, crop: 'limit' }],
          },
          (error, uploaded) => {
            if (error || !uploaded) return reject(error ?? new Error('Upload failed'));
            resolve(uploaded);
          },
        );
        stream.end(file.buffer);
      });

      return {
        // f_auto,q_auto: Cloudinary serves the best format and quality for each browser
        url: result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/'),
        publicId: result.public_id,
      };
    } catch (err) {
      const httpCode = (err as { http_code?: number }).http_code;
      if (httpCode === 400) {
        throw new BadRequestException('Could not process this image. Please use a valid JPG, PNG or WebP file.');
      }
      this.logger.error(`Cloudinary upload failed: ${(err as Error).message ?? err}`);
      throw new BadGatewayException('Image upload failed. Please try again.');
    }
  }
}