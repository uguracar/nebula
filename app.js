var express = require('express'),
  app = express(),
  port = process.env.PORT || 8888,
  bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
var routes = require('./routes/reviewRoutes'); 
routes(app);

app.listen(port, ()=>console.log('NEBULA application started on 8888'));

