import { Module, Global } from '@nestjs/common';
import { ImageUploadService } from './image-upload.service';

@Global()
@Module({
  providers: [ImageUploadService],
  exports: [ImageUploadService],
})
export class ImageUploadModule {}
