import { SetMetadata } from "@nestjs/common"

export const permission_key = 'permissions';
export const PermissionDecorator = (...permissions: string[]) => SetMetadata(permission_key, permissions)