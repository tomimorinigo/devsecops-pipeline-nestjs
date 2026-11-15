import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { Note } from '../notes/note.entity.js';
import { Product } from '../products/product.entity.js';
import { User } from '../users/user.entity.js';

export const SEED_USERS = {
  alice: 'alice@tpi.local',
  bob: 'bob@tpi.local',
};

const PRODUCTS = [
  {
    name: 'Teclado mecánico',
    description: 'Switches rojos, layout español',
    price: '85000.00',
  },
  {
    name: 'Mouse inalámbrico',
    description: 'Sensor óptico 16000 DPI',
    price: '42000.00',
  },
  {
    name: 'Monitor 27 pulgadas',
    description: 'IPS 144 Hz',
    price: '390000.00',
  },
  {
    name: 'Auriculares',
    description: 'Con micrófono y cancelación de ruido',
    price: '120000.00',
  },
  { name: 'Webcam HD', description: '1080p con autofoco', price: '65000.00' },
  {
    name: 'Silla ergonómica',
    description: 'Soporte lumbar regulable',
    price: '450000.00',
  },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const users = this.dataSource.getRepository(User);
    if ((await users.count()) > 0) return;

    const passwordHash = await bcrypt.hash(
      this.config.getOrThrow<string>('SEED_PASSWORD'),
      10,
    );

    await this.dataSource.transaction(async (tx) => {
      const [alice, bob] = await tx.save(User, [
        { email: SEED_USERS.alice, passwordHash },
        { email: SEED_USERS.bob, passwordHash },
      ]);
      await tx.save(Note, [
        {
          title: 'Contraseña del wifi',
          body: 'Nota privada de Alice #1',
          ownerId: alice.id,
        },
        {
          title: 'Lista de compras',
          body: 'Nota privada de Alice #2',
          ownerId: alice.id,
        },
        { title: 'Ideas', body: 'Nota privada de Bob', ownerId: bob.id },
      ]);
      await tx.save(Product, PRODUCTS);
    });

    this.logger.log('Seed data created');
  }
}
