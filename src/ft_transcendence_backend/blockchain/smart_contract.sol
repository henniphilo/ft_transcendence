// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TournamentScores {
    mapping(uint => mapping(uint => uint)) public tournamentUserScores;
    mapping(uint => uint[]) public tournamentUserIds;

    function addScore(uint tournamentId, uint userId, uint score) public {
        bool exists = false;
        for (uint i = 0; i < tournamentUserIds[tournamentId].length; i++) {
            if (tournamentUserIds[tournamentId][i] == userId) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            tournamentUserIds[tournamentId].push(userId);
        }
        tournamentUserScores[tournamentId][userId] = score;
    }

    function getTournamentScores(uint tournamentId) public view returns (uint[] memory, uint[] memory) {
        uint[] memory userIds = tournamentUserIds[tournamentId];
        uint[] memory scores = new uint[](userIds.length);
        for (uint i = 0; i < userIds.length; i++) {
            scores[i] = tournamentUserScores[tournamentId][userIds[i]];
        }
        return (userIds, scores);
    }
}