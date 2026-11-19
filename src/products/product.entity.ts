import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from './comment.entity.js';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('numeric', { precision: 10, scale: 2 })
  price: string;

  @OneToMany(() => Comment, (comment) => comment.product)
  comments: Comment[];
}
