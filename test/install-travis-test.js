var assert = require("assert"),
    garden_core = require("../garden-core.js");

describe('install', function(){
    it('should intall an app from a remote source', function(done){
        garden_core.install('http://garden20.com/market/_db', 'bookmarks', 'http://localhost:5984/', 'garden_test', {
            dashboard_db_name: 'garden-core',
            update_status_function: function(msg, percent) {
                console.log(percent, msg);
            }
        }, function(err){
            assert.ifError(err);
            done();
        });
    });
});
