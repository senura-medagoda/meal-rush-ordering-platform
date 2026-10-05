import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const img = (text: string) =>
  `https://placehold.co/600x400/png?text=${encodeURIComponent(text)}`;

const slugify = (t: string) =>
  t.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function main() {
  // ---- Admin user ----
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  }
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'MealRush Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN,
    },
  });

  // ---- Categories ----
  const categoryNames = ['Rice & Curry', 'Kottu & Noodles', 'Burgers & Snacks', 'Beverages', 'Desserts'];
  const categories: Record<string, number> = {};
  for (const name of categoryNames) {
    const c = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    categories[name] = c.id;
  }

  // ---- Products ----
  const products = [
    { name: 'Chicken Rice & Curry', cat: 'Rice & Curry', price: 1200, isVeg: false, stock: 50, description: 'Steamed rice with chicken curry, dhal, and three vegetable sides.' },
    { name: 'Vegetable Rice & Curry', cat: 'Rice & Curry', price: 950, isVeg: true, stock: 40, description: 'Steamed rice with dhal, pumpkin curry, beetroot, and sambol.' },
    { name: 'Fish Ambul Thiyal Rice', cat: 'Rice & Curry', price: 1400, isVeg: false, stock: 30, description: 'Sour fish curry cooked the southern way, served with rice and sides.' },
    { name: 'Chicken Kottu', cat: 'Kottu & Noodles', price: 1300, isVeg: false, stock: 60, description: 'Chopped godamba roti stir-fried with chicken, egg, and vegetables.' },
    { name: 'Cheese Kottu', cat: 'Kottu & Noodles', price: 1500, isVeg: false, stock: 40, description: 'Loaded kottu with melted cheese and spicy gravy.' },
    { name: 'Vegetable Fried Noodles', cat: 'Kottu & Noodles', price: 900, isVeg: true, stock: 35, description: 'Wok-fried noodles with fresh seasonal vegetables.' },
    { name: 'Crispy Chicken Burger', cat: 'Burgers & Snacks', price: 1100, isVeg: false, stock: 45, description: 'Crispy fried chicken, lettuce, and house sauce in a toasted bun.' },
    { name: 'Vegetable Roll', cat: 'Burgers & Snacks', price: 180, isVeg: true, stock: 100, description: 'Crispy golden roll filled with spiced vegetables.' },
    { name: 'Iced Coffee', cat: 'Beverages', price: 650, isVeg: true, stock: 80, description: 'Chilled coffee with milk and a hint of caramel.' },
    { name: 'Fresh Lime Juice', cat: 'Beverages', price: 400, isVeg: true, stock: 80, description: 'Freshly squeezed lime with a touch of sugar.' },
    { name: 'Watalappan', cat: 'Desserts', price: 550, isVeg: true, stock: 25, description: 'Traditional Sri Lankan coconut custard with jaggery and cardamom.' },
    { name: 'Chocolate Brownie', cat: 'Desserts', price: 600, isVeg: true, stock: 30, description: 'Warm fudgy brownie with chocolate sauce.' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: slugify(p.name) },
      update: {},
      create: {
        name: p.name,
        slug: slugify(p.name),
        description: p.description,
        price: p.price,
        imageUrl: img(p.name),
        isVeg: p.isVeg,
        stock: p.stock,
        categoryId: categories[p.cat],
      },
    });
  }

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());