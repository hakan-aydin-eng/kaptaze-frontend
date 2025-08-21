// Customer Registration Netlify Function
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    console.log('🆕 New customer registration:', data);

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.businessName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Gerekli alanlar eksik'
        })
      };
    }

    const registrationId = Date.now().toString();
    const registrationData = {
      id: registrationId,
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      type: 'restaurant'
    };

    // Try to forward to admin panel API
    let forwardSuccess = false;
    try {
      const adminResponse = await fetch('https://kaptaze-admin.netlify.app/.netlify/functions/shared-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          data: registrationData
        })
      });

      if (adminResponse.ok) {
        forwardSuccess = true;
        console.log('✅ Data forwarded to admin panel successfully');
      }
    } catch (forwardError) {
      console.log('⚠️ Failed to forward to admin panel:', forwardError.message);
    }

    // Store locally as backup
    global.customerRegistrations = global.customerRegistrations || [];
    global.customerRegistrations.push(registrationData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Başvurunuz başarıyla kaydedildi! Admin onayından sonra bilgilendirileceksiniz.',
        registrationId: registrationId,
        forwarded: forwardSuccess
      })
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Kayıt işlemi sırasında hata oluştu. Lütfen tekrar deneyin.'
      })
    };
  }
};