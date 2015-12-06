/*
*	Written by Sam Sung Kai Yeung & Ma Pui Nam 
*	For OUHK COMP 381 Project Assignment
*	A Node.js Server providing RESTful web service
*	of a collection (restaurants) in MongodbLab.
*	06 Dec 2015
*/
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
var mongodbURL = 'mongodb://samsungmajai:samsam123@ds054288.mongolab.com:54288/pj';

var restaurantSchema = require('./models/restaurant');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


function isNumeric(n) { 
      return !isNaN(parseFloat(n)) && isFinite(n); 
}

function checkGrade(grade) {
	var regexLetter = /[abdceduABCDEFU]/;
	if(!regexLetter.test(grade)){
		return false;
	}
	return grade.toUpperCase();
}

app.param('lon', function(req,res, next, lon){
	if(isNumeric(lon)){
		req.lon = lon;	
	}
 	else {
    		return res.send('Error 400: lon must be a number.');
 	}
 	next();
});

app.param('lat', function(req,res, next, lat){
	if(isNumeric(lat)){
		req.lat = lat;	
	}
 	else {
    		return res.send('Error 400: lat must be a number.');
 	}
 	next();
});


// redirect to RESTful path
app.get('/',function(req,res) {
	var query = "";
	if (req.query.hasOwnProperty('name')) {
		query += '/name/'+req.query.name;
	}
	if (req.query.hasOwnProperty('building')) {
		query += '/building/'+req.query.building;
	}
	if (req.query.hasOwnProperty('street')) {
		query += '/street/'+req.query.street;
	}
	if (req.query.hasOwnProperty('zipcode')) {
		query += '/zipcode/'+req.query.zipcode;
	}
	if (req.query.hasOwnProperty('borough')) {
		query += '/borough/'+req.query.borough;
	}
	if (req.query.hasOwnProperty('cuisine')) {
		query += '/cuisine/'+req.query.cuisine;
	}
	if (req.query.hasOwnProperty('restaurant_id')) {
		query += '/restaurant_id/'+req.query.restaurant_id;
	}
	if(query == "")
        query = "/restaurants";
	res.redirect(query);
});

app.get('/restaurants', function(req,res) {
	var criteria = {};
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
	var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find(criteria,function(err,results){
			if (err) {
				console.log("Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				db.close();
				console.log('Found: ',results.length);
				res.type('application/json');
				if (results.length ==0) {
					res.json({"message":"No document in restaurants"});
				}
				else {
					res.json(results);
				}		
			}
		});
	});
});

function getCriteria (req,res,attrib, attrib_value,criteria) {
	if (attrib == "street" || attrib == "zipcode" ||
	    attrib == "building") {
		criteria["address."+attrib] = new RegExp(".*" + attrib_value + ".*");
	}
	else if(attrib == "borough" || attrib == "cuisine" ||
		attrib == "name"){
		criteria[attrib] = new RegExp(".*" + attrib_value + ".*");
	}
	else if(attrib == "coord") {
		var message = '{"message":"Please use the path /coord/lon/:lon or /coord/lat/:lat", "'+attrib + '":"' +attrib_value+'"}';
		res.json(JSON.parse(message));
	}
	else if(attrib == "lon") {
		if(isNumeric(attrib_value)){
			criteria["address.coord.0"] = parseFloat(attrib_value);
		}
 		else {
    			return res.send('Error 400: lon must be a number.');
 		}	
	}
	else if(attrib == "lat") {
		if(isNumeric(attrib_value)){
			criteria["address.coord.1"] = parseFloat(attrib_value);
		}
 		else {
    			return res.send('Error 400: lat must be a number.');
 		}	
	}
	else if(attrib == "grades") {
		var message = '{"message":"Please use the path /grades/date/:date or /grades/grade/:grade or /grades/score/:score", "'+attrib + '":"' +attrib_value+'"}';
		res.json(JSON.parse(message));
	}
	else if(attrib == "_id" || attrib == "restaurant_id") {
		criteria[attrib] = attrib_value;
	}
	else {
    		return res.send('Error 400: No this attribute in Restaurant. ' + attrib);
	}
	return criteria
}

