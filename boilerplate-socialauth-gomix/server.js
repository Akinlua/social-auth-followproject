'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session     = require('express-session');
const mongo       = require('mongodb').MongoClient;
const passport    = require('passport');

const app = express();

let GitHubStrategy = require('passport-github').Strategy
fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'pug')

let uri = 'mongodb://127.0.0.1:27017/advancednode'
mongo.connect(uri, (err, client) => {
    if(err) {
        console.log('Database error: ' + err);
    } else {
        console.log('Successful database connection');
        let db = client.db('advancednode')
      
        app.use(session({
          secret: "dffghjartnberth",
          resave: true,
          saveUninitialized: true,
        }));
        app.use(passport.initialize());
        app.use(passport.session());
      
        function ensureAuthenticated(req, res, next) {
          if (req.isAuthenticated()) {
              return next();
          }
          res.redirect('/');
        };

        passport.serializeUser((user, done) => {
          done(null, user.id);
        });

        passport.deserializeUser((id, done) => {
            db.collection('socialusers').findOne(
                {id: id},
                (err, doc) => {
                    done(null, doc);
                }
            );
        });

      
        /*
        *  ADD YOUR CODE BELOW
        */

      passport.use(
        new GitHubStrategy(
          {
            clientID: 'jdjf',
            clientSecret: 'fjggk',
            callbackURL: "http://127.0.0.1:3000/auth/github/callback"
        },
        function(accessToken, refreshToken, profile, cb) {
          console.log(profile)

          db.collection('socialusers').findOneAndUpdate(
            {id: profile.id},
            {"$set":{
              id: profile.id,
              name: profile.displayName,
              photo: profile.photo[0].value
            }},
            {upsert: true, returnOriginal: false},
            (error, updatedDocument) => {
              if(!error && updatedDocument){
                return cb(null, updatedDocument.value)
              }
            }
          )
          }
        
        )
        )
      
      app.route('/auth/github').get(passport.authenticate('github'))

      app.route('/auth/github/callback').get(passport.authenticate('github', {failureRedirect: '/'}), (req, res) => {
        res.redirect('/profile')
      })
      
      
      
      
      
        /*
        *  ADD YOUR CODE ABOVE
        */
      
      
        app.route('/')
          .get((req, res) => {
            res.render(process.cwd() + '/views/pug/index');
          });

        app.route('/profile')
          .get(ensureAuthenticated, (req, res) => {
               res.render(process.cwd() + '/views/pug/profile', {user: req.user});
          });

        app.route('/logout')
          .get((req, res) => {
              req.logout();
              res.redirect('/');
          });

        app.use((req, res, next) => {
          res.status(404)
            .type('text')
            .send('Not Found');
        });
      
        app.listen(3000, () => {
          console.log("Listening on port 3000 ");
        });  
}});
