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

import type { Prisma } from '@prisma/client';
import { Field, InputType } from 'type-graphql';
import { GraphQLTimestamp } from 'graphql-scalars';

@InputType({ isAbstract: true, description: 'Timestamp filter' })
export class TimestampFilter implements Prisma.DateTimeFilter {
  @Field(() => GraphQLTimestamp, {
    nullable: true,
    description: 'Timestamp equals'
  })
  equals?: Date;

  @Field({ nullable: true, description: 'Timestamp not equals' })
  not?: TimestampFilter;

  @Field(() => [GraphQLTimestamp], {
    nullable: true,
    description: 'Timestamp exists in list'
  })
  in?: Date[];

  @Field(() => [GraphQLTimestamp], {
    nullable: true,
    description: 'Timestamp does not exists in list'
  })
  notIn?: Date[];

  @Field(() => GraphQLTimestamp, {
    nullable: true,
    description: 'Timestamp is less than'
  })
  lt?: Date;

  @Field(() => GraphQLTimestamp, {
    nullable: true,
    description: 'Timestamp is less than or equal to'
  })
  lte?: Date;

  @Field(() => GraphQLTimestamp, {
    nullable: true,
    description: 'Timestamp is greater than'
  })
  gt?: Date;

  @Field(() => GraphQLTimestamp, {
    nullable: true,
    description: 'Timestamp is greater than or equal to'
  })
  gte?: Date;
}
