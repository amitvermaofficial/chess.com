const express = require('express');
const http = require('http');
const socket = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app); // express ke server se http ke server to link kiya then vo http ka server socket.io ko de diya ab isko ye manage karega  
const io = socket(server); // socket ki saari functionality ab io main aa chuki hai

let chess = new Chess(); // chess.js ki library se chess ka object bana liya
let players = {};
let currentPlayer = 'w';

app.set('view engine', 'ejs'); // ejs ko view engine ke roop main set kiya
app.use(express.static(path.join(__dirname, 'public'))); // public folder ko static bana diya jisse hum usme se koi bhi file access kar sakein
app.use(express.json()); // express ko json format main data bhejne ke liye use kiya
app.use(express.urlencoded({ extended: true })); // express ko url encoded data bhejne ke liye use kiya


app.get('/', (req, res) => {
  res.render('index', { title: 'Chess Game' }); // index.ejs ko render kiya jisme title diya
});

io.on('connection', (uniquesocket) => {
    
    if (!players.white) {
        players.white = uniquesocket.id; // agar white player nahi hai to usko white player bana do
        uniquesocket.emit('playerRole', 'w');
    } else if (!players.black) {
        players.black = uniquesocket.id; // agar black player nahi hai to usko black player bana do
        uniquesocket.emit('playerRole', 'b');
    } else {
        uniquesocket.emit('spectatorRole');
    }


    // for disconnection of players
    uniquesocket.on('disconnect', () => {
        if (uniquesocket.id === players.white) {
            delete players.white; // agar white player disconnect hota hai to usko hata do
        } else if (uniquesocket.id === players.black) {
            delete players.black; // agar black player disconnect hota hai to usko hata do
        }
    });

    // validating the moves on 'move' event.
    uniquesocket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && players.white !== uniquesocket.id) return;
            if (chess.turn() === 'b' && players.black !== uniquesocket.id) return;

            // uniquesocket.move(move); // move ko socket par bhej diya
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
            console.log(err.message);
        };
    });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000'); 
});