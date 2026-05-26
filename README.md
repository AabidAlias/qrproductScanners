# Smart QR Product Scanner

A production-minded MERN + Python scanner app that reads QR codes from a mobile IP camera stream, looks products up in MongoDB, and records scan history.

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB, JWT
- Scanner service: Python Flask, OpenCV, pyzbar
- Camera source: mobile IP camera stream URL, for example `http://192.168.x.x:8080/video`

## Folder Structure

```text
smart-qr-product-scanner/
  backend/
    src/
      config/
      middleware/
      models/
      routes/
      utils/
    .env.example
    package.json
  frontend/
    src/
      components/
      context/
      pages/
      services/
    .env.example
    package.json
  scanner-service/
    app.py
    .env.example
    requirements.txt
  README.md
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB running locally or a MongoDB Atlas URI
- A phone IP camera app that exposes an MJPEG/video stream URL

## Setup

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run seed:admin
npm run dev
```

Update `backend/.env` before starting:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_qr_scanner
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:5173
SCANNER_API_KEY=replace-with-a-shared-scanner-key
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

### 2. Scanner Service

Install zbar first because `pyzbar` depends on it.

- Windows: install ZBar and ensure its DLL directory is on `PATH`
- macOS: `brew install zbar`
- Ubuntu/Debian: `sudo apt-get install libzbar0`

```bash
cd scanner-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

Set the mobile camera URL and backend settings in `scanner-service/.env`:

```env
FLASK_PORT=7000
CAMERA_STREAM_URL=http://192.168.x.x:8080/video
BACKEND_API_URL=http://localhost:5000/api
SCANNER_API_KEY=replace-with-a-shared-scanner-key
SCAN_COOLDOWN_SECONDS=3
REQUEST_TIMEOUT_SECONDS=5
```

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Update `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SCANNER_API_URL=http://localhost:7000
VITE_CAMERA_STREAM_URL=http://192.168.x.x:8080/video
```

Open `http://localhost:5173`.

## Usage

1. Log in with the seeded admin account.
2. Add products in the Admin page. The QR code value should match the data encoded in your product QR.
3. Open Scanner, enter or confirm the mobile camera stream URL, and start scanning.
4. The Flask scanner service decodes QR codes and posts them to Express.
5. Express fetches the matching product from MongoDB and stores a scan history entry.

## API Overview

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Products

- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `GET /api/products/qr/:qrCode`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Scan History

- `GET /api/scans`
- `POST /api/scans/ingest` using `x-scanner-api-key`
- `GET /api/scans/stats`

### Scanner Service

- `GET /health`
- `GET /status`
- `POST /scan/start`
- `POST /scan/stop`

## Production Notes

- Use strong unique values for `JWT_SECRET` and `SCANNER_API_KEY`.
- Restrict CORS to your deployed frontend origin.
- Run backend and scanner service behind a process manager such as PM2/systemd.
- Put HTTPS in front of public deployments.
- Do not expose the scanner ingest API without the scanner key.
- Keep MongoDB credentials out of source control.
