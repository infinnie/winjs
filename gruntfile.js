// Copyright (c) Microsoft Open Technologies, Inc.  All Rights Reserved. Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
(function () {
    "use strict";

    module.exports = function (grunt) {
        var config = require("./config.js");
        config.grunt = grunt;

        // Strip source files of their BOMs. BOMs will be added at the end of the build
        // by the "add-bom" task.
        grunt.file.preserveBOM = false;

        // Parse custom args
        var args = require("minimist")(process.argv);
        if (args.quiet) {
            grunt.log.write = function () {return grunt.log;};
            grunt.log.writeln = function () {return grunt.log;};
        }

        // Helper function to load the config file
        function loadConfig(path) {
            var glob = require("glob");
            var object = {};
            var key;

            glob.sync("*.js", { cwd: path }).forEach(function (option) {
                key = option.replace(/\.js$/, "");
                object[key] = require(path + option);
            });

            return object;
        }

        // Load task options
        var gruntConfig = loadConfig("./tasks/options/");

        // Package data
        gruntConfig.pkg = grunt.file.readJSON("package.json");

        // Project config
        grunt.initConfig(gruntConfig);

        // Load all grunt-tasks in package.json
        require("load-grunt-tasks")(grunt);

        // Register external tasks
        grunt.loadTasks("tasks/");

        grunt.registerTask("configureStore", function () { 
            config.isStorePackage = true;

            // the configuration for ui is already mixed in when requirejs options are loaded
            // so we have to override the path to the Telemetry implementation manually
            var requirejs = grunt.config.get("requirejs");
            var merge = { requirejs: {} };
            var ui = requirejs["ui"];
            ui.options.paths["WinJS/Utilities/_Telemetry"] = "./WinJS/Utilities/_TelemetryImpl";
            merge.requirejs["ui"] = ui;
            grunt.config.merge(merge);
        });

        // Tasks that drop things in bin/ (should have "add-bom" as the last task)
        grunt.registerTask("storePackage", ["configureStore", "default"]);
        grunt.registerTask("default", ["clean", "check-file-names", "ts", "build-qunit", "less", "concat", "_build", "_copyFinal", "replace", "add-bom"]);
        grunt.registerTask("quick", ["clean", "ts:src", "less", "concat", "_quickBuild", "add-bom"]);

        grunt.registerTask("release", ["lint", "default", "uglify", "cssmin", "add-bom"]);
        grunt.registerTask("minify", ["uglify", "add-bom"]);

        // Private tasks (not designed to be used from the command line)
        grunt.registerTask("_build", ["onefile:base", "requirejs:ui", "onefile:WinJS"]);
        grunt.registerTask("_quickBuild", ["onefile:base", "requirejs:ui"]);
        grunt.registerTask("_copyFinal", ["copy:tests", "copy:testDeps", "copy:fonts"]);
        grunt.registerTask("_copyToTsBuild", ["copy:srcjs"])

        // Other tasks
        grunt.registerTask("modules", ["clean:modules", "requirejs:publicModules", "replace:base"]);
        grunt.registerTask("lint", ["jshint", "jscs"]);
        grunt.registerTask("saucelabs", ["connect:saucelabs", "saucelabs-qunit", "post-tests-results"]);
    };
})();
