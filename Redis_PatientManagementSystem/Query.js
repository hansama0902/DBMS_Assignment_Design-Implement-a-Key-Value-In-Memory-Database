import { createClient } from 'redis';
import { MongoClient, ObjectId } from 'mongodb';

const redisClient = createClient();

const uri = "mongodb://localhost:27017";
let mongoClient;

async function initializeClients() {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");
    await redisClient.flushAll();
    console.log("All Redis databases cleared");

    await redisClient.select(0);
    console.log("Using Redis database 0");

    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error during client initialization:", err);
    process.exit(1);
  }
}

async function cachePatientInfo(patientId) {
  try {
    console.log(`Attempting to get patient info for ID: ${patientId} from Redis...`);

    const redisKey = `patient:${patientId}`;
    const result = await redisClient.hGetAll(redisKey);

    if (Object.keys(result).length > 0) {
      console.log("Retrieved from Redis:", result);
    } else {
      console.log("Not found in Redis, retrieving from MongoDB...");

      const db = mongoClient.db("patient_management");
      const collection = db.collection("patients");

      const query = ObjectId.isValid(patientId) && patientId.length === 24
        ? { _id: new patientId }
        : { _id: patientId };

      console.log("Querying MongoDB with:", query);
      const patient = await collection.findOne(query);

      if (patient) {
        console.log("Patient found in MongoDB:", patient);
        await redisClient.hSet(redisKey, {
          first_name: patient.first_name || "",
          last_name: patient.last_name || "",
          phone: patient.phone || "",
          DOB: patient.DOB || "",
          address: patient.address || "",
          gender: patient.gender || "",
        });
        console.log("Cached in Redis:", patient);
      } else {
        console.log("Patient not found in MongoDB.");
      }
    }
  } catch (err) {
    console.error("Error in cachePatientInfo:", err);
  }
}

async function setPatientOnlineStatus(patientId, isOnline) {
  try {
    const redisKey = `onlineStatus:${patientId}`;
    const status = isOnline ? "true" : "false";
    await redisClient.set(redisKey, status, { EX: 60 * 60 });
    console.log(`Patient ${patientId} online status set to ${status}`);
  } catch (err) {
    console.error("Error in setPatientOnlineStatus:", err);
  }
}

async function checkPatientOnlineStatus(patientId) {
  try {
    const redisKey = `onlineStatus:${patientId}`;
    const isOnline = await redisClient.get(redisKey);
    console.log(`Patient ${patientId} is online:`, isOnline === "true");
    return isOnline === "true";
  } catch (err) {
    console.error("Error in checkPatientOnlineStatus:", err);
    return false;
  }
}

async function cacheDiseaseHistory(patientId) {
  try {
    console.log(`Attempting to get disease history for ID: ${patientId} from Redis...`);

    const db = mongoClient.db("patient_management");
    const collection = db.collection("patients");

    const query = ObjectId.isValid(patientId) && patientId.length === 24
      ? { _id: new patientId }
      : { _id: patientId };

    const patient = await collection.findOne(query);

    if (patient?.disease_history) {
      console.log("Disease history found in MongoDB:", patient.disease_history);

      for (const disease of patient.disease_history) {
        const redisKey = `diseaseHistory:${patientId}:${disease._id}`;
        await redisClient.hSet(redisKey, {
          diseases_name: disease.diseases_name,
          patient_id: patientId,
        });
        console.log(`Cached disease history with ID ${disease._id} in Redis.`);
      }
    } else {
      console.log("Disease history not found in MongoDB.");
    }
  } catch (err) {
    console.error("Error in cacheDiseaseHistory:", err);
  }
}

async function addPendingTest(patientId, testName) {
  try {
    const redisKey = `pendingTests:${patientId}`;
    await redisClient.lPush(redisKey, testName);
    console.log(`Added pending test "${testName}" for patient ${patientId}`);
  } catch (err) {
    console.error("Error in addPendingTest:", err);
  }
}

async function getPendingTests(patientId) {
  try {
    const redisKey = `pendingTests:${patientId}`;
    const pendingTests = await redisClient.lRange(redisKey, 0, -1);
    console.log(`Pending tests for patient ${patientId}:`, pendingTests);
    return pendingTests;
  } catch (err) {
    console.error("Error in getPendingTests:", err);
    return [];
  }
}

async function main() {
  await initializeClients();
  const patientId = "000002";

  await cachePatientInfo(patientId);
  await setPatientOnlineStatus(patientId, true);
  await checkPatientOnlineStatus(patientId);
  await cacheDiseaseHistory(patientId);
  await addPendingTest(patientId, "Blood Test");
  await addPendingTest(patientId, "X-Ray");
  await getPendingTests(patientId);
  await mongoClient.close();
  await redisClient.disconnect();
  console.log("Clients disconnected, program ended.");
}

main().catch((err) => {
  console.error("Error during execution:", err);
  process.exit(1);
});

