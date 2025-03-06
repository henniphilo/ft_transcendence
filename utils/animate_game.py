import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.animation as animation
import ast
import datetime

def parse_log_file(log_filename):
    """
    Liest die Log-Datei und extrahiert alle Zeilen, die einen Spielzustand ("Game State:")
    enthalten. Der Zustand wird als Dictionary geparst und mit einem Zeitstempel versehen.
    """
    states = []
    with open(log_filename, "r") as f:
        for line in f:
            if "Game State:" in line:
                try:
                    # Extrahiere den Teil nach "Game State:" und entferne führende/abschließende Leerzeichen
                    state_str = line.split("Game State:", 1)[1].strip()
                    state = ast.literal_eval(state_str)

                    # Extrahiere den Zeitstempel aus der Zeile (Format: "YYYY-MM-DD HH:MM:SS,ms")
                    timestamp_str = line.split(" - ")[0].strip()
                    timestamp = datetime.datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S,%f")
                    state["timestamp"] = timestamp
                    states.append(state)
                except Exception as e:
                    print(f"Fehler beim Parsen der Zeile:\n{line}\n{e}")
    return states

# Log-Datei einlesen und Zustände extrahieren
states = parse_log_file("game.log")
if not states:
    print("Keine 'Game State'-Einträge im Log gefunden.")
    exit(1)

# Sortiere die Zustände nach Zeitstempel
states.sort(key=lambda s: s["timestamp"])

# Erstelle den Plot
fig, ax = plt.subplots()
ax.set_xlim(-1.1, 1.1)
ax.set_ylim(-1.1, 1.1)
ax.set_aspect('equal')
ax.set_title("Pong Game Animation")

# Initialisiere grafische Elemente: Ball, linkes Paddle, rechtes Paddle und Score-Text
ball = plt.Circle((0, 0), 0.02, fc='red')
ax.add_patch(ball)

# Festgelegte Positionen und Breite für die Paddles (wie im Spiel definiert)
PADDLE_X = 0.95
PADDLE_WIDTH = 0.02

# Erstelle Rechtecke für linkes und rechtes Paddle (initiale Dummy-Werte, die im Update angepasst werden)
left_paddle = patches.Rectangle((-PADDLE_X - PADDLE_WIDTH/2, 0), PADDLE_WIDTH, 0.1, fc='blue')
right_paddle = patches.Rectangle((PADDLE_X - PADDLE_WIDTH/2, 0), PADDLE_WIDTH, 0.1, fc='green')
ax.add_patch(left_paddle)
ax.add_patch(right_paddle)

# Text für den Score
score_text = ax.text(0, 1.05, "", ha="center", va="bottom", fontsize=12)

def update(frame):
    """
    Aktualisiert die grafischen Elemente (Ball, Paddles, Score) basierend auf dem Spielzustand
    des aktuellen Frames.
    """
    state = states[frame]
    # Aktualisiere die Ballposition
    ball_x, ball_y = state["ball"]
    ball.center = (ball_x, ball_y)

    # Aktualisiere das linke Paddle (Spieler 1)
    paddle1 = state["player1"]["paddle"]
    paddle1_top = paddle1["top"]
    paddle1_bottom = paddle1["bottom"]
    paddle_height = paddle1_bottom - paddle1_top
    left_paddle.set_xy((-PADDLE_X - PADDLE_WIDTH/2, paddle1_top))
    left_paddle.set_height(paddle_height)

    # Aktualisiere das rechte Paddle (Spieler 2)
    paddle2 = state["player2"]["paddle"]
    paddle2_top = paddle2["top"]
    paddle2_bottom = paddle2["bottom"]
    paddle_height2 = paddle2_bottom - paddle2_top
    right_paddle.set_xy((PADDLE_X - PADDLE_WIDTH/2, paddle2_top))
    right_paddle.set_height(paddle_height2)

    # Aktualisiere den Score-Text
    score_text.set_text(f"{state['player1']['name']}: {state['player1']['score']}   "
                        f"{state['player2']['name']}: {state['player2']['score']}")

    return ball, left_paddle, right_paddle, score_text

# Erstelle die Animation. Interval gibt die Dauer in Millisekunden pro Frame an.
ani = animation.FuncAnimation(fig, update, frames=len(states), interval=10, blit=True, repeat=False)

plt.show()
