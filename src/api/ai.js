import apiClient from "./client.js";

/**
 * Sends a message to the AI Travel Assistant backend endpoint
 * @param {string} message - User query or question
 * @param {Array<{role: string, text: string}>} history - Previous conversation turns
 * @returns {Promise<{success: boolean, reply: string, packages: Array, destinations: Array, suggestions: Array, intent: string}>}
 */
export async function sendChatMessage(message, history = []) {
  const { data } = await apiClient.post("/ai/chat", {
    message,
    history
  });
  return data;
}
