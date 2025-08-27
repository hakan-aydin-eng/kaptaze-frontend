/**
 * SendGrid Email Service for KapTaze Admin
 * Automated email notifications for restaurant approvals
 * Version: 2025.08.28
 */

class SendGridService {
    constructor() {
        this.apiKey = null; // Will be set from environment or config
        this.baseURL = 'https://api.sendgrid.com/v3';
        this.fromEmail = 'admin@kaptaze.com';
        this.fromName = 'KapTaze Restaurant Platform';
        
        this.templates = {
            approval: {
                subject: '🎉 KapTaze Başvurunuz Onaylandı - Giriş Bilgileriniz',
                template: 'approval-credentials'
            },
            rejection: {
                subject: '❌ KapTaze Başvuru Sonucu',
                template: 'rejection-notice'
            },
            welcome: {
                subject: '🏪 KapTaze\'ye Hoşgeldiniz - Restoran Yönetim Paneli',
                template: 'welcome-restaurant'
            }
        };
        
        this.init();
    }

    async init() {
        console.log('📧 SendGrid Email Service initializing...');
        
        // Try to get API key from various sources
        await this.loadAPIKey();
        
        console.log('✅ SendGrid Email Service ready');
    }

    async loadAPIKey() {
        // Try multiple sources for API key
        this.apiKey = 
            process.env.SENDGRID_API_KEY || 
            window.SENDGRID_API_KEY ||
            localStorage.getItem('sendgrid_api_key') ||
            'SG.demo-key-for-development'; // Demo key for development
            
        if (this.apiKey.startsWith('SG.demo')) {
            console.warn('⚠️ Using demo SendGrid API key - emails will be simulated');
        }
    }

