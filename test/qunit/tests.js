asyncTest( "replicate an app", function() {

    expect( 1 );
    garden_core.install('http://garden20.com/market/_db', 'bookmarks', 'http://localhost:5984/', 'garden_test', {
        dashboard_db_name: 'garden-core',
        update_status_function: function(msg, percent) {
            console.log(percent, msg);
        }
    }, function(err){
        if (err) {
            ok(false, err.toString());
        } else ok( true, "Passed and ready to resume!" );
        start();
    });
});