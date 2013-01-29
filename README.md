Garden-Core
===========

Small surface api to install, update and manage garden apps. Use in node, requirejs, and browser global.


Node usage
----------

```npm install garden-core```

```
var garden_core = require('garden-core');

garden_core.install('http://garden20.com/market/_db', 'bookmarks', 'http://localhost:5984/', 'bookmarks', function(err) {
    if (err) console.log('no bookmarks for you');
});

```


Jam (requirejs) Usage
---------------------

```jam install garden-code```

```
require(['garden-core'], function(garden_core) {
    garden_core.install('http://garden20.com/market/_db', 'bookmarks', 'http://localhost:5984/', 'bookmarks', function(err) {
        if (err) console.log('no bookmarks for you');
    });
})

```

Browser Global
--------------

```
  <script src="assets/async.min.js" type="text/javascript"></script>
  <script src="assets/jquery-1.8.3.min.js" type="text/javascript"></script>
  <script src="assets/couchr-browser.js" type="text/javascript"></script>
  <script src="assets/url.js" type="text/javascript"></script>
  <script src="assets/garden-core.min.js" type="text/javascript"></script>
  <script>
    garden_core.install('http://garden20.com/market/_db', 'bookmarks', 'http://localhost:5984/', 'bookmarks', function(err) {
        if (err) console.log('no bookmarks for you');
    });
  </script>

```


API
---

install(src_db, doc_id, couch_root_url, db_name, options, callback);

  - **src_db*** The url of a couch db, eg 'http://me.cool.com:5984/test', 'http://garden20.com/market/_db'
  - **doc_id** The doc id of the application to install, eg 'bookmarks'
  - **couch_root_url** The couchdb root url that you want to install your app into, eg 'http://localhost:5984'
  - **db_name** the name of the db you want to install your app into. It will be created if it does not exist. eg 'my_bookmarks'
  - **callback** callback function when complete. format: function(err)
  - **options** options controlling the installation.
    - dashboard_db_name: the db to store an installation doc. default is'dashboard',
    - app_details : additional details to store in the installation doc. defaults to {}
    - install_with_no_reader: do not add any reader roles to the db. setting to true makes db public. defaults to false.
    - additional_member_roles: any additional member roles to set on the security object. defaults to [].
    - update_status_function: A function called to indicate install progess. default is function(msg, percent) {},
    - add_vhost_entries: add a vhost entry for the application. default is false.
    - vhost_hostnames: hostnames to used for the vhost entry. eg ['my.domain.com']. default is []
    - vhost_path: the full path to the design doc, eg '/bookmarks/_design/bookmarks/_rewrite/'


Licenece: MIT

