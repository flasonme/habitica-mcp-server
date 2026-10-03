#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createHabiticaClient } from './habitica-client.js';

// Validate environment variables
const HABITICA_USER_ID = process.env.HABITICA_USER_ID;
const HABITICA_API_TOKEN = process.env.HABITICA_API_TOKEN;


if (!HABITICA_USER_ID || !HABITICA_API_TOKEN) {
  console.error('Error: Please set HABITICA_USER_ID and HABITICA_API_TOKEN environment variables');
  process.exit(1);
}

// Habitica API client
const habiticaClient = createHabiticaClient(HABITICA_USER_ID, HABITICA_API_TOKEN);

// Create MCP server
const server = new Server(
  {
    name: 'habitica-mcp-server',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools = [
  {
    name: 'get_user_profile',
    description: 'Get user profile',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_tasks',
    description: 'Get tasks list',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['habits', 'dailys', 'todos', 'rewards'],
          description: 'Task type',
        },
      },
    },
  },
  {
    name: 'create_task',
    description: 'Create new task',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['habit', 'daily', 'todo', 'reward'],
          description: 'Task type',
        },
        text: {
          type: 'string',
          description: 'Task title',
        },
        notes: {
          type: 'string',
          description: 'Task notes',
        },
        difficulty: {
          type: 'number',
          enum: [0.1, 1, 1.5, 2],
          description: 'Difficulty (0.1=easy, 1=medium, 1.5=hard, 2=very hard)',
        },
        priority: {
          type: 'number',
          enum: [0.1, 1, 1.5, 2],
          description: 'Priority (0.1=low, 1=med, 1.5=high, 2=urgent)',
        },
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'Checklist item text',
              },
              completed: {
                type: 'boolean',
                description: 'Completed status',
                default: false,
              },
            },
            required: ['text'],
          },
          description: 'Checklist items',
        },
      },
      required: ['type', 'text'],
    },
  },
  {
    name: 'score_task',
    description: 'Score task / habit',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
        direction: {
          type: 'string',
          enum: ['up', 'down'],
          description: 'Direction (up=positive, down=negative, habits only)',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'update_task',
    description: 'Update task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
        text: {
          type: 'string',
          description: 'Task title',
        },
        notes: {
          type: 'string',
          description: 'Task notes',
        },
        completed: {
          type: 'boolean',
          description: 'Completed flag',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'get_stats',
    description: 'Get user stats',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'buy_reward',
    description: 'Buy reward',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Reward key or ID',
        },
      },
      required: ['key'],
    },
  },
  {
    name: 'get_inventory',
    description: 'Get inventory',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'cast_spell',
    description: 'Cast spell',
    inputSchema: {
      type: 'object',
      properties: {
        spellId: {
          type: 'string',
          description: 'Spell ID',
        },
        targetId: {
          type: 'string',
          description: 'Target ID (optional)',
        },
      },
      required: ['spellId'],
    },
  },
  {
    name: 'get_tags',
    description: 'Get tags list',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_tag',
    description: 'Create tag',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Tag name',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_pets',
    description: 'Get pets list',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'feed_pet',
    description: 'Feed pet',
    inputSchema: {
      type: 'object',
      properties: {
        pet: {
          type: 'string',
          description: 'Pet key',
        },
        food: {
          type: 'string',
          description: 'Food key',
        },
      },
      required: ['pet', 'food'],
    },
  },
  {
    name: 'hatch_pet',
    description: 'Hatch pet',
    inputSchema: {
      type: 'object',
      properties: {
        egg: {
          type: 'string',
          description: 'Egg key',
        },
        hatchingPotion: {
          type: 'string',
          description: 'Hatching potion key',
        },
      },
      required: ['egg', 'hatchingPotion'],
    },
  },
  {
    name: 'get_mounts',
    description: 'Get mounts list',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'equip_item',
    description: 'Equip item',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['mount', 'pet', 'costume', 'equipped'],
          description: 'Equipment type',
        },
        key: {
          type: 'string',
          description: 'Item key',
        },
      },
      required: ['type', 'key'],
    },
  },
  {
    name: 'get_notifications',
    description: 'Get notifications',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'read_notification',
    description: 'Mark notification as read',
    inputSchema: {
      type: 'object',
      properties: {
        notificationId: {
          type: 'string',
          description: 'Notification ID',
        },
      },
      required: ['notificationId'],
    },
  },
  {
    name: 'get_shop',
    description: 'Get shop items',
    inputSchema: {
      type: 'object',
      properties: {
        shopType: {
          type: 'string',
          enum: ['market', 'questShop', 'timeTravelersShop', 'seasonalShop'],
          description: 'Shop type',
        },
      },
    },
  },
  {
    name: 'buy_item',
    description: 'Buy shop item',
    inputSchema: {
      type: 'object',
      properties: {
        itemKey: {
          type: 'string',
          description: 'Item key',
        },
        quantity: {
          type: 'number',
          description: 'Quantity',
          default: 1,
        },
      },
      required: ['itemKey'],
    },
  },
  {
    name: 'add_checklist_item',
    description: 'Add checklist item to task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
        text: {
          type: 'string',
          description: 'Checklist item text',
        },
      },
      required: ['taskId', 'text'],
    },
  },
  {
    name: 'update_checklist_item',
    description: 'Update checklist item',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
        itemId: {
          type: 'string',
          description: 'Checklist item ID',
        },
        text: {
          type: 'string',
          description: 'Checklist item text',
        },
        completed: {
          type: 'boolean',
          description: 'Completed status',
        },
      },
      required: ['taskId', 'itemId'],
    },
  },
  {
    name: 'delete_checklist_item',
    description: 'Delete checklist item',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
        itemId: {
          type: 'string',
          description: 'Checklist item ID',
        },
      },
      required: ['taskId', 'itemId'],
    },
  },
  {
    name: 'get_task_checklist',
    description: 'Get task checklist items',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'score_checklist_item',
    description: 'Score checklist item (mark complete/incomplete)',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Task ID',
        },
        itemId: {
          type: 'string',
          description: 'Checklist item ID',
        },
      },
      required: ['taskId', 'itemId'],
    },
  },
];

