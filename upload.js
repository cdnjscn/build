//上传到upyun
var glob = require('glob');
var _ = require('underscore');
var fs = require('fs');
var UPYun = require('./upyun').UPYun;
var config = require('./config.json');
var upyun = new UPYun(config.upyun_bucket, config.upyun_user, config.upyun_password);
var Path = require('path');
var Log = require('log');
var log = new Log('debug', fs.createWriteStream('my.log'));


function upload(path){
	//console.log(path);
	glob('../cdnjs/ajax/libs/' + path + '/**/*.*',function(err,matches){
		_.each(matches,function(v){
			if(fs.statSync(v).isDirectory()) return;
			var fileContent = fs.readFileSync(v);
			//console.log(v.replace(/^ajax/gi,''));
			//'/test' + 
			var filePath = v.replace(/^\.\.\/cdnjs\/ajax/gi,'');
			console.log('--------------------------------');
			console.log(filePath);
			toUpyun(filePath, fileContent);	
		});
	});
}

function toUpyun(filePath,fileContent) {
	//console.log(filePath);	
	log.info(filePath);
	var counter = 0;
	upyun.writeFile(filePath, fileContent, true, function(err, data){
		//console.log(upyun.getWritedFileInfo('x-upyun-file-type'));
		if(err && filePath.split('/').length > 14){
			automkDir(Path.dirname(filePath),function(){
			   console.log('mkdir ' + filePath + ' .....');
			   toUpyun(filePath, fileContent);
			});
		} else if (err && counter < 3){
			counter++;
	    	console.log(filePath + ' ...  err,retry ' + counter);	
			toUpyun(filePath, fileContent);
	    }
		if (!err) {
			console.log('ok ' + filePath);
		}
	});	
}

function automkDir(_path,callback){
_path = _path.replace(/^\//gi,'');
_path = _path.split('/');
var len = _path.length,
	all = [],
	i = 0;
	for(i;i<len;i++){
		all.push('/' + _path.slice(0,i+1).join('/'));
	}
	if(_path.length > 15){
		console.log(all.slice(14,15));
		//自动创建15级目录
		upyun.mkDir(all.slice(14,15),true,function(err, data){
			if(!err){
				all.splice(0,15);
				console.log('dddddddd');
				//递归创建
				_automkDir(all);
			}else{
				console.log(err);
			}
		});
}

function _automkDir(paths){
		if(paths.length == 0) {
			callback();
			return;
		}
		var _path = paths.shift();
		console.log(_path);
		upyun.mkDir(_path,false,function(err, data){
			if(!err){
				console.log(data);
				_automkDir(paths);
			}else{
				console.log(err);
			}
		});
	}
}

exports.upload = upload;