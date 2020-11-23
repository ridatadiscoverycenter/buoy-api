const ids = [
  'bid2',
  'bid3',
  'bid4',
  'bid5',
  'bid6',
  'bid7',
  'bid8',
  'bid9',
  'bid10',
  'bid13',
  'bid15',
  'bid16',
  'bid17'
];

const variables = [
  'O2PercentSurface',
  'depth',
  'SalinityBottom',
  'pHBottom',
  'DepthBottom',
  'TurbidityBottom',
  'ChlorophyllSurface',
  'pHSurface',
  'SpCondSurface',
  'SpCondBottom',
  'FSpercentSurface',
  'WaterTempBottom',
  'O2Surface',
  'WaterTempSurface',
  'SalinitySurface'
];

const stationMap = {
  bid2: 'N. Prudence',
  bid3: 'Conimicut Pt',
  bid4: 'Upper Bay Winter Station',
  bid5: 'Bullocks Reach',
  bid6: 'Mnt. View',
  bid7: 'Quonset Pt',
  bid8: 'Mnt. Hope Bay',
  bid9: 'Poppasquash Pt',
  bid10: 'Sally Rock',
  bid13: 'Unknown',
  bid15: 'Greenwich Bay',
  bid16: 'Unknown',
  bid17: 'GSO Dock',
  bid21: 'Station II'
};

module.exports = {
  ids,
  variables,
  stationMap
};