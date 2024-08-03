// const http = require('http');
// const https = require('https');
// const app = require('./app');
// const fs = require('fs');
// const port = process.env.PORT || 7001;

// const options = {
//     key: fs.existsSync(process.env.SSL_KEY)
//       ? fs.readFileSync(process.env.SSL_KEY)
//       : null,
//     cert: fs.existsSync(process.env.SSL_CRT)
//       ? fs.readFileSync(process.env.SSL_CRT)
//       : null,
//   };


//   const server = process.env.MODE =="DEV"
//   ? http.createServer(app)
//   :https.createServer(options,app);

//   console.log("Serving on ",port);
//   server.listen(port);



const http = require('http');
const https = require('https');
const app = require('./app');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 7001;

let server;

// Check for the presence of SSL certificates
if (process.env.MODE !== "DEV" && process.env.SSL_KEY && process.env.SSL_CRT) {
    const options = {
        key: fs.readFileSync(process.env.SSL_KEY),
        cert: fs.readFileSync(process.env.SSL_CRT),
    };

    server = https.createServer(options, app);
    console.log("HTTPS server running on port", port);
} else {
    server = http.createServer(app);
    console.log("HTTP server running on port", port);
}

server.listen(port);
