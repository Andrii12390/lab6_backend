const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { WebSocketServer } = require('ws');
const { MongoClient } = require('mongodb');

const app = express();

const corsOptions = {
    origin: '*',
    methods: 'GET,POST,DELETE',
    allowedHeaders: '*',
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Додано для обробки preflight-запитів
app.use(bodyParser.json());

const mongoUrl = 'mongodb+srv://user_1:Foresteroid12390@cluster0.ckpfo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    if (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }

    const db = client.db('mydatabase');
    const collection = db.collection('data');

    app.get('/data', async (req, res) => {
        try {
            const data = await collection.find({}).toArray();
            res.json(data);
        } catch (error) {
            console.error('Error reading data from database:', error);
            res.status(500).json({ error: 'Error reading data from database' });
        }
    });

    app.post('/submit', async (req, res) => {
        const newItem = req.body;
        try {
            await collection.insertOne(newItem);
            broadcastToClients(newItem);
            res.status(200).json({ message: 'Data added successfully' });
        } catch (error) {
            console.error('Error writing to database:', error);
            res.status(500).json({ error: 'Error writing to database' });
        }
    });

    app.delete('/data/delete', async (req, res) => {
        try {
            await collection.deleteMany({});
            broadcastToClients(null);
            res.status(200).json({ message: 'Data deleted successfully' });
        } catch (error) {
            console.error('Error deleting data from database:', error);
            res.status(500).json({ error: 'Error deleting data from database' });
        }
    });

    const server = app.listen(process.env.PORT || 3000, () => {
        console.log(`HTTP Server is running on ${process.env.PORT ? 'Vercel' : 'http://localhost'}:${server.address().port}`);
    });

    const wss = new WebSocketServer({ server });

    function broadcastToClients(data) {
        wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
});
