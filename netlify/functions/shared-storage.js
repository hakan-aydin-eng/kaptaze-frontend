// Simple shared storage using Netlify Functions
// This is a temporary solution - in production use a proper database

let storage = {
  registrations: [
    // Default mock data
    {
      id: '1734789123456',
      firstName: 'Ahmet',
      lastName: 'Kaya',
      email: 'ahmet@example.com',
      phone: '532 123 45 67',
      businessName: 'Ahmet\'in Lokantası',
      businessCategory: 'Geleneksel Türk',
      businessAddress: 'Muratpaşa, Antalya',
      username: 'ahmetlokanta',
      type: 'restaurant',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ]
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { action, data } = JSON.parse(event.body || '{}');

    switch (action) {
      case 'add':
        storage.registrations.push(data);
        console.log('Added registration:', data.businessName);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, total: storage.registrations.length })
        };

      case 'get':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            basarili: true, 
            basvurular: storage.registrations 
          })
        };

      case 'update':
        const index = storage.registrations.findIndex(reg => reg.id === data.id);
        if (index !== -1) {
          storage.registrations[index] = { ...storage.registrations[index], ...data };
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};