function findRestaurant(req,res,params,criteria) {
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
	var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find(criteria,function(err,results){
			if (err) {
				console.log("fError: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				db.close();
				console.log('Found: ',results.length);
				res.type('application/json');
				if (results.length ==0) {
					var attribed = [];
					var message = {};
					message["message"] = "No matching document";
					for(var key in criteria) {
						for(var attri in req.params) {
							if(attribed.indexOf(attri) >= 0 || attribed.indexOf(attri+"_value") >=0 ) {
							}
							else {
								if(key.indexOf("0") != -1)  {
									message["lon"] = req.params[attri+"_value"];
									attribed.push(attri);
									attribed.push(attri+"_value");
									break;
								}
								if(key.indexOf("1") != -1) {
									message["lat"] = req.params[attri+"_value"];
									attribed.push(attri);
									attribed.push(attri+"_value");
									break;
								}
								if(key.indexOf("address") != -1)  {
									if(!message.hasOwnProperty(key.substring(key.indexOf(".") +1))) {
										message[key.substring(key.indexOf(".") +1)] = req.params[attri+"_value"];
										attribed.push(attri);
										attribed.push(attri+"_value");
									break;
									}
								}
								if(key.indexOf(req.params[attri]) != -1) {
									message[key] = req.params[attri+"_value"];
									attribed.push(attri);
									attribed.push(attri+"_value");
									break;			
								}
							}

						}
					}
					res.json(message);
				}
				else {
					res.json(results);
				}		
			}
		});
	});
}

app.get('/:attrib/:attrib_value', function(req,res) {
	var criteria = {};
	criteria = getCriteria(req,res,req.params.attrib,req.params.attrib_value,criteria);
	findRestaurant(req,res,req.params.attrib_value,criteria);
});

app.get('/:attrib/:attrib_value/:attrib2/:attrib2_value', function(req,res) {
	var criteria = {};
	criteria = getCriteria(req,res,req.params.attrib,req.params.attrib_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib2,req.params.attrib2_value,criteria);
	findRestaurant(req,res,req.params,criteria);
});

app.get('/:attrib/:attrib_value/:attrib2/:attrib2_value/:attrib3/:attrib3_value', function(req,res) {
	var criteria = {};
	criteria = getCriteria(req,res,req.params.attrib,req.params.attrib_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib2,req.params.attrib2_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib3,req.params.attrib3_value,criteria);
	findRestaurant(req,res,req.params,criteria);
});
app.get('/:attrib/:attrib_value/:attrib2/:attrib2_value/:attrib3/:attrib3_value/:attrib4/:attrib4_value', function(req,res) {
	var criteria = {};
	criteria = getCriteria(req,res,req.params.attrib,req.params.attrib_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib2,req.params.attrib2_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib3,req.params.attrib3_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib4,req.params.attrib4_value,criteria);
	findRestaurant(req,res,req.params,criteria);
});
app.get('/:attrib/:attrib_value/:attrib2/:attrib2_value/:attrib3/:attrib3_value/:attrib4/:attrib4_value/:attrib5/:attrib5_value', function(req,res) {
	var criteria = {};
	criteria = getCriteria(req,res,req.params.attrib,req.params.attrib_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib2,req.params.attrib2_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib3,req.params.attrib3_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib4,req.params.attrib4_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib5,req.params.attrib5_value,criteria);
	findRestaurant(req,res,req.params,criteria);
});
app.get('/:attrib/:attrib_value/:attrib2/:attrib2_value/:attrib3/:attrib3_value/:attrib4/:attrib4_value/:attrib5/:attrib5_value/:attrib6/:attrib6_value', function(req,res) {
	var criteria = {};
	criteria = getCriteria(req,res,req.params.attrib,req.params.attrib_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib2,req.params.attrib2_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib3,req.params.attrib3_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib4,req.params.attrib4_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib5,req.params.attrib5_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib6,req.params.attrib6_value,criteria);
	findRestaurant(req,res,req.params,criteria);
});
app.get('/:attrib/:attrib_value/:attrib2/:attrib2_value/:attrib3/:attrib3_value/:attrib4/:attrib4_value/:attrib5/:attrib5_value/:attrib6/:attrib6_value/:attrib7/:attrib7_value', function(req,res) {
	var criteria = {};
	criteria = getCriteria(req,res,req.params.attrib,req.params.attrib_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib2,req.params.attrib2_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib3,req.params.attrib3_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib4,req.params.attrib4_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib5,req.params.attrib5_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib6,req.params.attrib6_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib7,req.params.attrib7_value,criteria);
	findRestaurant(req,res,req.params,criteria);
});
app.get('/:attrib/:attrib_value/:attrib2/:attrib2_value/:attrib3/:attrib3_value/:attrib4/:attrib4_value/:attrib5/:attrib5_value/:attrib6/:attrib6_value/:attrib7/:attrib7_value/:attrib8/:attrib8_value', function(req,res) {
	var criteria = {};
	criteria = getCriteria(req,res,req.params.attrib,req.params.attrib_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib2,req.params.attrib2_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib3,req.params.attrib3_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib4,req.params.attrib4_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib5,req.params.attrib5_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib6,req.params.attrib6_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib7,req.params.attrib7_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib8,req.params.attrib8_value,criteria);
	findRestaurant(req,res,req.params,criteria);
});
app.get('/:attrib/:attrib_value/:attrib2/:attrib2_value/:attrib3/:attrib3_value/:attrib4/:attrib4_value/:attrib5/:attrib5_value/:attrib6/:attrib6_value/:attrib7/:attrib7_value/:attrib8/:attrib8_value/:attrib9/:attrib9_value', function(req,res) {
	var criteria = {};
	criteria = getCriteria(req,res,req.params.attrib,req.params.attrib_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib2,req.params.attrib2_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib3,req.params.attrib3_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib4,req.params.attrib4_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib5,req.params.attrib5_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib6,req.params.attrib6_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib7,req.params.attrib7_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib8,req.params.attrib8_value,criteria);
	criteria = getCriteria(req,res,req.params.attrib9,req.params.attrib9_value,criteria);
	findRestaurant(req,res,req.params,criteria);
});


