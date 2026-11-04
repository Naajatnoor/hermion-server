
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
    await connectToMongoDB();

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
