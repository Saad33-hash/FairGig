const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

const configurePassport = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        return done(null, {
          provider: 'google',
          providerId: profile.id,
          firstName: profile.name?.givenName || 'User',
          lastName: profile.name?.familyName || '',
          email: profile.emails?.[0]?.value?.toLowerCase() || '',
          avatar: profile.photos?.[0]?.value || '',
        });
      }
    )
  );
};

module.exports = configurePassport;