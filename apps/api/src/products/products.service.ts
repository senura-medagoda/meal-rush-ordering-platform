import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/slugify';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Public ----------
  findAllPublic(query: QueryProductsDto) {
    return this.list(query, true);
  }

  async findOneBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isAvailable: true },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ---------- Admin ----------
  findAllAdmin(query: QueryProductsDto) {
    return this.list(query, false);
  }

  async findOneById(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: productInclude });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    await this.ensureCategoryExists(dto.categoryId);
    return this.prisma.product.create({
      data: { ...dto, slug: slugify(dto.name) },
      include: productInclude,
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    if (dto.categoryId !== undefined) {
      await this.ensureCategoryExists(dto.categoryId);
    }
    return this.prisma.product.update({
      where: { id },
      data: { ...dto, ...(dto.name ? { slug: slugify(dto.name) } : {}) },
      include: productInclude,
    });
  }

  remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }

  // ---------- Helpers ----------
  private async list(query: QueryProductsDto, publicOnly: boolean) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where = this.buildWhere(query, publicOnly);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private buildWhere(q: QueryProductsDto, publicOnly: boolean): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    if (publicOnly) where.isAvailable = true;
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    if (q.category) where.category = { slug: q.category };
    if (q.isVeg !== undefined) where.isVeg = q.isVeg;
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      where.price = { gte: q.minPrice, lte: q.maxPrice };
    }
    return where;
  }

  private async ensureCategoryExists(categoryId: number) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new BadRequestException('Category does not exist');
  }
}