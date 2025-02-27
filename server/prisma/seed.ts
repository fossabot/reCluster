/*
 * MIT License
 *
 * Copyright (c) 2022-2022 Carlo Corradini
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { PrismaClient } from '@prisma/client';
import pino from 'pino';
import { users, cpus, nodes, nodePools } from './data';

const logger = pino({ level: 'debug', name: 'prisma-seed' });
const prisma = new PrismaClient();

async function main() {
  logger.debug('Connecting database');
  await prisma.$connect();

  logger.info('Start seeding');

  logger.debug(`Seeding ${users.length} Users`);
  await Promise.all(
    users.map(async (user) => {
      await prisma.user.create({ data: user });
    })
  );

  logger.debug(`Seeding ${cpus.length} CPUs`);
  await Promise.all(
    cpus.map(async (cpu) => {
      await prisma.cpu.create({ data: cpu });
    })
  );

  logger.debug(`Seeding ${nodePools.length} Node pools`);
  await Promise.all(
    nodePools.map(async (nodePool) => {
      await prisma.nodePool.create({ data: nodePool });
    })
  );

  logger.debug(`Seeding ${nodes.length} Nodes`);
  await Promise.all(
    nodes.map(async (node) => {
      await prisma.node.create({ data: node });
    })
  );

  logger.info('Seeding completed');
}

main()
  .catch((error) => {
    logger.error(error instanceof Error ? error.message : error);
    throw error;
  })
  .finally(async () => {
    logger.debug('Disconnecting database');
    await prisma.$disconnect();
  });
