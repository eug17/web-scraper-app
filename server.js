//BASE SETUP
"use strict";

let config = require('./config'),
    Scraper = require('./app/scraper'),
    express = require('express'),
    morgan = require('morgan'),
    FileWorker = require('./app/fileWorker'),
    bodyParser = require('body-parser'),
    DataParser = require('./app/dataParser');



//Initialize the app and needed modules
let app = express(),

    //Instance of FileWorker for working with the file where we store the data
    fileWorker = new FileWorker(),
    scraper = new Scraper(),
    dataParser = new DataParser();


//Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//Parse application/json
app.use(bodyParser.json());

//Log all requests to the console
app.use(morgan('dev'));


//Set static files location
//Used for requests that our front end will make
app.use(express.static(__dirname  + '/public'));


//Scraper processing route
app.post('/process', (req, res) => {

    let urls = req.body;

    scraper.scrapeData(urls, config.options).then( (data) => {
        fileWorker.write(config.filename, dataParser.parse(data)).then((message) => {

            //Success message to the client
            res.json({
                success: true,
                message: message
            });
            }, (err) => {
            res.json({
                success: false,
                message: err
            })
        })
    }, (err) => {
        res.json({
            success: false,
            message: err
        })
    })
});

//Scraper downloading route
app.get('/download', (req, res) => {

    let fileStream = fileWorker.createFileStream(config.filename);

    fileStream.on('error', (err) => {
        //Error handling
        res.json({
            success: false,
            message: err
        });
    });

    fileStream.pipe(res);

});

//Main route
//Send our users to front-end
app.all('*', (req, res) => {
    res.sendFile(path.join(__dirname + 'public/app/index.html'))
});


//START THE SERVER
app.listen(config.port);
console.log('The server is running on port ' + config.port);

