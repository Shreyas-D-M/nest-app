import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { DOCUMENT_STORAGE, type DocumentStorage } from './document-storage';
import { LocalDiskDocumentStorage } from './local-disk-document-storage';

/**
 * Document storage wiring.
 *
 * The provider is chosen from configuration. Adding a real one means a new
 * implementation plus a branch here; nothing in the verification workflow changes.
 *
 * `apiEnvSchema` already refuses to boot a production deployment configured with
 * the `local` provider, so the exhaustive switch cannot ship a non-durable store.
 */
@Global()
@Module({
  providers: [
    LocalDiskDocumentStorage,
    {
      provide: DOCUMENT_STORAGE,
      inject: [AppConfigService, LocalDiskDocumentStorage],
      useFactory: (config: AppConfigService, localStorage: LocalDiskDocumentStorage): DocumentStorage => {
        switch (config.documentStorageProvider) {
          case 'local':
            return localStorage;
        }
      },
    },
  ],
  exports: [DOCUMENT_STORAGE],
})
export class StorageModule {}
