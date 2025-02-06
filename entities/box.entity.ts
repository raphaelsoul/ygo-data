import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from "typeorm";

@Index(['code', 'language'], { unique: true })
@Entity()
export class Box {
    
    @PrimaryGeneratedColumn('uuid')
    id!: string;
    
    @Column({ type: "varchar", unique: true, nullable: false })
    code: string | null = null;
    
    @Column({ type: "varchar", nullable: false })
    language!: string;

    @Column({ type: "varchar", nullable: false })
    name!: string;

    @Column({ type: "int", default: 0 })
    count!: number;

    @Column({ type: "tinyint", default: 0 })
    status!: number;

    @Column({ type: "varchar", nullable: false })
    url!: string;

    @Column({ type: "datetime", nullable: true })
    publishAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt!: Date;
}
