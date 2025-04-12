const express = require('express');
const http = require('http');
const socket = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let chess = new Chess();
let players = {};
let currentPlayer = 'w';

// Set view engine and static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Chess Game',
        env: process.env.NODE_ENV || 'development'
    });
});

// Socket.io connection handling
io.on('connection', (uniquesocket) => {
    let playerColor = '';
    
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit('playerRole', 'w');
        playerColor = 'White';
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit('playerRole', 'b');
        playerColor = 'Black';
    } else {
        uniquesocket.emit('spectatorRole');
        playerColor = 'Spectator';
    }

    // Notify others that a player has joined
    io.emit('chat message', {
        sender: 'System',
        message: `${playerColor} player has joined the game`,
        type: 'system'
    });

    // Handle chat messages
    uniquesocket.on('chat message', (message) => {
        if (typeof message !== 'string' || message.length > 500) {
            return;
        }
        io.emit('chat message', {
            sender: playerColor,
            message: message,
            type: 'user'
        });
    });

    // Handle disconnection
    uniquesocket.on('disconnect', () => {
        let disconnectedColor = '';
        if (uniquesocket.id === players.white) {
            delete players.white;
            disconnectedColor = 'White';
        } else if (uniquesocket.id === players.black) {
            delete players.black;
            disconnectedColor = 'Black';
        }
        
        if (disconnectedColor) {
            io.emit('chat message', {
                sender: 'System',
                message: `${disconnectedColor} player has left the game`,
                type: 'system'
            });
        }
    });

    // Handle moves
    uniquesocket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && players.white !== uniquesocket.id) return;
            if (chess.turn() === 'b' && players.black !== uniquesocket.id) return;

            let result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();  
                io.emit('move', move); 
                io.emit('boardState', chess.fen());
            } else {
                console.log('Invalid Move : ' + move);
                uniquesocket.emit('InvalidMove! : ' + move);
            }
        } catch (err) {
            console.error('Move error:', err);
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, (err) => {
    if (err) {
        console.log(err.message);
    }
});