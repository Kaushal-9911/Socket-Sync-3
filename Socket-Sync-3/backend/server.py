import eventlet
eventlet.monkey_patch()

from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
import mysql.connector
from datetime import datetime

app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# ---------- DATABASE (LOCAL + RENDER SAFE) ----------
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB_NAME = os.environ.get("DB_NAME", "whatsapp_clone")
DB_PORT = int(os.environ.get("DB_PORT", 3306))

db = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
    port=DB_PORT
)

# ---------- SIGNUP ----------
@app.post("/signup")
def signup():
    data = request.json
    try:
        cur = db.cursor()
        cur.execute(
            "INSERT INTO users (user_id, name, password, avatar) VALUES (%s,%s,%s,%s)",
            (data["userId"], data["name"], data["password"], data["avatar"])
        )
        db.commit()
        return jsonify(success=True)
    except mysql.connector.IntegrityError:
        return jsonify(error="User ID already exists"), 400

# ---------- LOGIN ----------
@app.post("/login")
def login():
    data = request.json
    cur = db.cursor(dictionary=True)
    cur.execute(
        "SELECT user_id,name,avatar FROM users WHERE user_id=%s AND password=%s",
        (data["userId"], data["password"])
    )
    user = cur.fetchone()
    return jsonify(user) if user else (jsonify(error="Invalid credentials"), 401)

# ---------- USERS ----------
@app.get("/users")
def users():
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT user_id,name,avatar FROM users")
    return jsonify(cur.fetchall())

# ---------- LOAD MESSAGES ----------
@app.get("/messages")
def messages():
    u1 = request.args.get("u1")
    u2 = request.args.get("u2")
    cur = db.cursor(dictionary=True)
    cur.execute("""
        SELECT sender AS `from`, receiver AS `to`,
               message AS text,
               DATE_FORMAT(timestamp,'%H:%i') AS time
        FROM messages
        WHERE (sender=%s AND receiver=%s)
           OR (sender=%s AND receiver=%s)
        ORDER BY timestamp
    """, (u1, u2, u2, u1))
    return jsonify(cur.fetchall())

# ---------- SOCKET ----------
@socketio.on("join")
def join(data):
    join_room(data["room"])

@socketio.on("send_message")
def send(data):
    now = datetime.now()
    cur = db.cursor()
    cur.execute(
        "INSERT INTO messages (sender,receiver,message,timestamp) VALUES (%s,%s,%s,%s)",
        (data["from"], data["to"], data["text"], now)
    )
    db.commit()

    emit("receive_message", {
        "from": data["from"],
        "to": data["to"],
        "text": data["text"],
        "time": now.strftime("%H:%M")
    }, room="-".join(sorted([data["from"], data["to"]])))

# ---------- RUN (ONLY ONE) ----------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port)
