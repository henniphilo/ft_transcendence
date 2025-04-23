// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GameStats {
    // Struct to represent a game
    struct Game {
        string winner_tournament_name;
        string timestamp;
    }

    // Array to store all games
    Game[] public games;

    // Event to emit when a game is added
    event GameAdded(
        uint256 indexed gameIndex,
        string winner_tournament_name,
        string timestamp
    );

    // Function to add a game
    function addGame(
        string memory _winner_tournament_name,
        string memory _timestamp
    ) public {
        // Store the game
        games.push(Game({
            winner_tournament_name: _winner_tournament_name,
            timestamp: _timestamp
        }));

        // Emit event with the index of the new game
        emit GameAdded(
            games.length - 1,
            _winner_tournament_name,
            _timestamp
        );
    }

    // Function to get a game's details
    function getGame(uint256 _index) public view returns (
        string memory winner_tournament_name,
        string memory timestamp
    ) {
        require(_index < games.length, "Game does not exist");
        Game memory game = games[_index];
        return (
            game.winner_tournament_name,
            game.timestamp
        );
    }

    // Function to get the total number of games
    function getGameCount() public view returns (uint256) {
        return games.length;
    }
}