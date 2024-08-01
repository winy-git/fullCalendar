const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const mariadb = require('mariadb');

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Set up views and view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

// Define routes
app.get('/', function(req, res) {
    res.render('index.html');
});

app.get('/fullCalendar', function(req, res) {
  res.render('fullCalendar.html');
});

// Create a MariaDB connection pool
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root', 
  password: 'my_password', 
  database: 'fullCalendar',
  connectionLimit: 10
});

// Database route
app.get('/fullCalendar', (req, res) => {
  pool.query('SELECT * FROM events', (err, results) => {
      if (err) throw err;
      res.json(results);
  });
});

app.post('/fullCalendar', (req, res) => {
  const events = req.body; // Assuming it's an array of events

  if (events.length === 0) {
    return res.status(400).json({ error: 'No events to insert' });
  }

  // Construct the query and parameters
  let query = 'INSERT INTO events (title, start, end) VALUES';
  let values = [];
  let placeholders = events.map(event => {
    values.push(event.title, event.start, event.end);
    return '(?, ?, ?)';
  }).join(', ');

  query += placeholders;

  pool.query(query, values, (err, results) => {
    if (err) {
      console.error("Error inserting events:", err);
      return res.status(500).json({ error: 'Failed to insert events' });
    }
    res.json({ success: true, affectedRows: results.affectedRows });
  });
});

// Endpoint to delete event
app.delete('/fullCalendar/:id', async (req, res) => {
  const eventId = req.params.id;
  try {
    const result = await pool.query('DELETE FROM events WHERE id = ?', [eventId]);
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Start the server
const server = app.listen(3000, () => {
  console.log('Start Server : localhost:3000');
});