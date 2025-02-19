import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";

@Entity()
export class Box {
    
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: "varchar", nullable: false, unique: true })
    boxId!: string;
    
    @Column({ type: "varchar", nullable: false })
    code: string | null = null;
    
    @Column({ type: "varchar", nullable: false })
    language!: string;

    @Column({ type: "varchar", nullable: false })
    name!: string;

    @Column({ type: "int", default: 0 })
    count!: number;

    @Column({ type: "boolean", default: false })
    status!: boolean;

    @Column({ type: "varchar", nullable: false })
    url!: string;

    @Column({ nullable: true })
    publishAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt!: Date;
}
