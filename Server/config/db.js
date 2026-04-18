const mongoose = require('mongoose');

const getMongoHost = (uri) => {
  try {
    const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, '');
    const afterCreds = withoutScheme.includes('@')
      ? withoutScheme.split('@')[1]
      : withoutScheme;

    return afterCreds.split('/')[0] || 'unknown-host';
  } catch (_error) {
    return 'unknown-host';
  }
};

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in environment variables.');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      // Conservative defaults for a typical single-instance Node API.
      maxPoolSize: 20,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);

    if (String(error.message).includes('querySrv ENOTFOUND')) {
      const host = getMongoHost(process.env.MONGO_URI || '');
      console.error(
        `MongoDB SRV lookup failed for host "${host}". Use your exact Atlas URI from Atlas Connect. ` +
          'The hostname usually looks like cluster0.xxxxx.mongodb.net (not cluster.mongodb.net).'
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;