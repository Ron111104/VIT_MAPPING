const express = require('express');
const mongoose = require('mongoose');
const { BusRouteModel } = require('./models'); // Import your schema and model
const path = require('path');
const app = express();
const port = 4000;

require('dotenv').config();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname));

const atlasConnectionString = process.env.ATLASDB_URL;

main = async () => {
    try {
        // Connect to MongoDB Atlas
        await mongoose.connect(atlasConnectionString);
        console.log('Connected to MongoDB Atlas');

        // Fetch all bus routes from MongoDB
        const busRoutes = await BusRouteModel.find().lean();
        console.log('Fetched all bus routes from MongoDB:', busRoutes);

        return busRoutes;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
};

app.get('/input',async(req,res)=>{
    const busRoutes = await main();
    try{

        res.render('input' ,{
            mapboxAccessToken: process.env.MAPBOX_APIKEY,
            busRoutes: busRoutes
        });
    }catch(error){
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
})

app.get('/', async (req, res) => {
    const busRoutes = await main();
    try {
        // Fetch bus routes from MongoDB

        // Render the home template with both mapboxAccessToken and busRoutes
        res.render('home', {
            mapboxAccessToken: process.env.MAPBOX_APIKEY,
            busRoutes: busRoutes
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
