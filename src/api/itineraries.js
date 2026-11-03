import apiClient from "./client.js";

/**
 * Generate AI trip itinerary with verified map waypoints
 */
export async function generateAITrip(data) {
  const response = await apiClient.post("/ai/plan-trip", data);
  return response.data;
}

/**
 * Regenerate a single specific day in an itinerary
 */
export async function regenerateTripDay(data) {
  const response = await apiClient.post("/ai/regenerate-day", data);
  return response.data;
}

/**
 * Fetch authenticated user's saved itineraries
 */
export async function getMySavedItineraries() {
  const response = await apiClient.get("/itineraries/my");
  return response.data;
}

/**
 * Fetch a single saved itinerary by ID
 */
export async function getSavedItinerary(id) {
  const response = await apiClient.get(`/itineraries/my/${id}`);
  return response.data;
}

/**
 * Save an itinerary to user's account
 */
export async function saveUserItinerary(data) {
  const response = await apiClient.post("/itineraries", data);
  return response.data;
}

/**
 * Update an existing saved itinerary
 */
export async function updateUserItinerary(id, data) {
  const response = await apiClient.put(`/itineraries/${id}`, data);
  return response.data;
}

/**
 * Delete a saved itinerary owned by user
 */
export async function deleteUserItinerary(id) {
  const response = await apiClient.delete(`/itineraries/${id}`);
  return response.data;
}

/**
 * Geocode query
 */
export async function geocodeCity(query) {
  const response = await apiClient.get("/ai/geocode", { params: { query } });
  return response.data;
}