app.get('/coord/lon/:lon', function(req,res) {
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
	var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find({"address.coord.0":req.params.lon},function(err,results){
			if (err) {
				console.log("Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				db.close();
				console.log('Found: ',results.length);
				res.type('application/json');
				if (results.length ==0) {
					var message = '{"message":"No matching document", "address.coord.lon":"' +req.params.lon+'"}';
					res.json(JSON.parse(message));
				}
				else {
					res.json(results);
				}		
			}
		});
	});
});

app.get('/coord/lat/:lat', function(req,res) {
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
	var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find({"address.coord.1":req.params.lat},function(err,results){
			if (err) {
				console.log("Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				db.close();
				console.log('Found: ',results.length);
				res.type('application/json');
				if (results.length ==0) {
					var message = '{"message":"No matching document", "address.coord.lat":"' +req.params.lat+'"}';
					res.json(JSON.parse(message));
				}
				else {
					res.json(results);
				}		
			}
		});
	});
});

app.get('/grades/:attrib/:attrib_value', function(req,res) {
	var criteria = {};
	if(req.params.attrib == "date") {
		criteria["grades.date"]  = new Date(req.params.attrib_value);
	}
	else if(req.params.attrib == "grade") {
		if(checkGrade(req.params.attrib_value)) {
			criteria["grades.grade"] = checkGrade(req.params.attrib_value);
			req.params.attrib_value = checkGrade(req.params.attrib_value);
		}
		else {
    			return res.send('Error 400: grade must be an alphabet in A-F,U.');
		}
	}
	else if(req.params.attrib == "score") {
		if(isNumeric(req.params.attrib_value)){
			criteria["grades.score"] = parseInt(req.params.attrib_value);
		}
 		else {
    			return res.send('Error 400: score must be a number.');
 		}
 	}

	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
	var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find(criteria,function(err,results){
			if (err) {
				console.log("Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				db.close();
				console.log('Found: ',results.length);
				res.type('application/json');
				if (results.length ==0) {
					var message = '{"message":"No matching document", "grades.'+req.params.attrib + '":"' +req.params.attrib_value+'"}';
					res.json(JSON.parse(message));
				}
				else {
					res.json(results);
				}		
			}
		});
	});
});

