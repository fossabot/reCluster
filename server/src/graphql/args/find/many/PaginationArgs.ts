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

import { GraphQLID, GraphQLInt } from 'graphql';
import { ArgsType, Field } from 'type-graphql';
import { GraphQLNonNegativeInt } from 'graphql-scalars';
import { Max, Min } from 'class-validator';

@ArgsType()
export abstract class PaginationArgs {
  public static readonly SKIP_DEFAULT_VALUE: number = 0;

  public static readonly TAKE_DEFAULT_VALUE: number = 8;

  public static readonly TAKE_MIN_VALUE: number = -16;

  public static readonly TAKE_MAX_VALUE: number = 16;

  @Field(() => GraphQLNonNegativeInt, {
    defaultValue: PaginationArgs.SKIP_DEFAULT_VALUE,
    description: `Skip data`
  })
  skip!: number;

  @Field(() => GraphQLInt, {
    defaultValue: PaginationArgs.TAKE_DEFAULT_VALUE,
    description: `Take data`
  })
  @Min(PaginationArgs.TAKE_MIN_VALUE)
  @Max(PaginationArgs.TAKE_MAX_VALUE)
  take!: number;

  @Field(() => GraphQLID, {
    nullable: true,
    description: `Data cursor`
  })
  cursor?: string;
}
