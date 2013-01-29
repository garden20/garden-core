(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( require('async'), require('couchr'), require('url'));
    } else if (typeof define === 'function' && define.amd) {
        define(['async', 'couchr', 'url'],factory);
    } else {
        root.garden_core = factory(root.async, root.couchr, root.url);
    }
}(this, function (async, couchr, url) {



var app = {};


app.std_options = {
    dashboard_db_name: 'dashboard',
    install_with_no_reader: false,
    additional_member_roles: [],
    app_details : {},
    update_status_function: function(msg, percent) {},
    add_vhost_entries: false,
    vhost_hostnames: [],
    vhost_path: null
};


app.install_market = function(market_json, to_couch_root_url, db_name, options, callback) {
    options.app_details = market_json;
    options.vhost_path  = '/' + db_name + '/_design/' + market_json.doc_id + '/' + market_json.open_path;
    app.install(market_json.db_src, market_json.doc_id, to_couch_root_url, db_name, options, callback);
};

app.install = function(src_db, doc_id, couch_root_url, db_name, options, callback) {
  // allow options to be skipped passing in
  if (!callback) callback = options;
    if (!endsWith(couch_root_url, '/')) couch_root_url += '/';
    var opts = app.process_options(options),
        dashboad_db_url = url.resolve(couch_root_url, opts.dashboard_db_name);
        couch_db_url = url.resolve(couch_root_url, db_name);

    opts.update_status_function('Installing App', '30%');
    async.series([
        function(callback) {
            app.replicate(couch_root_url, src_db, db_name, doc_id, callback);
        },
        function(callback) {
            opts.update_status_function('Configuring App', '60%');
            app.copyDoc(couch_db_url, doc_id, '_design/' + doc_id, false, callback);
        },
        function(callback) {
            opts.update_status_function('Cleaning Up', '70%');
            app.purgeDoc(couch_db_url, doc_id, callback);
        },
        function(callback) {
            opts.update_status_function('Recording Install', '85%');
            app.saveAppDetails(dashboad_db_url, db_name, opts.app_details, callback);
        },
        function(callback) {
            opts.update_status_function('Setting security', '90%', true);
            app.install_app_security(couch_db_url, opts, callback);
        },
        function(callback) {
            opts.update_status_function('Configuring URL', '98%', true);
            if (!opts.add_vhost_entries) return callback(null);
            app.install_app_vhosts(couch_root_url, opts.vhost_hostnames, opts.vhost_short_name, opts.vhost_path, callback);
        }

    ], function(err) {
        if (!err) opts.update_status_function('Install Complete', '100%', true);
        callback(err);
    });
};


app.replicate = function(couch_root_url, src_db, target_db, doc_id, callback) {
  var replicate_url = url.resolve(couch_root_url, '/_replicate'),
    data = {
        source: src_db,
        target: target_db,
        create_target:true,
        doc_ids : [doc_id]
    };
    couchr.post(replicate_url, data, callback);
};



app.copyDoc = function(couch_db_url, from_doc_id, to_doc_id, update, callback) {
    if (!endsWith(couch_db_url, '/')) couch_db_url += '/';
    var doc_url = url.resolve(couch_db_url,  from_doc_id),
        dest = to_doc_id;

    if (!update) return couchr.copy(doc_url, dest, callback);

    couchr.head(doc_url, function(err, res, req){
        if (err) return callback(err);
        var rev = findEtag(req);
        dest += "?rev=" + rev;
        return couchr.copy(doc_url, dest, callback);
    });
};


app.purgeDoc = function(couch_db_url, doc_id, callback) {
    if (!endsWith(couch_db_url, '/')) couch_db_url += '/';

    var doc_url = url.resolve(couch_db_url,  doc_id);
    var purge_url = url.resolve(couch_db_url, './_purge');
    couchr.head(doc_url, function(err, res, req){
        if (err) return callback(err);
        console.log(req);
        var rev = findEtag(req);
        var data = {};
        data[doc_id] = [rev];
        couchr.post(purge_url, data, callback);
    });
};


function findEtag(req) {
  if (req.headers) {
    return req.headers.etag.replace(/"/gi, '');
  }
  return req.getResponseHeader('etag').replace(/"/gi, '');
}


app.saveAppDetails = function(dashboad_db_url, app_db_name, app_details, callback) {
    if (!endsWith(dashboad_db_url, '/')) dashboad_db_url += '/';
    if (!callback) {
        callback = app_details;
        app_details = null;
    }
    if (!app_details) app_details = {};
    app_details.installed  = {
        date : new Date().getTime(),
        db : app_db_name
    };
    app_details.dashboard_title = app_db_name;
    app_details.type = 'install';
    if (!app_details._id) couchr.post(dashboad_db_url, app_details, callback);
    else {
        var doc_url = url.resolve(dashboad_db_url,  app_details._id);
        couchr.put(doc_url, app_details, callback);
    }
};

app.install_app_security = function(db_url, options, callback) {
    if (!callback) {
        callback = options;
        options = null;
    }
    if (!options) options = { install_with_no_reader: false };
    if (options.install_with_no_reader) return callback(null);

    var roles = ['_admin'];
    if (options.additional_member_roles && options.additional_member_roles.length > 0) {
        roles = roles.concat(options.additional_member_roles);
    }
    app.setDBReaderRoles(db_url, roles, callback);
};

app.install_member_roles = function(db_url, roles) {
    app.addDBReaderUser(db_name, install_doc.remote_user, function(err) {
        callback(err, install_doc);
    });
};



app.getDBSecurity = function(db_url, callback) {
    if (!endsWith(db_url, '/')) db_url += '/';
    var security_url = url.resolve(db_url, './_security');
    couchr.get(security_url, callback);
};

app.setDBSecurity = function(db_url, security, callback) {
    if (!endsWith(db_url, '/')) db_url += '/';
    var security_url = url.resolve(db_url, './_security');
    couchr.put(security_url, security, callback);
};

app.setDBReaderRoles = function(db_url, role, callback) {
  app.getDBSecurity(db_url, function(err, sec) {
      if (!sec || !sec.admins) {
          sec = {"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":[]}};
      }
      if (isArray(role)) sec.members.roles = role;
      else sec.members.roles = [role];
      app.setDBSecurity(db_url, sec, callback);
  });
};

app.addDBReaderUser = function(db_url, user, callback) {
    app.getDBSecurity(db_url, function(err, sec) {
        if (!sec || !sec.admins) {
            sec = {"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":[]}};
        }

        if (isArray(user)) sec.members.names = _.union(sec.members.names, user);
        else sec.members.names.push(user);

        setDBSecurity(db_url, sec, callback);
    });
};

app.addDBReaderRole = function(db_url, role, callback) {
  app.getDBSecurity(db_url, function(err, sec) {
      //if (err) return callback(err);
      if (!sec || !sec.admins) {
          sec = {"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":[]}};
      }

      if (_.isArray(role))  sec.members.roles = _.union(sec.members.roles, role);
      else sec.members.roles.push(role);

      setDBSecurity(db_url, sec, callback);

  });
};

app.onlyAdminDBReaderRole = function(db_url, callback) {
  app.getDBSecurity(db_url, function(err, sec) {
      if (err) return callback(err);
      if (!sec || !sec.admins) {
          sec = {"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":[]}};
      }
      sec.members.roles = ['_admin'];
      setDBSecurity(db_url, sec, callback);
  });
};

