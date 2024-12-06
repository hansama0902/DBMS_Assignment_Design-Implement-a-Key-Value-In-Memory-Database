# Redis with Node Assignment 6 Project

This project is focused on querying the `ieeevis2020Tweets` database using Redis with Node. The dataset is related to IEEE VIS 2020 tweets, and the project performs a series of queries to extract useful insights from the data.

## Project Structure
- **`Loading the data`**: Download [the tweets generated during the 2020 ieeevis Conference](https://johnguerra.co/viz/influentials/ieeevis2020/ieeevis2020Tweets.dump.bz2) to an external site, and unzip the file. You can unzip this file using Keka or 7zip. After extraction, you should have a `.dump` file.
- **`init.js`**: This script is responsible for importing the dataset into MongoDB. It uses the following `mongoimport` command to load data from a `.dump` file into the MongoDB collection `tweet`:
  ```bash
  mongoimport -h localhost:27017 -d ieeevisTweets -c tweet --file ./db/ieeevis2020Tweets.dump --drop
  ```
  This command connects to the MongoDB instance running on `localhost` at port `27017` and imports the dataset into the `ieeevisTweets` database, dropping the existing collection before importing.

- **`Query1.js` to `Query5.js`**: These files contain individual query scripts that perform various analyses on the data within the `ieeevisTweets` database.

- **`runAllQueries.js`**: This script is used to execute all queries sequentially, including `init.js` and `Query1.js` to `Query5.js`. It ensures that the data is imported first before running the queries, and each query is executed in order.

## Prerequisites

- **Node.js**
- **MongoDB**
- **Redis**
- [**Download the tweets generated during the 2020 ieeevis Conference**](https://johnguerra.co/viz/influentials/ieeevis2020/ieeevis2020Tweets.dump.bz2)

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

## Project Workflow

1. **Initialization (`init.js`)**: The dataset is imported from `ieeevis2020Tweets.dump` into MongoDB.
    ```bash
   node init.js
   ```
2. **Queries (`Query1.js` to `Query5.js`)**: These files contain various queries that analyze the imported data.  
    You can run queries using the code:
   ```bash
   node Query1.js
   ```
3. **Execution (`runAllQueries.js`)**: This script runs all the queries sequentially, ensuring that data is properly imported before executing any query.
    You can run to execute all queries using the code:
   ```bash
   node runAllQueries.js
   ```

## Dependencies

- **`mongodb`**: MongoDB Node.js driver for interacting with the MongoDB instance.
- **`redis`**: Redis Node.js client for interacting with Redis.

