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

import * as k8s from '@kubernetes/client-node';
import { inject, injectable, singleton } from 'tsyringe';
import convert from 'convert';
import type { K8sNode } from '~/types';
import { logger } from '~/logger';
import { NodeService } from '~/services/NodeService';
import { K8sService } from '~/services/K8sService';
import { kubeconfig } from './kubeconfig';

@singleton()
@injectable()
export class NodeInformer {
  public static readonly RESTART_TIME: number = convert(3, 's').to('ms');

  private readonly api: k8s.CoreV1Api;

  private readonly informer: k8s.Informer<k8s.V1Node>;

  public constructor(
    @inject(NodeService)
    private readonly nodeService: NodeService
  ) {
    this.api = kubeconfig.makeApiClient(k8s.CoreV1Api);

    this.informer = k8s.makeInformer(kubeconfig, '/api/v1/nodes', () =>
      this.api.listNode()
    );

    this.informer.on(k8s.ADD, (node: k8s.V1Node) => this.on(k8s.ADD, node));
    this.informer.on(k8s.UPDATE, (node: k8s.V1Node) =>
      this.on(k8s.UPDATE, node)
    );
    this.informer.on(k8s.DELETE, (node: k8s.V1Node) =>
      this.on(k8s.DELETE, node)
    );
    this.informer.on(k8s.CONNECT, this.onConnect.bind(this));
    this.informer.on(k8s.ERROR, this.onError.bind(this));
  }

  private restart() {
    logger.info(`Restarting Node informer in ${NodeInformer.RESTART_TIME} ms`);

    setTimeout(async () => {
      await this.start();
    }, NodeInformer.RESTART_TIME);
  }

  public async start() {
    try {
      logger.info('Starting Node informer');
      await this.informer.start();
    } catch (error) {
      logger.error(
        `Error starting Node informer: ${
          error instanceof Error ? error.message : error
        }`
      );
      this.restart();
    }
  }

  public async stop() {
    logger.info('Stopping Node informer');
    await this.informer.stop();
  }

  private onConnect() {
    logger.debug('Node informer connected');
  }

  private onError(error: unknown) {
    logger.error(
      `Node informer error: ${error instanceof Error ? error.message : error}`
    );
    this.restart();
  }

  private async onAdd(node: K8sNode) {
    logger.debug(`K8s node added: ${JSON.stringify(node)}`);

    await this.nodeService.update({
      where: { id: node.id },
      data: {
        name: node.name,
        address: node.address,
        hostname: node.hostname,
        status: node.status
      }
    });
  }

  private async onUpdate(node: K8sNode) {
    logger.debug(`K8s node updated: ${JSON.stringify(node)}`);

    await this.nodeService.update({
      where: { id: node.id },
      data: {
        name: node.name,
        address: node.address,
        hostname: node.hostname,
        status: node.status
      }
    });
  }

  private async onDelete(node: K8sNode) {
    logger.debug(`K8s node deleted: ${JSON.stringify(node)}`);

    await this.nodeService.shutdown({
      where: { id: node.id },
      status: { reason: 'NodeDeleted', message: 'Node deleted' }
    });
  }

  private on(verb: k8s.ADD | k8s.UPDATE | k8s.DELETE, node: k8s.V1Node) {
    try {
      const k8sNode = K8sService.toK8sNode(node);

      switch (verb) {
        case k8s.ADD:
          this.onAdd(k8sNode);
          break;
        case k8s.UPDATE:
          this.onUpdate(k8sNode);
          break;
        case k8s.DELETE:
          this.onDelete(k8sNode);
          break;
        default:
          logger.warn(`Node informer unknown verb '${verb}'`);
          break;
      }
    } catch (error) {
      logger.error(
        `Node informer on '${verb}' caught error: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }
}
