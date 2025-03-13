import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.widgets import Slider, Button
import matplotlib.animation as animation
import ast
import datetime
from matplotlib.lines import Line2D

BALL_RADIUS = 0.02  # Radius des Balls

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
                    # Extrahiere den Teil nach "Game State:" und entferne Leerzeichen
                    state_str = line.split("Game State:", 1)[1].strip()
                    state = ast.literal_eval(state_str)

                    # Extrahiere den Zeitstempel (Format: "YYYY-MM-DD HH:MM:SS,ms")
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

# Erstelle Liste der Spielstart-Indizes:
# Wir nehmen an, dass ein neues Spiel beginnt, wenn beide Spieler wieder 0 Punkte haben,
# nachdem in der vorherigen Zeile schon Punkte vorhanden waren.
game_start_indices = [0]  # erster Zustand ist immer Spielstart
for i in range(1, len(states)):
    prev = states[i-1]
    curr = states[i]
    prev_score = prev["player1"]["score"] + prev["player2"]["score"]
    curr_score = curr["player1"]["score"] + curr["player2"]["score"]
    if prev_score > 0 and curr_score == 0:
        game_start_indices.append(i)

print("Spielstart-Indizes:", game_start_indices)

# --- Plot und grafische Elemente erstellen ---
fig, ax = plt.subplots(figsize=(8, 8))
plt.subplots_adjust(left=0.1, right=0.9, top=0.9, bottom=0.35)  # Platz für Slider/Buttons
ax.set_xlim(-1.1, 1.1)
ax.set_ylim(-1.1, 1.1)
ax.set_aspect('equal')
ax.set_title("Pong Game - Animation & Spielsprünge", pad=20)

# Legende erstellen
legend_elements = [
    Line2D([0], [0], marker='o', color='w', label='Ball', markerfacecolor='red', markersize=10),
    patches.Patch(facecolor='blue', label='Spieler 1 (links)'),
    patches.Patch(facecolor='green', label='Spieler 2 (rechts)')
]
ax.legend(handles=legend_elements, loc='upper left')

# Grafische Elemente: Ball, Paddles und Score-Text
ball = plt.Circle((0, 0), BALL_RADIUS, fc='red')
ax.add_patch(ball)

PADDLE_X = 0.95
PADDLE_WIDTH = 0.02

left_paddle = patches.Rectangle((-PADDLE_X - PADDLE_WIDTH/2, 0), PADDLE_WIDTH, 0.1, fc='blue')
right_paddle = patches.Rectangle((PADDLE_X - PADDLE_WIDTH/2, 0), PADDLE_WIDTH, 0.1, fc='green')
ax.add_patch(left_paddle)
ax.add_patch(right_paddle)

score_text = ax.text(0, 1.1, "", ha="center", va="bottom", fontsize=12)

# Globale Variablen für den aktuellen Frame und Abspielstatus
current_index = 0
playing = True  # Animation startet automatisch

def draw_state(index):
    """Aktualisiert die grafischen Elemente anhand des Zustands mit Index 'index'."""
    state = states[index]
    
    # Ballposition aktualisieren
    ball_x, ball_y = state["ball"]
    ball.center = (ball_x, ball_y)
    
    # Linkes Paddle (Spieler 1) aktualisieren
    paddle1 = state["player1"]["paddle"]
    paddle1_top = paddle1["top"]
    paddle1_bottom = paddle1["bottom"]
    paddle_height = paddle1_bottom - paddle1_top
    left_paddle.set_xy((-PADDLE_X - PADDLE_WIDTH/2, paddle1_top))
    left_paddle.set_height(paddle_height)
    
    # Rechtes Paddle (Spieler 2) aktualisieren
    paddle2 = state["player2"]["paddle"]
    paddle2_top = paddle2["top"]
    paddle2_bottom = paddle2["bottom"]
    paddle_height2 = paddle2_bottom - paddle2_top
    right_paddle.set_xy((PADDLE_X - PADDLE_WIDTH/2, paddle2_top))
    right_paddle.set_height(paddle_height2)
    
    # Score-Text aktualisieren
    score_text.set_text(f"{state['player1']['name']}: {state['player1']['score']}   "
                        f"{state['player2']['name']}: {state['player2']['score']}")
    
    # Kollisionserkennung: Prüfe, ob der Ball eines der Paddles berührt
    # Linkes Paddle:
    if (ball.center[0] - BALL_RADIUS <= left_paddle.get_x() + PADDLE_WIDTH and
        left_paddle.get_y() <= ball.center[1] <= left_paddle.get_y() + left_paddle.get_height()):
        print(f"Kollision Spieler 1 - Ball: {ball.center}, Paddle: ({left_paddle.get_x()}, {left_paddle.get_y()}, {PADDLE_WIDTH}, {left_paddle.get_height()})")
    
    # Rechtes Paddle:
    if (ball.center[0] + BALL_RADIUS >= right_paddle.get_x() and
        right_paddle.get_y() <= ball.center[1] <= right_paddle.get_y() + right_paddle.get_height()):
        print(f"Kollision Spieler 2 - Ball: {ball.center}, Paddle: ({right_paddle.get_x()}, {right_paddle.get_y()}, {PADDLE_WIDTH}, {right_paddle.get_height()})")
    
    fig.canvas.draw_idle()

# Initialer Zustand
draw_state(current_index)

# --- Slider zur manuellen Steuerung der Frames ---
ax_slider = plt.axes([0.15, 0.25, 0.7, 0.04])
frame_slider = Slider(ax_slider, 'Frame', 0, len(states)-1, valinit=0, valfmt='%d')

def slider_update(val):
    global current_index
    current_index = int(frame_slider.val)
    draw_state(current_index)

frame_slider.on_changed(slider_update)

# --- Buttons zum Springen zwischen Spielen ---
# Button "Vorheriges Spiel"
ax_button_prev = plt.axes([0.15, 0.15, 0.2, 0.06])
button_prev = Button(ax_button_prev, 'Vorheriges Spiel')

def prev_game(event):
    global current_index
    for idx in reversed(game_start_indices):
        if idx < current_index:
            current_index = idx
            frame_slider.set_val(current_index)
            break

button_prev.on_clicked(prev_game)

# Button "Nächstes Spiel"
ax_button_next = plt.axes([0.65, 0.15, 0.2, 0.06])
button_next = Button(ax_button_next, 'Nächstes Spiel')

def next_game(event):
    global current_index
    for idx in game_start_indices:
        if idx > current_index:
            current_index = idx
            frame_slider.set_val(current_index)
            break

button_next.on_clicked(next_game)

# --- Play/Pause Button ---
ax_button_toggle = plt.axes([0.425, 0.05, 0.15, 0.06])
button_toggle = Button(ax_button_toggle, 'Pause')

def toggle_play(event):
    global playing
    playing = not playing
    button_toggle.label.set_text("Play" if not playing else "Pause")
    fig.canvas.draw_idle()

button_toggle.on_clicked(toggle_play)

# --- Animation: Automatisches Abspielen, sofern "playing" True ist ---
def update_animation(frame):
    global current_index
    if playing:
        if current_index < len(states) - 1:
            current_index += 1
        else:
            current_index = 0
        frame_slider.set_val(current_index)
        draw_state(current_index)
    return ball, left_paddle, right_paddle, score_text

# Animationsintervall auf 30 ms gesetzt für schnellere Abläufe
ani = animation.FuncAnimation(fig, update_animation, frames=len(states), interval=30, blit=False)

plt.show()
