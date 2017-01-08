
let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');

let routes = require('./routes/index');
let users = require('./routes/users');
let settings = require('./settings');
let session = require('express-session');
let flash = require('connect-flash');
let MongoStore = require('connect-mongo')(session);
const multer = require('multer');
const fs = require('fs');
let accesslog = fs.createWriteStream('access.log',{flags:'a'});
let errorLog = fs.createWriteStream('error.log',{flags:'a'});

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(logger({stream:accesslog}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret:settings.cookieSecret,
  key:settings.db,
  cookie:{maxAge:1000*60*60*24*30},
  resave: false,
  saveUninitialized: true,
  store:new MongoStore({
    db:settings.db,
    host:settings.host,
    port:settings.port,
    url: 'mongodb://localhost/blog'
  })
}));

app.use(flash());

//routes(app);
app.use('/', routes);
app.use('/users', users);

app.use(multer({
  dest:'./public/images',
  rename:function(fieldname,filename){
    return filename;
  }
}));



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  let meta = '[' + new Date() + ']' +req.url +'\n';
  errorLog.write('\n\n'+meta+err.stack + '\n');

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
