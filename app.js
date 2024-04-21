const express = require('express');
const mongoose = require('mongoose');
const { BusRouteModel, StopModel } = require('./models'); // Import your schema and model
const path = require('path');
const fs = require('fs');
const app = express();
const port = 4000;

require('dotenv').config();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname));

const atlasConnectionString = process.env.ATLASDB_URL;

// Function to read data from data.json file
const readDataJson = () => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data.json'));
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data.json:', error);
        return [];
    }
};

// Function to extract bus route numbers and stop names from data.json
const extractRouteNumbersAndStops = () => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data.json'));
        const jsonData = JSON.parse(data);
        const routes = [];
        for (const route in jsonData) {
            const routeNumber = route.match(/\d+/)[0]; // Extract bus route number
            const stops = jsonData[route].map(stop => stop['NAME OF THE STOPPING']); // Extract stop names
            routes.push({ routeNumber, stops });
        }
        return routes;
    } catch (error) {
        console.error('Error reading data.json:', error);
        return [];
    }
};

main = async () => {
    try {
        // Connect to MongoDB Atlas
        await mongoose.connect(atlasConnectionString);
        console.log('Connected to MongoDB Atlas');

        // Fetch all busRoutesData
        const busRoutesData = readDataJson();
        console.log('Fetched all busRoutesData:', busRoutesData);

        return busRoutesData;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
};

app.get('/', async (req, res) => {
    try {
        // Fetch busRoutesData from data.json
        const busRoutesData = readDataJson();

        // Render the home template with both mapboxAccessToken and busRoutesData
        res.render('home', {
            mapboxAccessToken: process.env.MAPBOX_APIKEY,
            busRoutesData: Object.values(busRoutesData) // Pass busRoutesData to the template as an array of routes
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to fetch bus route numbers and stop names
app.get('/routes', async (req, res) => {
    try {
        // Extract bus route numbers and stop names
        const routes = extractRouteNumbersAndStops();
        res.json(routes);
    } catch (error) {
        console.error('Error fetching bus routes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
