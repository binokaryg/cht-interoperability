const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;

const {
  classifyANCVisit,
  getLatestPregnancyRecord,
  calculateDeliveryDate,
  createPatientProfile,
} = require('../ehmis-requests/get-patient-profile.js');
const db = require('../db.js');

describe('get-patient-profile tests', function() {
  let getPatientsByFchvAreaIDStub;
  let getPatientDocumentStub;
  let getAllRecordsForPatientStub;

  beforeEach(function() {
    getPatientsByFchvAreaIDStub = sinon.stub(db, 'getPatientsByFchvAreaID');
    getPatientDocumentStub = sinon.stub(db, 'getPatientDocument');
    getAllRecordsForPatientStub = sinon.stub(db, 'getAllRecordsForPatient');
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('classifyANCVisit', function() {
    it('should correctly classify ANC visit based on LMP and reported date', function() {
      const lmpDate = '2024-01-01';
      const reportedDate = '2024-03-15'; // 73 days after LMP

      const result = classifyANCVisit(lmpDate, reportedDate);
      expect(result).to.equal(1); // ANC 1
    });

    it('should return -1 for dates outside ANC intervals', function() {
      const lmpDate = '2024-01-01';
      const reportedDate = '2025-01-01'; // 365 days after LMP

      const result = classifyANCVisit(lmpDate, reportedDate);
      expect(result).to.equal('-1');
    });
  });

  describe('getLatestPregnancyRecord', function() {
    it('should return the latest pregnancy record', function() {
      const records = [
        { form: 'L', reported_date: '2024-01-10' },
        { form: 'pregnancy', reported_date: '2024-01-15' },
        { form: 'delivery', reported_date: '2024-01-20' }
      ];

      const result = getLatestPregnancyRecord(records);
      expect(result).to.deep.equal(records[1]);
    });

    it('should return null if no pregnancy records are found', function() {
      const records = [
        { form: 'delivery', reported_date: '2024-01-20' }
      ];

      const result = getLatestPregnancyRecord(records);
      expect(result).to.be.null;
    });
  });

  describe('calculateDeliveryDate', function() {
    it('should correctly calculate delivery date based on reported date and days since birth', function() {
      const reportedDate = '2024-08-03';
      const daysSinceBirth = 2; // 9 months

      const result = calculateDeliveryDate(reportedDate, daysSinceBirth);
      expect(result).to.equal('2024-08-01'); // 2 days prior to reported date
    });
  });

  describe('createPatientProfile', function() {
    it('should correctly create a patient profile from records and patient document', function() {
      const uniqueRecords = [
        { form: 'L', fields: { lmp_date: '2024-01-01' }, reported_date: '2024-01-10' },
        { form: 'delivery', fields: { delivery: { delivery_date: '2024-08-01' } }, reported_date: '2024-08-01' }
      ];

      const patientDoc = {
        patient_id: '12345',
        _id: 'abcde',
        phone: '123-456-7890',
        parent: { parent: { _id: 'hf-uuid' }, _id: 'fchv-uuid' }
      };

      const result = createPatientProfile(uniqueRecords, patientDoc);
      expect(result.PatientID).to.equal('12345');
      expect(result.Patient_UUID).to.equal('abcde');
      expect(result.Phone_number).to.equal('123-456-7890');
      expect(result.HF_UUID).to.equal('hf-uuid');
      expect(result.FCHV_UUID).to.equal('fchv-uuid');
      expect(result.Pregnancy.englishLMPDate).to.equal('2024-01-01');
      expect(result.Delivery.englishDeliveryDate).to.equal('2024-08-01');
    });
  });
});
