export const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 60000,
};

export const getGeolocation = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS)
  );
