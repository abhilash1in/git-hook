var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var pm2 = require('pm2');
const key = "route-test";
const PID = "3";


function verifyGitHub(req, secret){
	if (!req.headers['user-agent'].includes('GitHub-Hookshot')) {
		return false;
	}
// Compare their hmac signature to our hmac signature
// (hmac = hash-based message authentication code)
const theirSignature = req.headers['x-hub-signature'];
const payload = JSON.stringify(req.body);
const ourSignature = `sha1=${crypto.createHmac('sha1', secret).update(payload).digest('hex')}`;
return crypto.timingSafeEqual(Buffer.from(theirSignature), Buffer.from(ourSignature));
};

router.post('/', function(req, res) {
	console.log(verifyGitHub(req,"route-test"));
	pm2.connect(function(err) {
		if (err) {
			console.error(err);
			//process.exit(2);
		}
		pm2.describe(PID,function(pm2process,errback){
			console.log(pm2process);
		});
		/*pm2.restart(PID, function(restartErr, apps) {
			pm2.disconnect();   // Disconnects from PM2
			if (restartErr){
				console.error(restartErr);
			}
		});*/
	});
	res.send("Thanks!");
});

module.exports = router;
