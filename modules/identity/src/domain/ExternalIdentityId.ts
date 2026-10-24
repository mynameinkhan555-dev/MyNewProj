import { UniqueId } from '@workspace/kernel';

export class ExternalIdentityId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}
