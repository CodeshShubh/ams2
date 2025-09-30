// Geofencing utility functions

export interface GeofenceLocation {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  name?: string;
  address?: string;
}

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a location is within a geofence
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param geofence Geofence configuration
 * @returns Object with status and distance information
 */
export function isWithinGeofence(
  userLat: number,
  userLon: number,
  geofence: GeofenceLocation
): {
  isInside: boolean;
  distance: number;
  geofence: GeofenceLocation;
} {
  const distance = calculateDistance(
    userLat,
    userLon,
    geofence.latitude,
    geofence.longitude
  );

  return {
    isInside: distance <= geofence.radius,
    distance,
    geofence,
  };
}

/**
 * Format distance for human-readable display
 * @param distanceInMeters Distance in meters
 * @returns Formatted string
 */
export function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  }
}

/**
 * Get geofence status message
 * @param isInside Whether user is inside geofence
 * @param distance Distance from geofence center
 * @param geofenceName Name of the geofence location
 * @returns Status message
 */
export function getGeofenceStatusMessage(
  isInside: boolean,
  distance: number,
  geofenceName?: string
): string {
  const locationName = geofenceName || 'office';
  
  if (isInside) {
    return `✅ You are at ${locationName}`;
  } else {
    return `📍 You are ${formatDistance(distance)} away from ${locationName}`;
  }
}

/**
 * Validate geofence configuration
 * @param geofence Geofence configuration to validate
 * @returns Validation result
 */
export function validateGeofence(geofence: Partial<GeofenceLocation>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof geofence.latitude !== 'number' || isNaN(geofence.latitude)) {
    errors.push('Latitude must be a valid number');
  } else if (geofence.latitude < -90 || geofence.latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (typeof geofence.longitude !== 'number' || isNaN(geofence.longitude)) {
    errors.push('Longitude must be a valid number');
  } else if (geofence.longitude < -180 || geofence.longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }

  if (typeof geofence.radius !== 'number' || isNaN(geofence.radius)) {
    errors.push('Radius must be a valid number');
  } else if (geofence.radius <= 0) {
    errors.push('Radius must be greater than 0');
  } else if (geofence.radius > 10000) {
    errors.push('Radius cannot exceed 10km');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}