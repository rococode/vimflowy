import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';
import * as minimist from 'minimist';

import logger from '../shared/utils/logger';

import makeSocketServer from './socket_server';
import { defaultStaticDir, publicPath } from './constants';

async function main(args: any) {
  if (args.help || args.h) {
    process.stdout.write(`
      Usage: ./node_modules/.bin/ts-node ${process.argv[1]}
          -h, --help: help menu

          --host $hostname: Host to listen on
          --port $portnumber: Port to run websocket (database) server on
          --httpport $portnumber: Port to run http server on
          --httpsport $portnumber: Port to run https server on

          --sslKey: Path to key; enables https server
          --sslCert: Path to cert
          
          --db $dbtype: If a db is set, we will additionally run a socket server.
            Available options:
            - 'sqlite' to use sqlite backend
            Any other value currently defaults to an in-memory backend.
          --password: password to protect database with (defaults to empty)

          --dbfolder: For sqlite backend only.  Folder for sqlite to store data
            (defaults to in-memory if unspecified)

          --staticDir: Where static assets should be served from.  Defaults to the \`static\`
            folder at the repo root.

    `, () => {
      process.exit(0);
    });
    return;
  }

  const staticDir = path.resolve(args.staticDir || defaultStaticDir);
  const buildDir = path.join(staticDir, publicPath);

  let httpPort: number = args.httpport || 80;
  let httpsPort: number = args.httpsport || 443;
  let host: string = args.host || 'localhost';
  let sslKey: string = args.sslKey || null;
  let sslCert: string = args.sslCert || null;
  logger.info('sslKey: ' + sslKey);
  logger.info('sslCert: ' + sslCert);

  if (!fs.existsSync(buildDir)) {
    logger.info(`
        No assets found at ${buildDir}!
        Try running \`npm run build -- --outdir ${buildDir}\` first.
        Or specify where they should be found with --staticDir $somedir.
    `);
    return;
  }
  logger.info('Starting production server');

  if (sslKey == null) {
    const httpApp = express();
    httpApp.use(express.static(staticDir));
    const httpServer: http.Server = http.createServer(httpApp as any);
    if (args.db) {
      const options = {
        db: args.db,
        dbfolder: args.dbfolder,
        password: args.password,
        path: '/socket',
      };
      makeSocketServer(httpServer, options);
    }
    httpServer.listen(httpPort, host, (err?: Error) => {
      if (err) { return logger.error(err); }
      logger.info('HTTP listening on http://%s:%d', httpServer.address().address, httpServer.address().port);
    });
  } else {
    let privateKey = fs.readFileSync(sslKey);
    let certificate = fs.readFileSync(sslCert);
    const httpsApp = express();
    httpsApp.use(express.static(staticDir));
    const httpsServer = https.createServer({key: privateKey, cert: certificate}, httpsApp as any);

    if (args.db) {
      const options = {
        db: args.db,
        dbfolder: args.dbfolder,
        password: args.password,
        path: '/socket',
      };
      makeSocketServer(httpsServer, options);
    }
    httpsServer.listen(httpsPort, host, (err?: Error) => {
      if (err) { return logger.error(err); }
      logger.info('HTTPS listening on https://%s:%d', httpsServer.address().address, httpsServer.address().port);
    });

    const httpServer = http.createServer(function (req, res) {
        let hostHeader = 'host';
        res.writeHead(301, { 'Location': 'https://' + req.headers[hostHeader] + req.url });
        res.end();
    });
    httpServer.listen(httpPort, host, (err?: Error) => {
      if (err) { return logger.error(err); }
      logger.info('HTTP listening on http://%s:%d', httpServer.address().address, httpServer.address().port);
    });
  }
}

main(minimist(process.argv.slice(2)));
