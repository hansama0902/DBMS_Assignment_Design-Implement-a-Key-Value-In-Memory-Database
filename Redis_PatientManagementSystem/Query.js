const { createClient } = require('redis');
const { MongoClient, ObjectId } = require('mongodb');

// 创建 Redis 客户端
const redisClient = createClient();

// MongoDB 连接 URI
const uri = "mongodb://localhost:27017";
let mongoClient;

async function initializeClients() {
  try {
    // 连接 Redis
    await redisClient.connect();
    console.log("Connected to Redis");

    // 清空 Redis 所有逻辑数据库
    await redisClient.flushAll();
    console.log("All Redis databases cleared");

    // 选择 Redis 的逻辑数据库 0
    await redisClient.select(0);
    console.log("Using Redis database 0");
    // 连接 MongoDB
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error during client initialization:", err);
    process.exit(1); // 如果初始化失败，退出程序
  }
}
// 缓存患者（作为用户）信息
async function cachePatientInfo(patientId) {
  try {
    console.log(`Attempting to get patient info for ID: ${patientId} from Redis...`);

    const redisKey = `patient:${patientId}`;
    // 从 Redis 检索数据
    const result = await redisClient.hGetAll(redisKey);

    if (Object.keys(result).length > 0) {
      console.log("Retrieved from Redis:", result);
    } else {
      console.log("Not found in Redis, retrieving from MongoDB...");

      const db = mongoClient.db("patient_management");
      const collection = db.collection("patients");

      // 检查 _id 的类型，确保与数据库中的数据一致
      let query;
      if (ObjectId.isValid(patientId) && patientId.length === 24) {
        query = { _id: new ObjectId(patientId) }; // MongoDB 使用 ObjectId 类型
      } else {
        query = { _id: patientId }; // 假设 _id 是字符串
      }

      console.log("Querying MongoDB with:", query);
      const patient = await collection.findOne(query);
      console.log("Query result from MongoDB:", patient);

      if (patient) {
        console.log("Patient found in MongoDB:", patient);
        const response = await redisClient.hSet(redisKey, {
          first_name: patient.first_name || "",
          last_name: patient.last_name || "",
          phone: patient.phone || "",
          DOB: patient.DOB || "",
          address: patient.address || "",
          gender: patient.gender || "",
        });
        console.log("Redis HSET response:", response);
        console.log("Cached in Redis:", patient);
      } else {
        console.log("Patient not found in MongoDB.");
      }
    }
  } catch (err) {
    console.error("Error in cachePatientInfo:", err);
  }
}

// 设置患者在线状态
async function setPatientOnlineStatus(patientId, isOnline) {
  try {
    const redisKey = `onlineStatus:${patientId}`;
    const status = isOnline ? "true" : "false";
    await redisClient.set(redisKey, status, { EX: 60 * 60 }); // 在线状态有效期为 1 小时
    console.log(`Patient ${patientId} online status set to ${status}`);
  } catch (err) {
    console.error("Error in setPatientOnlineStatus:", err);
  }
}

// 检查患者在线状态
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

// 缓存每个疾病历史为单独的 Redis 哈希表
async function cacheDiseaseHistory(patientId) {
  try {
    console.log(`Attempting to get disease history for ID: ${patientId} from Redis...`);

    const db = mongoClient.db("patient_management");
    const collection = db.collection("patients");

    // 检查 _id 的类型，确保与数据库中的数据一致
    let query;
    if (ObjectId.isValid(patientId) && patientId.length === 24) {
      query = { _id: new patientId }; // MongoDB 使用 ObjectId 类型
    } else {
      query = { _id: patientId }; // 假设 _id 是字符串
    }

    console.log("Querying MongoDB with:", query);
    const patient = await collection.findOne(query);
    console.log("Query result from MongoDB:", patient);

    if (patient && patient.disease_history) {
      console.log("Disease history found in MongoDB:", patient.disease_history);

      // 将每个疾病历史存储为独立的 Redis 哈希表
      for (let disease of patient.disease_history) {
        const redisKey = `diseaseHistory:${patientId}:${disease._id}`;
        const response = await redisClient.hSet(redisKey, {
          diseases_name: disease.diseases_name,
          patient_id: patientId,
        });
        console.log(`Cached disease history with ID ${disease._id} in Redis:`, {
          diseases_name: disease.diseases_name,
          patient_id: patientId,
        });
        console.log("Redis HSET response for disease:", response);
      }

    } else {
      console.log("Disease history not found in MongoDB.");
    }
  } catch (err) {
    console.error("Error in cacheDiseaseHistory:", err);
  }
}

// 添加待办测试到患者队列
async function addPendingTest(patientId, testName) {
  try {
    const redisKey = `pendingTests:${patientId}`;
    await redisClient.lPush(redisKey, testName);
    console.log(`Added pending test "${testName}" for patient ${patientId}`);
  } catch (err) {
    console.error("Error in addPendingTest:", err);
  }
}

// 获取患者的所有待办测试
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

// 主程序入口
async function main() {
  await initializeClients();
  const patientId = "000002"; // 假设这是患者的 ID

  // 缓存患者信息（作为用户信息）和疾病历史
  await cachePatientInfo(patientId);

  // 设置患者在线状态为 "true"
  await setPatientOnlineStatus(patientId, true);

  // 检查患者是否在线
  await checkPatientOnlineStatus(patientId);

  // 缓存患者的疾病历史
  await cacheDiseaseHistory(patientId);

  // 添加待办测试到患者队列
  await addPendingTest(patientId, "Blood Test");
  await addPendingTest(patientId, "X-Ray");

  // 获取患者的所有待办测试
  await getPendingTests(patientId);

  // 关闭客户端
  await mongoClient.close();
  await redisClient.disconnect();
  console.log("Clients disconnected, program ended.");
}

// 执行程序
main().catch((err) => {
  console.error("Error during execution:", err);
  process.exit(1);
});