app.post('/', function(req,res) {
	var name;
	var building;
	var street;
	var zipcode;
	var lon;
	var lat;
	var borough;
	var cuisine;
	var restaurant_id;
	var _id;

	if(!req.body.hasOwnProperty('name')) {
    		return res.send('Error 400: Name should be provided in the data.');
	}
	else { name = req.body.name;}

	if(!req.body.hasOwnProperty('building')) {
    		return res.send('Error 400: Building should be provided in the data.');
	}
	else { building = req.body.building;}

	if(!req.body.hasOwnProperty('street')) {
    		return res.send('Error 400: Street should be provided in the data.');	
	}
	else { street = req.body.street;}

	if(!req.body.hasOwnProperty('zipcode')) {
    		return res.send('Error 400: Zipcode should be provided in the data.');	
	}
	else { zipcode = req.body.zipcode;}
		
	if(!req.body.hasOwnProperty('lon')) {
    		return res.send('Error 400: Lon should be provided in the data.');	
	}
	else { lon = parseFloat(req.body.lon);}
		
	if(!req.body.hasOwnProperty('lat')) {
    		return res.send('Error 400: Lat should be provided in the data.');	
	}
	else { lat = parseFloat(req.body.lat);}
		
	if(!req.body.hasOwnProperty('borough')) {
    		return res.send('Error 400: Borough should be provided in the data.');	
	}
	else { borough = req.body.borough;}
		
	if(!req.body.hasOwnProperty('cuisine')) {
    		return res.send('Error 400: cuisine should be provided in the data.');	
	}
	else { cuisine = req.body.cuisine;}
		
	if(!req.body.hasOwnProperty('restaurant_id')) {
    		return res.send('Error 400: Restaurant ID should be provided in the data.');	
	}
	else { restaurant_id = req.body.restaurant_id;}

	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	//check id already exist or not
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
	var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find({restaurant_id: restaurant_id},function(err,results){
			if (err) {
				console.log("Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				console.log('Going to insert '+restaurant_id+' to database.');
				res.type('application/json');
				if (results.length ==0) {
					mongoose.model('Restaurant', restaurantSchema).create({
    					address : {
        					street: street,
        					zipcode: zipcode,
        					building: building,
        					coord: [lon,lat]
       					},
    					borough: borough,
    					cuisine: cuisine,
    					grades: [],
    					name: name,
    					restaurant_id: restaurant_id
					}, function (err, results) {
					if (err) {
						res.end(err.message,500);
					} else {
						console.log('Insert Done. ' + '_id: '+results["_id"]);
						var result = '{"message":"insert done", "_id":"'+results["_id"]+'"}';
						res.json(JSON.parse(result));
					}
					db.close();
					});
				}
				else {
					console.log('Fail to insert '+restaurant_id+' to database. : Restaurant ID already exists');
					var result = '{"message":"insert failed. Restaurant ID already exists.", "restaurant_id":"'+restaurant_id+'"}';
					res.json(JSON.parse(result));
					db.close();
				}		
			}
		});
	});
});

app.post('/:attrib/:attrib_value/:attrib2/:attrib2_value/:attrib3/:attrib3_value/:attrib4/:attrib4_value/:attrib5/:attrib5_value/:attrib6/:attrib6_value/:attrib7/:attrib7_value/:attrib8/:attrib8_value/:attrib9/:attrib9_value', function(req,res) {
	var name;
	var building;
	var street;
	var zipcode;
	var lon;
	var lat;
	var borough;
	var cuisine;
	var restaurant_id;
	var _id;

	var data = {name:null, building:null, street:null, zipcode:null, lon:null, lat:null, borough:null, cuisine:null, restaurant_id:null};

	for(var a in req.params) {
		if(a.indexOf("_value")<0) {
			if(req.params[a] == "name" || req.params[a] == "building" || req.params[a] == "street" || req.params[a] == "zipcode" || req.params[a] == "lon" ||
		   	req.params[a] == "lat" || req.params[a] == "borough" || req.params[a] == "cuisine" || req.params[a] == "restaurant_id") {
				data[req.params[a]] = req.params[a+"_value"];
			}
			else {
				return res.send('Error 400: No this attribute in Restaurant. ' + req.params[a]);
			}
		}
	}

	for (var key in data) {
		if(data[key] == null)
			return res.send('Error 400: ' + key + ' should be provided in the data.');
	}

	name = data.name;
	building = data.building;
	street = data.street;
	zipcode = data.zipcode;
	lon = data.lon;
	lat = data.lat;
	borough = data.borough;
	cuisine = data.cuisine;
	restaurant_id = data.restaurant_id;

	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	//check id already exist or not
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
	var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find({restaurant_id: restaurant_id},function(err,results){
			if (err) {
				console.log("Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				console.log('Going to insert '+restaurant_id+' to database.');
				res.type('application/json');
				if (results.length ==0) {
					mongoose.model('Restaurant', restaurantSchema).create({
    					address : {
        					street: street,
        					zipcode: zipcode,
        					building: building,
        					coord: [lon,lat]
       					},
    					borough: borough,
    					cuisine: cuisine,
    					grades: [],
    					name: name,
    					restaurant_id: restaurant_id
					}, function (err, results) {
					if (err) {
						res.end(err.message,500);
					} else {
						console.log('Insert Done. ' + '_id: '+results["_id"]);
						var result = '{"message":"insert done", "_id":"'+results["_id"]+'"}';
						res.json(JSON.parse(result));
					}
					db.close();
					});
				}
				else {
					console.log('Fail to insert '+restaurant_id+' to database. : Restaurant ID already exists');
					var result = '{"message":"insert failed. Restaurant ID already exists.", "restaurant_id":"'+restaurant_id+'"}';
					res.json(JSON.parse(result));
					db.close();
				}		
			}
		});
	});
});

