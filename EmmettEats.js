// server.js

const http = require('node:http');
const { MongoClient } = require("mongodb");
const url = require('url'); // For parsing URL query strings

const hostname = '0.0.0.0';
const port = 3000;

const uri = "mongodb://localhost";
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

async function searchFoodItems(restaurantName) {
  try {
    const database = client.db('EmmettEats');
    const collection = database.collection('EmmettEats');
    const query = { restaurantName: { $regex: restaurantName, $options: 'i' } }; // Case-insensitive search
    const foodItems = await collection.find(query).toArray();
    return foodItems;
  } catch (error) {
    console.error('Error fetching food items:', error);
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true); // Parse the URL
  if (parsedUrl.pathname === '/search' && req.method === 'GET') {
    const restaurantName = parsedUrl.query.restaurantName;
    try {
      const foodItems = await searchFoodItems(restaurantName);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(foodItems)); // Send results as JSON
    } catch (error) {
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  } else {
    res.statusCode = 404;
    res.end("Not Found");
  }
});

// Start the server
async function startServer() {
  await connectToDatabase();
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

startServer().catch(error => {
  console.error('Failed to start the server:', error);
  process.exit(1);
});

