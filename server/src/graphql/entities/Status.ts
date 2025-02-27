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
import { GraphQLTimestamp } from 'graphql-scalars';
import { NodeStatusEnum } from '~/db';
// eslint-disable-next-line import/no-cycle
import { Node } from './Node';

@ObjectType({ description: 'Status' })
export class Status implements Prisma.Status {
  @Field(() => GraphQLID, { description: 'Status identifier' })
  id!: string;

  @Field(() => NodeStatusEnum, { description: 'Status' })
  status!: NodeStatusEnum;

  @Field(() => GraphQLString, {
    nullable: true,
    description: 'Status reason'
  })
  reason!: string | null;

  @Field(() => GraphQLString, {
    nullable: true,
    description: 'Status message'
  })
  message!: string | null;

  @Field(() => GraphQLTimestamp, {
    nullable: true,
    description: 'Last heartbeat timestamp'
  })
  lastHeartbeat!: Date | null;

  @Field(() => GraphQLTimestamp, { description: 'Last transition timestamp' })
  lastTransition!: Date;

  @Field(() => GraphQLTimestamp, { description: 'Up date timestamp' })
  updatedAt!: Date;

  /* Field resolvers */

  @Field(() => Node, { description: 'Status node' })
  node!: Node;
}
