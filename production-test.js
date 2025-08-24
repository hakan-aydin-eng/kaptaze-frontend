/**
 * KapTaze Production Test Script
 * Tests all critical endpoints and functionality
 */

const API_BASE = 'https://kaptaze-backend-api.onrender.com';

// Test data
const testData = {
    admin: {
        username: 'admin',
        password: 'admin123'
    },
    application: {
        firstName: 'Test',
        lastName: 'Restaurant',
        email: `test-${Date.now()}@example.com`,
        phone: '+905551234567',
        businessName: 'Test Restaurant',
        businessCategory: 'Restaurant',
        businessAddress: 'Test Address',
        city: 'Istanbul',
        district: 'Besiktas',
        experience: '2 years',
        whyJoin: 'Test application'
    }
};

async function makeRequest(url, options = {}) {
    try {
        console.log(`🔗 ${options.method || 'GET'} ${url}`);
        const response = await fetch(url, {
            timeout: 10000,
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        const data = await response.json();
        console.log(`✅ Status: ${response.status} - ${response.statusText}`);
        console.log(`📊 Response:`, data);
        return { success: response.ok, status: response.status, data };
    } catch (error) {
        console.error(`❌ Error:`, error.message);
        return { success: false, error: error.message };
    }
}

async function runProductionTests() {
    console.log('🚀 Starting KapTaze Production Tests...\n');
    
    let authToken = null;
    let testResults = {
        total: 0,
        passed: 0,
        failed: 0
    };
    
    // Test 1: Health Check
    console.log('='.repeat(50));
    console.log('🏥 TEST 1: Health Check');
    console.log('='.repeat(50));
    testResults.total++;
    
    const healthCheck = await makeRequest(`${API_BASE}/health`);
    if (healthCheck.success && healthCheck.data.status === 'OK') {
        console.log('✅ Health check passed');
        testResults.passed++;
    } else {
        console.log('❌ Health check failed');
        testResults.failed++;
    }
    
    // Test 2: Admin Login
    console.log('\n' + '='.repeat(50));
    console.log('🔐 TEST 2: Admin Login');
    console.log('='.repeat(50));
    testResults.total++;
    
    const adminLogin = await makeRequest(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        body: JSON.stringify(testData.admin)
    });
    
    if (adminLogin.success && adminLogin.data.success && adminLogin.data.data.token) {
        console.log('✅ Admin login passed');
        authToken = adminLogin.data.data.token;
        testResults.passed++;
    } else {
        console.log('❌ Admin login failed');
        testResults.failed++;
    }
    
    // Test 3: Application Submission
    console.log('\n' + '='.repeat(50));
    console.log('📝 TEST 3: Application Submission');
    console.log('='.repeat(50));
    testResults.total++;
    
    const appSubmission = await makeRequest(`${API_BASE}/public/applications`, {
        method: 'POST',
        body: JSON.stringify(testData.application)
    });
    
    if (appSubmission.success && appSubmission.data.success) {
        console.log('✅ Application submission passed');
        testResults.passed++;
    } else {
        console.log('❌ Application submission failed');
        testResults.failed++;
    }
    
    // Test 4: Admin - Get Applications (with auth)
    if (authToken) {
        console.log('\n' + '='.repeat(50));
        console.log('📋 TEST 4: Admin - Get Applications');
        console.log('='.repeat(50));
        testResults.total++;
        
        const getApps = await makeRequest(`${API_BASE}/admin/applications`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (getApps.success && getApps.data.success) {
            console.log('✅ Get applications passed');
            console.log(`📊 Found ${getApps.data.data.length} applications`);
            testResults.passed++;
        } else {
            console.log('❌ Get applications failed');
            testResults.failed++;
        }
    }
    
    // Final Results
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${(testResults.passed / testResults.total * 100).toFixed(1)}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Production ready! 🚀');
    } else {
        console.log('\n⚠️  Some tests failed. Check logs above.');
    }
}

// Run tests
runProductionTests().catch(console.error);