const nano = require('nano');
const { CHT } = require ('../../../dist/config/index.js');

const server = `https://${CHT.username}:${CHT.password}@${CHT.url}`;
//const server = 'https://medic:snowdrop-weaker-oppositive-twites-dulverton@bardiya-ne.dev.medicmobile.org';
const database = 'medic';

const db = nano(server).use(database);

async function getPatientsByFchvAreaID(fchvAreaId) {
  try {
    const response = await db.view('patient_ehmis_views', 'patient_by_fchv_area', {
      key: fchvAreaId,
      include_docs: true
    });

    return response.rows.map(row => row.doc);  // Extracting documents from rows
  } catch (error) {
    console.error('Error fetching patients by FCHV area ID:', error);
    throw error;
  }
}

async function getFchvAreaIdByFchv(fchvUUID) {
  try {
    const response = await db.view('patient_ehmis_views', 'fchv_by_area', {
      key: fchvUUID,
      include_docs: true
    });

    if (response.rows.length > 0) {
      return response.rows[0].value;  // Assuming value contains FCHV area ID
    } else {
      throw new Error('FCHV ID not found');
    }
  } catch (error) {
    console.error('Error fetching FCHV area ID:', error);
    throw error;
  }
}

async function getPatientDocument(patientId) {
  try {
    const result = await db.find({
      selector: {
        type: 'person',
        patient_id: patientId
      }
    });
    return result.docs[0] || null;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function getView(viewName){
 return await db.view('patient_ehmis_views', viewName, { include_docs: true });
}

async function getAllRecordsForPatient(patientId, patientUuid) {
  try {
    // Query by patient_id
    const patientIdResults = await db.view('patient_ehmis_views', 'all_patient_records', {
      key: patientId,
      include_docs: true
    });

    // Query by patient_uuid
    const patientUuidResults = await db.view('patient_ehmis_views', 'all_patient_records', {
      key: patientUuid,
      include_docs: true
    });

    // Combine results
    const allRecords = [...patientIdResults.rows, ...patientUuidResults.rows];

    // Filter unique records (assuming _id is unique)
    const uniqueRecords = {};
    allRecords.forEach(record => {
      uniqueRecords[record.id] = record.doc;
    });

    return Object.values(uniqueRecords);
  } catch (error) {
    console.error('Error:', error.message);
    return [];
  }
}

module.exports = {
  getPatientsByFchvAreaID,
  getPatientDocument,
  getAllRecordsForPatient,
  getFchvAreaIdByFchv,
  getView
};
