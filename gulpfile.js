var gulp = require('gulp');
var rimraf = require('rimraf');

// Clean task to delete the 'public' directory
gulp.task('clean', function(cb) {
    rimraf('./public', cb);
});

// Default task to copy files from 'app' to 'public'
function defaultTask(cb) {
    gulp.src('app/*')
        .pipe(gulp.dest('public/'))
        .on('end', function() {
            gulp.src('app/trait-viz/lib/*')
                .pipe(gulp.dest('public/trait-viz/lib/'))
                .on('end', cb);
        });
}

// Export default task
exports.default = defaultTask;

// Register default task as a named Gulp task
gulp.task('default', defaultTask);

// Build task to run 'clean' and then 'defaultTask'
gulp.task('build', gulp.series('clean', defaultTask));

