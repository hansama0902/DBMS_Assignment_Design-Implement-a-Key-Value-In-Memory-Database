import express from "express";
import { MongoClient } from "mongodb";
import redis from "redis";

const router = express.Router();

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "patient_management";

// Create Redis client
let redisClient;
const initializeRedisClient = async () => {
  redisClient = redis.createClient();
  redisClient.on("error", (err) => console.error("Redis Client Error:", err));
  await redisClient.connect();
};
initializeRedisClient().catch(console.error);

// Add Patient
router.post("/add", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("patients");
    const patient = req.body;

    // Check patient_id
    if (!patient.patient_id) {
      return res.status(400).send("Error: Patient ID is required");
    }

    // Check if patient_id already exists in MongoDB
    const existingPatient = await collection.findOne({ _id: patient.patient_id });
    if (existingPatient) {
      return res.status(400).send("Error: Patient ID already exists");
    }

    // Insert patient information into MongoDB
    await collection.insertOne({
      _id: patient.patient_id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      phone: patient.phone,
      DOB: patient.DOB,
      address: patient.address,
      gender: patient.gender,
      disease_history: patient.disease_history || [],
    });

    // Renew patient list cache
    const patientWithId = {
      _id: patient.patient_id,
      ...patient
    };
    // Set patient in Redis
    await redisClient.set(`patient:${patient.patient_id}`, JSON.stringify(patientWithId), { EX: 300 });

    // Delete patient list cache to refresh it
    await redisClient.del('patients::');
    res.redirect('/');
  } catch (err) {
    console.error("Error adding patient:", err);
    res.status(500).send("Database error occurred");
  }
});

// Get patient list
router.get("/", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("patients");
    const query = {};

    if (req.query.id) {
      query._id = { $regex: req.query.id, $options: 'i' };
    }
    if (req.query.number) {
      query.phone = { $regex: req.query.number, $options: 'i' };
    }

    const cacheKey = `patients:${req.query.id || ''}:${req.query.number || ''}`;
    
    // Check if patient list is cached
    const cachedPatients = await redisClient.get(cacheKey);
    if (cachedPatients) {
      console.log("Using cached data");
      return res.render('patients', { res: JSON.parse(cachedPatients) });
    }

    // If not cached, get from MongoDB
    const patients = await collection.find(query).toArray();

    // Cache the patient list
    await redisClient.set(cacheKey, JSON.stringify(patients), { EX: 300 }); // Cache for 5 minutes
    console.log("Using data from MongoDB and setting cache");
    res.render('patients', { res: patients });
  } catch (err) {
    console.error("error in get /patients", err);
    res.status(500).send("DB error");
  }
});

// Delete patient
router.get("/delete", async (req, res) => {
  try {
    const db = client.db(dbName);
    const patientCollection = db.collection("patients");
    const patientId = req.query.id;

    // Delete patient from MongoDB
    await patientCollection.deleteOne({ _id: patientId });

    // Delete patient from Redis
    await redisClient.del(`patient:${patientId}`);

    // Delete patient list cache
    await redisClient.del('patients::');
    await redisClient.del('diseaseHistory::');

    // Return status
    res.json({ delstatus: 1 });
  } catch (err) {
    console.error("error in delete", err);
    res.status(500).send("DB error");
  }
});

// Edit Patient Page
router.get("/editPage", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("patients");
    const patientId = req.query.patient_id;

    // Make sure patientId is provided
    if (!patientId) {
      return res.status(400).send("Patient ID is required");
    }

    // Check if patient exists in cache
    const cachedPatient = await redisClient.get(`patient:${patientId}`);
    if (cachedPatient) {
      const patient = JSON.parse(cachedPatient);
      if (!patient || !patient._id) {
        await redisClient.del(`patient:${patientId}`);
      } else {
        return res.render("editPage", { patientObj: patient });
      }
    }

    // Get patient information from MongoDB
    const patient = await collection.findOne({ _id: patientId });
    if (patient) {
      // Cache patient information in Redis
      await redisClient.set(`patient:${patientId}`, JSON.stringify(patient), { EX: 300 }); // Set TTL to 300 seconds
      return res.render("editPage", { patientObj: patient });
    } else {
      return res.status(404).send("Patient not found");
    }
  } catch (err) {
    console.error("Error retrieving patient for edit:", err);
    return res.status(500).send("Database error occurred");
  }
});

// Update Patient Information
router.post("/updatePatient", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("patients");
    const updatedPatient = req.body;

    // Ensure patient_id is valid
    if (!updatedPatient.patient_id) {
      return res.status(400).send("Patient ID is required");
    }

    // Update patient information in MongoDB
    await collection.updateOne(
      { _id: updatedPatient.patient_id },
      { $set: updatedPatient }
    );

    // Update patient information in Redis cache
    await redisClient.set(`patient:${updatedPatient.patient_id}`, JSON.stringify(updatedPatient), { EX: 300 });

    // Delete patient list cache in Redis to refresh it next time
    await redisClient.del('patients::');
    res.redirect('/');
  } catch (err) {
    console.error("Error updating patient information:", err);
    return res.status(500).send("Database error");
  }
});

