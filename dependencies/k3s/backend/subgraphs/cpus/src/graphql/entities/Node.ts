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

import { GraphQLID } from 'graphql';
import { Directive, Field, ObjectType } from 'type-graphql';
import { Node as NodePrisma } from '@prisma/client';
import { Cpu } from './Cpu';

@ObjectType()
// TODO @Directive(`@key(fields: "id", resolvable: false)`) when type-graphql supports GraphQL v16
@Directive(`@key(fields: "id")`)
export class Node implements Pick<NodePrisma, 'id' | 'cpuId'> {
  @Field(() => GraphQLID)
  id!: string;

  @Field(() => GraphQLID)
  @Directive(`@external`)
  cpuId!: string;

  @Field(() => Cpu, { description: 'Node Cpu' })
  @Directive(`@requires(fields: "cpuId")`)
  cpu?: Cpu;
}
