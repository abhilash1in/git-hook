var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var pm2 = require('pm2');

const key = "route-test";
const PID = "7";
const DIR = "/home/ubuntu/route-webhook-test/"

const git = require('simple-git')(DIR);

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
	var verified = verifyGitHub(req,"route-test");
	if (!verified){
		res.send(401,"Wrong Secret Key");
		return;
	}
	pm2.connect(function(connectErr) {
		if (connectErr) {
			console.error(connectErr);
			pm2.disconnect();
			res.send("Failed. Could not connect to PM2");
			return;
		}
		pm2.describe(PID,function(describeErr,pm2process){
			if(describeErr){
				console.error(describeErr);
				pm2.disconnect();
				res.send("Failed. Could not describe process with PID "+PID);
				return;
			}
			const status = pm2process[0]['pm2_env'].status;
			if(status == "online" || status == "errored" ){
				git.pull(function(pullErr,update){
					if(pullErr){
						console.error(pullErr);
						pm2.disconnect();
						res.send("Failed. Could not perform git pull for directory: "+DIR);
						return;
					}
					pm2.restart(PID, function(restartErr) {
						if(restartErr){
							console.error(restartErr);
							pm2.disconnect();
							res.send("Failed. Could not restart process with PID "+PID);
							return;
						}
						pm2.disconnect()
						res.send("Success");
					});
				});
			}
		});
	});
});

module.exports = router;
