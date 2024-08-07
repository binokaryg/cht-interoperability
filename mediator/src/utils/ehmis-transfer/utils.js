const fs = require('fs');
const nano = require('nano');

const writeToFile = (path, content) => {
  const jsonContent = JSON.stringify(content, null, 3);
  try {
    fs.writeFileSync(path, jsonContent);
    console.log(`Content successfully written to ${path}`);
  } catch (error) {
    console.error(`Error writing to file ${path}:`, error);
  }
};

const createDirectoryIfNotExists = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    try {
      fs.mkdirSync(directoryPath);
      console.log(`Directory created: ${directoryPath}`);
    } catch (err) {
      console.error(`Error creating directory ${directoryPath}:`, err);
    }
  } else {
    console.log(`Directory already exists: ${directoryPath}`);
  }
};

const isDirectoryEmpty = (path) => {
  try {
    const files = fs.readdirSync(path);
    return files.length === 0;
  } catch (error) {
    console.error(`Error checking if directory ${path} is empty:`, error);
    return false; // Assume directory is not empty if an error occurs
  }
};

const getDbConnection = (server, database) => {
  try {
    const db = nano(server).use(database);
    nano(server).db.list().then(() => {
      console.log(`Connected to database '${database}' on server '${server}'`);
    }).catch((error) => {
      console.error(`Error connecting to database '${database}' on server '${server}':`, error);
    });
    return db;
  } catch (error) {
    console.error(`Error connecting to CouchDB server '${server}':`, error);
    return null; // Return null or handle as appropriate based on your application logic
  }
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

module.exports = {
  writeToFile,
  createDirectoryIfNotExists,
  isDirectoryEmpty,
  getDbConnection,
  sleep
};