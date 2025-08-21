// Netlify Functions - Approve Registration
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.applicationId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          hata: true,
          mesaj: 'Başvuru ID\'si zorunludur' 
        }),
      };
    }

    const applicationId = data.applicationId;
    
    // TODO: Production'da MongoDB'da güncelle
    // Şimdilik başarı dön
    console.log('Başvuru onaylandı:', applicationId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        basarili: true,
        mesaj: 'Başvuru başarıyla onaylandı!',
        applicationId: applicationId
      }),
    };

  } catch (error) {
    console.error('Approval error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        hata: true,
        mesaj: 'Onaylama işlemi sırasında hata oluştu.'
      }),
    };
  }
};