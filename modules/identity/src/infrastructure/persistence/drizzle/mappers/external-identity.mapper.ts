import { ExternalIdentity } from '../../../../domain/ExternalIdentity';
import type { ExternalIdentitySelect, ExternalIdentityInsert } from '../schema/external-identities.table';

/**
 * Mapper between ExternalIdentity domain entity and persistence model
 */
export class ExternalIdentityMapper {
  static toDomain(row: ExternalIdentitySelect): ExternalIdentity {
    return ExternalIdentity.reconstruct({
      id: row.id,
      userId: row.userId,
      provider: row.provider,
      providerSubject: row.providerSubject,
      identityVerifiedAt: row.identityVerifiedAt,
      providerEmail: row.providerEmail,
      providerEmailVerified: row.providerEmailVerified,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(externalIdentity: ExternalIdentity): ExternalIdentityInsert {
    return {
      id: externalIdentity.id.value,
      userId: externalIdentity.userId.value,
      provider: externalIdentity.provider.value,
      providerSubject: externalIdentity.providerSubject,
      identityVerifiedAt: externalIdentity.identityVerifiedAt,
      providerEmail: externalIdentity.providerEmail?.value ?? null,
      providerEmailVerified: externalIdentity.providerEmailVerified,
      createdAt: externalIdentity.createdAt,
      updatedAt: externalIdentity.updatedAt,
    };
  }
}
