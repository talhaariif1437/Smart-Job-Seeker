const http = require('http');
const https = require('https');
const app = require('./app');
const fs = require('fs');
const port = process.env.PORT || 7001;

const options = {
    key: fs.existsSync(process.env.SSL_KEY)
      ? fs.readFileSync(process.env.SSL_KEY)
      : null,
    cert: fs.existsSync(process.env.SSL_CRT)
      ? fs.readFileSync(process.env.SSL_CRT)
      : null,
  };


  const server = process.env.MODE =="DEV"
  ? http.createServer(app)
  :https.createServer(options,app);

  console.log("Serving on ",port);
  server.listen(port);