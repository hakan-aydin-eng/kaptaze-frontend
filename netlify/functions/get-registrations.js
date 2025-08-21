// Netlify Functions - Get Registrations for Admin Panel
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // TODO: Production'da MongoDB'dan çek
    // Şimdilik mock data dön
    const mockRegistrations = [
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
      },
      {
        id: '1734789234567',
        firstName: 'Fatma',
        lastName: 'Demir',
        email: 'fatma@example.com',
        phone: '533 234 56 78',
        businessName: 'Fatma\'nın Pastanesi',
        businessCategory: 'Kahve & Pasta',
        businessAddress: 'Kepez, Antalya',
        username: 'fatmapastane',
        type: 'restaurant',
        status: 'approved',
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 gün önce
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        basarili: true,
        basvurular: mockRegistrations
      }),
    };

  } catch (error) {
    console.error('Get registrations error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        hata: true,
        mesaj: 'Başvurular yüklenirken hata oluştu.'
      }),
    };
  }
};