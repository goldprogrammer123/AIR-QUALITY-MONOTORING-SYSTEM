export const calculateAQI = (nox = 0, voc = 0, co2 = 0, benzene = 0) => {
  let aqi = 0;
  let pollutant = '';

  // NOx AQI calculation (EPA standard, concentration in ppb)
  let noxAqi = 0;
  if (nox <= 53) {
    noxAqi = Math.round(((nox - 0) / 53) * 50); // Good: 0–50
  } else if (nox <= 100) {
    noxAqi = Math.round(((nox - 54) / 46) * 50 + 51); // Moderate: 51–100
  } else if (nox <= 360) {
    noxAqi = Math.round(((nox - 101) / 259) * 50 + 101); // Unhealthy for Sensitive Groups: 101–150
  } else if (nox <= 649) {
    noxAqi = Math.round(((nox - 361) / 288) * 50 + 151); // Unhealthy: 151–200
  } else if (nox <= 1249) {
    noxAqi = Math.round(((nox - 650) / 599) * 50 + 201); // Very Unhealthy: 201–300
  } else {
    noxAqi = Math.round(((nox - 1250) / 750) * 50 + 301); // Hazardous: 301–500
  }

  if (noxAqi > aqi) {
    aqi = noxAqi;
    pollutant = 'NOx';
  }

  // VOC AQI calculation (hypothetical, concentration in ppb)
  let vocAqi = 0;
  if (voc <= 50) {
    vocAqi = Math.round(((voc - 0) / 50) * 50); // Good: 0–50
  } else if (voc <= 150) {
    vocAqi = Math.round(((voc - 51) / 99) * 50 + 51); // Moderate: 51–100
  } else if (voc <= 300) {
    vocAqi = Math.round(((voc - 151) / 149) * 50 + 101); // Unhealthy for Sensitive Groups: 101–150
  } else if (voc <= 500) {
    vocAqi = Math.round(((voc - 301) / 199) * 50 + 151); // Unhealthy: 151–200
  } else if (voc <= 1000) {
    vocAqi = Math.round(((voc - 501) / 499) * 50 + 201); // Very Unhealthy: 201–300
  } else {
    vocAqi = Math.round(((voc - 1001) / 1000) * 50 + 301); // Hazardous: 301–500
  }

  if (vocAqi > aqi) {
    aqi = vocAqi;
    pollutant = 'VOC';
  }

  // CO2 AQI calculation (hypothetical, concentration in ppm)
  let co2Aqi = 0;
  if (co2 <= 1000) {
    co2Aqi = Math.round(((co2 - 0) / 1000) * 50); // Good: 0–50
  } else if (co2 <= 2000) {
    co2Aqi = Math.round(((co2 - 1001) / 999) * 50 + 51); // Moderate: 51–100
  } else if (co2 <= 5000) {
    co2Aqi = Math.round(((co2 - 2001) / 2999) * 50 + 101); // Unhealthy for Sensitive Groups: 101–150
  } else if (co2 <= 10000) {
    co2Aqi = Math.round(((co2 - 5001) / 4999) * 50 + 151); // Unhealthy: 151–200
  } else if (co2 <= 20000) {
    co2Aqi = Math.round(((co2 - 10001) / 9999) * 50 + 201); // Very Unhealthy: 201–300
  } else {
    co2Aqi = Math.round(((co2 - 20001) / 30000) * 50 + 301); // Hazardous: 301–500
  }

  if (co2Aqi > aqi) {
    aqi = co2Aqi;
    pollutant = 'CO2';
  }

  // Benzene AQI calculation (hypothetical, concentration in ppb)
  let benzeneAqi = 0;
  if (benzene <= 10) {
    benzeneAqi = Math.round(((benzene - 0) / 10) * 50); // Good: 0–50
  } else if (benzene <= 50) {
    benzeneAqi = Math.round(((benzene - 11) / 39) * 50 + 51); // Moderate: 51–100
  } else if (benzene <= 100) {
    benzeneAqi = Math.round(((benzene - 51) / 49) * 50 + 101); // Unhealthy for Sensitive Groups: 101–150
  } else if (benzene <= 200) {
    benzeneAqi = Math.round(((benzene - 101) / 99) * 50 + 151); // Unhealthy: 151–200
  } else if (benzene <= 500) {
    benzeneAqi = Math.round(((benzene - 201) / 299) * 50 + 201); // Very Unhealthy: 201–300
  } else {
    benzeneAqi = Math.round(((benzene - 501) / 500) * 50 + 301); // Hazardous: 301–500
  }

  if (benzeneAqi > aqi) {
    aqi = benzeneAqi;
    pollutant = 'Benzene';
  }

  // Ensure minimum realistic AQI
  if (aqi < 10) {
    aqi = 10;
    pollutant = 'None';
  }

  return { aqi, pollutant };
};

export const getAQIStatus = (aqi) => {
  if (aqi <= 50) return { status: 'Good', color: 'aqi-good', icon: 'CheckCircle' };
  if (aqi <= 100) return { status: 'Moderate', color: 'aqi-moderate', icon: 'Activity' };
  if (aqi <= 150) return { status: 'Unhealthy for Sensitive Groups', color: 'aqi-unhealthy', icon: 'AlertTriangle' };
  if (aqi <= 200) return { status: 'Unhealthy', color: 'aqi-unhealthy', icon: 'AlertTriangle' };
  if (aqi <= 300) return { status: 'Very Unhealthy', color: 'aqi-very-unhealthy', icon: 'XCircle' };
  return { status: 'Hazardous', color: 'aqi-hazardous', icon: 'XCircle' };
};

export const extractPollutantData = (data) => {
  if (!data || !Array.isArray(data)) {
    console.log('No valid data provided to extractPollutantData');
    return { nox: 0, voc: 0, co2: 0, benzene: 0 };
  }

  console.log('Fetched data:', data.map(item => ({
    measurement: item.measurement,
    value: item.value,
    time: item._time,
    id: item.id
  })));

  const latestMeasurements = { nox: 0, voc: 0, co2: 0, benzene: 0 };

  ['nox', 'voc', 'co2', 'benzene'].forEach(pollutant => {
    const pollutantData = data.filter(item => 
      item.measurement && typeof item.measurement === 'string' && item.measurement.toLowerCase().includes(pollutant)
    );
    if (pollutantData.length > 0) {
      const latest = pollutantData.reduce((a, b) => 
        new Date(a._time) > new Date(b._time) ? a : b
      );
      latestMeasurements[pollutant] = (pollutant === 'nox' || pollutant === 'benzene') 
        ? latest.value * 1000 // Convert ppm to ppb
        : latest.value;
      console.log(`Latest ${pollutant.toUpperCase()}:`, {
        value: latest.value,
        converted: latestMeasurements[pollutant],
        time: latest._time,
        id: latest.id
      });
    } else {
      console.log(`No ${pollutant.toUpperCase()} data found`);
    }
  });

  return latestMeasurements;
};