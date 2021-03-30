module.exports = function (data) {

    // Get App
    const app = require('./files/constructor')(data.main);

    // Helmet
    if (data.helmet) { require('./files/helmet')(app, data.helmet); }

    // Firebase
    let firebase;
    let cookieSession;
    if (data.firebase) {

        // Get Firebase
        firebase = require('./files/firebase')(data.firebase);
        if (data.cookieSession) { cookieSession = require('./files/cookieSession')(app, data.cookieSession); }

    }

    // Nope
    else if (data.cookieSession) { cookieSession = data.cookieSession; app.use(cookieSession); }

    // CSRF Token
    if (data.csrftoken) { require('./files/csrftoken').apply({ app: app }, data.csrftoken.module); }

    // Discord OAuth2
    let dsSession;
    if (data.discordOAuth2) {

        // Start Module
        data.discordOAuth2.firebase = firebase;
        if (!data.discordOAuth2.cfg) { data.discordOAuth2.cfg = {}; }
        data.discordOAuth2.cfg.domain = data.main.domainValidator.domain;
        dsSession = require('./files/discord-oauth2')(app, data.errorPage, data.vars, data.discordOAuth2, data.firebaseWeb, data.cfg);

    }

    // Firebase Auth
    let firebaseOAuth;
    if (data.firebaseOAuth) {
        firebaseOAuth = require('./files/firebase-auth')(app, data.fileCfg, firebase, data.vars);
    }

    // i18
    let i18;
    if (data.i18) {
        if (data.csrftoken) { data.i18.getCsrfToken = data.csrftoken.callback; }
        i18 = require('./files/i18')(app, data.i18);
    }

    // Timezone
    let timezone;
    if (data.timezone) {

        // File Age
        if (data.fileCfg && data.fileCfg.fileMaxAge) { data.timezone.fileMaxAge = data.fileCfg.fileMaxAge; }

        // Start Timezone
        timezone = require('./files/timezone')(app, data.timezone, data.csrftoken.callback);

    }

    // Start Middleware
    data.middleware({

        // Other Things
        i18: i18, cookieSession: cookieSession, app: app, firebaseWeb: data.firebaseWeb, cfg: data.cfg,

        // Firebase Auth
        firebaseOAuth: function (req, res) {
            const tinyArgs = arguments;
            return i18.insertIsUser(req, res, function () { return firebaseOAuth.apply(firebaseOAuth, tinyArgs); });
        },

        // Discord Session
        dsSession: function (req, res) {
            const tinyArgs = arguments;
            return i18.insertIsUser(req, res, function () { return dsSession.apply(dsSession, tinyArgs); });
        },

        // FN
        fn: function () {

            // Start
            if (data.timezone) { timezone.start(); }
            if (data.i18) { i18.app.start(); }

            // Insert Error Pages
            if (typeof data.errorPage === "function") {
                require('./files/createErrorPage')(app, (req, res, next, err) => {
                    return data.errorPage(req, res, err, data.cfg, data.firebaseWeb);
                });
            }

            // Complete
            return;

        }

    });

    // Express Module
    return app;

};