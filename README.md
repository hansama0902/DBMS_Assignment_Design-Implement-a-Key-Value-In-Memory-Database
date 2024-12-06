# Project III: Redis-focused Assignment

This project is focused on leveraging **Redis** for various functionalities, divided into three main parts:

1. **Redis Data Structure Implementation**: Simulating an online user management system using Redis data structures. This includes documentation of the Redis commands used.
2. **Node.js Implementation with Redis**: Developing a Node.js project, named `Redis_PatientManagementSystem`, which uses Redis as the primary data store for patient management. 
3. **Node.js Implementation with Redis and MongoDB**: Integrating with a Node + Express + MongoDB application called `nodeExpressRedis_PatientManagementSystem`, which supports creating, displaying, modifying, and deleting data that represents at least one of the Redis data structures described in the previous part.

## MongoDB Backup and Restore Guide

We can use the `mongodump` command to export a MongoDB database. For example, the following command exports the `patient_management` database to the `backup` directory on the desktop:

```bash
mongodump --db patient_management --out ~/Desktop/backup/
```

- `--db patient_management`: Specifies the name of the database to export.
- `--out ~/Desktop/backup/`: Specifies the path where the export files will be saved.

After running this command, the `patient_management` database will be exported to the `~/Desktop/backup/patient_management` directory, generating files including `.bson` and `.metadata.json`.

To restore a MongoDB database from the previously exported files, you can use the `mongorestore` command. For example, to restore the `patient_management` database from the backup directory on the desktop:

```bash
mongorestore --dir ~/Desktop/backup/patient_management
```

- `--dir ~/Desktop/backup/patient_management`: Specifies the directory path that contains the exported data.

We can also use the `--nsInclude` parameter of `mongorestore` to specify which database and collections to restore. For example, if  BSON files are located in the `db` directory, you can run the following command:

```bash
mongorestore --nsInclude "patient_management.*" db
```

- `--nsInclude "patient_management.*"`: Specifies to restore all collections related to the `patient_management` database.
- `db`: Specifies the directory that contains the `.bson` and `.metadata.json` files.  
## Prerequisites

- **Node.js**
- **MongoDB**
- **Redis**
## Setup Instructions

1. Clone the repository to your local machine:
   ```bash
   git clone <repository-url>
   cd MongoDB_Assignment_5_Project
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```
3. Install MongoDB:
   ```bash
   npm install mongodb
   ```
4. Install Redis:
   ```bash
   npm install redis
   ``` 
5. Import the dataset into MongoDB by running the initialization script & Run all queries using the following command:
   ```bash
   npm start
   ```

## Installing MongoDB on macOS

To install MongoDB on a Mac, follow these steps:

1. **Install Homebrew** (if not already installed):
   Homebrew is a package manager for macOS that makes it easy to install software.
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install MongoDB** using Homebrew:
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community@8.0
   ```

3. **Start MongoDB**:
   After installation, start the MongoDB service:
   ```bash
   brew services start mongodb/brew/mongodb-community
   ```

4. **Verify MongoDB is running**:
   You can verify that MongoDB is running by using the following command:
   ```bash
   mongo
   ```
   This will open the MongoDB shell if the server is running properly.

## Installing MongoDB on Docker

To install and run MongoDB using Docker, follow these steps:

1. **Pull the MongoDB Docker image**:
   ```bash
   docker pull mongo:latest
   ```

2. **Run MongoDB in a Docker container**:
   ```bash
   docker run --name mongodb -d -p 27017:27017 -v mongo_data:/data/db mongo:latest
   ```
   - `--name mongodb`: Assigns a name to the container.
   - `-d`: Runs the container in detached mode.
   - `-p 27017:27017`: Maps port 27017 on your local machine to port 27017 in the container.
   - `-v mongo_data:/data/db`: Creates a Docker volume to persist MongoDB data.

3. **Verify MongoDB is running**:
   ```bash
   docker ps
   ```
   This command will show a list of running containers. You should see the MongoDB container listed.

4. **Connect to MongoDB**:
   You can connect to MongoDB using the Mongo shell:
   ```bash
   docker exec -it mongodb mongo
   ```
   This command will open the MongoDB shell inside the running container.

## Installing Redis on macOS

To install Redis on a Mac, follow these steps:

1. **Install Redis** using Homebrew:
   ```bash
   brew install redis
   ```

2. **Start Redis**:
   ```bash
   brew services start redis
   ```

3. **Verify Redis is running**:
   You can verify that Redis is running by using the following command:
   ```bash
   redis-cli ping
   ```
   If Redis is running, this command should return `PONG`.

## Using Redis in Node.js

To use Redis in Node.js, follow these steps:

1. **Install the Redis client library**:
   ```bash
   npm install redis
   ```

2. **Connecting to Redis in your Node.js script**:
   ```javascript
   const { createClient } = require('redis');

   async function connectRedis() {
     const redisClient = createClient();

     redisClient.on('error', (err) => console.error('Redis Client Error', err));

     await redisClient.connect();
     console.log('Connected to Redis');

     // Example command
     await redisClient.set('key', 'value');
     const value = await redisClient.get('key');
     console.log(`The value of 'key' is: ${value}`);

     // Disconnect after operations
     await redisClient.disconnect();
     console.log('Disconnected from Redis');
   }

   connectRedis().catch(console.error);
   ```

   This script connects to Redis, sets a key-value pair, retrieves it, and then disconnects from Redis.

## Dependencies

- **`mongodb`**: MongoDB Node.js driver for interacting with the MongoDB instance.
- **`redis`**: Redis Node.js client for interacting with Redis.


