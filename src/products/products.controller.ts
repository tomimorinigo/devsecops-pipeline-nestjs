import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Render,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/session.js';
import { CreateCommentDto } from './create-comment.dto.js';
import { ProductsService } from './products.service.js';

@Controller()
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @Render('index')
  home() {
    return { title: 'Tienda TPI' };
  }

  @Get('products/search')
  searchJson(@Query('q') q = '') {
    return this.products.search(String(q));
  }

  @Get('search')
  @Render('search')
  async searchPage(@Query('q') q = '') {
    const term = String(q);
    return {
      title: 'Buscar',
      q: term,
      results: await this.products.search(term),
    };
  }

  @Get('products/:id')
  @Render('product')
  async productPage(@Param('id', ParseIntPipe) id: number) {
    const product = await this.products.findOneWithComments(id);
    return { title: product.name, product };
  }

  @Post('products/:id/comments')
  @UseGuards(AuthGuard)
  async addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    await this.products.addComment(id, dto.body, req.user.email);
    res.redirect(303, `/products/${id}`);
  }
}
