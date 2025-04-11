const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null; 

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = '';
    
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            // for creating chessboard w/b pattern
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', 
                (rowindex + squareindex) % 2 === 0 ? 'light' : 'dark'
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            // placing chess pieces onto their positions.
            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', 
                    square.color === 'w' ? 'white' : 'black'
                );

                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData('plain/text', '');   
                    }
                });

                pieceElement.addEventListener('dragend', (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.append(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault(); // khud se drop mat karo  

                if (draggedPiece) { // iss logic se drop karo
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSource);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97+source.col)}${8-source.row}`,
        to: `${String.fromCharCode(97+target.col)}${8-target.row}`,
        promotion: 'q',
    };

    socket.emit('move', move);
};

const getPieceUnicode = (piece) => { // for getting the Icons (rook, queen etc.)
    const unicodePieces = {
        K: '♔',
        Q: '♕',
        R: '♖',
        b: '♗',
        N: '♘',
        P: '♙',
        k: '♚',
        q: '♛',
        r: '♜',
        b: '♝', 	
        n: '♞',
        p: '♟'
    }

    return unicodePieces[piece.type] || '';
};

socket.on('playerRole', (role) => {
    playerRole = role;
    renderBoard();
});

socket.on('spectatorRole', () => {
    playerRole = null;
    renderBoard();
});

socket.on('boardState', (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on('move', (move) => {
    chess.move(move);
    renderBoard();
});

renderBoard();

























































// const socket = io(); // iss line se frontend pe aate hi automatically socket.io ek request send kar dega backend pe 
// // aur vo request app.js ke io.on('connection') main jaake handle hoti hai

// // req pehle server ke pass jati hai then wha se decide karenge ki konsa event perform karna hai
// // sabko bhejna including you (group chat)
// // sirf ek ko bhejna including you (chat)
// // sabko bhejna excluding you (your typing status in whatsapp {typing...)})

// socket.on('playerRole', (role) => {
//     if (role === 'w') {
//         document.getElementById('playerRole').innerText = 'You are playing as White';
//     } else if (role === 'b') {
//         document.getElementById('playerRole').innerText = 'You are playing as Black';
//     } else {
//         document.getElementById('playerRole').innerText = 'You are a spectator';
//     }
// });