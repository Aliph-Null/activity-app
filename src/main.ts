import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
/* eslint-disable @typescript-eslint/no-require-imports */
const session = require('express-session');
const passport = require('passport');
const hbs = require('hbs');
import { marked } from 'marked';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const viewsPath = join(__dirname, '..', 'views');
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('hbs');
  await new Promise<void>((resolve, reject) => {
    hbs.registerPartials(join(viewsPath, 'partials'), (err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  hbs.registerHelper('eq', (a, b) => a === b);
  hbs.registerHelper('or', (...args) => {
    args.pop();
    return args.some(Boolean);
  });
  hbs.registerHelper('add', (a: number, b: number) => a + b);
  hbs.registerHelper('sub', (a: number, b: number) => a - b);
  hbs.registerHelper('gt', (a: number, b: number) => a > b);
  hbs.registerHelper('lt', (a: number, b: number) => a < b);
  hbs.registerHelper('range', (from: number, to: number) => {
    const result: number[] = [];
    for (let i = from; i <= to; i++) result.push(i);
    return result;
  });
  hbs.registerHelper('includes', (arr: string | any[], val: any) => {
    if (Array.isArray(arr)) return arr.includes(val);
    return false;
  });
  hbs.registerHelper('json', (context) => JSON.stringify(context));
  hbs.registerHelper('markdown', (text: string) => {
    if (!text) return '';
    return new hbs.handlebars.SafeString(marked.parse(text) as string);
  });
  hbs.registerHelper('split', (str: string, sep: string) => {
    if (typeof str !== 'string') return [];
    return str.split(sep).map((s: string) => s.trim()).filter(Boolean);
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'ai3-dev-secret-change-in-prod',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use((req: any, _res: any, next: any) => {
    if (!req.session) return next();

    req.flash = (type?: string, message?: string) => {
      if (!req.session._flash) req.session._flash = {};
      if (!type) {
        const msgs = req.session._flash || {};
        req.session._flash = {};
        return msgs;
      }
      if (!message) return req.session._flash[type] || [];
      if (!req.session._flash[type]) req.session._flash[type] = [];
      req.session._flash[type].push(message);
    };

    req.session._flashMessages = req.flash();
    next();
  });

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port);
  console.log(`AI3 Dashboard running on http://localhost:${port}`);
}
bootstrap();
