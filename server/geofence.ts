import { GeofenceSettings } from '@shared/schema';

export class GeofenceService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param lat1 Latitude of first point
   * @param lon1 Longitude of first point  
   * @param lat2 Latitude of second point
   * @param lon2 Longitude of second point
   * @returns Distance in meters
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if a location is within a geofence
   * @param latitude User's current latitude
   * @param longitude User's current longitude
   * @param geofence Geofence settings to check against
   * @returns Object with validation result and distance
   */
  static validateLocation(
    latitude: number, 
    longitude: number, 
    geofence: GeofenceSettings
  ): { 
    isValid: boolean; 
    distance: number; 
    allowedRadius: number;
    geofenceName: string;
  } {
    const distance = this.calculateDistance(
      latitude, 
      longitude, 
      geofence.latitude, 
      geofence.longitude
    );

    return {
      isValid: distance <= geofence.radius,
      distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      allowedRadius: geofence.radius,
      geofenceName: geofence.name
    };
  }

  /**
   * Find the closest active geofence and validate location against it
   * @param latitude User's current latitude
   * @param longitude User's current longitude
   * @param geofences Array of active geofence settings
   * @returns Validation result for the closest geofence, or null if no geofences
   */
  static validateAgainstClosestGeofence(
    latitude: number,
    longitude: number,
    geofences: GeofenceSettings[]
  ): {
    isValid: boolean;
    distance: number;
    allowedRadius: number;
    geofenceName: string;
  } | null {
    if (geofences.length === 0) {
      return null;
    }

    // Find the closest geofence
    let closestGeofence = geofences[0];
    let shortestDistance = this.calculateDistance(
      latitude, longitude, 
      closestGeofence.latitude, closestGeofence.longitude
    );

    for (const geofence of geofences.slice(1)) {
      const distance = this.calculateDistance(
        latitude, longitude,
        geofence.latitude, geofence.longitude
      );
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestGeofence = geofence;
      }
    }

    return this.validateLocation(latitude, longitude, closestGeofence);
  }
}