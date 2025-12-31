import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";

@Entity('permissions')
export class Permission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @ManyToMany(() => Role, (role) => role.permissions)
    roles: Role[];
}