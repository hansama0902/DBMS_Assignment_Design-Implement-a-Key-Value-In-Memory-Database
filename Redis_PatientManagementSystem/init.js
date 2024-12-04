const { execSync } = require("child_process");

const commands = [
  'mongoimport --host localhost --port 27017 --db patient_management --collection patients --file db/patients.json --jsonArray --drop',
  'mongoimport --host localhost --port 27017 --db patient_management --collection appointments --file db/appointments.json --jsonArray --drop',
  'mongoimport --host localhost --port 27017 --db patient_management --collection tests --file db/tests.json --jsonArray --drop',
  'mongoimport --host localhost --port 27017 --db patient_management --collection doctors --file db/doctors.json --jsonArray --drop',
  'mongoimport --host localhost --port 27017 --db patient_management --collection prescriptions --file db/prescriptions.json --jsonArray --drop',
   'mongoimport --host localhost --port 27017 --db patient_management --collection medicine_record --file db/medicine_record.json --jsonArray --drop',
   'mongoimport --host localhost --port 27017 --db patient_management --collection surveys --file db/surveys.json --jsonArray --drop'
];

commands.forEach((command) => {
  try {
    const stdout = execSync(command, { stdio: ['pipe', 'pipe', 'ignore'] });
    console.log(`Command executed successfully: ${command}`);
    console.log(stdout.toString());
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
  }
});


