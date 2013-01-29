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
    },
    server: {
      port: 8000,
      base: '.'
    }
  });

  // Create a new task.
  grunt.registerTask('kanso', 'kanso push test app', function() {
    var done = this.async();
    grunt.utils.spawn({
      cmd:  'kanso',
      args: ['push', 'http://localhost:5984/garden-core'],
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