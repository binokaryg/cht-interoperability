const axios = require('axios');
const qs = require('qs');

const url = 'https://bardiya-ne.dev.medicmobile.org/api/v2/records';


const formData = {
    from: '9841171819',
    message: 'ehmis-pregnancy 62169 2081 1 10'
}

const credentials = {
    username : 'medic',
    password : 'snowdrop-weaker-oppositive-twites-dulverton'
};

axios.post(url, qs.stringify(formData), {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  auth: credentials,
})
.then(response => {
  console.log('Response:', response.data);
})
.catch(error => {
  console.error('Error:', error);
});
