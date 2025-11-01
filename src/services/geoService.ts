export interface JobCoordinates {
  pickup_lat: number | null;
  pickup_lng: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  distance_miles: number | null;
}

export async function getJobCoordinates(
  pickupAddress: string,
  deliveryAddress: string,
): Promise<JobCoordinates | null> {
  try {
    // Fetch Google Maps API key from edge function
    const response = await fetch("/functions/v1/google-maps-config");
    const { apiKey } = await response.json();

    if (!apiKey) {
      console.error("Google Maps API key not configured");
      return null;
    }

    // Geocode pickup address
    const pickupResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pickupAddress)}&key=${apiKey}`,
    );
    const pickupData = await pickupResponse.json();

    // Geocode delivery address
    const deliveryResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(deliveryAddress)}&key=${apiKey}`,
    );
    const deliveryData = await deliveryResponse.json();

    if (pickupData.status !== "OK" || deliveryData.status !== "OK") {
      console.error("Geocoding failed", { pickupData, deliveryData });
      return null;
    }

    const pickupLocation = pickupData.results[0].geometry.location;
    const deliveryLocation = deliveryData.results[0].geometry.location;

    // Calculate distance using Haversine formula
    const distance = calculateDistance(
      pickupLocation.lat,
      pickupLocation.lng,
      deliveryLocation.lat,
      deliveryLocation.lng,
    );

    return {
      pickup_lat: pickupLocation.lat,
      pickup_lng: pickupLocation.lng,
      delivery_lat: deliveryLocation.lat,
      delivery_lng: deliveryLocation.lng,
      distance_miles: Math.round(distance * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
