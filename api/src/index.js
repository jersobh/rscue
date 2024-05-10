const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());

app.use(bodyParser.json());

// can use a file as well
const db = new sqlite3.Database('./alerts.db');
// const db = new sqlite3.Database(':memory:');

// Initialize the SQLite database with an alerts table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL,
        lng REAL,
        event_name TEXT,
        type TEXT,
        description TEXT,
        tags TEXT,
        contact_number TEXT
    )`);
});

const sseClients = [];

// HTTP Routes
app.post('/alerts', (req, res) => {
  const { lat, lng, event_name, type, description, tags, contact_number } =
    req.body;

  if (
    !lat ||
    !lng ||
    !event_name ||
    !type ||
    !description ||
    !tags ||
    !contact_number
  ) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const stmt =
    db.prepare(`INSERT INTO alerts (lat, lng, event_name, type, description, tags, contact_number)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(
    lat,
    lng,
    event_name,
    type,
    description,
    tags.join(','),
    contact_number,
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const newAlert = {
        id: this.lastID,
        lat,
        lng,
        event_name,
        type,
        description,
        tags,
        contact_number,
      };

      // Notify all WebSocket clients of the new alert
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(newAlert));
        }
      });

      // Send data to all connected SSE clients
      sseClients.forEach((client) => {
        client.res.write(`data: ${JSON.stringify(newAlert)}\n\n`);
      });

      res.status(201).json(newAlert);
    }
  );
  stmt.finalize();
});

app.get('/alerts', (req, res) => {
  db.all(`SELECT * FROM alerts`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.delete('/alerts/:id', (req, res) => {
  const alertId = req.params.id;
  const stmt = db.prepare(`DELETE FROM alerts WHERE id = ?`);
  stmt.run(alertId, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Alert deleted successfully', id: alertId });
  });
  stmt.finalize();
  const deletionNotification = { type: 'delete', id: alertId };
  sseClients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(deletionNotification)}\n\n`);
  });
});

// avoid deleting all alerts

app.delete('/alerts', (req, res) => {
  const stmt = db.prepare(`DELETE FROM alerts`);
  stmt.run([], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'All alerts deleted successfully' });
  });
  stmt.finalize();
  const deletionNotification = { type: 'deleteAll' };
  sseClients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(deletionNotification)}\n\n`);
  });
});

app.get('/alerts/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Keep the client connection open for streaming data
  const newClient = { id: sseClients.length + 1, res };
  sseClients.push(newClient);

  // Remove client from list if connection is closed
  req.on('close', () => {
    sseClients.splice(sseClients.indexOf(newClient), 1);
  });

  // Send initial data to the newly connected client
  db.all(`SELECT * FROM alerts`, [], (err, rows) => {
    if (err) {
      res.write(`data: ${JSON.stringify({ error: 'Database error' })}\n\n`);
    } else {
      rows.forEach((row) => {
        res.write(`data: ${JSON.stringify(row)}\n\n`);
      });
    }
  });
});

// yes, we have websockets
const server = app.listen(3000, () => {
  console.log('HTTP Server listening on port 3000');
});

const wss = new WebSocket.Server({ server, path: '/ws' });

const clientAlerts = new Map();

wss.on('connection', (ws) => {
  // Track alerts for this specific client
  clientAlerts.set(ws, []);

  ws.on('message', (message) => {
    try {
      const sosAlert = JSON.parse(message);
      const { lat, lng, event_name, description, tags, type } = sosAlert;

      if (!lat || !lng || !event_name || !description || !tags || !type) {
        ws.send(JSON.stringify({ error: 'All fields are required' }));
        return;
      }

      const stmt = db.prepare(`
        INSERT INTO alerts (lat, lng, event_name, type, description, tags, contact_number)
        VALUES (?, ?, ?, ?, ?, ?, '')
      `);
      stmt.run(
        lat,
        lng,
        event_name,
        type,
        description,
        tags.join(','),
        function (err) {
          if (err) {
            ws.send(JSON.stringify({ error: 'Database error' }));
            return;
          }

          const newSosAlert = {
            id: this.lastID,
            lat,
            lng,
            event_name,
            type,
            description,
            tags,
            contact_number: '',
          };

          // Add the alert to the client's list of alerts
          clientAlerts.get(ws).push(newSosAlert.id);

          // Notify all WebSocket clients of the new SOS alert
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(newSosAlert));
            }
          });

          // Send data to all connected SSE clients
          sseClients.forEach((client) => {
            client.res.write(`data: ${JSON.stringify(newSosAlert)}\n\n`);
          });
        }
      );
      stmt.finalize();
    } catch (error) {
      ws.send(JSON.stringify({ error: 'Invalid data format' }));
    }
  });

  ws.on('close', () => {
    // Delete all alerts created by this WebSocket client
    const alertIds = clientAlerts.get(ws) || [];

    alertIds.forEach((alertId) => {
      const stmt = db.prepare(`DELETE FROM alerts WHERE id = ?`);
      stmt.run(alertId, (err) => {
        if (err) {
          console.error('Error deleting alert:', err);
        } else {
          const deletionNotification = { type: 'delete', id: alertId };

          // Notify other WebSocket clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(deletionNotification));
            }
          });

          // Notify all connected SSE clients
          sseClients.forEach((client) => {
            client.res.write(
              `data: ${JSON.stringify(deletionNotification)}\n\n`
            );
          });
        }
      });
    });

    // Clean up the client from the map
    clientAlerts.delete(ws);
  });

  // Send the initial list of alerts
  db.all(`SELECT * FROM alerts`, [], (err, rows) => {
    if (err) {
      ws.send(JSON.stringify({ error: 'Database error' }));
    } else {
      ws.send(JSON.stringify({ alerts: rows }));
    }
  });
});