// Register the tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools,
  };
});

// Register the tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_user_profile':
        return await getUserProfile();
      
      case 'get_tasks':
        return await getTasks(args.type);
      
      case 'create_task':
        return await createTask(args);
      
      case 'score_task':
        return await scoreTask(args.taskId, args.direction);
      
      case 'update_task':
        return await updateTask(args.taskId, args);
      
      case 'delete_task':
        return await deleteTask(args.taskId);
      
      case 'get_stats':
        return await getStats();
      
      case 'buy_reward':
        return await buyReward(args.key);
      
      case 'get_inventory':
        return await getInventory();
      
      case 'cast_spell':
        return await castSpell(args.spellId, args.targetId);
      
      case 'get_tags':
        return await getTags();
      
      case 'create_tag':
        return await createTag(args.name);
      
      case 'get_pets':
        return await getPets();
      
      case 'feed_pet':
        return await feedPet(args.pet, args.food);
      
      case 'hatch_pet':
        return await hatchPet(args.egg, args.hatchingPotion);
      
      case 'get_mounts':
        return await getMounts();
      
      case 'equip_item':
        return await equipItem(args.type, args.key);
      
      case 'get_notifications':
        return await getNotifications();
      
      case 'read_notification':
        return await readNotification(args.notificationId);
      
      case 'get_shop':
        return await getShop(args.shopType);
      
      case 'buy_item':
        return await buyItem(args.itemKey, args.quantity);
      
      case 'get_task_checklist':
        return await getTaskChecklist(args.taskId);
      
      case 'add_checklist_item':
        return await addChecklistItem(args.taskId, args.text);
      
      case 'update_checklist_item':
        return await updateChecklistItem(args.taskId, args.itemId, args);
      
      case 'delete_checklist_item':
        return await deleteChecklistItem(args.taskId, args.itemId);
      
      case 'score_checklist_item':
        return await scoreChecklistItem(args.taskId, args.itemId);
      
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    throw new McpError(ErrorCode.InternalError, `Habitica API error: ${errorMessage}`);
  }
});

// Tool implementations
async function getUserProfile() {
  const response = await habiticaClient.get('/user');
  const user = response.data.data;
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(user, null, 2),
      },
    ],
  };
}

async function getTasks(type) {
  const endpoint = type ? `/tasks/user?type=${type}` : '/tasks/user';
  const response = await habiticaClient.get(endpoint);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      },
    ],
  };
}

async function createTask(taskData) {
  const response = await habiticaClient.post('/tasks/user', taskData);
  const task = response.data.data;
  
  return {
    content: [
      {
        type: 'text',
        text: `Created task: ${task.text} (ID: ${task.id})`,
      },
    ],
  };
}

async function scoreTask(taskId, direction = 'up') {
  const response = await habiticaClient.post(`/tasks/${taskId}/score/${direction}`);
  const result = response.data.data;
  
  let message = `Task scored! `;
  if (result.exp) message += `Earned ${result.exp} XP `;
  if (result.gp) message += `Earned ${result.gp} gold `;
  if (result.lvl) message += `Reached level ${result.lvl}! `;
  
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
  };
}

async function updateTask(taskId, updates) {
  const response = await habiticaClient.put(`/tasks/${taskId}`, updates);
  const task = response.data.data;
  
  return {
    content: [
      {
        type: 'text',
        text: `Updated task: ${task.text}`,
      },
    ],
  };
}

async function deleteTask(taskId) {
  await habiticaClient.delete(`/tasks/${taskId}`);
  
  return {
    content: [
      {
        type: 'text',
        text: `Deleted task (ID: ${taskId})`,
      },
    ],
  };
}

async function getStats() {
  const response = await habiticaClient.get('/user');
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response.data.data.stats, null, 2),
      },
    ],
  };
}