// Edit Disease History Page
router.get("/editDiseaseHistory", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("patients");

    // History ID
    const historyId = req.query.history_id;

    // Try to get patient information from Redis cache
    const cachedPatient = await redisClient.get(`patient:${req.query.patient_id}`);
    if (cachedPatient) {
      const patient = JSON.parse(cachedPatient);
      const history = patient.disease_history.find((h) => h._id === historyId);
      if (history) {
        return res.render("editHistory", { historyObj: history });
      } else {
        return res.status(404).send("Disease History not found");
      }
    }

    // If cache is not available, get data from MongoDB
    const patient = await collection.findOne({ "disease_history._id": historyId });
    if (patient) {
      // Cache patient information in Redis
      await redisClient.set(`patient:${patient._id}`, JSON.stringify(patient), { EX: 300 }); // Set TTL to 300 seconds
      const history = patient.disease_history.find((h) => h._id === historyId);
      if (history) {
        return res.render("editHistory", { historyObj: history });
      } else {
        return res.status(404).send("Disease History not found");
      }
    } else {
      return res.status(404).send("Patient not found");
    }
  } catch (err) {
    console.error("Error retrieving Disease History for edit:", err);
    res.status(500).send("Database error occurred");
  }
});

// Update Disease History
router.post("/updateDiseaseHistory", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("patients");
    const { history_id, patient_id, diseases_name } = req.body;

    // Update specific disease history record in MongoDB
    await collection.updateOne(
      { _id: patient_id, "disease_history._id": history_id },
      { $set: { "disease_history.$.diseases_name": diseases_name } }
    );

    // Delete all related caches
    await redisClient.del(`diseaseHistory::`); // Delete patient list cache
    res.redirect('/DiseaseHistory'); // Force page refresh
  } catch (err) {
    console.error("Error updating disease history:", err);
    res.status(500).send("Database error occurred");
  }
});

// Delete Disease History
router.get("/delDiseaseHistory", async (req, res) => {
  try {
    const db = client.db(dbName);
    const patientCollection = db.collection("patients");
    const historyId = req.query.id;

    // Delete disease history record from MongoDB
    await patientCollection.updateOne(
      { "disease_history._id": historyId },
      { $pull: { disease_history: { _id: historyId } } }
    );

    // Delete all related caches
    await redisClient.del(`diseaseHistory::`); // Delete patient list cache

    res.json({ delstatus: 1 });
  } catch (err) {
    console.error("Error deleting disease history:", err);
    res.status(500).send("Database error occurred");
  }
});

// Add Disease History
router.post("/addDiseaseHistory", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("patients");
    const history = req.body;

    // Ensure disease_history is an array
    const existingPatient = await collection.findOne({ _id: history.patient_id });
    if (existingPatient && !Array.isArray(existingPatient.disease_history)) {
      await collection.updateOne(
        { _id: history.patient_id },
        { $set: { disease_history: [] } }
      );
    }

    // Check if the same history ID already exists
    const historyExists = await collection.findOne({ "disease_history._id": history._id });
    if (historyExists) {
      return res.status(400).send("Error: History ID already exists");
    }

    // Insert history record into the patient's disease_history array
    const updateResult = await collection.updateOne(
      { _id: history.patient_id },
      {
        $push: {
          disease_history: {
            _id: history._id,
            patient_id: history.patient_id,
            diseases_name: history.diseases_name,
          },
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).send("Error: Patient ID not found");
    }

    // Delete all related caches
    await redisClient.del(`diseaseHistory::`); // Delete patient list cache

    res.redirect('/DiseaseHistory'); // Force page refresh
  } catch (err) {
    console.error("Error adding disease history:", err);
    res.status(500).send("Database error occurred");
  }
});

// Get Disease History
router.get("/DiseaseHistory", async (req, res) => {
  try {
    const db = client.db(dbName);
    const patientCollection = db.collection("patients");
    const historyQuery = {};
    console.log(req.query);

    if (req.query.Id) {
      historyQuery["disease_history._id"] = req.query.Id;
      console.log(historyQuery);
    }
    if (req.query.patientId) {
      historyQuery["disease_history.patient_id"] = req.query.patientId;
      console.log(historyQuery);
    }

    const cacheKey = `diseaseHistory:${req.query.Id || ''}:${req.query.patientId || ''}`;
    // Try to get disease history from Redis cache
    const cachedHistory = await redisClient.get(cacheKey);
    if (cachedHistory) {
      console.log("Using cached disease history data");
      return res.render('diseasesHistory', { res: JSON.parse(cachedHistory) });
    }

    // Get patient data from MongoDB
    const patients = await patientCollection.find(historyQuery).toArray();

    // Extract matching disease history records
    patients.forEach(patient => {
      if (patient.disease_history && Array.isArray(patient.disease_history)) {
        patient.disease_history = patient.disease_history.filter(disease => 
          (!req.query.Id || disease._id === req.query.Id) &&
          (!req.query.patientId || disease.patient_id === req.query.patientId)
        );
      }
    });

    // Cache disease history in Redis
    await redisClient.set(cacheKey, JSON.stringify(patients), { EX: 300 });

    res.render('diseasesHistory', { res: patients });
  } catch (err) {
    console.error("Error retrieving disease history:", err);
    res.status(500).send("Database error occurred");
  }
});

export default router;

