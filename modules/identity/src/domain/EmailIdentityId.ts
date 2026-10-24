import { UniqueId } from '@workspace/kernel';

export class EmailIdentityId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}
