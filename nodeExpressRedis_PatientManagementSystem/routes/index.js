
const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");
const redis = require("redis");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "patient_management";

// Create Redis client
const redisClient = redis.createClient();
redisClient.connect();

// Add Patient
router.post("/add", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("patients");
    const patient = req.body;

    // 检查是否提供了patient_id
    if (!patient.patient_id) {
      return res.status(400).send("Error: Patient ID is required");
    }

    // 检查MongoDB中是否已经存在相同的patient_id
    const existingPatient = await collection.findOne({ _id: patient.patient_id });
    if (existingPatient) {
      return res.status(400).send("Error: Patient ID already exists");
    }

    // 插入患者信息到MongoDB
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

    // 更新 Redis 缓存中的患者信息
    const patientWithId = {
      _id: patient.patient_id,
      ...patient
    };
    // set patient in redis
    await redisClient.set(`patient:${patient.patient_id}`, JSON.stringify(patientWithId), { EX: 300 });

    // 删除患者列表缓存，确保前端下次获取的是最新数据
    await redisClient.del('patients::');

    res.redirect('/');
  } catch (err) {
    console.error("Error adding patient:", err);
    res.status(500).send("Database error occurred");
  }
});

// 获取患者列表
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
    
    // 检查Redis缓存
    const cachedPatients = await redisClient.get(cacheKey);
    if (cachedPatients) {
      console.log("Using cached data");
      return res.render('patients', { res: JSON.parse(cachedPatients) });
    }

    // 如果缓存不可用，从MongoDB获取数据
    const patients = await collection.find(query).toArray();

    // 将数据缓存到Redis
    await redisClient.set(cacheKey, JSON.stringify(patients), { EX: 300 }); // 缓存300秒
    console.log("Using data from MongoDB and setting cache");
    res.render('patients', { res: patients });
  } catch (err) {
    console.error("获取患者信息出错：", err);
    res.status(500).send("数据库错误");
  }
});

// 删除患者信息
router.get("/delete", async (req, res) => {
  try {
    const db = client.db(dbName);
    const patientCollection = db.collection("patients");
    const patientId = req.query.id;

    // 从MongoDB中删除患者信息
    await patientCollection.deleteOne({ _id: patientId });

    // 从Redis缓存中删除患者信息
    await redisClient.del(`patient:${patientId}`);

    // 确保从Redis中删除患者列表缓存
    await redisClient.del('patients::');
    await redisClient.del('diseaseHistory::');

    // 返回删除状态
    res.json({ delstatus: 1 });
  } catch (err) {
    console.error("删除患者信息出错：", err);
    res.status(500).send("数据库错误");
  }
});

// Edit Patient Page
router.get("/editPage", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("patients");
    const patientId = req.query.patient_id;

    // 确保patientId有效
    if (!patientId) {
      return res.status(400).send("Patient ID is required");
    }

    // 检查Redis缓存
    const cachedPatient = await redisClient.get(`patient:${patientId}`);
    if (cachedPatient) {
      const patient = JSON.parse(cachedPatient);
      if (!patient || !patient._id) {
        return res.status(400).send("Invalid patient data in cache");
      }
      return res.render("editPage", { patientObj: patient });
    }

    // 从MongoDB获取患者信息
    const patient = await collection.findOne({ _id: patientId });
    if (patient) {
      // 将患者信息缓存到Redis
      await redisClient.set(`patient:${patientId}`, JSON.stringify(patient), { EX: 300 }); // 设置TTL为300秒
      return res.render("editPage", { patientObj: patient });
    } else {
      return res.status(404).send("Patient not found");
    }
  } catch (err) {
    console.error("Error retrieving patient for edit:", err);
    return res.status(500).send("Database error occurred");
  }
});

// 更新患者信息
router.post("/updatePatient", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("patients");
    const updatedPatient = req.body;

    // 确保patient_id有效
    if (!updatedPatient.patient_id) {
      return res.status(400).send("Patient ID is required");
    }

    // 更新MongoDB中的患者信息
    await collection.updateOne(
      { _id: updatedPatient.patient_id },
      { $set: updatedPatient }
    );

    // 更新Redis缓存中的患者信息
    await redisClient.set(`patient:${updatedPatient.patient_id}`, JSON.stringify(updatedPatient), { EX: 300 });

    // 删除Redis中的患者列表缓存，以便下次重新获取最新数据
    await redisClient.del('patients::');

    res.redirect('/');
  } catch (err) {
    console.error("更新患者信息出错：", err);
    return res.status(500).send("数据库错误");
  }
});  
// Edit Disease History Page
router.get("/editDiseaseHistory", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection("patients");

    // history_id
    const historyId = req.query.history_id;

    // 尝试从Redis缓存中获取患者信息
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

    // 如果缓存不可用，从MongoDB获取数据
    const patient = await collection.findOne({ "disease_history._id": historyId });
    if (patient) {
      // 将患者信息缓存到Redis
      await redisClient.set(`patient:${patient._id}`, JSON.stringify(patient), { EX: 300 }); // 设置TTL为300秒
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

    // 更新MongoDB中的特定疾病历史记录
    await collection.updateOne(
      { _id: patient_id, "disease_history._id": history_id },
      { $set: { "disease_history.$.diseases_name": diseases_name } }
    );

    // 删除所有相关的缓存
    await redisClient.del(`diseaseHistory::`); // 删除患者列表缓存
    res.redirect('/DiseaseHistory'); // 强制刷新页面
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

    // 从MongoDB中删除疾病历史记录
    await patientCollection.updateOne(
      { "disease_history._id": historyId },
      { $pull: { disease_history: { _id: historyId } } }
    );

    // 删除所有相关的缓存
    await redisClient.del(`diseaseHistory::`); // 删除患者列表缓存

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

    // 确保disease_history是一个数组
    const existingPatient = await collection.findOne({ _id: history.patient_id });
    if (existingPatient && !Array.isArray(existingPatient.disease_history)) {
      await collection.updateOne(
        { _id: history.patient_id },
        { $set: { disease_history: [] } }
      );
    }

    // 检查是否已经存在相同的历史记录ID
    const historyExists = await collection.findOne({ "disease_history._id": history._id });
    if (historyExists) {
      return res.status(400).send("Error: History ID already exists");
    }

    // 将历史记录插入到患者的disease_history数组中
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

    // 删除所有相关的缓存
    await redisClient.del(`diseaseHistory::`); // 删除患者列表缓存

    res.redirect('/DiseaseHistory'); // 强制刷新页面
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
    // 尝试从Redis缓存中获取疾病历史记录
    const cachedHistory = await redisClient.get(cacheKey);
    if (cachedHistory) {
      console.log("Using cached disease history data");
      return res.render('diseasesHistory', { res: JSON.parse(cachedHistory) });
    }

    // 从MongoDB获取患者数据
    const patients = await patientCollection.find(historyQuery).toArray();

    // 提取符合条件的疾病历史记录
    patients.forEach(patient => {
      if (patient.disease_history && Array.isArray(patient.disease_history)) {
        patient.disease_history = patient.disease_history.filter(disease => 
          (!req.query.Id || disease._id === req.query.Id) &&
          (!req.query.patientId || disease.patient_id === req.query.patientId)
        );
      }
    });

    // 缓存疾病历史记录到Redis
    await redisClient.set(cacheKey, JSON.stringify(patients), { EX: 300 });

    res.render('diseasesHistory', { res: patients });
  } catch (err) {
    console.error("Error retrieving disease history:", err);
    res.status(500).send("Database error occurred");
  }
});

module.exports = router;