app.removeAllDBReaderRoles = function(db_url, callback) {
  app.getDBSecurity(db_url, function(err, sec) {
      if (err) return callback(err);
      if (!sec.admins) {
          sec = {"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":[]}};
      }
      sec.members.roles = [];
      setDBSecurity(db_url, sec, callback);
  });
};

app.removeDBReaderRole = function(db_url, role, callback) {
  app.getDBSecurity(db_url, function(err, sec) {
      if (err) return callback(err);
      if (!sec.admins) {
          sec = {"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":[]}};
      }
      sec.members.roles = _.without(sec.members.roles, role);
      setDBSecurity(db_url, sec, callback);
  });
};



app.install_app_vhosts = function (couch_root_url, hosts, vhost_short_name, vhost_path, callback) {
    if (!endsWith(couch_root_url, '/')) couch_root_url += '/';
    var hostnames = [];
    if (isArray(hosts)) hostnames = hosts;
    else {
        hostnames = hosts.split(',');
    }

    async.forEach(hostnames, function(hostname, cb) {
        var p = url.parse(hostname);
        var to_bind = p.hostname;
        if (p.port != '80' && (isString(p.port) || isNumber(p.port)) ) {
            to_bind += ':' + p.port;
        }
        app.addVhostRule(couch_root_url, to_bind, vhost_short_name, vhost_path, cb);
    }, callback);
};

 app.addVhostRule = function  (couch_root_url, host, vhost_short_name, vhost_path, callback) {
    if (!endsWith(couch_root_url, '/')) couch_root_url += '/';
    var key = './_config/' + host + '/' + vhost_short_name;
    var vhost_url = url.resolve(couch_root_url, key);
    couchr.put(vhost_url, vhost_path, callback);
};


app.process_options = function(options) {
    if (!options) return app.std_options;
    var opts = {
        dashboard_db_name: options.dashboard_db_name || app.std_options.dashboard_db_name,
        install_with_no_reader: options.install_with_no_reader || app.std_options.install_with_no_reader,
        additional_member_roles: options.additional_member_roles || app.std_options.additional_member_roles,
        add_vhost_entries: options.add_vhost_entries || app.std_options.add_vhost_entries,
        vhost_hostnames: options.vhost_hostnames || app.std_options.vhost_hostnames,
        vhost_short_name: options.vhost_short_name || app.std_options.vhost_short_name,
        vhost_path: options.vhost_path || app.std_options.vhost_path,
        update_status_function: options.update_status_function || app.std_options.update_status_function
    };
    return opts;
};

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var isArray = Array.isArray || function(obj) {
    return toString.call(obj) == '[object Array]';
};

var isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
};

var isString = function(obj) {
    return toString.call(obj) == '[object String]';
};



if (couchr.test) return app;
else return {
    install : app.install
};

}));