var fs = require("fs"),
	path = require("path"),
	util = require("util"),
	events = require("events");

//default filename filter function
function filter(filename) {
	return true;
}

//create a callback that knows the full path
function createCallback(watcher, directory) {
	return function(event, filename) {
		var p = path.join(directory, filename);
		
		watcher.watch(p);
		
		//check if throttling is needed, else just emit the event
		if(watcher.throttle > 0) {
			watcher._throttling[p] = watcher._throttling[p] || {};
			if(watcher._throttling[p][event]) {
				clearTimeout(watcher._throttling[p][event])
			}
			watcher._throttling[p][event] = setTimeout(function() {
				watcher.emit("change", event, p, watcher);
			}, watcher.throttle);
		} else {
			watcher.emit("change", event, p, watcher);
		}
	}
}

//donstructor only sets some defaults and some private properties
function Watcher(options) {
	var me = this;
	
	//used to save watchers, so directories are only watched once by a Watcher
	me._watchers = {};
	//used to save a map that poits to a timeout id, used for throttling (e.g: me._throttling["C:\\myDir"].rename)
	me._throttling = {};
	
	//call super constructor, to extend EventEmitter
	events.EventEmitter.call(me);
	
	//set some default options
	options = options || {};
	this.filter = options.filter || filter;
	this.throttle = options.throttle || 0;
};

//inherit from EventEmitter
util.inherits(Watcher, events.EventEmitter);

//recursively set watchers on dir and all of its subdirs
Watcher.prototype.watch = function(directory, callback) {
	var me = this;
	
	fs.readdir(directory, function(err, files) {
		if(err) {
			return callback ? callback(err, me) : false;
		}
		
		//if the directory is not already being watched by this watcher, watch it
		if(!me._watchers[directory]) {
			me._watchers[directory] = fs.watch(directory, createCallback(me, directory));
		}
		
		//keep track of the state so we can call the callback function when all listeners are attached
		var pending = files.length;
		
		if(!pending) {
			return callback ? callback(null, me) : false;
		}
		
		files.forEach(function(file, index, files) {
			fs.stat(path.join(directory, file), function(err, stats) {
				if(stats && stats.isDirectory() && me.filter(file)) {
					me.watch(path.join(directory, file), function(err, res) {
						if(!--pending) {
							callback ? callback(null, me) : false;
						}
					});
				} else {
					if(!--pending) {
						callback ? callback(null, me) : false;
					}
				}
			});
		});
	});
};

Watcher.prototype.close = function() {
	Object.keys(this._watchers).forEach(function closeEachWatcher(key) {
		this._watchers[key].close();
	});
}

//expose the Watcher constructor function
exports.Watcher = Watcher;
