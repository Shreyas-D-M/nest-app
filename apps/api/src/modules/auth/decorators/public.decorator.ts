import { SetMetadata, type CustomDecorator } from '@nestjs/common';

/**
 * Marks a route as reachable without authentication.
 *
 * The access-token guard is registered globally, so every endpoint is protected
 * unless it opts out here. Secure-by-default: forgetting the decorator makes an
 * endpoint unreachable, which is noticed immediately, whereas forgetting to *add*
 * a guard would silently expose it.
 */
export const IS_PUBLIC_KEY = 'nest:isPublic';

export const Public = (): CustomDecorator<string> => SetMetadata(IS_PUBLIC_KEY, true);
