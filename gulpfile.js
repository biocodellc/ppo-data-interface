var gulp = require('gulp');
var rimraf = require('rimraf');


function defaultTask(cb) {
    
    cb()
    gulp.src('app/*')    
        .pipe(gulp.dest('public/'))
    gulp.src('app/lib/*')    
        .pipe(gulp.dest('public/lib/'))
}
  
exports.default = defaultTask

gulp.task('clean', function(cb) {
    rimraf('./public', cb);
});
