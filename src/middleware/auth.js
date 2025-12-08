const path = require('path');
const PASSWORD = process.env.APP_PASSWORD;

const sessions = new Map();

function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const requireAuth = (req, res, next) => {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

    if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        if (Date.now() - session.createdAt < 24 * 60 * 60 * 1000) {
            req.session = session;
            return next();
        } else {
            sessions.delete(sessionId);
        }
    }

    if (req.path === '/edit-vessels/login' && req.method === 'POST') {
        return next();
    }

    if (req.path === '/edit-vessels/login' && req.method === 'GET') {
        return res.sendFile(path.join(__dirname, '../public', 'login.html'));
    }

    if (req.path === '/edit-vessels' && req.method === 'GET') {
        return res.redirect('/edit-vessels/login');
    }

    return res.status(401).json({ success: false, message: 'Unauthorized' });
};

const login = (req, res) => {
    const { password } = req.body;

    if (password === PASSWORD) {
        const sessionId = generateSessionId();
        sessions.set(sessionId, {
            id: sessionId,
            createdAt: Date.now()
        });

        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.json({ success: true, message: 'Login successful' });
    }

    return res.status(401).json({ success: false, message: 'Invalid password' });
};

module.exports = {
    requireAuth,
    login
};

