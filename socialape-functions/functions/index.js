const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./utils/FBAuth');
const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signUp, logIn } = require('./handlers/users');

//Scream Routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);

//User Routes
app.post('/signup', signUp);
app.post('/login', logIn);


exports.api = functions.https.onRequest(app);
