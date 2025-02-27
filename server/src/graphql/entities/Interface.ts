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

import type * as Prisma from '@prisma/client';
import { GraphQLID, GraphQLString } from 'graphql';
import { Field, ObjectType } from 'type-graphql';
import { GraphQLBigInt, GraphQLTimestamp } from 'graphql-scalars';
import { WoLFlagEnum } from '~/db';
// eslint-disable-next-line import/no-cycle
import { Node } from './Node';

@ObjectType({ description: 'Interface' })
export class Interface implements Prisma.Interface {
  @Field(() => GraphQLID, { description: 'Interface identifier' })
  id!: string;

  nodeId!: string;

  @Field(() => GraphQLString, { description: 'Interface name' })
  name!: string;

  @Field(() => GraphQLString, { description: 'Interface MAC address' })
  address!: string;

  @Field(() => [WoLFlagEnum], {
    description: 'Interface Wake-on-Lan flags'
  })
  wol!: WoLFlagEnum[];

  @Field(() => GraphQLTimestamp, { description: 'Creation timestamp' })
  createdAt!: Date;

  @Field(() => GraphQLTimestamp, { description: 'Update timestamp' })
  updatedAt!: Date;

  /* Field resolvers */

  @Field(() => GraphQLBigInt, { description: 'Interface speed' })
  speed!: bigint;

  @Field(() => Node, { description: 'Interface node' })
  node!: Node;
}
