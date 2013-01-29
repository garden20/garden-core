module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    lint: {
      all: ['garden-core.js']
    },
    mochaTest: {
      files: ['test/test.js']
    },
    min: {
      dist: {
        src: ['./garden-core.js'],
        dest: './garden-core.min.js'
      }
    },
    qunit: {
      all: ['http://localhost:5984/garden-core/_design/garden-core-test/index.html']
    }
  });

  // Create a new task.
  grunt.registerTask('kanso', 'kanso push test app', function() {
    var done = this.async();
    var test_db = grunt.option('test_db') || 'http://127.0.0.1:5984/garden-core';


    grunt.utils.spawn({
      cmd:  'kanso',
      args: ['push', test_db],
      opts: {
        cwd: './test/qunit'
      }
    }, function(err, result, code){
      if (code !== 0) return done('kanso failed');
      done(null);
    });
  });
  grunt.loadNpmTasks('grunt-mocha-test');


  // Default task.
  grunt.registerTask('default', 'lint mochaTest min');

};