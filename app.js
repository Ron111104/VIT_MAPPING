const express = require('express');
const mongoose = require('mongoose');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const fs = require('fs');
const { BusRouteModel ,StopModel} = require('./models'); // Import your schema and model
const path = require('path');
const app = express();
const port = 4000;

require('dotenv').config();

app.set('view engine', 'ejs');

// Set the views directory to the directory where app.js resides
app.set('views',path.join(__dirname));

const busRoutesData={
    "BUS ROUTE NO: 1   PADI SARAVANA": [
      {
        "SL.NO.": 1,
        "NAME OF THE STOPPING": "PADI SARAVANA STORES",
        "TIME A.M": "06.00AM"
      },
      {
        "SL.NO.": 2,
        "NAME OF THE STOPPING": "DUNLOP",
        "TIME A.M": "06.05AM"
      },
      {
        "SL.NO.": 3,
        "NAME OF THE STOPPING": "AMBATTUR OT",
        "TIME A.M": "06.10AM"
      },
      {
        "SL.NO.": 4,
        "NAME OF THE STOPPING": "VANDALUR ",
        "TIME A.M": "07.30AM"
      },
      {
        "SL.NO.": 5,
        "NAME OF THE STOPPING": "VIT",
        "TIME A.M": "07.45AM"
      }
]};


const atlasConnectionString =  process.env.ATLASDB_URL;

const mapToken = process.env.MAPBOX_APIKEY;

// Initialize the Mapbox Geocoding client
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Chennai bounding box coordinates
const chennaiBoundingBox = [80.0833, 12.8333, 80.3333, 13.1667]; // [minLon, minLat, maxLon, maxLat]

// Function to geocode a location using Mapbox Geocoding API
async function geocodeLocation(locationName) {
    try {
        const response = await geocodingClient.forwardGeocode({
            query: locationName,
            limit: 1,
            bbox: chennaiBoundingBox
        }).send();

        if (response && response.body && response.body.features && response.body.features.length > 0) {
            // Extract coordinates from the first result
            const coordinates = response.body.features[0].geometry.coordinates;
            console.log(coordinates);
            return coordinates;
        } else {
            console.error(`Geocoding failed for location: ${locationName}`);
            return null;
        }
    } catch (error) {
        console.error('Error geocoding location:', error.message);
        return null;
    }
}

// Function to geocode all locations in a bus route
async function geocodeBusRoute(busRouteData) {
    for (const stop of busRouteData) {
        const locationName = stop['NAME OF THE STOPPING'];
        const coordinates = await geocodeLocation(locationName);
        if (coordinates) {
            stop.coordinates = { type: 'Point', coordinates: coordinates };
        } else {
            // If coordinates are not available, remove the stop from the route data
            delete stop.coordinates;
        }
    }
}

// Function to geocode all bus routes
async function geocodeAllBusRoutes(busRoutesData) {
    for (const routeName in busRoutesData) {
        const busRouteData = busRoutesData[routeName];
        await geocodeBusRoute(busRouteData);
    }
}

// Read data from data.json
// const rawData = fs.readFileSync('data.json');
// const busRoutesData = JSON.parse(rawData);
    
app.get('/', (req, res) => {
        // Pass busRoutesData to the EJS template
        
// Connect to MongoDB Atlas
mongoose.connect(atlasConnectionString)
.then(async () => {
    console.log('Connected to MongoDB Atlas');

    // Call the function to geocode all bus routes
    await geocodeAllBusRoutes(busRoutesData);
    console.log(busRoutesData);
    // Create the collection and insert data
    for (const routeName in busRoutesData) {
        const stopsData = busRoutesData[routeName];
        const stops = [];
        for (const stopData of stopsData) {
            const stop = new StopModel({
                name: stopData['NAME OF THE STOPPING'],
                time: stopData['TIME A.M'],
                // Add coordinates if available
            });
            stops.push(stop);
        }
    
        const busRoute = new BusRouteModel({
            routeNumber: routeName,
            stops: stops
        });
    
        try {
            await busRoute.save();
            console.log(`Route ${routeName} inserted successfully.`);
        } catch (error) {
            console.error(`Error inserting route ${routeName}:`, error);
        }
    }
    // await BusRouteModel.insertMany(busRoutesData);

    console.log('Data inserted successfully');
})
.catch(error => {
    console.error('Error connecting to MongoDB Atlas:', error);
});
        res.render('home', { busRoutesData });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
