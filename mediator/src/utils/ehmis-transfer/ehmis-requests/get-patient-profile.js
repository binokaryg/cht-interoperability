const NepaliDate = require('nepali-datetime');
const { ANC_INTERVALS } = require('../appConstants.js');
const { getPatientsByFchvAreaID, getPatientDocument, getAllRecordsForPatient, getFchvAreaIdByFchv } = require('../db.js');
const { findPatientsWithPregnancyNoANC } = require('./get-pending-patients.js')


function classifyANCVisit(lmpDate, reportedDate) {
  const ancReportedDate = new Date(reportedDate);
  const lmpDateObj = new Date(lmpDate);
  const daysFromLMP = Math.floor((ancReportedDate.getTime() - lmpDateObj.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < ANC_INTERVALS.length; i++) {
    const interval = ANC_INTERVALS[i];
    if (daysFromLMP >= interval.start && daysFromLMP <= interval.end) {
      return i + 1; // ANC numbers are 1-indexed
    }
  }

  return '-1'; // Return '-1' if no matching interval is found
}

function getLatestPregnancyRecord(uniqueRecords) {
  // Ensure uniqueRecords is an array
  const recordsArray = Array.isArray(uniqueRecords) ? uniqueRecords : [uniqueRecords];

  // Filter records with the form 'L', 'ल', or 'pregnancy'
  const pregnancyRecords = recordsArray.filter(record =>
    ['L', 'ल', 'pregnancy'].includes(record.form)
  );

  // Sort records by reported_date in descending order
  pregnancyRecords.sort((a, b) => new Date(b.reported_date) - new Date(a.reported_date));

  // Get the latest record
  return pregnancyRecords[0] || null;
}

function calculateDeliveryDate(reportedDate, daysSinceBirth) {
  const reportedDateObj = new Date(reportedDate);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const daysSinceBirthInMilliseconds = daysSinceBirth * millisecondsPerDay;
  const deliveryDateMilliseconds = reportedDateObj.getTime() - daysSinceBirthInMilliseconds;
  const deliveryDateObj = new Date(deliveryDateMilliseconds);
  return deliveryDateObj.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

function createPatientProfile(uniqueRecords, patientDoc) {
  const latestPregnancy = getLatestPregnancyRecord(uniqueRecords);

  const profile = {
    PatientID: '',
    Patient_UUID: '',
    Phone_number: '',
    HF_UUID: '',
    FCHV_UUID: '',
    AncVisits: [],
    Pregnancy: {},
    PNC: [],
    Delivery: {}
  };

  uniqueRecords.forEach(record => {
    if (record.errors && record.errors.length > 0) {
      return; // Skip records with errors
    }
    switch (record.form) {
      case 'L':
      case 'ल':
      case 'pregnancy':
        profile.Pregnancy.epochLMPDate = new Date(record.fields.lmp_date).getTime();
        profile.Pregnancy.englishLMPDate = new Date(record.fields.lmp_date).toISOString().split('T')[0];
        profile.Pregnancy.pregnancyDateNepali = (new NepaliDate(new Date(record.fields.lmp_date))).format('YYYY-MM-DD');
        break;
      case 'delivery':
      case 'J':
      case 'ज':
        // Determine delivery date
        let deliveryDate = record.fields.delivery?.delivery_date ?? null;
        if (!deliveryDate && record.fields.days_since_birth !== undefined) {
          deliveryDate = calculateDeliveryDate(record.reported_date, record.fields.days_since_birth);
        }

        profile.Delivery.epochDeliveryDate = new Date(deliveryDate).getTime();
        profile.Delivery.englishDeliveryDate = deliveryDate;
        profile.Delivery.nepaliDeliveryDate = (new NepaliDate(new Date(deliveryDate))).format('YYYY-MM-DD');

        // Handle cases where delivery.bbyinfo might be missing
        if (record.fields?.delivery?.bbyinfo) {
          profile.Delivery.Babies = [];
          record.fields.delivery.bbyinfo.baby_repeat.forEach((baby, index) => {
            profile.Delivery.Babies.push({
              Baby_number: index + 1,
              Gender: baby.baby_details.baby_sex || '',
              Weight: baby.baby_details.baby_wt || '',
              BirthDate: baby.baby_details.baby_status || ''
            });
          });
        }
        break;
      case 'G':
      case 'ग':
      case '1':
      case '१':
      case 'pregnancy_visit':
        const visitNumber = record.fields.current_visit_count ?? classifyANCVisit(latestPregnancy.fields.lmp_date, record.reported_date);
        profile.AncVisits.push({
          visitNo: visitNumber,
          ancDateEnglish: new Date(record.reported_date).toISOString().split('T')[0],
          ancDateNepali: (new NepaliDate(record.reported_date)).format('YYYY-MM-DD'),
          ancDateEpoch: new Date(record.reported_date).getTime(),
          ancDangerSigns: record.fields.pregnancy_visit?.danger_signs ?? null
        });
        break;
      case 'P':
      case 'प':
      case 'pnc_visit':
        profile.PNC.push({
          pncNumber: record.fields.current_visit_count ?? record.fields.pnc_visits,
          pncDateNepali: (new NepaliDate(record.reported_date)).format('YYYY-MM-DD'),
          pncDateEnglishDate: new Date(record.reported_date).toISOString().split('T')[0],
          pncDateEpoch: new Date(record.reported_date).getTime()
        });
        break;
      default:
        break;
    }
  });

  // Set the PatientID and Patient_UUID
  profile.PatientID = patientDoc.patient_id;
  profile.Patient_UUID = patientDoc._id;

  // Add HF_UUID and FCHV_UUID if available
  profile.HF_UUID = patientDoc.parent.parent._id || '';
  profile.FCHV_UUID = patientDoc.parent._id || '';
  profile.Phone_number = patientDoc.phone || '';

  return profile;
}

async function getPatientProfile(patientDoc) {
  try {

    if (!patientDoc) {
      throw new Error('Patient document not found');
    }

    // Get all records for the patient
    const records = await getAllRecordsForPatient(patientDoc.patient_id, patientDoc._id);
    // Create the patient profile
    const patientProfile = createPatientProfile(records, patientDoc);

    return patientProfile;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function getAllPatientProfilesByFCHV(fchvUUID) {
  try {

    // Fetch the FCHV area ID
    const fchvAreaId = await getFchvAreaIdByFchv(fchvUUID);
    
    // find pending patients
    const patients = await findPatientsWithPregnancyNoANC(fchvAreaId);

    //const patients = await getPatientsByFchvAreaID(fchvAreaId); 

    
    const patientProfiles = [];

    for (const patient of patients) {
      const profile = await getPatientProfile(patient.patientDoc);
      if (profile) {
        patientProfiles.push(profile);
      }
    }

    return patientProfiles;
  } catch (error) {
    console.error('Error:', error.message);
    return [];
  }
}

// Example usage
getAllPatientProfilesByFCHV('95718246-98a3-4c52-a477-4b4bc9bcebab').then(profiles => {
  console.log('Patient Profiles:', JSON.stringify(profiles, null, 2));
});

module.exports = {
  getPatientsByFchvAreaID,
  getPatientDocument,
  getAllRecordsForPatient,
  classifyANCVisit,
  getLatestPregnancyRecord,
  calculateDeliveryDate,
  createPatientProfile,
  getPatientProfile,
  getAllPatientProfilesByFCHV
};
