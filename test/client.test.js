import assert from 'node:assert/strict';
import test from 'node:test';
import { createHabiticaClient } from '../habitica-client.js';

test('every Habitica API request includes the required client header and credentials', async () => {
  let captured;
  const client = createHabiticaClient('user-id', 'api-token', async (config) => {
    captured = config;
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
  });
  await client.get('/tasks/user');
  assert.equal(captured.headers.get('x-api-user'), 'user-id');
  assert.equal(captured.headers.get('x-api-key'), 'api-token');
  assert.equal(captured.headers.get('x-client'), 'user-id-HabiticaMCPServer');
});
