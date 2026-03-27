const https = require('https');

https.get('https://raw.githubusercontent.com/marilsonns15trabalho-eng/programa-lioness/main/src/models/anamnese.py', (resp) => {
  let data = '';
  resp.on('data', (chunk) => {
    data += chunk;
  });
  resp.on('end', () => {
    console.log(data);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
