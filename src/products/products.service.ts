import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Comment } from './comment.entity.js';
import { Product } from './product.entity.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
  ) {}

  search(term: string): Promise<Product[]> {
    // FIX-01: parameterized query, user input never becomes part of the SQL
    return this.dataSource.query(
      'SELECT id, name, description, price FROM products WHERE name ILIKE $1 ORDER BY id',
      [`%${term}%`],
    );
  }

  async findOneWithComments(id: number) {
    const product = await this.products.findOne({
      where: { id },
      relations: { comments: true },
      order: { comments: { createdAt: 'ASC' } },
    });
    if (!product) {
      throw new NotFoundException();
    }
    return product;
  }

  async addComment(productId: number, body: string, authorEmail: string) {
    await this.findOneWithComments(productId);
    return this.comments.save(
      this.comments.create({ productId, body, authorEmail }),
    );
  }
}
