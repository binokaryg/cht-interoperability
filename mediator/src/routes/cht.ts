import { Router } from 'express';
import { requestHandler } from '../utils/request';
import { createPatient, updatePatientIds, createEncounter, getFchvList } from '../controllers/cht'
import { getFCHVListByHF } from '../utils/cht';

const router = Router();

const resourceType = 'Patient';

router.post(
  '/patient',
  requestHandler((req) => createPatient(req.body))
);

router.post(
  '/patient_ids',
  requestHandler((req) => updatePatientIds(req.body.doc))
);

router.post(
  '/encounter',
  requestHandler((req) => createEncounter(req.body))
);

router.post(
  '/fchv',
  requestHandler((req) => getFCHVListByHF(req.query.hf))
)

export default router;
