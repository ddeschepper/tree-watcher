Tree-watcher is a tool for monitoring changes in an entire file tree.

The standard ``fs.watch(dir, callback)`` only watches for changes in a single directory. Tree-watcher can watch an unlimited amount of directories for changes.

Features include

-   Watching subdirs as they are created (so no need to manually add watchers to newly created subdirs of a dir that is already watched)
-   Getting the full path of a changed file as a parameter to the `change`` event handler
-   Adding event handlers at any time (``require("tree-watcher").Watcher`` is an EventEmitter)
-   Throttling change events (tree-watchers keeps track of the event/path combinations that get fired and adds the possibility to throttle these, to prevent a large number of the events firing for a single change)
-   filter out directory names that dont need to be watched (by adding a filter function)

warning: watching many directories is no problem, but attaching all the listeners can potentially take some time.

USAGE
-----

    var watcher = require("./treewatcher");
    
    watcher = new watcher.Watcher({
        //filter function return true to allow filename, false to disallow
        //gets the filename, not the full path
        //the default is a function that always returns true
        filter: function(filename) {
            return filename.charAt(0) !== ".";
        },
        //set to 0 to prevent throttling
        throttle: 50
    });
    
    //the Watcher EventEmitter only emits change events, but the event type fired by fs.watch is passed as the first parameter
    //you can alse choose to add the listener inside of the callback for Watcher.watch, to make sure no events are fired before every dir is watched
    watcher.on("change", function(event, path, watcher) {
        console.log("something has changed");
    });
    
    //the callback is fired when all the (sub)directories are being watched
    watcher.watch("C:\\myDir", function(err, watcher) {
        if(err) {
            console.log("ERROR: " + err);
        } else {
            console.log("DONE");
        }
    });
    
    //add more directories to watch
    watcher.watch("C:\\myOtherDir", function() {
        ...
    })