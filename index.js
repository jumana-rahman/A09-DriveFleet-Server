const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const dotenv = require('dotenv');
const cors = require("cors");
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const uri = process.env.MONGODB_URI;

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = (req, res, next) => {
  console.log(`${req.method} | ${req.url}`);
  next();
}

const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;
  // console.log(req.headers, 'from verify token');
  const token = authorization?.split(" ")[1];
  console.log(token)
  
  if(!token){
    return res.status(401).json({message: 'Unauthorized'});
  }

   try {
    const JWKS = createRemoteJWKSet(
      new URL('http://localhost:3000/api/auth/jwks')
    )
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;

    next();
  } catch (error) {
    console.error('Token validation failed:', error)
    return res.status(401).json({message: 'Unauthorized'});
  }

  
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const db = client.db("drivefleetdb");
    const carsCollection = db.collection("cars");
    const bookingCollection = db.collection("bookings");

    app.get("/my-cars", verifyToken, async (req, res) => {
      try {
        const userId = req.user?.sub || req.user?.id;

        const cars = await carsCollection
          .find({ userId })
          .toArray();

        res.send(cars);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch cars" });
      }
    });

    app.get("/cars", async (req, res) => {

      const { search, type } = req.query;

      let query = {};

      // SEARCH
      if (search) {
        query.carName = {
          $regex: search,
          $options: "i",
        };
      }

      // FILTER
      if (type && type !== "All") {
        query.carType = type;
      }

      const result = await carsCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/available", async(req, res) => {
        const cursor = carsCollection.find( { availability: "Available" } ).limit(6);
        const result = await cursor.toArray();
        // console.log(result);
        res.send(result);
    });

    app.get("/cars/:id", logger, verifyToken, async(req, res) => {
        const {id} = req.params;
        // console.log(id);
        const query = {_id: new ObjectId(id)};
        const result = await carsCollection.findOne(query);
        res.send(result);

    });

    app.post("/cars", verifyToken, async (req, res) => {
      try {
        const car = req.body;

        car.userId = req.user?.sub || req.user?.id;
        car.createdAt = new Date();

        const result = await carsCollection.insertOne(car);

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to add car" });
      }
    });

    app.delete("/cars/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;

        const result = await carsCollection.deleteOne({
          _id: new ObjectId(id),
          userId: req.user?.sub || req.user?.id, // IMPORTANT: only owner can delete
        });

        if (result.deletedCount === 0) {
          return res.status(403).json({ message: "Not authorized or not found" });
        }
          res.send({ message: "Car deleted successfully" });
      } catch (error) {
          res.status(500).json({ message: "Failed to delete car" });
        }
    });

    app.patch("/cars/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;

        const updatedData = req.body;

        const result = await carsCollection.updateOne(
          {
            _id: new ObjectId(id),
            userId: req.user?.sub || req.user?.id,
          },
          {
            $set: {
              dailyRentPrice: updatedData.dailyRentPrice,
              description: updatedData.description,
              availability: updatedData.availability,
              image: updatedData.image,
              carType: updatedData.carType,
              pickupLocation: updatedData.pickupLocation,
              updatedAt: new Date(),
            },
          }
        );

        res.send(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to update car" });
      }
    });

    app.get("/booking/:userId", verifyToken, async (req, res) => {
      const {userId} = req.params;
      const result = await bookingCollection.find({userId: userId}).toArray();
      res.send(result);
    });

    app.patch("/booking/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;

        const bookingData = req.body;

        const car = await carsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!car) {
          return res.status(404).json({
            message: "Car not found",
          });
        }

        await carsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $inc: {
              bookingCount: 1,
            },
            $set: {
              lastBookingAt: new Date(),
            },
          }
        );

        const result = await bookingCollection.insertOne({
          userId: bookingData.userId,
          userName: bookingData.userName,
          userEmail: bookingData.userEmail,

          carId: id,
          carName: car.carName,
          image: car.image,
          carType: car.carType,
          pickupLocation: car.pickupLocation,
          dailyRentPrice: car.dailyRentPrice,
          seatCapacity: car.seatCapacity,
          availability: car.availability,

          driverNeeded: bookingData.driverNeeded,
          specialNote: bookingData.specialNote,

          bookedAt: new Date(),
        });

        res.send(result);

      } catch (error) {
        console.log(error);

        res.status(500).json({
          message: "Booking failed",
        });
      }
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
