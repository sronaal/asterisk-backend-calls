# CallMetrics Backend

This repository contains the backend service for the CallMetrics project. It is a small
Node.js/Express application that exposes a set of HTTP endpoints to query
Asterisk and Asterisk CDR databases and return call-related data in JSON format.

> ⚠️ No claims are made about production readiness or performance. This readme
> reflects the current state of the code as found in the workspace.

---

## 🧱 Project Structure

```
app.js              # Express application and HTTP server setup
index.js            # Server start script
package.json        # Dependencies and npm scripts
src/
  config/
    config.js       # Loads environment variables and exports configuration
  controllers/
    cdr.controller.js  # Route handlers for CDR-related endpoints
  dao/
    asterisk.js     # Data access for Asterisk database
    cdr.js          # Data access for Asterisk CDR database
  db/
    mysql.js        # MySQL connection pools and initialization
  routes/
    routers.cdr.js  # Defines API routes for CDR operations
```

---

## 🔧 Prerequisites

- Node.js 18+ (see `package.json` for version used during development)
- MySQL databases for Asterisk and Asterisk CDR accessible with the
  appropriate credentials
- Environment configured using a `.env` file or equivalent

---

## ⚙️ Installation

```bash
# from the backend directory
npm install
```

---

## 📁 Environment Variables

Create a `.env` file in the `backend` folder with the following variables:

```dotenv
PORT=3100                               # HTTP server port (optional)

# Asterisk AMI (not used by current code but defined in config)
USER_AMI=yourAmiUser
PASS_AMI=yourAmiPass
HOST_AMI=ami.host.local
PORT_AMI=5038

# Asterisk database credentials
DB_USER_Asterisk=...
DB_PASSWORD_Asterisk=...
DB_HOST_Asterisk=...
DB_NAME_Asterisk=...
DB_PORT_Asterisk=3306

# Asterisk CDR database credentials
DB_USER_AsteriskCDR=...
DB_PASSWORD_AsteriskCDR=...
DB_HOST_AsteriskCDR=...
DB_NAME_AsteriskCDR=...
DB_PORT_AsteriskCDR=3306
```

> 🔒 Do not commit the `.env` file containing sensitive credentials.

---

## 🚀 Running the Service

```bash
npm run dev    # Starts the server with nodemon (development mode)
```

The server listens on the port specified by `PORT` (default `3100`).

---

## 📡 Available Endpoints

All routes are prefixed with `/api/v1/llamadas`.

| Method | Path                         | Description                                |
|--------|------------------------------|--------------------------------------------|
| GET    | `/`                          | Retrieve normalized call records           |
| GET    | `/agentes`                   | Statistics by agent                        |
| GET    | `/queues`                    | Call data grouped by queues                |
| GET    | `/queues/estadisticas`       | Queue statistics                           |

Each endpoint returns JSON data fetched from the corresponding view in
`asteriskcdrdb`.

---

## 📝 Notes

- The code uses CommonJS (`require`) modules; package.json declares
  `"type": "commonjs"`.
- Database pools are initialized at startup; connection errors are logged
  but do not prevent the server from starting.
- No authentication or input validation is currently implemented.

---

## 🛠️ Extending or Modifying

You can add additional routes, controllers, or DAO methods following the
existing patterns. Be mindful of error handling and database connections.

---

## 📄 License

This project does not specify a license. Add one if appropriate.
