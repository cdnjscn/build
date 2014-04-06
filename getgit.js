var https = require('https'),
	fs = require('fs'),
	mongoose = require('mongoose'),
	_ = require('underscore'),
	Schema = require('mongoose').Schema,
	request = require('request'),
	async = require('async');
	
var db = mongoose.createConnection('mongodb://127.0.0.1/cdnjs');


var cdnjsSchema = new Schema({
  "name": String,
  "filename": String,
  "version": String,
  "homepage": String,
  "description": String,
  "keywords": [String],
  "maintainers":[{"name": String,"email":String,"web": String}],
  "bugs": String,
  "licenses": [{"type":String,"url":String}],
  "repository":{"type": String,"url": String},
  "repositories": [{}],
  "assets": [{"version": String,"files": [String]}]
},{ collection: 'cdnjs' });

var cdnjscnSchema = new Schema({
  "name": String,
  'g_star': Number,
  'g_fork': Number
},{ collection: 'cdnjscn' });

var Cdnjs = db.model('cdnjs',cdnjsSchema);
var cdnjscn = db.model('cdnjscn', cdnjscnSchema);

Cdnjs.find({},{
	repositories:1,
	name: 1,
	_id: 0
}).exec(function(err,list){	
	
	var arr = [];
	_.each(list,function(v){
		var t = v.repositories[0],url = '';
		if(t){
			if(t.url == 'git://github.com/angular-strap/angular-strap.git'){
				t.url = 'https://github.com/mgcrea/angular-strap';
			}
			if(/^git\@github.com\:/.test(t.url)){
				t.url = t.url.replace(/git\@github.com\:/,'https://github.com/')
						.replace(/\.git$/,'');
			}
			if(/^git\:\/\/github\.com\//.test(t.url) && /\.git$/.test(t.url)){
				t.url = t.url.replace(/git\:\/\/github\.com\//,'https://github.com/')
						.replace(/\.git$/,'');
				
			}
			if(t && t.url && t.url.indexOf('https') == 0){
				url  = v.repositories[0].url.replace(/\.git$/,'');
				arr.push([v.name,url]);
			}
		}
	});
	console.log('total:' + arr.length);
	//console.log(arr);
	
	var arr301 = [],arrList = [],total = arr.length,i=0;
	
	var option = {
			timeout:10000,
			headers: {
			        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36 '
			}
	};
	
	
	async.eachSeries(arr,function(item,callback){
		var path = item[1];
		console.log('start: ' + path);
		option.url = path;
		request(option,function(error, res, html){
			//console.log(error);
			if(error){ //ESOCKETTIMEDOUT //ETIMEDOUT
				console.log(error);
				arrList.push(item);
				callback();
				return;
			}
			
			if(res.statusCode == '301'){
				if(res.headers.location.indexOf('https://github.com') == 0){
					arr301.push([item[0],res.headers.location])
				}
				callback();
				return;
			}
			
			console.log('end:' + path);
			console.log(res.statusCode);
			
			var reStar = /stargazers\">\s*([\d|,]+)\s*</;
			var reFork = /network\".*>\s*([\d|,]+)\s*</
		    var star = html.match(reStar);
			var fk = html.match(reFork);
			
			if(!fk){
				console.log(path);
				console.log(fk);
				callback();
				return;
			}
			if(fk && star) {
				console.log(item[0]);
				console.log('剩余: ' + (total - (i++)));
			   	cdnjscn.update(
				   {'name':item[0]},
				   {'$set': {'g_star' : +star[1].replace(',',''), 'g_fork' : +fk[1].replace(',','')}},
				   {'upsert':true}
				).exec(function(){
						callback();
				});
			}
		});
	});
	
	// 301
	async.eachSeries(arr301,function(item,callback){
		var path = item[1];
		option.url = path;
		console.log('start: ' + path);
		request(option,function(error, res, html){
			//console.log(error);
			if(error){ //ESOCKETTIMEDOUT //ETIMEDOUT
				console.log(error);
				arrList.push([item[0],res.headers.location]);
				callback();
				return;
			}
			
			console.log('end:' + path);
			console.log(res.statusCode);
			
			var reStar = /stargazers\">\s*([\d|,]+)\s*</;
			var reFork = /network\".*>\s*([\d|,]+)\s*</
		    var star = html.match(reStar);
			var fk = html.match(reFork);
			
			if(!fk){
				console.log(path);
				console.log(fk);
				callback();
				return;
			}
			if(fk && star) {
				console.log(item[0]);
				console.log('剩余: ' + (total - (i++)));
			   	cdnjscn.update(
				   {'name':item[0]},
				   {'$set': {'g_star' : +star[1].replace(',',''), 'g_fork' : +fk[1].replace(',','')}},
				   {'upsert':true}
				).exec(function(){
						callback();
				});
			}
		});
	});
	
	// error
	async.eachSeries(arrList,function(item,callback){
		var path = item[1];
		option.url = path;
		console.log('start: ' + path);
		request(option,function(error, res, html){
			//console.log(error);
			if(error){ //ESOCKETTIMEDOUT //ETIMEDOUT
				console.log(error);
				callback();
				return;
			}
			
			console.log('end:' + path);
			console.log(res.statusCode);
			
			var reStar = /stargazers\">\s*([\d|,]+)\s*</;
			var reFork = /network\".*>\s*([\d|,]+)\s*</
		    var star = html.match(reStar);
			var fk = html.match(reFork);
			
			if(!fk){
				console.log(path);
				console.log(fk);
				callback();
				return;
			}
			if(fk && star) {
				console.log(item[0]);
				console.log('剩余: ' + (total - (i++)));
			   	cdnjscn.update(
				   {'name':item[0]},
				   {'$set': {'g_star' : +star[1].replace(',',''), 'g_fork' : +fk[1].replace(',','')}},
				   {'upsert':true}
				).exec(function(){
						callback();
				});
			}
		});
	});
	
});
