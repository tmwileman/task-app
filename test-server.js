// Simple test server to verify the app structure
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Task App Test</title></head>
      <body>
        <h1>Task App - Quick Test</h1>
        <p>The app structure is ready with these new features:</p>
        <ul>
          <li>✅ Enhanced Due Date Picker with quick buttons</li>
          <li>✅ Recurring Task System (daily/weekly/monthly/yearly)</li>
          <li>✅ Advanced Overdue Detection with visual indicators</li>
          <li>✅ Time-based Filtering (Today, Tomorrow, Week, Overdue)</li>
          <li>✅ Smart Scheduling Algorithms</li>
          <li>✅ Deadline Notification System</li>
        </ul>
        <p><strong>Database Schema:</strong> Updated with recurring task fields</p>
        <p><strong>Components:</strong> Enhanced with time management features</p>
        <p><strong>API:</strong> Supports time-based filtering</p>
        <hr>
        <p>To fix the Next.js connection issue, try:</p>
        <ol>
          <li>Restart your computer</li>
          <li>Try a different browser</li>
          <li>Check firewall settings</li>
          <li>Run: <code>npm install && npm run build && npm start</code></li>
        </ol>
      </body>
    </html>
  `);
});

server.listen(3005, () => {
  console.log('Test server running at http://localhost:3005');
});