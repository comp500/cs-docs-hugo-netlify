const gulp = require("gulp");
const del = require("del");
const less = require("gulp-less");
const exec = require("child_process").exec;
const swPrecache = require("sw-precache");

gulp.task("clean", () => {
	return del(["./public/", "./themes/green/static/css/styles.css"]);
});

gulp.task("less", () => {
	return gulp
		.src("./themes/green/less/styles.less")
		.pipe(less())
		.pipe(gulp.dest("./themes/green/static/css/styles.css"));
});

gulp.task("hugo", done => {
	return exec("hugo", (err, stdout, stderr) => {
		if (err != null) {
			console.log(stdout); // See Hugo output
			console.log(stderr); // Debugging feedback
		}
		done(err);
	});
});

gulp.task("sw-precache", callback => {
	swPrecache.write(
		"public/service-worker.js",
		{
			staticFileGlobs: [
				"public/**/*.{js,html,css,woff,woff2,json}",
				"public/favicon.ico",
				"public/cs-docs-logo.png"
			],
			stripPrefix: "public/",
			runtimeCaching: [
				{
					urlPattern: /^https:\/\/cdnjs\.cloudflare\.com/,
					handler: "cacheFirst"
				}
			]
		},
		callback
	);
});

gulp.task("default", gulp.series("clean", "less", "hugo", "sw-precache"));
