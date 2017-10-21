var express = require('express');
var router = express.Router();
var crypto = require('crypto');

const key = "route-test";

function verifyGitHub(req){
  if (!req.headers['user-agent'].includes('GitHub-Hookshot')) {
    return false;
  }
  // Compare their hmac signature to our hmac signature
  // (hmac = hash-based message authentication code)
  const theirSignature = req.headers['x-hub-signature'];
  const payload = JSON.stringify(req.body);
  const secret = 'route-test-123';
  const ourSignature = `sha1=${crypto.createHmac('sha1', secret).update(payload).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(theirSignature), Buffer.from(ourSignature));
};

/* GET home page. */
router.post('/', function(req, res) {
  //console.log(req.body);
  console.log(verifyGitHub(req));
  res.send("Thanks!");
});

module.exports = router;
