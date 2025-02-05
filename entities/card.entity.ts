import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, PrimaryColumn } from "typeorm";

@Entity()
export class Card {
    
    @PrimaryGeneratedColumn('uuid')
    id!: number;

    @PrimaryColumn({ type: "varchar", unique: true, nullable: false })
    code: string | null = null;

    @Column({ type: "varchar", nullable: true })
    cid: string | null = null;

    @Column("json", {nullable: true})
    name: {
        zh: string;
        ja: string;
        en: string;
    } | null = null;
    
    @Column({ type: "tinyint", default: 0 })
    status!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt!: Date;
    
}