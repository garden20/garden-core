var assert = require("assert"),
    couchr = require('couchr'),
    requireMock = require("requiremock")(__filename);




var couchrMock = {
    test: true,
    post: function(url, data, callback) {}
};

requireMock.mock("couchr", couchrMock);
var install = requireMock("../garden-core.js");


describe('Options', function(){
    it('provides default options when none are provided', function(){
        var opts = install.process_options();
        assert.deepEqual(opts, install.std_options);
    });
    it('allows overidding the std options', function(){
        var opts = install.process_options({
            dashboard_db_name: 'dashboard2',
            install_with_no_reader: true,
            additional_member_roles: ['a', 'b']
        });
        assert.equal('dashboard2', opts.dashboard_db_name);
        assert.equal(true, opts.install_with_no_reader),
        assert.deepEqual(opts.additional_member_roles, ['a', 'b']);
    });
});


describe('Replication', function () {
    it('calls replicate with the correct url and data', function () {
        couchrMock.post = function(url, data, callback) {
            assert.equal(url, 'http://127.0.0.1/_replicate');
            assert.deepEqual(data, {
                source: 'http://garden20.com/market',
                target: 'app',
                create_target:true,
                doc_ids : ['app']
            });
        };
        install.replicate("http://127.0.0.1/", "http://garden20.com/market", "app", "app", "callback");
    });
    it('should send supplied credentials', function () {
        couchrMock.post = function(url, data, callback) {
            assert.equal(url, 'http://admin:admin@127.0.0.1/_replicate');
        };
        install.replicate("http://admin:admin@127.0.0.1/", "http://garden20.com/market", "app", "app", "callback");
    });
});


describe('Copy Doc', function(){
    it('should not use rev if update is false', function() {
        couchrMock.head = function(doc, func) { assert.fail('head called', 'should not be'); };
        couchrMock.copy = function(docUrl, dest, callback) {
            assert.equal(docUrl, 'http://localhost:5984/db/app');
            assert.equal(dest, '_design/app');
        };
        install.copyDoc('http://localhost:5984/db', 'app', '_design/app', false, function(err, resp){} );
    });
    it('should handle trailing / in url', function() {
        couchrMock.head = function(doc, func) { assert.fail('head called', 'should not be'); };
        couchrMock.copy = function(docUrl, dest, callback) {
            assert.equal(docUrl, 'http://localhost:5984/db/app');
        };
        install.copyDoc('http://localhost:5984/db/', 'app', '_design/app', false, function(err, resp){} );
    });

    it('should append rev to dest when update is true', function(done){
        couchrMock.head = function(doc, func) {
            func(null, null, { headers: { etag: "21-70f36545dced654c9dd711a98eab85eb" }});
        };
        couchrMock.copy = function(docUrl, dest, callback) {
            assert.equal(dest, '_design/app?rev=21-70f36545dced654c9dd711a98eab85eb');
            done();
        };
        install.copyDoc('http://localhost:5984/db/', 'app', '_design/app', true, function(err, resp){} );
    });
});


describe('Purge Doc', function(){
    it('should purge!', function(){
        couchrMock.head = function(doc, func) {
            func(null, null, { headers: { etag: "21-70f36545dced654c9dd711a98eab85eb" }});
        };
        couchrMock.post = function(url, data, callback) {
            assert.equal(url, 'http://localhost:5984/db/_purge');
            assert.deepEqual(data, {
                'app' : [ "21-70f36545dced654c9dd711a98eab85eb" ]
            });
        };
        install.purgeDoc('http://localhost:5984/db', 'app', function(err, resp){});
    });
});

describe('Save Details', function(){
    it('should call post on new docs');
});


describe('Install App Security', function(){
    it('should add _admin by default', function(){
        couchrMock.get = function(url, callback) {
            assert.equal(url, 'http://localhost:5984/db/_security');
            callback(null, null);
        };
        couchrMock.put = function(url, data, callback) {
            assert.equal(url, 'http://localhost:5984/db/_security');
            assert.deepEqual(data, {"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":['_admin']}});
        };

        install.install_app_security('http://localhost:5984/db', function(err){});
    });

    it('should add addition member roles if provided', function(done){
        couchrMock.get = function(url, callback) {
            assert.equal(url, 'http://localhost:5984/db/_security');
            callback(null, null);
        };
        couchrMock.put = function(url, data, callback) {
            assert.equal(url, 'http://localhost:5984/db/_security');
            assert.deepEqual(data, {"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":['_admin', 'accounting']}});
            callback(null);
        };

        install.install_app_security('http://localhost:5984/db', { additional_member_roles: ['accounting'] }, function(err){ done(); });
    });
});

describe('install app vhosts', function(){
    it ('adds a vhost', function(done){
        couchrMock.put = function(url, data, callback) {
            assert.equal(url, 'http://localhost:5984/_config/cool.com/app');
            assert.equal(data, '/app/_design/app/_rewrite');
            callback(null);
        };
        install.install_app_vhosts('http://localhost:5984', ['http://cool.com'], 'app', '/app/_design/app/_rewrite', function(err){ done(); });
    });
    it ('does a port properly', function(done){
        couchrMock.put = function(url, data, callback) {
            assert.equal(url, 'http://localhost:5984/_config/localhost:5984/app');
            assert.equal(data, '/app/_design/app/_rewrite');
            callback(null);
        };
        install.install_app_vhosts('http://localhost:5984', ['http://localhost:5984'], 'app', '/app/_design/app/_rewrite', function(err){ done(); });
    });
});
