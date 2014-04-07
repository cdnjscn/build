var glob = require('glob'),
	fs = require('fs'),
	_ = require('underscore'),
	natcompare = require('./natcompare.js'),
	exec = require('child_process').exec,
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	async = require('async'),
	_config = require('./config'),
	DAY = 1,
	db = mongoose.createConnection('mongodb://' + _config.mongo_ip + ':' + _config.mongo_port + '/cdnjs'),
	cdnjsSchema = new Schema({
		"name": String,
		"filename": String,
		"version": String,
		"homepage": String,
		"description": String,
		"keywords": [String],
		"maintainers": [{
			"name": String,
			"email": String,
			"web": String
		}],
		"bugs": String,
		"licenses": [{
			"type": String,
			"url": String
		}],
		"repository": {
			"type": String,
			"url": String
		},
		"repositories": [{}],
		"assets": [{
			"version": String,
			"files": [String]
		}]
	}, {
		collection: 'cdnjs'
	}),
	Cdnjs = db.model('cdnjs', cdnjsSchema);

async.waterfall([
	function(callback) {
		var shell = 'cd ../cdnjs; git ls-tree -r --name-only HEAD | grep **/package.json | while read filename; do   echo "$(git log -1 --since="' + DAY + ' days ago" --name-status --format="%ad" -- $filename) blahcrap"; done';
		exec(shell, function(err, stdout, stderr) {
			var recentLibraries = stdout.split('blahcrap');
			recentLibraries = _.filter(recentLibraries, function(lib) {
				if (lib.length > 4) {
					return true;
				};
				return false;
			});
			recentLibraries = _.map(recentLibraries, function(lib) {
				lib = lib.replace('\n\n', '\n');
				lib = lib.replace('\t', '\n');
				lib = lib.substr(1);
				lib = lib.split('\n');
				if (lib.length < 3) return;
				lib[0] = new Date(lib[0]);
				lib = {
					date: lib[0],
					change: lib[1],
					path: lib[2].replace(/(^\s+|\s+$)/g, '')
				}
				return lib;
			});
			//remove undefined
			recentLibraries = _.compact(recentLibraries);
			//console.dir(recentLibraries);
			recentLibraries = _.sortBy(recentLibraries, function(arrayElement) {
				//element will be each array, so we just return a date from first element in it
				//console.dir(arrayElement);
				return arrayElement.date.getTime();
			});
			recentLibraries = recentLibraries.reverse();
			//console.log(recentLibraries);
			callback(null, recentLibraries);
		});
	},
	function(recentLibraries, callback) {
		async.each(recentLibraries, function(lib, next) {
			//console.log(lib);
			var path = lib.path.replace(/\/package\.json$/, '');
			var package = JSON.parse(fs.readFileSync('../cdnjs/' + lib.path, 'utf8'));
			package.assets = [];
			var versions = glob.sync('../cdnjs/' + path + "/!(package.json)");
			versions.forEach(function(version) {
				var temp = {};
				temp.version = version.replace(/^.+\//, "");
				temp.files = glob.sync(version + "/**/*.*");
				for (var i = 0; i < temp.files.length; i++) {
					temp.files[i] = temp.files[i].replace(version + "/", "");
				}
				package.assets.push(temp);
			});
			package.assets.sort(function(a, b) {
				return natcompare.compare(a.version, b.version);
			})
			package.assets.reverse();
			Cdnjs.update({
				'name': package.name
			}, {
				'$set': package
			}, {
				'upsert': true
			}).exec(function() {
				next();
			});
		}, function(err) {
			callback(err);
		});
	},
], function(err, result) {
	err && console.log(err);
	console.log('all is ok');
});
