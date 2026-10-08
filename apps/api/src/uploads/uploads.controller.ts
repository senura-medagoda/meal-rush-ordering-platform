import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadsService } from './uploads.service';
import type { UploadedImage } from './uploaded-image';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = /^image\/(jpeg|png|webp)$/;

// Guards run BEFORE the file is read, so anonymous users and customers can't upload anything.
@Controller('admin/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      // No `storage` option: the file stays in memory and is never written to disk
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_TYPES.test(file.mimetype)) {
          return cb(new BadRequestException('Only JPG, PNG or WebP images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: UploadedImage | undefined) {
    if (!file) {
      throw new BadRequestException('No image received. Send it in a form field named "file".');
    }
    return this.uploads.uploadImage(file);
  }
}