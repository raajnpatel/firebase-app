const { db } = require('../utils/admin');

const config = require('../utils/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const { validateSignupData,  validateLoginData } = require('../utils/validation');

exports.signUp = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    const { valid, errors } = validateSignupData(newUser);

    if(!valid) return res.status(400).json(errors);

    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if(doc.exists){
                return res
                    .status(400)
                    .json({handle: "This handle is already taken"})
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken()
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId: userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res
                .status(201)
                .json({token})
        })
        .catch(error => {
            console.log(error);
            if(error.code === "auth/email-already-in-use"){
                return res
                    .status(400)
                    .json({email: "Email is already in use."})
            } else {
                res
                    .status(500)
                    .json({error: error.code})
            }
        })
};

exports.logIn = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };

    const { valid, errors } = validateLoginData(user);

    if(!valid) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({token})
        })
        .catch(error => {
            if(error.code === 'auth/wrong-password'){
                return res
                    .status(403)
                    .json({general: "Incorrect Username/Password combination. Please try again."})
            } else if(error.code === 'auth/user-not-found'){
                return res
                    .status(403)
                    .json({general: "User not found in system"})
            } else if(error.code === 'auth/invalid-email'){
                return res
                    .status(403)
                    .json({general: "Invalid Email input."})
            } else {
                console.log(error);
                return res
                    .status(500)
                    .json({error: error.code})
            }
        })
};