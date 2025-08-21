// Netlify Functions - Customer Registration API
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    if (!data.firstName || !data.lastName || !data.email || !data.businessName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Gerekli alanlar eksik',
          mesaj: 'Ad, soyad, e-posta ve işletme adı zorunludur' 
        }),
      };
    }

    // Generate registration ID
    const registrationId = Date.now().toString();
    
    // Create registration object
    const registrationData = {
      id: registrationId,
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      type: data.businessType || 'restaurant'
    };

    // Store in a simple global array (will reset on each deploy)
    // This is a temporary solution for demo purposes
    global.registrations = global.registrations || [];
    global.registrations.push(registrationData);
    
    console.log('✅ Yeni kayıt eklendi:', registrationData.businessName);
    console.log('📊 Toplam kayıt:', global.registrations.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        basarili: true,
        mesaj: 'Restoran başvurunuz başarıyla alındı. İnceleme sonrası e-posta ile bilgilendirileceksiniz.',
        basvuruId: registrationId,
        durum: 'pending'
      }),
    };

  } catch (error) {
    console.error('Registration error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        hata: true,
        mesaj: 'Başvuru işlemi sırasında hata oluştu. Lütfen daha sonra tekrar deneyin.'
      }),
    };
  }
};