import { Entity, Index, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, PrimaryColumn } from "typeorm";

@Entity()
@Index(["code", "cid"], { unique: true })
export class Card {
    
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @PrimaryColumn({ type: "varchar", unique: true, nullable: false })
    code: string | null = null;

    @Column({ type: "varchar", nullable: true })
    cid: string | null = null;

    @Column("json", {nullable: true})
    name: {
        zh: string;
        jp: string;
        en: string;
    } | null = null;
    
    @Column({ type: "boolean", default: 0 })
    status!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt!: Date;
    
}