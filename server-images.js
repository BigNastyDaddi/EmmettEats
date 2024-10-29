const https = require('https');
const fs = require('fs');
const { MongoClient } = require("mongodb");
const url = require('url');
const path = require('path');
const cors = require('cors'); 

// SSL options
const options = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

const hostname = '0.0.0.0';
const port = 443;

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
}

async function searchFoodItems(searchTerm) {
    try {
        const database = client.db('EmmettEats');
        const collection = database.collection('EmmettEats');
        
        const query = {
            $or: [
                { restaurantName: { $regex: searchTerm, $options: 'i' } },
                { food: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        const results = await collection.find(query).toArray();
        return results;
    } catch (error) {
        console.error('Error fetching search results:', error);
        throw error;
    }
}

const server = https.createServer(options, async (req, res) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
    } else if (parsedUrl.pathname === '/search' && req.method === 'GET') {
        const restaurantName = parsedUrl.query.restaurantName;
        try {
            const foodItems = await searchFoodItems(restaurantName);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(foodItems));
        } catch (error) {
            console.error('Error fetching food items:', error);
            res.statusCode = 500;
            res.end("Internal Server Error");
        }
    } else if (parsedUrl.pathname === '/ee-logo' && req.method === 'GET') {
        // Serve the "EE" logo image
        res.writeHead(200, { 'Content-Type': 'image/jpg' });
        fs.createReadStream(path.join(__dirname, 'EE.jpg')).pipe(res);
    } else {
        res.statusCode = 404;
        res.end("Not Found");
    }
});

async function startServer() {
    await connectToDatabase();
    server.listen(port, hostname, () => {
        console.log(`Server running at https://${hostname}:${port}/`);
    });
}

startServer().catch(error => {
    console.error('Failed to start the server:', error);
    process.exit(1);
});

