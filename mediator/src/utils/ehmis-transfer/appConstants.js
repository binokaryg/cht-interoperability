const credentials = {
    devUser: 'medic',
    devPassword: '',
};

// ANC intervals definition
const ANC_INTERVALS = [
    { start: 0, end: 84 },  // ANC 1: 12 Weeks (57 - 84 days)
    { start: 85, end: 112 }, // ANC 2: 16 Weeks (106 - 112 days)
    { start: 113, end: 168 },// ANC 3: 20 - 24 Weeks (134 - 168 days)
    { start: 169, end: 196 },// ANC 4: 28 Weeks (190 - 196 days)
    { start: 197, end: 224 },// ANC 5: 32 Weeks (218 - 224 days)
    { start: 225, end: 238 },// ANC 6: 34 Weeks (232 - 238 days)
    { start: 239, end: 252 },// ANC 7: 36 Weeks (246 - 252 days)
    { start: 253, end: 280 } // ANC 8: 38 - 40 Weeks (259 - 280 days)
  ];

module.exports = { credentials, ANC_INTERVALS};


