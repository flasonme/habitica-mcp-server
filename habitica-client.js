import axios from 'axios';

const HABITICA_API_BASE = 'https://habitica.com/api/v3';

export function createHabiticaClient(userId, apiToken, adapter) {
  return axios.create({
    baseURL: HABITICA_API_BASE,
    ...(adapter ? { adapter } : {}),
    headers: {
      'x-api-user': userId,
      'x-api-key': apiToken,
      'x-client': `${userId}-HabiticaMCPServer`,
      'Content-Type': 'application/json',
    },
  });
}
