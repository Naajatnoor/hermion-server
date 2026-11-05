
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = 8000;

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
    console.error("MongoDB Connection Error:", err);
    throw err;
  }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("socialService");

const createEventCollection = db.collection("createEvent");
const joinEventCollection = db.collection("joinEvent");

// Prevent duplicate joins
await joinEventCollection.createIndex(
  { eventId: 1, userEmail: 1 },
  { unique: true }
);

// CREATE EVENT
// POST: /add-event

app.post("/add-event", async (req, res) => {
  try {
    const result = await createEventCollection.insertOne(req.body);

    res.status(201).send({
      success: true,
      message: "Event created successfully",
      result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to create event",
    });
  }
});


// GET ALL EVENTS
// GET: /createEvent

app.get("/createEvent", async (req, res) => {
  try {
    const result = await createEventCollection.find().toArray();

    res.send(result);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to get events",
    });
  }
});

// GET SINGLE EVENT
// GET: /createEvent/:id

app.get("/createEvent/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid event ID",
      });
    }

    const result = await createEventCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!result) {
      return res.status(404).send({
        message: "Event not found",
      });
    }

    res.send({ result });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to get event",
    });
  }
});


// UPDATE EVENT
// PUT: /update-event/:id


app.put("/update-event/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid event ID",
      });
    }

    const {
      title,
      description,
      eventType,
      eventDate,
      location,
      thumbnail,
    } = req.body;

    if (
      !title ||
      !description ||
      !eventType ||
      !eventDate ||
      !location ||
      !thumbnail
    ) {
      return res.status(400).send({
        message: "All event fields are required",
      });
    }

    const result = await createEventCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          description,
          eventType,
          eventDate,
          location,
          thumbnail,
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Event not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Event updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to update event",
    });
  }
});


// DELETE EVENT
// DELETE: /delete-event/:id


app.delete("/delete-event/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid event ID",
      });
    }

    const result = await createEventCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Event not found",
      });
    }

    // Delete related join records
    await joinEventCollection.deleteMany({
      eventId: id,
    });

    res.status(200).send({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to delete event",
    });
  }
});



// JOIN EVENT
// POST: /join-event

app.post("/join-event", async (req, res) => {
  try {
    const {
      eventId,
      eventTitle,
      eventDate,
      userName,
      userEmail,
    } = req.body;

    if (!eventId || !userEmail) {
      return res.status(400).send({
        message: "Event ID and user email are required",
      });
    }

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).send({
        message: "Invalid event ID",
      });
    }

    const existingEvent = await createEventCollection.findOne({
      _id: new ObjectId(eventId),
    });

    if (!existingEvent) {
      return res.status(404).send({
        message: "Event not found",
      });
    }

    const result = await joinEventCollection.insertOne({
      eventId,
      eventTitle,
      eventDate,
      userName,
      userEmail,
      joinedAt: new Date().toISOString(),
    });

    res.status(201).send({
      success: true,
      message: "Successfully joined event",
      result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).send({
        message: "You have already joined this event",
      });
    }

    console.error(error);

    res.status(500).send({
      message: "Failed to join event",
    });
  }
});

// GET EVENTS JOINED BY A USER
// GET: /my-joined-events/:email

app.get("/my-joined-events/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);

    const result = await joinEventCollection
      .find({ userEmail: email })
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to get joined events",
    });
  }
});

// GET EVENT PARTICIPANTS
// GET: /event-participants/:eventId

app.get("/event-participants/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!ObjectId.isValid(eventId)) {
      return res.status(400).send({
        message: "Invalid event ID",
      });
    }

    const result = await joinEventCollection
      .find({ eventId })
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: " Failed to get participants lists",
    });
  }
});


// LEAVE EVENT
// DELETE: /leave-event

app.delete("/leave-event", async (req, res) => {
  try {
    const { eventId, userEmail } = req.body;

    if (!eventId || !userEmail) {
      return res.status(400).send({
        message: "Event ID and user email are required",
      });
    }

    const result = await joinEventCollection.deleteOne({
      eventId,
      userEmail,
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Join record not found",
      });
    }

    res.send({
      success: true,
      message: "Successfully left the event",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to leave event",
    });
  }
});


// HOME ROUTE
// GET: /
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running fine!",
  });
});


// START SERVER

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

export default app;
