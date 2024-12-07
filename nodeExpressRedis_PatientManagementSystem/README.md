# Node nodeExpressRedis_PatientManagementSystem

An example application built using Node.js, Express, MongoDB, and EJS, implementing a simple reference manager. This application serves as a practical demonstration of how to create a server-side rendered application using EJS templates.

## Features

- **Reference Management**: Add, view, update, and delete references using a user-friendly web interface.
- **Server-Side Rendering**: Uses EJS as a templating engine to render HTML pages on the server.
- **MongoDB Integration**: Stores and retrieves data using MongoDB as the database.

## Prerequisites

To run this project, you will need the following software installed on your system:

- Node.js (v12 or later)
- MongoDB (local or cloud instance)
- Redis (for additional caching, optional)

## Using It

Follow these steps to get the application running on your local machine.

### 1. Clone the Repository

Clone the repository to your local machine:

```
git clone https://github.com/yourusername/nodeExpressMongoDBEJS.git
```

### 2. Install Dependencies

Navigate to the project directory and install the necessary dependencies:

```
cd nodeExpressMongoDBEJS
npm install
```

### 3. Restore Database

To initialize the database with sample data, use the `mongorestore` command to restore a MongoDB dump:

```
mongorestore --nsInclude "patient_management.*" db
```

### 4. Install Redis

If you plan to use Redis for caching, install the Redis package:

```
npm install redis
```

### 5. Start the Server

Start the server using the following command:

```
npm start
```

The server will start running on port 3000 by default.

### 6. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```  
