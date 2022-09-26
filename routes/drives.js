var express = require('express');
var router = express.Router();
var {MileageDB} = require('../mongo.js')
const { uuid } = require('uuidv4');
var dotenv = require('dotenv')
var jwt = require('jsonwebtoken')
dotenv.config()
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// {
//   "_id": {
//     "$oid": "6330b408c8e3b86dd96937df"
//   },
//   "tripId": "d61096ae-6dfa-419e-8897-fa082e62ab22",
//   "userId": "27b2bbff-bf05-4421-8558-6a5a8e07246c",
//   "date": "2022-09-25T19:52:53.251Z",
//   "origin": "SoHo, Manhattan, New York, NY, USA",
//   "destination": "Staten Island Ferry, Staten Island, NY, USA",
//   "mileage": 23921,
//   "tolls": 50,
//   "parking": 6
// }

//view trips by specific user(list)
router.get('/view-drives',async (req,res)=> {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;
  //  const token = req.headers.authorization.slice(7)
  const token = req.headers.token;
  // console.log("token",token)
  const verified = jwt.verify(token,jwtSecretKey)
  if(!verified) {
    return res.json({success:false})
  }
  try {
    let sortOrder = req.query.sortOrder;
    if(sortOrder === "asc") {
      sortOrder = 1
    } else if (sortOrder === 'desc') {
      sortOrder = -1
    }
    let sortField = req.query.sortField;
    
    let sortObj = {}
    //if both exist
    if(sortField && sortOrder) {
      sortObj = {[sortField]:sortOrder}
    }
    const userId = verified.data.id
    const collection = await MileageDB().collection('drives')
    
    //find by user and sort by
    const userData = await collection.find({userId})
      .sort(sortObj)
      .toArray()
    console.log("get(view-drives)",userData)
    res.json({success:true,message:userData})
  } catch (error) {
    res.json({success:false,message:String(error)})
  }
})
//add a trip
router.post('/log-drive',async (req,res) => {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;
  //  const token = req.headers.authorization.slice(7)
  const token = req.headers.token;
  // console.log("token",token)
  const verified = jwt.verify(token, jwtSecretKey);
  console.log("post/log-drive",verified)
  if(!verified) {
    return res.json({ success: false});
  }
  try {
    const {date,origin,destination,mileage,tolls,parking} = req.body
    const userId = verified.data.id
    const collection = await MileageDB().collection('drives')
    const trip = {
      tripId:uuid(),
      userId,
      date,
      origin,
      destination,
      mileage:Number(mileage)
    }
    tolls && (trip.tolls = Number(tolls))
    parking && (trip.parking = Number(parking))
    
    await collection.insertOne(trip)
    res.json({success:true,message:"added post"})
  } catch (error) {
    res.json({success:false,message:String(error)})
  }
  
})

module.exports = router;