import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import type {
  DocumentStorage,
  DocumentUploadRequest,
  SignedDocumentUrl,
  StoredDocumentUpload,
} from './document-storage';

/**
 * Development document storage: writes to a local directory.
 *
 * This exists so the verification workflow can be built and tested without an
 * object-storage account. It is NOT a stand-in for a real provider:
 *
 *   * `apiEnvSchema` rejects `DOCUMENT_STORAGE_PROVIDER=local` when NODE_ENV is
 *     production, so it cannot reach a real deployment.
 *   * Its "signed" URL is a plain `file://` path with **no enforced expiry** — a
 *     local file cannot revoke itself. The returned `expiresAt` describes the
 *     intended policy, not something this implementation enforces. That gap is
 *     exactly why it is development-only.
 *   * Files are written to local disk, which does not survive a container.
 */
@Injectable()
export class LocalDiskDocumentStorage implements DocumentStorage {
  private readonly logger = new Logger(LocalDiskDocumentStorage.name);

  constructor(private readonly config: AppConfigService) {}

  async put(request: DocumentUploadRequest): Promise<StoredDocumentUpload> {
    // The key is server-generated. Deriving it from the uploaded filename would
    // let a caller steer the write path with `../` segments.
    const extension = safeExtension(request.originalFilename);
    const key = `${request.professionalId}/${request.documentType}/${randomUUID()}${extension}`;
    const destination = this.resolveWithinRoot(key);

    await mkdir(join(destination, '..'), { recursive: true });
    await writeFile(destination, request.body);

    this.logger.warn(
      `[DEV STORAGE — local disk, not a real provider] stored document at ${destination}`,
    );

    return { key, sizeBytes: request.body.byteLength };
  }

  signedUrl(key: string, ttlSeconds: number): Promise<SignedDocumentUrl> {
    const destination = this.resolveWithinRoot(key);

    return Promise.resolve({
      url: pathToFileURL(destination).href,
      // Nominal only. A file:// path has no expiry; see the class comment.
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    });
  }

  async remove(key: string): Promise<void> {
    await rm(this.resolveWithinRoot(key), { force: true });
  }

  /**
   * Resolves a key inside the storage root, refusing anything that escapes it.
   *
   * Keys are server-generated today, so traversal should be impossible — this is
   * the check that keeps it impossible if that ever changes.
   */
  private resolveWithinRoot(key: string): string {
    const root = resolve(this.config.documentStorageDir);
    const destination = resolve(root, key);

    if (destination !== root && !destination.startsWith(root + sep)) {
      throw new Error('Refusing to resolve a document path outside the storage root');
    }

    return destination;
  }
}

/** Keeps a short, known-safe extension; drops anything unexpected. */
function safeExtension(filename: string): string {
  const extension = extname(filename).toLowerCase();

  return /^\.[a-z0-9]{1,5}$/.test(extension) ? extension : '';
}
