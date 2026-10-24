export enum MembershipRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

export namespace MembershipRole {
  export function parse(value: string): MembershipRole {
    if (Object.values(MembershipRole).includes(value as MembershipRole)) {
      return value as MembershipRole;
    }
    throw new Error(`Invalid MembershipRole: ${value}`);
  }

  export function isValid(value: string): boolean {
    return Object.values(MembershipRole).includes(value as MembershipRole);
  }
}
