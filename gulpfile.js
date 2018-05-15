var gulp = require('gulp'),
    less = require('gulp-less'),
    notify = require("gulp-notify"),
    bower = require('gulp-bower'),
    minifyCSS = require('gulp-minify-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

var config = {
    bowerDir: './bower_components',
    lessDir: './resources/less',
    jsDir: './resources/js'
};

gulp.task('bower', function () {
    return bower()
        .pipe(gulp.dest(config.bowerDir))
});

gulp.task('icons', function () {
    return gulp.src(config.bowerDir + '/font-awesome/fonts/**.*')
        .pipe(gulp.dest('./public/fonts'));
});

gulp.task('css', function () {
    return gulp.src(config.lessDir + '/style.less')
        .pipe(less({
            style: 'compressed',
            paths: [
                './resources/less',
                config.bowerDir + '/bootstrap/less',
                config.bowerDir + '/font-awesome/less'
            ]
        })
            .on("error", notify.onError(function (error) {
                return "Error: " + error.message;
            })))
        .pipe(minifyCSS())
        .pipe(gulp.dest('./public/css'));
});

gulp.task('scripts', function () {
    gulp.src([
        './resources/js/vendor/modernizr-2.8.3.min.js',
        './bower_components/angular/angular.min.js',
        './bower_components/angular-route/angular-route.min.js',
        './bower_components/angular-animate/angular-animate.min.js',
        './bower_components/underscore/underscore.js',
        './bower_components/angular-underscore-module/angular-underscore-module.js',
        './resources/js/controller.js',
        './bower_components/jquery/dist/jquery.min.js',
        './bower_components/bootstrap/dist/js/bootstrap.min.js'
    ])
        .pipe(concat('client.min.js'))
       // .pipe(uglify())
        .pipe(gulp.dest('./public/js'))
});

gulp.task('watch', function () {
    gulp.watch(config.lessDir + '/**/*.less', ['css']);
    gulp.watch(config.jsDir + '/**/*.js', ['scripts']);
});

gulp.task('default', ['bower', 'icons', 'css', 'scripts']);