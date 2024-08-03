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


// server.js
const app = require('./app');

// Set the port to an environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
