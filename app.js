var express = require('express');
var favicon = require('express-favicon');
var logger = require('express-logger');
var methodOverride = require('express-method-override');
var errorHandler = require('express-error-handler');
var bodyParser = require('body-parser');
var http = require('http');
var path = require('path');
var jwt = require('jwt-simple');
var _ = require('underscore');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('jwtTokenSecret', 'g897t43lg98dFE*(W$FHL*(h3lfFHHHH*'); // a random value there
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger({path: "logfile.txt"}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

var tokens = [];

function requiresAuthentication(request, response, next) {
    if (request.headers.access_token) {
        var token = request.headers.access_token;
        if (_.where(tokens, token).length > 0) {
            var decodedToken = jwt.decode(token, app.get('jwtTokenSecret'));
            if (new Date(decodedToken.expires) > new Date()) {
                next();
                return;
            } else {
                removeFromTokens();
                response.status(401).end("Your session is expired");
            }
        }
    }
    response.status(401).end("No access token found in the request");
}

function removeFromTokens(token) {
    for (var counter = 0; counter < tokens.length; counter++) {
        if (tokens[counter] === token) {
            tokens.splice(counter, 1);
            break;
        }
    }
}

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

// handle initial request
app.get('/', function(request, response) {
    response.sendfile("./public/index.html");
});

// handle login
app.post('/api/login', function(request, response) {
    var userName = request.body.userName;
    var password = request.body.password;

    if (userName === "ey" && password === "ey") {
        var expires = new Date();
        expires.setDate((new Date()).getDate() + 24*60*60*1000); // 24 hours until token expires
        var token = jwt.encode({
            userName: userName,
            expires: expires
        }, app.get('jwtTokenSecret'));

        tokens.push(token);

        response.send(200, { access_token: token, userName: userName });
    } else {
        response.send(401, "Invalid credentials");
    }
});

// handle logout
app.post('/api/logout', requiresAuthentication, function(request, response) {
    var token= request.headers.access_token;
    removeFromTokens(token);
    response.send(200);
});

// Following are business methods for manipulating with customers

var customers = [ // predefined customers to start something with
    {
        id: 1,
        name: "ENTG",
        info:"ENTG is a creative tech company and consulting hub for advanced digital strategies and projects.Zagreb, Grad Zagreb, Croatia.European Union (EU)",
        cbrank : "93,866",
        status:"approved",
        email:"hello@entg.co"
            },
    {id: 2, name: "DKM Economic Consultants.",
        info:"DKM is the economic research and advice in Irish and international markets.Dublin, Dublin, Ireland.European Union (EU)",
        cbrank : "84,476",
        status:"approved",
        email:"hello@pluscitizen.com"},
    {id: 3, name: "Citizen, Inc.",
        info:"Citizen is a design company offering design and technology services.Portland, Oregon, United States.West Coast (US), Western US",
        cbrank : "84,476",
        status:"pending approval",
        email:"hello@pluscitizen.com"}
];

app.get('/api/crm', requiresAuthentication, function(request, response) {
    response.send(customers);
});

app.get('/api/crm/:customerId', requiresAuthentication, function(request, response) {
    response.send(_.findWhere(customers, {id: parseInt(request.params.customerId)}));
});

app.post('/api/crm', requiresAuthentication, function(request, response) {
    var newCustomer = request.body;
    newCustomer.id = 1 + _.max(customers, function (customer) {
            return customer.id;
        }).id;
    customers.push(newCustomer);
    response.send(customers);
});

app.put('/api/crm', requiresAuthentication, function(request, response) {
    var customer = request.body;
    for (var i = 0; i < customers.length; i++) {
        console.log("anannya 2",customers[i])
        if (customers[i].id == customer.id) {
            customers[i].name = customer.name;
            customers[i].info = customer.info;
            customers[i].email =  customer.email;
            customers[i].cbrank = customer.cbrank;
            customers[i].status = customer.status;
        }
    }
    response.send(204);
});

app.delete('/api/crm/:customerId', requiresAuthentication, function(request, response) {
    for (var i = 0; i < customers.length; i++) {
        if (customers[i].id == request.params.customerId) {
            customers.splice(i, 1);
        }
    }
    response.send(customers);
});