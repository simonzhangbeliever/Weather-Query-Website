import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import fs from "fs";

//define express app and port
const app = express();
const port = 3000;
const description = JSON.parse(fs.readFileSync('descriptions.json', 'utf-8')); //read weather description from JSON file

app.use(express.static("public")); //use the public folder for static files
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.render("index.ejs");
});

//get geocoding data and weather data respectively from api
app.post("/Search", async (req, res) => {
    const searchLoc = req.body.location;
    try {
        //get latitude and longitude for a city from api
        const responseGeo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${searchLoc}&count=1`);
        const latitude = responseGeo.data.results[0].latitude;
        const longitude = responseGeo.data.results[0].longitude;
        // console.log(responseGeo.data.results[0].name);

        //get weather data for the city from api
        const responseWea = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&forecast_days=1&timezone=auto`);
        console.log(responseWea.data);
        //get current time in search city
        const timeZone = responseWea.data.timezone;
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', { 
            timeZone: timeZone,
            hour: 'numeric',
            minute: 'numeric',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
        const localTime = formatter.format(now);
        console.log(localTime);
        //get current weather description and weather icon
        const weatherCode = responseWea.data.current.weather_code; 
        const isDay = responseWea.data.current.is_day;
        if (isDay) {
            var weatherDesc = description[weatherCode].day.description;
            var weatherImg = description[weatherCode].day.image;
        } else {
            weatherDesc = description[weatherCode].night.description;
            weatherImg = description[weatherCode].night.image;
        }
        console.log(weatherDesc, weatherImg);
        res.render("index.ejs", {
            weather: responseWea.data,
            weatherDesc: weatherDesc,
            weatherImg: weatherImg,
            city: searchLoc.charAt(0).toUpperCase()+searchLoc.slice(1),
            time: localTime,
            sunriseTime: responseWea.data.daily.sunrise[0].slice(-5),
            sunsetTime: responseWea.data.daily.sunset[0].slice(-5),
        });
    } catch (error) {
        console.error("Failed to make request:", error.message);
        res.render("index.ejs", {error: "Please enter the correct location!"});
    }
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
})