async function buyReward(key) {
  const response = await habiticaClient.post(`/user/buy/${key}`);
  const result = response.data.data;
  
  return {
    content: [
      {
        type: 'text',
        text: `Bought reward! Gold remaining: ${result.gp}`,
      },
    ],
  };
}

async function getInventory() {
  const response = await habiticaClient.get('/user');
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response.data.data.items, null, 2),
      },
    ],
  };
}

async function castSpell(spellId, targetId) {
  const endpoint = targetId ? `/user/class/cast/${spellId}?targetId=${targetId}` : `/user/class/cast/${spellId}`;
  const response = await habiticaClient.post(endpoint);
  
  return {
    content: [
      {
        type: 'text',
        text: `Cast skill: ${spellId}`,
      },
    ],
  };
}

async function getTags() {
  const response = await habiticaClient.get('/tags');
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      },
    ],
  };
}

async function createTag(name) {
  const response = await habiticaClient.post('/tags', { name });
  const tag = response.data.data;
  
  return {
    content: [
      {
        type: 'text',
        text: `Created tag: ${tag.name} (ID: ${tag.id})`,
      },
    ],
  };
}

async function getPets() {
  const response = await habiticaClient.get('/user');
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response.data.data.items.pets, null, 2),
      },
    ],
  };
}

async function feedPet(pet, food) {
  const response = await habiticaClient.post(`/user/feed/${pet}/${food}`);
  const result = response.data.data;
  
  let message = `Fed pet ${pet}! `;
  if (result.message) {
    message += result.message;
  }
  
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
  };
}

async function hatchPet(egg, hatchingPotion) {
  const response = await habiticaClient.post(`/user/hatch/${egg}/${hatchingPotion}`);
  const result = response.data.data;
  
  return {
    content: [
      {
        type: 'text',
        text: `Hatched pet: ${egg}-${hatchingPotion}`,
      },
    ],
  };
}

async function getMounts() {
  const response = await habiticaClient.get('/user');
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response.data.data.items.mounts, null, 2),
      },
    ],
  };
}

async function equipItem(type, key) {
  const response = await habiticaClient.post(`/user/equip/${type}/${key}`);
  
  return {
    content: [
      {
        type: 'text',
        text: `Equipped ${type}: ${key}`,
      },
    ],
  };
}

async function getNotifications() {
  const response = await habiticaClient.get('/notifications');
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      },
    ],
  };
}

async function readNotification(notificationId) {
  await habiticaClient.post(`/notifications/${notificationId}/read`);
  
  return {
    content: [
      {
        type: 'text',
        text: `Marked notification as read (ID: ${notificationId})`,
      },
    ],
  };
}

async function getShop(shopType = 'market') {
  const response = await habiticaClient.get(`/shops/${shopType}`);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      },
    ],
  };
}

async function buyItem(itemKey, quantity = 1) {
  const response = await habiticaClient.post(`/user/buy/${itemKey}`, { quantity });
  const result = response.data.data;
  
  return {
    content: [
      {
        type: 'text',
        text: `Bought ${itemKey} x${quantity}! Gold remaining: ${result.gp}`,
      },
    ],
  };
}

async function getTaskChecklist(taskId) {
  const response = await habiticaClient.get(`/tasks/${taskId}`);
  const task = response.data.data;
  const checklist = task.checklist || [];
  
  return {
    content: [
      {
        type: 'text',
        text: `Task: ${task.text}\nChecklist items (${checklist.length}):`,
      },
      {
        type: 'text',
        text: checklist.length > 0 
          ? checklist.map(item => `${item.completed ? '✓' : '○'} ${item.text} (ID: ${item.id})`).join('\n')
          : 'No checklist items found',
      },
    ],
  };
}

async function addChecklistItem(taskId, text) {
  const response = await habiticaClient.post(`/tasks/${taskId}/checklist`, { text });
  const item = response.data.data;
  
  return {
    content: [
      {
        type: 'text',
        text: `Successfully added checklist item: ${item.text} (ID: ${item.id})`,
      },
    ],
  };
}

async function updateChecklistItem(taskId, itemId, updates) {
  const response = await habiticaClient.put(`/tasks/${taskId}/checklist/${itemId}`, updates);
  const item = response.data.data;
  
  return {
    content: [
      {
        type: 'text',
        text: `Successfully updated checklist item: ${item.text}`,
      },
    ],
  };
}

async function deleteChecklistItem(taskId, itemId) {
  await habiticaClient.delete(`/tasks/${taskId}/checklist/${itemId}`);
  
  return {
    content: [
      {
        type: 'text',
        text: `Successfully deleted checklist item (ID: ${itemId})`,
      },
    ],
  };
}

async function scoreChecklistItem(taskId, itemId) {
  const response = await habiticaClient.post(`/tasks/${taskId}/checklist/${itemId}/score`);
  const item = response.data.data;
  
  return {
    content: [
      {
        type: 'text',
        text: `Successfully scored checklist item: ${item.text} (completed: ${item.completed})`,
      },
    ],
  };
}

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Habitica MCP server started');
}

runServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
}); 