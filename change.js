var glob = require('glob');
var fs = require('fs');
var _ = require('underscore');
var natcompare = require('./natcompare.js');
var upload = require('./upload.js').upload;


var exec=require('child_process').exec;
exec('cd ../cdnjs; git ls-tree -r --name-only HEAD | grep **/package.json | while read filename; do   echo "$(git log -1 --since="10 weeks ago" --name-status --format="%ad" -- $filename) blahcrap"; done',function(err,stdout,stderr){
    console.log(stdout);
	var recentLibraries = stdout.split('blahcrap');
	//log.info(recentLibraries);
    recentLibraries = _.filter(recentLibraries, function(lib){
      if(lib.length > 4) {
        return true;
      };
      return false;
    })
	//console.log(recentLibraries);
    recentLibraries = _.map(recentLibraries, function(lib){
      lib = lib.replace('\n\n', '\n');
      lib = lib.replace('\t', '\n');
      lib = lib.substr(1);
      lib = lib.split('\n');
	  if(lib.length < 3) return;
      lib[0] = new Date(lib[0]);
	  //log.info(lib);
      lib = {
        date: lib[0],
        change: lib[1],
        path: lib[2].replace(/(^\s+|\s+$)/g, '')
      }
      return lib;
    })
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
	
    _.each(recentLibraries, function (lib) {
	  //console.log(lib.path);
      var package = JSON.parse(fs.readFileSync('../cdnjs/' + lib.path, 'utf8'));
      var title = '';
      if(lib.change === 'M') {
        title = package.name + ' updated to version ' + package.version
		saveLog(title);
		upload(package.name);
      }
      if(lib.change === 'A') {
        title = package.name + '('+package.version+') was added'
		saveLog(title);
		upload(package.name);
      }
      //var fileurl = '/libs/'+ package.name + '/' + package.version + '/' + package.filename;
	  /*console.dir({
          title:          title,
          url:            package.homepage,
          guid:           package.name+package.version, 
          description:    package.description + '<br /><br />' + '<a href="'+fileurl+'">'+fileurl+'</a>',
          date:           lib.date
      });*/
	  //console.log(title);
    });
    //fs.writeFileSync('rss', feed.xml(true), 'utf8');
});

function saveLog(log){
	console.log(log);
}
