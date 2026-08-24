/**
 * Document storage seam.
 *
 * 07_ARCHITECTURE.md defers the object-storage provider (S3-compatible or
 * Cloudinary) to implementation time, so verification depends on this interface
 * rather than on any vendor.
 *
 * 06_API_SPEC.md requires signed URLs for private media. Identity documents are
 * the most sensitive data NEST will hold, so the stored value is always an opaque
 * key and access is always a short-lived URL — never a durable public link.
 */

export interface StoredDocumentUpload {
  /** Opaque storage key. Persisted; never returned to a client. */
  key: string;
  sizeBytes: number;
}

export interface SignedDocumentUrl {
  url: string;
  expiresAt: Date;
}

export interface DocumentUploadRequest {
  /** Namespace prefix, so one professional's documents stay grouped. */
  professionalId: string;
  documentType: string;
  originalFilename: string;
  contentType: string;
  body: Buffer;
}

export interface DocumentStorage {
  put(request: DocumentUploadRequest): Promise<StoredDocumentUpload>;

  /** Mints a time-limited URL for reading one stored document. */
  signedUrl(key: string, ttlSeconds: number): Promise<SignedDocumentUrl>;

  remove(key: string): Promise<void>;
}

/** Injection token — `DocumentStorage` is an interface with no runtime identity. */
export const DOCUMENT_STORAGE = Symbol('DOCUMENT_STORAGE');

/** Content types accepted for a KYC document. */
export const ALLOWED_DOCUMENT_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
