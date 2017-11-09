var SFTP = require('./');

var sftp = SFTP();

sftp.on('ready', function () {
	console.log('ready');
	sftp.mkdir('my/subfolder/dir', true, function (err, data) {
		console.log(err, data);

		//sftp.end();
	});

	sftp.get('./asdfsadfsadf.asdfasdf', function (err, stream) {
		console.log(err);

	});
}).on('error', function (err) {
	console.log(err);
}).connect({
	host : process.env.SFTP_HOST
	, user : process.env.SFTP_USER
	, password : process.env.SFTP_PASSWORD
});
