/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

"use strict";

const del = require("del");
const gulp = require("gulp");
const gulpif = require("gulp-if");
const mergeStream = require("merge-stream");
const polymerBuild = require("polymer-build");

// Here we add tools that will be used to process our source files.
const imagemin = require("gulp-imagemin");

// Additional plugins can be used to optimize your source files after splitting.
// Before using each plugin, install with `npm i --save-dev <package-name>`
const uglify = require("gulp-uglify");
const cssSlam = require("css-slam").gulp;
const htmlMinifier = require("gulp-html-minifier");
const removeEmptyLines = require("gulp-remove-empty-lines");
const swPrecacheConfig = require("./sw-precache-config.js");
const polymerJson = require("./polymer.json");
const polymerProject = new polymerBuild.PolymerProject(polymerJson);
const bundledDirectory = "build/bundled";
const strip = require("gulp-strip-comments");

const uglifyjs = require("uglify-es");
const composer = require("gulp-uglify/composer");
const minify = composer(uglifyjs, console);

/**
 * Waits for the given ReadableStream
 */
function waitFor(stream) {
  return new Promise((resolve, reject) => {
    stream.on("end", resolve);
    stream.on("error", reject);
  });
}

function build() {
  return new Promise((resolve, reject) => {
    // eslint-disable-line no-unused-vars

    // Lets create some inline code splitters in case you need them later in your build.
    let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
    let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();

    // Okay, so first thing we do is clear the build directory
    console.log(`Deleting ${bundledDirectory} directory...`);
    del([bundledDirectory])
      .then(() => {
        // Let's start by getting your source files. These are all the files
        // in your `src/` directory, or those that match your polymer.json
        // "sources"  property if you provided one.
        let sourcesStream = polymerProject
          .sources()
          // If you want to optimize, minify, compile, or otherwise process
          // any of your source code for production, you can do so here before
          // merging your sources and dependencies together.
          .pipe(gulpif(/\.(png|gif|jpg|svg)$/, imagemin()))
          // The `sourcesStreamSplitter` created above can be added here to
          // pull any inline styles and scripts out of their HTML files and
          // into seperate CSS and JS files in the build stream. Just be sure
          // to rejoin those files with the `.rejoin()` method when you're done.
          .pipe(sourcesStreamSplitter.split())
          // Uncomment these lines to add a few more example optimizations to your
          // source files, but these are not included by default. For installation, see
          // the require statements at the beginning.
          .pipe(gulpif(/\.js$/, minify()))
          .pipe(gulpif(/\.css$/, cssSlam())) // Install css-slam to use
          .pipe(gulpif(/\.html$/, cssSlam()))
          .pipe(
          gulpif(
            /\.html$/,
            htmlMinifier({
              collapseWhitespace: true,
              removeAttributeQuotes: true,
              removeOptionalTags: true,
              removeRedundantAttributes: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              removeTagWhitespace: true,
              sortAttributes: true,
              sortClassName: true,
              useShortDoctype: true,
              minifyCss: true,
              minifyJs: true,
              removeComments: true
            })
          )
          )
          .pipe(strip())
          .pipe(gulpif(/\.html$|\.css$|\.js$/, removeEmptyLines()))
          // Remember, you need to rejoin any split inline code when you're done.
          .pipe(sourcesStreamSplitter.rejoin());

        // Similarly, you can get your dependencies seperately and perform
        // any dependency-only optimizations here as well.
        let dependenciesStream = polymerProject
          .dependencies()
          .pipe(dependenciesStreamSplitter.split()) // Install css-slam to use
          .pipe(gulpif(/\.js$/, minify()))
          .pipe(gulpif(/\.css$/, cssSlam())) // css slam for css
          .pipe(gulpif(/\.html$/, cssSlam())) //remove css in html
          .pipe(
          gulpif(
            /\.html$/,
            htmlMinifier({
              collapseWhitespace: true,
              removeAttributeQuotes: true,
              removeOptionalTags: true,
              removeRedundantAttributes: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              removeTagWhitespace: true,
              sortAttributes: true,
              sortClassName: true,
              useShortDoctype: true,
              minifyCss: true,
              minifyJs: true,
              removeComments: true
            })
          )
          ) // Install gulp-html-minifier to use
          .pipe(strip())
          .pipe(gulpif(/\.html$|\.css$|\.js$/, removeEmptyLines()))
          // Add any dependency optimizations here.
          .pipe(dependenciesStreamSplitter.rejoin());

        // Okay, now let's merge your sources & dependencies together into a single build stream.
        let buildStream = mergeStream(
          sourcesStream,
          dependenciesStream
        ).once("data", () => {
          console.log("Analyzing build dependencies...");
        });

        // If you want bundling, pass the stream to polymerProject.bundler.
        // This will bundle dependencies into your fragments so you can lazy
        // load them.
        buildStream = buildStream.pipe(polymerProject.bundler());

        // Now let's generate the HTTP/2 Push Manifest
        buildStream = buildStream.pipe(polymerProject.addPushManifest());

        // Okay, time to pipe to the build directory
        buildStream = buildStream.pipe(gulp.dest(bundledDirectory));

        // waitFor the buildStream to complete
        return waitFor(buildStream);
      })
      .then(() => {
        // Okay, now let's generate the Service Worker
        console.log("Generating the Service Worker...");
        return polymerBuild.addServiceWorker({
          project: polymerProject,
          buildRoot: bundledDirectory,
          bundled: true,
          swPrecacheConfig: swPrecacheConfig
        });
      })
      .then(() => {
        // You did it!
        console.log("Build complete!");
        resolve();
      });
  });
}

gulp.task("build", build);