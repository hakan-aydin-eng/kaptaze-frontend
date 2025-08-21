// Netlify Functions - Admin Login Authentication
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
    if (!data.username || !data.password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          hata: true,
          mesaj: 'Kullanıcı adı ve şifre zorunludur' 
        }),
      };
    }

    const { username, password } = data;
    
    // TODO: Production'da MongoDB'dan check et
    // Şimdilik demo credentials
    const validCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'demo', password: 'demo123' },
      { username: 'kaptaze', password: 'kaptaze2024' }
    ];
    
    const isValidUser = validCredentials.some(cred => 
      cred.username === username && cred.password === password
    );

    if (!isValidUser) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          hata: true,
          mesaj: 'Kullanıcı adı veya şifre hatalı'
        }),
      };
    }

    // Generate token (simple timestamp-based token for demo)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        basarili: true,
        mesaj: 'Giriş başarılı! Yönetim paneline yönlendiriliyorsunuz.',
        token: token,
        kullanici: {
          username: username,
          role: 'admin',
          loginTime: new Date().toISOString()
        }
      }),
    };

  } catch (error) {
    console.error('Login error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        hata: true,
        mesaj: 'Giriş işlemi sırasında hata oluştu. Lütfen tekrar deneyin.'
      }),
    };
  }
};