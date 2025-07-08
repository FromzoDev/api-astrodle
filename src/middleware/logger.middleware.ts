import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;

      let msg = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

      // Couleur simple selon status
      if (statusCode >= 500) {
        msg = `\x1b[31m${msg}\x1b[0m`; // rouge
      } else if (statusCode >= 400) {
        msg = `\x1b[33m${msg}\x1b[0m`; // jaune
      } else if (statusCode >= 300) {
        msg = `\x1b[36m${msg}\x1b[0m`; // cyan
      } else {
        msg = `\x1b[32m${msg}\x1b[0m`; // vert
      }

      this.logger.log(msg);
    });

    next();
  }
}
