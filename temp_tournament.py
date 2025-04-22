 # --- Komplette, überarbeitete record_result Methode ---
    def record_result(self, winner_name):
        # Schritt 1: Finde das korrekte Player-Objekt und den Turniernamen
        tournament_player = None
        original_input_name = winner_name # Merken, falls wir den Spieler nicht finden
        for player_entry in self.players:
            player = player_entry["player"]
            # Prüfe zuerst den Turniernamen (player.name)
            if player.name == winner_name:
                tournament_player = player
                break
            # Fallback: Prüfe den Benutzernamen aus dem Profil
            if hasattr(player, "user_profile") and player.user_profile:
                if player.user_profile.get("username") == winner_name:
                    tournament_player = player
                    winner_name = player.name # Stelle sicher, dass wir den Turniernamen verwenden
                    break

        if not tournament_player:
            print(f"⚠️ Kein passender Spieler im aktuellen Turnier gefunden für: {original_input_name}")
            # Überlege, ob hier die Suche in *allen* ursprünglichen Spielern sinnvoll wäre,
            # falls ein ausgeschiedener Spieler fälschlicherweise ein Ergebnis sendet.
            # Aktuell: Ignorieren, wenn Spieler nicht (mehr) aktiv ist.
            return

        # Stelle sicher, dass wir immer den internen Turniernamen verwenden
        winner_tournament_name = tournament_player.name

        # Schritt 2: Prüfe, ob es sich um das Finale oder Spiel um Platz 3 handelt
        # (Diese Logik bleibt unverändert)
        if self.final_match:
            p1 = self.final_match[0]["player"].name
            p2 = self.final_match[1]["player"].name
            if winner_tournament_name in [p1, p2]:
                loser = p2 if winner_tournament_name == p1 else p1
                self.final_result = {"winner": winner_tournament_name, "loser": loser}
                self.finished = True # Turnier ist definitiv vorbei
                print(f"🏁 Finalspiel beendet! Gewinner: {winner_tournament_name}")
                return # Frühzeitiger Ausstieg, da das Ergebnis speziell behandelt wurde

        if self.third_place_match:
            p1 = self.third_place_match[0]["player"].name
            p2 = self.third_place_match[1]["player"].name
            if winner_tournament_name in [p1, p2]:
                loser = p2 if winner_tournament_name == p1 else p1
                self.third_place_result = {"winner": winner_tournament_name, "loser": loser}
                print(f"🥉 Spiel um Platz 3 beendet! Gewinner: {winner_tournament_name}")
                # Hier nicht unbedingt self.finished setzen, Finale könnte noch laufen
                # und hier nicht return, da das Ergebnis auch für die normale Runde zählen könnte (falls Logik so gedacht)
                # Besser: Klar trennen oder sicherstellen, dass diese Matches nicht in active_matches sind.
                # Annahme hier: Diese Matches sind separat und wir können hier returnen.
                return

        # Schritt 3: Prüfe auf doppelte Einträge für normale Rundenspiele
        if winner_tournament_name in self.results:
            print(f"⚠️ Ergebnis für {winner_tournament_name} in dieser Runde bereits eingetragen – ignoriert.")
            return

        # Schritt 4: Ergebnis für normale Runde eintragen
        self.results[winner_tournament_name] = 1
        print(f"✅ Ergebnis für Runde {self.current_round} eingetragen: {winner_tournament_name}")

        # Schritt 5: Match History aktualisieren (Verlierer finden)
        loser_name = None
        match_found = False
        for p1_entry, p2_entry in self.active_matches:
            p1_name = p1_entry["player"].name
            p2_name = p2_entry["player"].name
            if winner_tournament_name in [p1_name, p2_name]:
                loser_name = p2_name if winner_tournament_name == p1_name else p1_name
                self.match_history.append({
                    "round": self.current_round,
                    "player1": p1_name,
                    "player2": p2_name,
                    "winner": winner_tournament_name,
                    "loser": loser_name
                })
                match_found = True
                break
        if not match_found:
             print(f"⚠️ Konnte kein aktives Match für den Sieger {winner_tournament_name} finden, um den Verlierer zu bestimmen.")


        # Schritt 6: Prüfen, ob die Runde beendet ist und ob das Turnier damit endet
        # Zähle, wie viele Ergebnisse für die *aktuell aktiven Matches* vorliegen.
        # Vorsicht bei Freilosen - diese sind schon in results, aber nicht in active_matches.
        # Sicherer ist oft, die Anzahl der erwarteten Matches pro Runde zu kennen.
        # Annahme: len(self.active_matches) repräsentiert die Spiele dieser Runde.
        if len(self.results) >= len(self.active_matches):
            print(f"🎯 Alle {len(self.active_matches)} Spiele der Runde {self.current_round} abgeschlossen. Prüfe Turnierstatus...")

            # Gewinner dieser Runde (alle Namen im results-Dictionary)
            current_round_winners = list(self.results.keys())
            print(f"   Sieger dieser Runde: {current_round_winners}")

            # Prüfen, ob nur noch EIN Sieger übrig ist
            if len(current_round_winners) == 1:
                # Nur noch ein Gewinner übrig -> Turnier ist beendet!
                final_winner = current_round_winners[0]
                self.finished = True

                # --- ★★★ HIER DIE WICHTIGE ÄNDERUNG ★★★ ---
                # Setze self.final_result, damit get_winner() es findet!
                # Finde den Verlierer des letzten Matches für das final_result dict
                final_match_loser = None
                # Wir brauchen das Match, das gerade beendet wurde und dessen Sieger `final_winner` ist.
                # Die `match_history` sollte den aktuellsten Eintrag dafür haben.
                if self.match_history:
                    last_match = self.match_history[-1]
                    # Stelle sicher, dass das letzte Match wirklich zu diesem finalen Ergebnis gehört
                    if last_match["winner"] == final_winner and last_match["round"] == self.current_round :
                       final_match_loser = last_match["loser"]

                # Fallback, falls Verlierer nicht gefunden wurde (sollte nicht sein)
                if final_match_loser is None:
                     final_match_loser = "Unknown"
                     print(f"⚠️ Konnte Verlierer des Finalspiels nicht aus Match-History ermitteln.")


                self.final_result = {"winner": final_winner, "loser": final_match_loser}
                print(f"🏁 Turnier ist jetzt beendet! Final Result wurde gesetzt. Gewinner: {final_winner}")
                # --- Ende der wichtigen Änderung ---

            else:
                 # Turnier geht weiter, Vorschau für nächste Runde optional vorbereiten
                 print(f"   Turnier geht weiter in Runde {self.current_round + 1} mit {len(current_round_winners)} Spielern.")

                 # Vorschau-Logik (optional, kann hier bleiben oder in eigene Methode)
                 next_players_entries = [
                     entry for entry in self.players
                     if entry["player"].name in current_round_winners # Filter für die Gewinner
                 ]

                 temp_matches_preview = []
                 players_copy = next_players_entries[:] # Kopie für Shuffle
                 shuffle(players_copy)

                 for i in range(0, len(players_copy), 2):
                     if i + 1 < len(players_copy):
                         temp_matches_preview.append((players_copy[i], players_copy[i + 1]))
                     else:
                         # Vorschau auf Freilos in der nächsten Runde
                         print(f"🛋️ Vorschau: {players_copy[i]['player'].name} hätte in der nächsten Runde ein Freilos")

                 print("🔮 Vorschau auf nächste Matchups (vor `next_round`):")
                 for p1_entry, p2_entry in temp_matches_preview:
                     print(f"   ➤ {p1_entry['player'].name} vs {p2_entry['player'].name}")
                 self.preview_next_round = temp_matches_preview # Vorschau speichern
