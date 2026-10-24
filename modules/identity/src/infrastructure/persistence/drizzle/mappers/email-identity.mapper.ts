import { EmailIdentity } from '../../../../domain/EmailIdentity';
import type { EmailIdentitySelect, EmailIdentityInsert } from '../schema/email-identities.table';

/**
 * Mapper between EmailIdentity domain entity and persistence model
 */
export class EmailIdentityMapper {
  static toDomain(row: EmailIdentitySelect): EmailIdentity {
    return EmailIdentity.reconstruct({
      id: row.id,
      userId: row.userId,
      email: row.email,
      verifiedAt: row.verifiedAt,
      primary: row.primary,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(emailIdentity: EmailIdentity): EmailIdentityInsert {
    return {
      id: emailIdentity.id.value,
      userId: emailIdentity.userId.value,
      email: emailIdentity.email.value,
      verifiedAt: emailIdentity.verifiedAt,
      primary: emailIdentity.primary,
      createdAt: emailIdentity.createdAt,
      updatedAt: emailIdentity.updatedAt,
    };
  }
}