app.put('/:attrib/:attrib_value/:updateattrib/:updateattrib_value', function(req,res) {
	if(req.params.attrib == "restaurant_id" || req.params.attrib == "_id") {
		var criteria = {};
		criteria[req.params.attrib] = req.params.attrib_value;
	}
	else {
		var result = '{"message":"Update failed. Please use an unique key. (restaurant_id or _id)", "'+req.params.attrib + '":"' +req.params.attrib_value+'"}';
		res.json(JSON.parse(result));
	}

	var update = {};
	update[req.params.updateattrib] = req.params.updateattrib_value;

	console.log(criteria);
	
	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		
		Restaurant.find(criteria,function(err,results){
			if (err) {
				console.log("Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				console.log('Going to Update '+req.params.attrib_value+' in database.');
				res.type('application/json');
				if (results.length ==1) {
					Restaurant.update(criteria,{$set:update},function(err){
						if (err) {
							console.log("Error: " + err.message);
							res.write(err.message);
							db.close();
						}
						else {
							db.close();
							res.json({"message":"update done"});	
						}
					});
				}
				else {
					console.log('Fail to Update '+req.params.attrib_value+' in database. : '+req.params.attrib +' dose not exists');
					var result = '{"message":"update failed. '+req.params.attrib+' does not exists.", "'+
					req.params.attrib+'":"'+req.params.attrib_value+'"}';
					res.json(JSON.parse(result));
					db.close();
				}		
			}
		});
	});
});

app.put('/:attrib/:attrib_value', function(req,res) {
	if(req.params.attrib == "restaurant_id" || req.params.attrib == "_id") {
		var criteria = {};
		criteria[req.params.attrib] = req.params.attrib_value;
	}
	else {
		var result = '{"message":"Update failed. Please use an unique key. (restaurant_id or _id)", "'+req.params.attrib + '":"' +req.params.attrib_value+'"}';
		res.json(JSON.parse(result));
	}

	var update = {};
	if(req.body.hasOwnProperty('street')) {
		update["address.street"] = req.body.street;
	}
	if(req.body.hasOwnProperty('zipcode')) {
		update["address.zipcode"] = req.body.zipcode;
	}
	if(req.body.hasOwnProperty('building')) {
		update["address.building"] = req.body.building;
	}
	if(req.body.hasOwnProperty('borough')) {
		update["borough"] = req.body.borough;
	}
	if(req.body.hasOwnProperty('cuisine')) {
		update["cuisine"] = req.body.cuisine;
	}
	if(req.body.hasOwnProperty('name')) {
		update["name"] = req.body.name;
	}
	if(req.body.hasOwnProperty('restaurant_id')) {
		update["restaurant_id"] = req.body.restaurant_id;
	}
	if(req.body.hasOwnProperty('lon')) {
		update["address.coord.0"] = req.body.lon;
	}
	if(req.body.hasOwnProperty('lat')) {
		update["address.coord.1"] = req.body.lat;
	}

	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		
		Restaurant.find(criteria,function(err,results){
			if (err) {
				console.log("Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				console.log('Going to Update '+req.params.attrib_value+' in database.');
				res.type('application/json');
				if (results.length ==1) {
					Restaurant.update(criteria,{$set:update},function(err){
						if (err) {
							console.log("Error: " + err.message);
							res.write(err.message);
							db.close();
						}
						else {
							db.close();
							res.json({"message":"update done"});	
						}
					});
				}
				else {
					console.log('Fail to Update '+req.params.attrib_value+' in database. : '+req.params.attrib +' dose not exists');
					var result = '{"message":"update failed. '+req.params.attrib+' does not exists.", "'+
					req.params.attrib+'":"'+req.params.attrib_value+'"}';
					res.json(JSON.parse(result));
					db.close();
				}		
			}
		});
	});
});

