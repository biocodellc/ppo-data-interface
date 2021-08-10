var gulp = require('gulp');
var rimraf = require('rimraf');


function defaultTask(cb) {
    
    cb()
    gulp.src('app/*')    
        .pipe(gulp.dest('public/'))
    gulp.src('app/trait-viz/lib/*')    
        .pipe(gulp.dest('public/trait-viz/lib/'))
}
  
exports.default = defaultTask

gulp.task('clean', function(cb) {
    rimraf('./public', cb);
});
