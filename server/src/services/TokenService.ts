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

import jwt from 'jsonwebtoken';
import { config } from '~/config';
import { TokenError } from '~/errors';
import type { Token, TokenPayload } from '~/types';

export enum TokenTypes {
  USER = 'USER',
  NODE = 'NODE'
}

export class TokenService {
  public static readonly SIGN_OPTIONS: jwt.SignOptions = {
    algorithm: config.token.algorithm,
    expiresIn: config.token.expiration
  };

  public static readonly VERIFY_OPTIONS: jwt.VerifyOptions = {
    algorithms: [config.token.algorithm],
    complete: true
  };

  public sign(payload: TokenPayload): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        { key: config.token.privateKey, passphrase: config.token.passphrase },
        TokenService.SIGN_OPTIONS,
        (error, encoded) => {
          if (error) reject(new TokenError(error.message));
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          else resolve(encoded!);
        }
      );
    });
  }

  public verify(token: string): Promise<Token> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        config.token.publicKey,
        TokenService.VERIFY_OPTIONS,
        (error, decoded) => {
          if (error) reject(new TokenError(error.message));
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          else resolve(decoded! as Token);
        }
      );
    });
  }
}
