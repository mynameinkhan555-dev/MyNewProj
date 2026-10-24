import { UniqueId } from '@workspace/kernel';

export class PasswordCredentialId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}