app.put('/:attrib/:attrib_value/grade', function(req,res) {
	if(req.params.attrib == "restaurant_id" || req.params.attrib == "_id") {
		var criteria = {};
		criteria[req.params.attrib] = req.params.attrib_value;
	}
	else {
		var result = '{"message":"Update failed. Please use an unique key. (restaurant_id or _id)", "'+req.params.attrib + '":"' +req.params.attrib_value+'"}';
		res.json(JSON.parse(result));
	}

	var date;
	var grade;
	var score;

	if(!req.body.hasOwnProperty('date')) {
    		return res.send('Error 400: Name should be provided in the data.');
	}
	else { date = req.body.date;}
	if(!req.body.hasOwnProperty('grade')) {
    		return res.send('Error 400: Grade should be provided in the data.');
	}
	else { 
		if(checkGrade(req.body.grade)) {
			grade = checkGrade(req.body.grade);
		}
		else {
    			return res.send('Error 400: Grade must be an alphabet in A-F,U.');
		}
	}
	if(!req.body.hasOwnProperty('score')) {
    		return res.send('Error 400: Score should be provided in the data.');
	}
	else { 
		if(isNumeric(req.body.score)){	score = parseInt(req.body.score);}
		else {
    		return res.send('Error 400: Score must be a number.');}
	}

	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		
		Restaurant.find(criteria,function(err,results){
			if (err) {
				console.log("Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				console.log('Going to Update '+req.params.attrib_value+' in database.');
				res.type('application/json');
				if (results.length ==1) {
					Restaurant.findOne(criteria).exec(function(err,results) {
   						results.grades.push( {date:new Date(date),grade:grade,score:score});
   						results.save(function(err) {
   							if (err) {
								console.log("Error: " + err.message);
								res.write(err.message);
								db.close();
							}
							else {
								db.close();
								res.json({"message":"update done"});
							}
  						});
					});
				}
				else {
					console.log('Fail to Update '+req.params.attrib_value+' in database. : '+req.params.attrib +' dose not exists');
					var result = '{"message":"update failed. '+req.params.attrib+' does not exists.", "'+
					req.params.attrib+'":"'+req.params.attrib_value+'"}';
					res.json(JSON.parse(result));
					db.close();
				}		
			}
		});
	});
});

app.delete('/:attrib/:attrib_value/grade', function(req,res) {
	if(req.params.attrib == "restaurant_id" || req.params.attrib == "_id") {
		var criteria = {};
		criteria[req.params.attrib] = req.params.attrib_value;
	}
	else {
		var result = '{"message":"Update failed. Please use an unique key. (restaurant_id or _id)", "'+req.params.attrib + '":"' +req.params.attrib_value+'"}';
		res.json(JSON.parse(result));
	}

	var date;
	var grade;
	var score;

	if(req.body.hasOwnProperty('date')) {
		 date = req.body.date;
	}
	if(req.body.hasOwnProperty('grade')) {
		if(checkGrade(req.body.grade)) {
			grade = checkGrade(req.body.grade);
		}
		else {
    			return res.send('Error 400: Grade must be an alphabet in A-F,U.');
		}
	}
	if(req.body.hasOwnProperty('score')) {
		if(isNumeric(req.body.score)){	score = parseInt(req.body.score);}
		else {
    		return res.send('Error 400: Score must be a number.');}
	}

	mongoose.connect(mongodbURL);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		
		Restaurant.find(criteria,function(err,results){
			if (err) {
				console.log("Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				console.log('Going to Update '+req.params.attrib_value+' in database.');
				res.type('application/json');
				if (results.length ==1) {
					Restaurant.findOne(criteria).exec(function(err,results) {
						if(date&&grade&&score)
   							results.grades.pull( {date:new Date(date),grade:grade,score:score});
   						else if (date&&grade)
   							results.grades.pull( {date:new Date(date),grade:grade});
   						else if(date&&score)
   							results.grades.pull( {date:new Date(date),score:score});
   						else if(grade&&score)
   							results.grades.pull( {grade:grade,score:score});
   						else if(date)
   							results.grades.pull( {date:new Date(date),grade:grade,score:score});
   						else if(grade)
   							results.grades.pull( {date:new Date(date),grade:grade,score:score});
   						else if(score)
   							results.grades.pull( {date:new Date(date),grade:grade,score:score});
   						else {
    							return res.send('Error 400: Date or Grade or Score must be provided in the data.');
   						}
   						results.save(function(err) {
   							if (err) {
								console.log("Error: " + err.message);
								res.write(err.message);
								db.close();
							}
							else {
								db.close();
								res.json({"message":"delete grade done"});
							}
  						});
					});
				}
				else {
					console.log('Fail to Update '+req.params.attrib_value+' in database. : '+req.params.attrib +' dose not exists');
					var result = '{"message":"delete failed. '+req.params.attrib+' does not exists.", "'+
					req.params.attrib+'":"'+req.params.attrib_value+'"}';
					res.json(JSON.parse(result));
					db.close();
				}		
			}
		});
	});
});

