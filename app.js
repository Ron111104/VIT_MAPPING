const express = require('express');
const mongoose = require('mongoose');
const { BusRouteModel, StopModel } = require('./models'); // Import your schema and model
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

        // Fetch all busRoutesData
        const busRoutesData = await BusRouteModel.find({});
        console.log('Fetched all busRoutesData:', busRoutesData);
        
        // Pass busRoutesData to the rendering function
        return busRoutesData;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
};

app.get('/', async(req, res) => {
    const busRoutesData = await main();
    await res.render('home', { busRoutesData });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
