var path = require('path')
	, join = path.posix ? path.posix.join : path.join
	;

module.exports = wrap;

function wrap (sftp) {
	if (sftp.constructor.prototype.__isSFTPJSWrapped) {
		return sftp;
	}
	sftp.constructor.prototype.__isSFTPJSWrapped = true;
	sftp.constructor.prototype.list = list;
	sftp.constructor.prototype.__mkdir = sftp.constructor.prototype.mkdir;
	delete sftp.constructor.prototype.mkdir;
	sftp.constructor.prototype.mkdir = mkdir;
	sftp.constructor.prototype.get = get;
	sftp.constructor.prototype.put = put;
	sftp.constructor.prototype.delete = remove;

	return sftp;
}

function list (path, useCompression, cb) {
	var self = this
		, regDash = /-/gi

	cb = arguments[arguments.length - 1];

	self.readdir(path, function (err, data) {
		if (err) {
			return cb(err);
		}

		//create an ftp like result

		data.forEach(function (f, i) {
			data[i] = {
				type : f.longname.substr(0, 1)
				, name : f.filename
				, size : f.attrs.size
				, date : new Date(f.attrs.mtime * 1000)
				, rights : {
					user : f.longname.substr(1,3).replace(regDash, '')
					, group : f.longname.substr(4, 3).replace(regDash, '')
					, other : f.longname.substr(7, 3).replace(regDash, '')
				}
				, owner : f.attrs.uid
				, group : f.attrs.gid
				, target : null //TODO
				, sticky : null //TODO
			}
		});

		return cb(null, data);
	});
};

function mkdir (path, recursive, cb) {
	var self = this;

	if (arguments.length === 2) {
		cb = recursive;
		recursive = false;
	}

	if (!recursive) {
		return self.__mkdir(path, cb);
	}

	var tokens = path.split(/\//g);
	var p = '';

	return mkdirp();

	function mkdirp () {
		var token = tokens.shift();

		if (!token && !tokens.length) {
			return cb(null);
		}

		token += '/';
		p = join(p, token);

		return self.__mkdir(p, function (err) {
			if (err && err.code != 4) {
				return cb(err);
			}

			mkdirp();
		});
	}
};

function get (path, useCompression, cb) {
	var self = this;

	if (arguments.length === 2) {
		cb = useCompression;
		useCompression = null;
	}

	try {
		var stream = self.createReadStream(path);
	} catch (e) {
		return cb(e);
	}

	stream.on('error', handleError);

	stream.on('open', function (handle) {
		stream.removeListener('error', handleError);

		return cb(null, stream);
	});

	function handleError(err) {
		return cb(err);
	}
};

function put (input, destPath, useCompression, cb) {
	var self = this;

	if (arguments.length === 3) {
		cb = useCompression;
		useCompression = null;
	}

	//input can be a ReadableStream, Buffer or Path
	if (typeof input === 'string') {
		return self.fastPut(input, destPath, cb);
	}

	var stream = self.createWriteStream(destPath);
	stream.on('close', cb);

	if (input instanceof Buffer) {
		return stream.end(input);
	}

	return input.pipe(stream);
};

function remove (path, cb) {
	var self = this;

	return self.unlink(path, cb);
};
