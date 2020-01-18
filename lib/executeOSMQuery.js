var request = require('request');
var querystring = require('querystring');

let backends = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  // 'https://overpass.openstreetmap.ru/cgi/interpreter'
]

module.exports = function executeOSMQuery(query) {
  let index = 0;
  let maxAttempts = 20;
  let totalAttempts = 0;

  return tryNext();

  function tryNext() {
    if (index > backends.length) index = 0;
    let url = backends[index];
    index += 1;
    totalAttempts += 1;
    console.warn('Trying ' + url);

    return tryUrl(url).catch(handleError);

    function handleError(err) {
      console.error(err);
      if (totalAttempts < maxAttempts) return tryNext();
      else Promise.reject('Too many attempts')
    }
    
    function tryUrl(url) {
      return new Promise((resolve, reject) => {
        var reqOptions = {
          uri: url,
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: querystring.stringify({ data: query }),
          json: true
        };

        request(reqOptions, function(err, response, body) {
          if (err) {
            reject(err);
            return;
          }
          if (response.statusCode === 200) {
            resolve(body);
          } else {
            reject(body);
          }
        });
      });
    }
  }
}
