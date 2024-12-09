const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { WebSocketServer } = require('ws');

const app = express();

const corsOptions = {
    origin: '*', // Дозволяє запити з будь-якого домену
    methods: 'GET,POST,DELETE',
    allowedHeaders: '*', // Дозволяє всі заголовки
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

const FILE_PATH = './data.json';

// Запуск сервера HTTP
const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`HTTP Server is running on ${process.env.PORT ? 'Vercel' : 'http://localhost'}:${server.address().port}`);
});

// Ініціалізація WebSocket сервера
const wss = new WebSocketServer({ server });

function broadcastToClients(data) {
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

app.get('/api/data', (req, res) => {
    fs.readFile(FILE_PATH, (err, fileData) => {
        if (err) {
            res.status(500).json({ error: 'Error reading data file' });
            return;
        }
        const jsonData = JSON.parse(fileData || '[]');
        res.json(jsonData);
    });
});

app.post('/api/submit', (req, res) => {
    const newItem = req.body;

    fs.readFile(FILE_PATH, (err, fileData) => {
        if (err) {
            res.status(500).json({ error: 'Error reading data file' });
            return;
        }
        const data = JSON.parse(fileData || '[]');
        data.push(newItem);

        fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                res.status(500).json({ error: 'Error writing to file' });
                return;
            }
            broadcastToClients(newItem);
            res.status(200).json({ message: 'Data added successfully' });
        });
    });
});

app.delete('/api/data/delete', (req, res) => {
    try {
        fs.writeFile(FILE_PATH, '[]', (err) => {
            if (err) {
                console.error('Error writing file:', err);
                res.status(500).json({ error: 'Error deleting data' });
                return;
            }
            broadcastToClients(null);
            res.status(200).json({ message: 'Data deleted successfully' });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Error deleting data' });
    }
});
