import { SetMetadata } from "@nestjs/common"

export const PermissionDecorator = (...permissions: string[]) => {
    SetMetadata('permissions', permissions)
}