// KapTaze MongoDB Storage - Persistent database solution
// Replaces the in-memory shared-storage.js with MongoDB Atlas

const { KapTazeDB } = require('./mongodb-service');

const db = new KapTazeDB();

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { action, data } = JSON.parse(event.body || '{}');
        console.log('📡 MongoDB Storage Request:', action, data ? 'with data' : 'no data');

        switch (action) {
            case 'get':
                // Return all data from MongoDB
                const allData = await db.getAllData();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        data: allData
                    })
                };

            case 'addApplication':
                // Add new application to MongoDB
                if (!data) {
                    throw new Error('No application data provided');
                }

                const application = await db.addApplication(data);
                console.log('✅ Application added to MongoDB:', application.id);

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        data: application,
                        message: 'Application saved to MongoDB Atlas'
                    })
                };

            case 'approveApplication':
                // Approve application in MongoDB
                try {
                    console.log('🔄 Starting MongoDB approval process...');
                    
                    if (!data || !data.applicationId || !data.credentials) {
                        console.error('❌ Invalid approval data:', data);
                        return {
                            statusCode: 400,
                            headers,
                            body: JSON.stringify({
                                success: false,
                                error: 'Missing applicationId or credentials'
                            })
                        };
                    }

                    const result = await db.approveApplication(data.applicationId, data.credentials);
                    
                    console.log('✅ MongoDB approval successful');
                    
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            data: result,
                            message: 'Application approved successfully in MongoDB'
                        })
                    };

                } catch (approvalError) {
                    console.error('❌ MongoDB approval failed:', approvalError);
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: approvalError.message || 'Approval failed'
                        })
                    };
                }

            case 'addPackage':
                // Add package to MongoDB
                if (!data) {
                    throw new Error('No package data provided');
                }

                const package = await db.addPackage(data);
                console.log('✅ Package added to MongoDB:', package.id);

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        data: package,
                        message: 'Package saved to MongoDB Atlas'
                    })
                };

            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: `Unknown action: ${action}`
                    })
                };
        }

    } catch (error) {
        console.error('❌ MongoDB Storage Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Internal server error',
                details: error.stack
            })
        };
    }
};