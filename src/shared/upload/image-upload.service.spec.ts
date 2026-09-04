import { BadRequestException } from '@nestjs/common';

const mockPutObject = jest.fn();
const mockRemoveObject = jest.fn();
const mockClientConstructor = jest.fn();

jest.mock('minio', () => ({
  Client: mockClientConstructor.mockImplementation(() => ({
    putObject: mockPutObject,
    removeObject: mockRemoveObject,
  })),
}));

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'fixed-uuid'),
}));

import { ImageUploadService } from './image-upload.service';
import { MulterFile } from '../../types/multer-file.type';

describe('ImageUploadService', () => {
  let service: ImageUploadService;

  const buildFile = (overrides: Partial<MulterFile> = {}): MulterFile =>
    ({
      fieldname: 'file',
      originalname: 'photo.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('fake-image-data'),
      ...overrides,
    }) as MulterFile;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPutObject.mockResolvedValue(undefined);
    mockRemoveObject.mockResolvedValue(undefined);

    process.env.MINIO_ENDPOINT = 'localhost';
    process.env.MINIO_PORT = '9000';
    process.env.MINIO_USE_SSL = 'false';
    process.env.MINIO_ACCESS_KEY = 'access-key';
    process.env.MINIO_SECRET_KEY = 'secret-key';
    process.env.MINIO_REGION = '';
    process.env.MINIO_BUCKET = 'astrodle-bucket';
    process.env.MINIO_PUBLIC_URL = 'https://cdn.example.com';
    process.env.MINIO_URL_STYLE = 'path';

    service = new ImageUploadService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadImage', () => {
    it('uploads the file and returns a path-style public URL', async () => {
      const file = buildFile();

      const url = await service.uploadImage(file, 'space-organisations', 42);

      expect(mockPutObject).toHaveBeenCalledWith(
        'astrodle-bucket',
        'space-organisations/42/fixed-uuid.png',
        file.buffer,
        file.size,
        { 'Content-Type': 'image/png', 'x-amz-acl': 'public-read' },
      );
      expect(url).toBe(
        'https://cdn.example.com/astrodle-bucket/space-organisations/42/fixed-uuid.png',
      );
    });

    it('returns a virtual-host-style public URL when configured', async () => {
      process.env.MINIO_URL_STYLE = 'virtual-host';
      service = new ImageUploadService();
      const file = buildFile();

      const url = await service.uploadImage(file, 'space-organisations', 42);

      expect(url).toBe(
        'https://cdn.example.com/space-organisations/42/fixed-uuid.png',
      );
    });

    it('derives the object key extension from the original filename', async () => {
      const file = buildFile({
        originalname: 'my.photo.of.mars.WEBP',
        mimetype: 'image/webp',
      });

      await service.uploadImage(file, 'space-sky-objects', 1);

      expect(mockPutObject).toHaveBeenCalledWith(
        'astrodle-bucket',
        'space-sky-objects/1/fixed-uuid.WEBP',
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('throws BadRequestException when the file exceeds the default max size (100 Mo)', async () => {
      const file = buildFile({ size: 101 * 1024 * 1024 });

      await expect(
        service.uploadImage(file, 'space-organisations', 1),
      ).rejects.toThrow(BadRequestException);
      expect(mockPutObject).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the file exceeds a custom max size', async () => {
      const file = buildFile({ size: 6 * 1024 * 1024 });

      await expect(
        service.uploadImage(file, 'space-organisations', 1, {
          maxSizeMb: 5,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPutObject).not.toHaveBeenCalled();
    });

    it('accepts a file within a custom max size', async () => {
      const file = buildFile({ size: 4 * 1024 * 1024 });

      await expect(
        service.uploadImage(file, 'space-organisations', 1, {
          maxSizeMb: 5,
        }),
      ).resolves.toBeDefined();
      expect(mockPutObject).toHaveBeenCalled();
    });

    it('throws BadRequestException for a disallowed mimetype (default whitelist)', async () => {
      const file = buildFile({ mimetype: 'application/pdf' });

      await expect(
        service.uploadImage(file, 'space-organisations', 1),
      ).rejects.toThrow(BadRequestException);
      expect(mockPutObject).not.toHaveBeenCalled();
    });

    it('allows a mimetype from a custom allowedMimeTypes list', async () => {
      const file = buildFile({ mimetype: 'image/gif' });

      await expect(
        service.uploadImage(file, 'space-organisations', 1, {
          allowedMimeTypes: ['image/gif'],
        }),
      ).resolves.toBeDefined();
      expect(mockPutObject).toHaveBeenCalled();
    });

    it('rejects a mimetype not present in a custom allowedMimeTypes list', async () => {
      const file = buildFile({ mimetype: 'image/png' });

      await expect(
        service.uploadImage(file, 'space-organisations', 1, {
          allowedMimeTypes: ['image/gif'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteImageByUrl', () => {
    it('removes the object matching the public URL (path style)', async () => {
      await service.deleteImageByUrl(
        'https://cdn.example.com/astrodle-bucket/space-organisations/42/logo.png',
      );

      expect(mockRemoveObject).toHaveBeenCalledWith(
        'astrodle-bucket',
        'space-organisations/42/logo.png',
      );
    });

    it('removes the object matching the public URL (virtual-host style)', async () => {
      process.env.MINIO_URL_STYLE = 'virtual-host';
      service = new ImageUploadService();

      await service.deleteImageByUrl(
        'https://cdn.example.com/space-organisations/42/logo.png',
      );

      expect(mockRemoveObject).toHaveBeenCalledWith(
        'astrodle-bucket',
        'space-organisations/42/logo.png',
      );
    });

    it('does nothing when the URL does not match the configured public URL/bucket', async () => {
      await service.deleteImageByUrl('https://other-host.com/some/key.png');

      expect(mockRemoveObject).not.toHaveBeenCalled();
    });
  });
});
