const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const configurePassport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

configurePassport(passport);

app.use(
	cors({
		origin: process.env.CLIENT_URL || 'http://localhost:5173',
		credentials: true,
	})
);
app.use(express.json());
app.use(passport.initialize());

app.get('/api/health', (_req, res) => {
	res.json({
		status: 'ok',
		database: {
			state: mongoose.connection.readyState,
			name: mongoose.connection.name || null,
		},
	});
});

app.use('/api/auth', authRoutes);

const startServer = async () => {
	try {
		await connectDB();
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error('Server startup failed:', error.message);
		process.exit(1);
	}
};

startServer();
