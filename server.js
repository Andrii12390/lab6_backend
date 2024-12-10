const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { WebSocketServer } = require('ws');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();

const corsOptions = {
    origin: '*',
    methods: 'GET,POST,DELETE',
    allowedHeaders: '*',
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());

const mongoUrl = 'mongodb+srv://user_1:1234@cluster0.ckpfo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const uri = "mongodb+srv://user_1:1234@cluster0.ckpfo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
    console.log('asdasd')
    await client.connect();

        console.log('Connected to MongoDB');
    
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
}
run().catch(console.dir);


// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://user_1:1234@cluster0.ckpfo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);
