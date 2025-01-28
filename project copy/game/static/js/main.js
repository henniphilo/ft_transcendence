import GameScreen from './game_screen.js';

document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    gameContainer.style.display = 'block';

    const onBackToMenu = () => {
        console.log('Game ended');
    };

    window.gameScreen = new GameScreen({
        player1: { name: "Player 1", score: 0, paddle: { center: 0 } },
        player2: { name: "Player 2", score: 0, paddle: { center: 0 } },
        ball: [0, 0]
    }, onBackToMenu);

    window.gameScreen.display();
});
