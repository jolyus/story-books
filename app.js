const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const connectDB = require('./config/db');



//load config
dotenv.config({ path: './config/config.env' });

//passport config
require('./config/passport')(passport);

connectDB()

const app = express()

// body parser
app.use(express.urlencoded({ urlencoded: false }));
app.use(express.json());

//method override
app.use(methodOverride((req, res) => {
    if(req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urldencoded POST bodies and delete it
        let method = req.body._method;
        delete req.body._method;
        return method;
    }
}))

// logging
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// handlebars helpers
const { formatDate, stripTags, truncate, editIcon, select } = require('./helpers/hbs');

//handlebars
app.engine('.hbs', exphbs({ helpers: { formatDate, stripTags, truncate, editIcon, select }, extname: '.hbs', defaultLayout: 'main.hbs'}));
app.set('view engine', '.hbs');

//sessions
app.use(session({
    secret: 'test secret',
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}))

//passport middleware
app.use(passport.initialize())
app.use(passport.session())

// set global variable
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next()
});

//static folder
app.use(express.static(path.join(__dirname, 'public')));

//routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/stories', require('./routes/stories'));


const PORT = process.env.PORT || 3000;


app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on ${PORT}`));