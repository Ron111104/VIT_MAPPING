const express = require('express');
const mongoose = require('mongoose');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const fs = require('fs');
const { BusRouteModel, StopModel } = require('./models'); // Import your schema and model
const path = require('path');
const app = express();
const port = 4010;
const busRoutesData = require('./data.json');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:4000"); // Update this with your frontend URL
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

require('dotenv').config();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname));

main = async () => {
    try {
        await mongoose.connect(atlasConnectionString);
        console.log('Connected to MongoDB Atlas');

        await BusRouteModel.deleteMany({});

        const insertionArray = [];

        await geocodeAllBusRoutes(busRoutesData);

        for (const routeName in busRoutesData) {
            const stopsData = busRoutesData[routeName];
            const stops = [];

            for (const stopData of stopsData) {
                let coordinates;
                if (stopData.coordinates) {
                    coordinates = {
                        type: 'Point',
                        coordinates: stopData.coordinates.coordinates
                    };
                }

                if (coordinates) {
                    const stop = new StopModel({
                        name: stopData['NAME OF THE STOPPING'],
                        time: stopData['TIME A.M'],
                        coordinates: coordinates
                    });
                    await stop.save();
                    stops.push(stop);
                }
            }

            const busRoute = new BusRouteModel({
                routeNumber: routeName,
                stops: stops
            });

            await busRoute.save();
        }

        console.log('Data inserted successfully');
    } catch (error) {
        console.error('Error:', error);
    }
};


const atlasConnectionString = process.env.ATLASDB_URL;
const mapToken = process.env.MAPBOX_APIKEY;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const chennaiBoundingBox = [80.0833, 12.8333, 80.3333, 13.1667];

async function geocodeLocation(locationName) {
    try {
        const response = await geocodingClient.forwardGeocode({
            query: locationName,
            limit: 1,
            bbox: chennaiBoundingBox
        }).send();

        if (response && response.body && response.body.features && response.body.features.length > 0) {
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

async function geocodeBusRoute(busRouteData) {
    for (const stop of busRouteData) {
        const locationName = stop['NAME OF THE STOPPING'];
        const coordinates = await geocodeLocation(locationName);
        if (coordinates) {
            stop.coordinates = { type: 'Point', coordinates: coordinates };
        } else {
            delete stop.coordinates;
        }
    }
}

async function geocodeAllBusRoutes(busRoutesData) {
    for (const routeName in busRoutesData) {
        const busRouteData = busRoutesData[routeName];
        await geocodeBusRoute(busRouteData);
    }
}

// Define the /routes endpoint to fetch bus routes data
app.get('/routes', async (req, res) => {
    try {
        const busRoutesData = await BusRouteModel.find({});
        res.json(busRoutesData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Define the main route to run the main function and send a response
app.get('/', async (req, res) => {
    await main();
    res.send("Backend works"); // Or any other response
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
