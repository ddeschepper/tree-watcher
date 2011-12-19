var fs = require("fs"),
	path = require("path"),
	util = require("util"),
	events = require("events");

function filter(filename) {
	return true;
}

function Watcher(root, options) {
	var me = this,
		watchers = {},
		throttling = {};
	
	//call super constructor
	events.EventEmitter.call(me);
	
	//fix arguments
	options = options || {};
	
	//create a callback that knows the full path
	function createCallback(dir) {
		return function(event, filename) {
			var p = path.join(dir, filename);
			watchDir(p);
			
			//throttling
			if(me.throttleTime > 0) {
				throttling[p] = throttling[p] || {};
				if(throttling[p][event]) {
					clearTimeout(throttling[p][event])
				}
				throttling[p][event] = setTimeout(function() {
					me.emit("change", event, p);
				}, me.throttleTime);
			} else {
				me.emit("change", event, p);
			}
		}
	}
	
	//recursively set watchers on dir and all of its subdirs
	function watchDir(dir) {
		var files, i, file, stats;
		
		if(path.existsSync(dir) && fs.statSync(dir).isDirectory()) {
			files = fs.readdirSync(dir);
		} else {
			return;
		}
		
		if(!watchers[dir]) {
			watchers[dir] = fs.watch(dir, createCallback(dir));
		}
		
		for(i = 0; i < files.length; i++) {
			try {
				file = files[i];
				filePath = path.join(dir, file);
				stats = fs.statSync(filePath);
				
				if(stats.isDirectory() && me.filter(file)) {
					watchDir(filePath);
				}
			} catch(e) {
				console.log(e);
			}
		}
	}
	
	this.root = root;
	this.filter = options.filter || filter;
	this.throttleTime = options.throttleTime || 0;
	
	watchDir(root);
}

//inherit from EventEmitter
util.inherits(Watcher, events.EventEmitter);

exports.createWatcher = function(root, options) {
	var watcher = new Watcher(root, options);
	return watcher;
};