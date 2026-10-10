
import { Position } from '../types';

// Convert degrees to radians
const toRad = (deg: number) => deg * (Math.PI / 180);
// Convert radians to degrees
const toDeg = (rad: number) => rad * (180 / Math.PI);

/**
 * Calculates the initial bearing (azimuth) from point A to point B on a sphere.
 * Returns degrees (0-360), where 0 is North, 90 is East.
 */
export const calculateAzimuth = (from: Position, to: Position): number => {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLon = toRad(to.lng - from.lng);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  const rad = Math.atan2(y, x);
  const deg = toDeg(rad);
  
  return (deg + 360) % 360;
};

/**
 * Calculates the elevation angle (look angle above horizon) from a ground station
 * to a satellite. Assumes spherical earth and geostationary orbit radius ratio.
 */
export const calculateElevation = (from: Position, to: Position): number => {
  const lat = toRad(from.lat);
  const lon = toRad(from.lng);
  const satLat = toRad(to.lat);
  const satLon = toRad(to.lng);

  // Central angle (gamma) between the two points
  const dLon = satLon - lon;
  // Standard Great Circle distance formula elements
  const cosGamma = Math.sin(lat) * Math.sin(satLat) + 
                   Math.cos(lat) * Math.cos(satLat) * Math.cos(dLon);
  
  const sinGamma = Math.sqrt(1 - cosGamma * cosGamma);

  // Ratio of Earth Radius (R) to Orbit Radius (r)
  // R_earth ~ 6371 km
  // R_orbit ~ 42164 km (Geostationary)
  // Ratio ~ 0.1511
  const ratio = 0.1511;

  // Elevation formula for perspective look angle
  // tan(El) = (cos(gamma) - ratio) / sin(gamma)
  if (sinGamma === 0) return 90; // Directly overhead
  
  const y = cosGamma - ratio;
  const x = sinGamma;
  
  let elevation = toDeg(Math.atan2(y, x));
  
  // If result is negative, satellite is below horizon
  return Math.max(0, elevation);
};

/**
 * Calculates rough distance in KM (Haversine formula)
 */
export const calculateDistance = (p1: Position, p2: Position): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lng - p1.lng); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};
