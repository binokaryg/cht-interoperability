const nano = require('nano');
const { getPatientDocument, getView } = require('../db.js');

// Function to find patients with pregnancy but no ANC visits
async function findPatientsWithPregnancyNoANC(fchvAreaId) {
  try {

    // Query pregnancy registration view
    const pregnancyResult = await getView('sms_pregnancy_registration');

    // Query ANC visits view
    const ancResult = await getView('all_anc_visits');

    // Extract patient_ids from each view result
    const pregnancyPatients = pregnancyResult.rows.map(row => ({
      patient_id: row.key,      
      HF_Area: row.value.contact && row.value.contact.parent && row.value.contact.parent.parent ? row.value.contact.parent.parent._id : null,
      fchv_AREA: row.value.contact && row.value.contact.parent ? row.value.contact.parent._id : null
    }));

    const ancPatients = ancResult.rows.map(row => row.key); // Assuming doc.fields.patient_id is the key

    // Find unique patients with pregnancy but no ANC visits
    const uniquePatients = {};
    const uniquePatientsWithPregnancyNoANC = pregnancyPatients.filter(patient => {
      if (!ancPatients.includes(patient.patient_id) && !uniquePatients[patient.patient_id]) {
        uniquePatients[patient.patient_id] = true;
        return true;
      }
      return false;
    });

    const updatedPatientsWithPregnancyNoANC = [];
    // Get each unique patient's doc
    for (const patient of uniquePatientsWithPregnancyNoANC) {
      const patientDoc = await getPatientDocument(patient.patient_id);
      if (patientDoc) {
        updatedPatientsWithPregnancyNoANC.push({
          patientUUID:patientDoc._id,
          ...patient,
          patientDoc: patientDoc,
        });
      }
    }   

    // return pending patients
    return updatedPatientsWithPregnancyNoANC.filter(patient => patient.patientDoc.parent._id === fchvAreaId);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

module.exports = {
  findPatientsWithPregnancyNoANC
};

