
import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const client = new MongoClient(process.env.MONGODB_URL);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
   const mongoClient = await connectToMongoDB();
const db = mongoClient.db("socialService");
const createEventCollection = db.collection("createEvent");

// app.post("/add-event", (req, res) => {
//   const data = req.body;
//   const result = createEventCollection.insertOne(data);
//   res.send(result);
// });

// app.get("/createEvent", async (req, res) => {
//   const result = await createEventCollection.find().toArray();
//   res.send(result);
// });


app.post("/add-event", async (req, res) => {
  try {
    const data = req.body;

    const result = await createEventCollection.insertOne(data);

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to create event",
    });
  }
});

app.get("/createEvent", async (req, res) => {
  try {
    const result = await createEventCollection.find().toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to get events",
    });
  }
});



// Home Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running fine!",
  });
});


    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });





export default app;
