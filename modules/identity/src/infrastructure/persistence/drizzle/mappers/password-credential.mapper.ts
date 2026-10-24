import { PasswordCredential } from '../../../../domain/PasswordCredential';
import type { PasswordCredentialSelect, PasswordCredentialInsert } from '../schema/password-credentials.table';

/**
 * Mapper between PasswordCredential domain entity and persistence model
 */
export class PasswordCredentialMapper {
  static toDomain(row: PasswordCredentialSelect): PasswordCredential {
    return PasswordCredential.reconstruct({
      id: row.id,
      userId: row.userId,
      hashedPassword: row.hashedPassword,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(passwordCredential: PasswordCredential): PasswordCredentialInsert {
    return {
      id: passwordCredential.id.value,
      userId: passwordCredential.userId.value,
      hashedPassword: passwordCredential.hashedPassword,
      createdAt: passwordCredential.createdAt,
      updatedAt: passwordCredential.updatedAt,
    };
  }
}