    async sendApprovalEmail(application, credentials) {
        console.log(`📧 Sending approval email to: ${application.email}`);
        
        try {
            const emailData = {
                personalizations: [{
                    to: [{
                        email: application.email,
                        name: `${application.firstName} ${application.lastName}`
                    }],
                    substitutions: {
                        '-restaurantName-': application.businessName,
                        '-ownerName-': `${application.firstName} ${application.lastName}`,
                        '-username-': credentials.username,
                        '-password-': credentials.password,
                        '-loginUrl-': 'https://kaptaze.com/restaurant-panel.html',
                        '-supportEmail-': 'destek@kaptaze.com',
                        '-applicationId-': application.applicationId
                    }
                }],
                from: {
                    email: this.fromEmail,
                    name: this.fromName
                },
                subject: this.templates.approval.subject,
                content: [{
                    type: 'text/html',
                    value: this.generateApprovalEmailHTML(application, credentials)
                }]
            };

            const result = await this.sendEmail(emailData);
            
            if (result.success) {
                console.log('✅ Approval email sent successfully');
                
                // Log email activity
                this.logEmailActivity('approval', application.email, result);
                
                return {
                    success: true,
                    messageId: result.messageId,
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ Failed to send approval email:', error);
            
            // Fallback: Simulate email sending in demo mode
            if (this.apiKey.startsWith('SG.demo')) {
                return this.simulateEmailSending('approval', application, credentials);
            }
            
            throw error;
        }
    }

    async sendRejectionEmail(application, reason) {
        console.log(`📧 Sending rejection email to: ${application.email}`);
        
        try {
            const emailData = {
                personalizations: [{
                    to: [{
                        email: application.email,
                        name: `${application.firstName} ${application.lastName}`
                    }],
                    substitutions: {
                        '-restaurantName-': application.businessName,
                        '-ownerName-': `${application.firstName} ${application.lastName}`,
                        '-rejectionReason-': reason,
                        '-reapplyUrl-': 'https://kaptaze.com/customer-registration-v2.html',
                        '-supportEmail-': 'destek@kaptaze.com',
                        '-applicationId-': application.applicationId
                    }
                }],
                from: {
                    email: this.fromEmail,
                    name: this.fromName
                },
                subject: this.templates.rejection.subject,
                content: [{
                    type: 'text/html',
                    value: this.generateRejectionEmailHTML(application, reason)
                }]
            };

            const result = await this.sendEmail(emailData);
            
            if (result.success) {
                console.log('✅ Rejection email sent successfully');
                
                // Log email activity
                this.logEmailActivity('rejection', application.email, result);
                
                return {
                    success: true,
                    messageId: result.messageId,
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ Failed to send rejection email:', error);
            
            // Fallback: Simulate email sending in demo mode
            if (this.apiKey.startsWith('SG.demo')) {
                return this.simulateEmailSending('rejection', application, { reason });
            }
            
            throw error;
        }
    }

    async sendEmail(emailData) {
        try {
            // Check if we're in demo mode
            if (this.apiKey.startsWith('SG.demo')) {
                return {
                    success: true,
                    messageId: 'demo-' + Date.now(),
                    demo: true
                };
            }

            // Real SendGrid API call
            const response = await fetch(`${this.baseURL}/mail/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (response.ok) {
                const messageId = response.headers.get('X-Message-Id');
                return {
                    success: true,
                    messageId: messageId,
                    status: response.status
                };
            } else {
                const error = await response.text();
                return {
                    success: false,
                    error: `SendGrid API error: ${response.status} - ${error}`,
                    status: response.status
                };
            }

        } catch (error) {
            return {
                success: false,
                error: `Network error: ${error.message}`
            };
        }
    }

    generateApprovalEmailHTML(application, credentials) {
        return `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>KapTaze Başvuru Onayı</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333333; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background-color: #f8fafc;
                }
                .email-container { 
                    background: white; 
                    border-radius: 16px; 
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
                    overflow: hidden; 
                    margin: 20px;
                }
                .header { 
                    background: linear-gradient(135deg, #16a34a, #22c55e); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 28px; 
                    font-weight: 700; 
                }
                .header p { 
                    margin: 10px 0 0; 
                    font-size: 16px; 
                    opacity: 0.9; 
                }
                .content { 
                    padding: 40px 30px; 
                }
                .congratulations { 
                    text-align: center; 
                    margin-bottom: 30px; 
                }
                .congratulations h2 { 
                    color: #16a34a; 
                    font-size: 24px; 
                    margin: 0 0 10px; 
                }
                .credentials-box { 
                    background: #f8fafc; 
                    border: 2px dashed #16a34a; 
                    border-radius: 12px; 
                    padding: 25px; 
                    margin: 25px 0; 
                    text-align: center; 
                }
                .credentials-box h3 { 
                    color: #16a34a; 
                    margin: 0 0 15px; 
                    font-size: 20px; 
                }
                .credential-item { 
                    margin: 15px 0; 
                    padding: 12px; 
                    background: white; 
                    border-radius: 8px; 
                    border-left: 4px solid #16a34a; 
                }
                .credential-label { 
                    font-weight: 600; 
                    color: #374151; 
                    display: block; 
                    margin-bottom: 5px; 
                }
                .credential-value { 
                    font-family: 'Courier New', monospace; 
                    font-size: 16px; 
                    color: #1f2937; 
                    background: #f3f4f6; 
                    padding: 8px 12px; 
                    border-radius: 6px; 
                    display: inline-block; 
                    font-weight: 700; 
                }
                .login-button { 
                    display: inline-block; 
                    background: linear-gradient(135deg, #16a34a, #22c55e); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 12px; 
                    font-weight: 600; 
                    font-size: 16px; 
                    margin: 20px 0; 
                    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3); 
                }
                .info-section { 
                    margin: 30px 0; 
                    padding: 20px; 
                    background: #eff6ff; 
                    border-radius: 12px; 
                    border-left: 4px solid #3b82f6; 
                }
                .warning-box { 
                    background: #fef3c7; 
                    border: 1px solid #f59e0b; 
                    border-radius: 8px; 
                    padding: 15px; 
                    margin: 20px 0; 
                }
                .footer { 
                    background: #f9fafb; 
                    padding: 30px; 
                    text-align: center; 
                    border-top: 1px solid #e5e7eb; 
                    color: #6b7280; 
                    font-size: 14px; 
                }
                .footer a { 
                    color: #16a34a; 
                    text-decoration: none; 
                }
                @media (max-width: 600px) {
                    .email-container { margin: 10px; }
                    .header, .content { padding: 25px 20px; }
                    .header h1 { font-size: 24px; }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>🎉 Tebrikler!</h1>
                    <p>KapTaze Restaurant Platform'una hoşgeldiniz</p>
                </div>
                
                <div class="content">
                    <div class="congratulations">
                        <h2>Başvurunuz Onaylandı!</h2>
                        <p>Sayın <strong>${application.firstName} ${application.lastName}</strong>,</p>
                        <p><strong>${application.businessName}</strong> işletmenizin KapTaze platformuna katılım başvurusu onaylanmıştır.</p>
                    </div>
                    
                    <div class="credentials-box">
                        <h3>🔐 Restoran Panel Giriş Bilgileriniz</h3>
                        <p>Aşağıdaki bilgilerle restoran yönetim panelinize giriş yapabilirsiniz:</p>
                        
                        <div class="credential-item">
                            <span class="credential-label">👤 Kullanıcı Adı:</span>
                            <div class="credential-value">${credentials.username}</div>
                        </div>
                        
                        <div class="credential-item">
                            <span class="credential-label">🔒 Şifre:</span>
                            <div class="credential-value">${credentials.password}</div>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <a href="https://kaptaze.com/restaurant-panel.html" class="login-button">
                                🏪 Restoran Paneline Giriş Yap
                            </a>
                        </div>
                    </div>
                    
                    <div class="warning-box">
                        <strong>⚠️ Güvenlik Uyarısı:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Giriş bilgilerinizi kimseyle paylaşmayın</li>
                            <li>İlk girişinizde şifrenizi değiştirin</li>
                            <li>Bu e-postayı güvenli bir yerde saklayın</li>
                        </ul>
                    </div>
                    
                    <div class="info-section">
                        <h3>📱 Restoran Panelinde Neler Yapabilirsiniz?</h3>
                        <ul style="padding-left: 20px; margin: 10px 0;">
                            <li><strong>Paket Yönetimi:</strong> Özel fiyatlı paketlerinizi ekleyin ve düzenleyin</li>
                            <li><strong>Sipariş Takibi:</strong> Gelen siparişleri gerçek zamanlı takip edin</li>
                            <li><strong>İstatistikler:</strong> Satış performansınızı analiz edin</li>
                            <li><strong>Profil Yönetimi:</strong> İşletme bilgilerinizi güncelleyin</li>
                            <li><strong>Müşteri İletişimi:</strong> Müşterilerinizle doğrudan iletişim kurun</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="font-size: 16px; color: #374151;">
                            <strong>Başvuru Numaranız:</strong> 
                            <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
                                ${application.applicationId}
                            </code>
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <p>Herhangi bir sorunuz olursa bizimle iletişime geçebilirsiniz:</p>
                        <p>
                            <strong>📧 Destek:</strong> <a href="mailto:destek@kaptaze.com">destek@kaptaze.com</a><br>
                            <strong>📞 Telefon:</strong> <a href="tel:+902121234567">+90 (212) 123 45 67</a>
                        </p>
                    </div>
                </div>
                
                <div class="footer">
                    <p><strong>KapTaze Restaurant Platform</strong></p>
                    <p>Lezzet ve teknoloji buluşuyor • <a href="https://kaptaze.com">kaptaze.com</a></p>
                    <p style="margin-top: 15px; font-size: 12px;">
                        Bu e-posta size ${application.applicationId} başvuru numaralı başvurunuzla ilgili olarak gönderilmiştir.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateRejectionEmailHTML(application, reason) {
        return `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>KapTaze Başvuru Sonucu</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333333; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background-color: #f8fafc;
                }
                .email-container { 
                    background: white; 
                    border-radius: 16px; 
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
                    overflow: hidden; 
                    margin: 20px;
                }
                .header { 
                    background: linear-gradient(135deg, #ef4444, #f87171); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                }
                .content { 
                    padding: 40px 30px; 
                }
                .reason-box { 
                    background: #fef2f2; 
                    border: 1px solid #fecaca; 
                    border-radius: 8px; 
                    padding: 20px; 
                    margin: 20px 0; 
                }
                .footer { 
                    background: #f9fafb; 
                    padding: 30px; 
                    text-align: center; 
                    border-top: 1px solid #e5e7eb; 
                    color: #6b7280; 
                    font-size: 14px; 
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>KapTaze Başvuru Sonucu</h1>
                </div>
                
                <div class="content">
                    <p>Sayın <strong>${application.firstName} ${application.lastName}</strong>,</p>
                    
                    <p><strong>${application.businessName}</strong> işletmenizin KapTaze platformuna katılım başvurusunu inceledik.</p>
                    
                    <div class="reason-box">
                        <h3>📋 Başvuru Durumu</h3>
                        <p><strong>Durum:</strong> Reddedildi</p>
                        <p><strong>Sebep:</strong> ${reason}</p>
                    </div>
                    
                    <p>Gerekli düzenlemeleri yaparak tekrar başvurabilirsiniz:</p>
                    <p><a href="https://kaptaze.com/customer-registration-v2.html">Yeni Başvuru Yap</a></p>
                    
                    <p>Herhangi bir sorunuz için: <a href="mailto:destek@kaptaze.com">destek@kaptaze.com</a></p>
                </div>
                
                <div class="footer">
                    <p><strong>KapTaze Restaurant Platform</strong></p>
                    <p>Başvuru Numaranız: ${application.applicationId}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    simulateEmailSending(type, application, data) {
        console.log(`📧 DEMO: Simulating ${type} email to ${application.email}`);
        
        const simulationResults = {
            approval: {
                success: true,
                messageId: `demo-approval-${Date.now()}`,
                timestamp: new Date().toISOString(),
                demo: true,
                message: `Demo: Approval email sent to ${application.email} with credentials: ${data.username}/${data.password}`
            },
            rejection: {
                success: true,
                messageId: `demo-rejection-${Date.now()}`,
                timestamp: new Date().toISOString(),
                demo: true,
                message: `Demo: Rejection email sent to ${application.email} with reason: ${data.reason}`
            }
        };

        // Show demo notification
        if (window.adminDashboard && window.adminDashboard.showNotification) {
            const message = type === 'approval' 
                ? `Demo: Onay e-postası gönderildi (${application.email})`
                : `Demo: Red e-postası gönderildi (${application.email})`;
            
            window.adminDashboard.showNotification('success', message);
        }

        // Log to console with nice formatting
        console.log(`
        📧 ============= DEMO EMAIL SENT =============
        Type: ${type.toUpperCase()}
        To: ${application.email}
        From: ${this.fromName} <${this.fromEmail}>
        Subject: ${this.templates[type].subject}
        ${type === 'approval' ? `
        Credentials:
        - Username: ${data.username}
        - Password: ${data.password}
        - Login URL: https://kaptaze.com/restaurant-panel.html
        ` : `
        Reason: ${data.reason}
        `}
        ==========================================
        `);

        return simulationResults[type];
    }

    logEmailActivity(type, email, result) {
        const activity = {
            type: type,
            email: email,
            messageId: result.messageId,
            timestamp: new Date().toISOString(),
            demo: result.demo || false,
            success: result.success
        };

        // Store in localStorage for admin panel tracking
        const emailLog = JSON.parse(localStorage.getItem('email_activity_log') || '[]');
        emailLog.unshift(activity);
        
        // Keep only last 100 activities
        if (emailLog.length > 100) {
            emailLog.splice(100);
        }
        
        localStorage.setItem('email_activity_log', JSON.stringify(emailLog));
        
        console.log('📝 Email activity logged:', activity);
    }

    generateCredentials(application) {
        // Generate secure restaurant login credentials
        const username = this.generateUsername(application);
        const password = this.generateSecurePassword();
        
        return {
            username: username,
            password: password,
            generatedAt: new Date().toISOString(),
            applicationId: application.applicationId
        };
    }

    generateUsername(application) {
        // Generate username based on business name and ID
        const businessName = application.businessName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 12);
            
        const timestamp = Date.now().toString().slice(-4);
        
        return `${businessName}${timestamp}`;
    }

    generateSecurePassword() {
        // Generate a secure, memorable password
        const adjectives = ['Güzel', 'Hızlı', 'Taze', 'Leziz', 'Kalite', 'Premium'];
        const nouns = ['Lezzet', 'Tatlar', 'Menü', 'Servis', 'Restoran', 'Mutfak'];
        const numbers = Math.floor(Math.random() * 9000) + 1000;
        
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        
        return `${adjective}${noun}${numbers}`;
    }

    getEmailActivityLog() {
        return JSON.parse(localStorage.getItem('email_activity_log') || '[]');
    }

    clearEmailLog() {
        localStorage.removeItem('email_activity_log');
        console.log('📝 Email activity log cleared');
    }
}

// Global instance for easy access
window.sendGridService = new SendGridService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SendGridService;
}