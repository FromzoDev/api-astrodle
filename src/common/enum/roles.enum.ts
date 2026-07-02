export enum Role {
    User = 'user',
    Moderator = 'moderator',
    Admin = 'admin',
};

export const RoleHierarchy: Record<Role, number> = {
  [Role.User]: 1,
  [Role.Moderator]: 2,
  [Role.Admin]: 3,
};