app.delete('/:attrib/:attrib_value', function(req,res){
	var criteria = {};
	criteria = getCriteria(req,res,req.params.attrib,req.params.attrib_value,criteria);
	console.log("\ncriteria:\n");
	console.log(criteria);
	mongoose.connect(mongodbURL);
	db = mongoose.connection;
	var restaurant_id = req.params.id;
	//check id already exist or not
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
	var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		Restaurant.find(criteria,function(err,results){
			if (err) {
				console.log("1Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				console.log('Going to delete '+req.params.attrib+' : ' + req.params.attrib_value +' to database.');
				res.type('application/json');
				if (results.length ==1) {
					Restaurant.find(criteria).remove(function(err) {
					if (err) {
						console.log("2Error: " + err.message);
						res.write(err.message);
						db.close();
					}
					else {
						console.log(req.params.attrib + "': "  + req.params.attrib_value + " Removed");
						var message = '{"message":"delete done", "'+req.params.attrib + '":"' +req.params.attrib_value+'"}';
						res.json(JSON.parse(message));
						db.close();
					}
					});
				}
				else {
					console.log('Fail to delete '+req.params.attrib_value+' to database. : ' + req.params.attrib + ' dose not exists');
					var result = '{"message":"delete failed. ' + req.params.attrib + ' does not exists.", "'+req.params.attrib + '":"' +req.params.attrib_value+'"}';
					res.json(JSON.parse(result));
					db.close();
				}		
			}
		});
	});
});

app.delete('/', function(req,res){
	var criteria = {};
	mongoose.connect(mongodbURL);
	db = mongoose.connection;
	var restaurant_id = req.params.id;
	//check id already exist or not
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurant = mongoose.model('Restaurant', restaurantSchema);
		console.log('Going to delete all document in database.');
		res.type('application/json');
		Restaurant.find(criteria).remove(function(err) {
			if (err) {
				console.log("2Error: " + err.message);
				res.write(err.message);
				db.close();
			}
			else {
				console.log("All Documents Removed");
				var message = '{"message":"delete done}';
				res.json(JSON.parse(message));
				db.close();
			}
		});
	});
});

/*
app.get('/reset', function(req,res) {
	var exec = require('child_process').exec;
	exec('mongoimport --db test --collection restaurants --drop --file primer-dataset.json', function(error, stdout, stderr) {
 		console.log('stdout: ', stdout);
 		console.log('stderr: ', stderr);
 		if (error !== null) {
			console.log('exec error: ', error);
		}
		else {
			console.log('Database Resset');
			res.send("Database Resset");
		}
	});
});

app.get('/removeall', function(req,res) {
	var exec = require('child_process').exec;
	exec('mongoimport --db test --collection restaurants --drop --file empty.json', function(error, stdout, stderr) {
 		console.log('stdout: ', stdout);
 		console.log('stderr: ', stderr);
 		if (error !== null) {
			console.log('exec error: ', error);
		}
		else {
			console.log('Database Removed All Documents.');
			res.send("Database Removed All Documents.");
		}
	});
});
*/
app.listen(process.env.PORT || 3000);