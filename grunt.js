module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    lint: {
      all: ['garden-core.js']
    },
    jshint: {
      options: {
        browser: true
      }
    }
  });


  // Default task.
  grunt.registerTask('default', 'lint');

};