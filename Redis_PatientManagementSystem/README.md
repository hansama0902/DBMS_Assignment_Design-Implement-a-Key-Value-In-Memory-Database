# Redis Patient Management System

An application built using Node.js, Express, MongoDB, and Redis that implements a simple patient reference manager. This system is useful for managing patient records and accessing patient data quickly using the caching capabilities of Redis.

## Features

- **Patient Management**: Add, update, view, and delete patient records.
- **Caching with Redis**: Leverage Redis for faster access to frequently requested patient information.
- **RESTful API**: Interact with the patient records via a RESTful API built using Node.js and Express.

## Prerequisites

To run this project, you will need the following software installed on your system:

- Node.js (v12 or later)
- MongoDB (local or cloud instance)
- Redis (local instance)

## Getting Started

Follow the steps below to get the application up and running on your local machine.

### 1. Clone the Repository

Clone this repository to your local machine using the following command:

```
git clone https://github.com/yourusername/Redis_PatientManagementSystem.git
```

### 2. Install Dependencies

Navigate into the project directory and install the necessary dependencies:

```
cd Redis_PatientManagementSystem
npm install
```
### 3. Install Redis

Install the Redis package to use Redis as a caching layer for the patient data:

```
npm install redis
```

### 4. Initialize Data

To initialize some sample patient data, run the following command:

```
node init
```

This will populate the database with some initial patient records to work with.

### 5. Start the Application

Start the application by running the following command:

```
node Query
```

