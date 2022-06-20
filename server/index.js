var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*'), (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
};

app.get('/test', function(req, res){
    res.send('It worked!!!');
});

app.listen(3005);
console.log('Server is running');
