import os
import threading
import time
from datetime import datetime, timezone

import cv2
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    from pyzbar.pyzbar import decode as pyzbar_decode

    DECODER = "pyzbar"
except Exception as exc:
    pyzbar_decode = None
    DECODER = "opencv"
    PYZBAR_IMPORT_ERROR = str(exc)
else:
    PYZBAR_IMPORT_ERROR = None

load_dotenv()

app = Flask(__name__)
CORS(app)

CONFIG = {
    "camera_url": os.getenv("CAMERA_STREAM_URL", ""),
    "backend_api_url": os.getenv("BACKEND_API_URL", "").rstrip("/"),
    "scanner_api_key": os.getenv("SCANNER_API_KEY", ""),
    "cooldown": float(os.getenv("SCAN_COOLDOWN_SECONDS", "3")),
    "timeout": float(os.getenv("REQUEST_TIMEOUT_SECONDS", "5")),
}

state = {
    "running": False,
    "last_code": None,
    "last_result": None,
    "last_error": None,
    "started_at": None,
}

worker_thread = None
stop_event = threading.Event()
state_lock = threading.Lock()


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def ingest_scan(qr_code, camera_url):
    response = requests.post(
        f"{CONFIG['backend_api_url']}/scans/ingest",
        json={"qrCode": qr_code, "source": "mobile-ip-camera", "cameraUrl": camera_url},
        headers={"x-scanner-api-key": CONFIG["scanner_api_key"]},
        timeout=CONFIG["timeout"],
    )
    response.raise_for_status()
    return response.json()


def decode_qr_codes(frame):
    if pyzbar_decode:
        return [symbol.data.decode("utf-8").strip() for symbol in pyzbar_decode(frame)]

    detector = cv2.QRCodeDetector()
    decoded, values, _, _ = detector.detectAndDecodeMulti(frame)

    if decoded and values is not None:
        return [value.strip() for value in values if value and value.strip()]

    value, _, _ = detector.detectAndDecode(frame)
    return [value.strip()] if value and value.strip() else []


def scan_loop(camera_url):
    capture = cv2.VideoCapture(camera_url)
    last_seen = {}

    if not capture.isOpened():
        with state_lock:
            state["last_error"] = f"Unable to open camera stream: {camera_url}"
            state["running"] = False
        return

    try:
        while not stop_event.is_set():
            ok, frame = capture.read()
            if not ok:
                time.sleep(0.25)
                continue

            for qr_code in decode_qr_codes(frame):
                now = time.time()
                if now - last_seen.get(qr_code, 0) < CONFIG["cooldown"]:
                    continue

                last_seen[qr_code] = now

                try:
                    result = ingest_scan(qr_code, camera_url)
                    with state_lock:
                        state["last_code"] = qr_code
                        state["last_result"] = result
                        state["last_error"] = None
                except Exception as exc:
                    with state_lock:
                        state["last_code"] = qr_code
                        state["last_error"] = str(exc)

            time.sleep(0.05)
    finally:
        capture.release()
        with state_lock:
            state["running"] = False


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "scanner", "decoder": DECODER})


@app.get("/status")
def status():
    with state_lock:
        return jsonify(
            {
                **state,
                "camera_url": CONFIG["camera_url"],
                "decoder": DECODER,
                "pyzbar_error": PYZBAR_IMPORT_ERROR,
            }
        )


@app.post("/scan/start")
def start_scan():
    global worker_thread

    body = request.get_json(silent=True) or {}
    camera_url = body.get("cameraUrl") or CONFIG["camera_url"]

    if not camera_url:
        return jsonify({"message": "Camera stream URL is required"}), 400

    if not CONFIG["backend_api_url"] or not CONFIG["scanner_api_key"]:
        return jsonify({"message": "Backend API URL and scanner API key are required"}), 500

    with state_lock:
        if state["running"]:
            return jsonify({"message": "Scanner is already running", **state})
        state["running"] = True
        state["started_at"] = utc_now()
        state["last_error"] = None

    stop_event.clear()
    worker_thread = threading.Thread(target=scan_loop, args=(camera_url,), daemon=True)
    worker_thread.start()

    return jsonify({"message": "Scanner started", "cameraUrl": camera_url})


@app.post("/scan/stop")
def stop_scan():
    stop_event.set()
    with state_lock:
        state["running"] = False
    return jsonify({"message": "Scanner stopped"})


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("FLASK_PORT", "7000")),
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
    )
