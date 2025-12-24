import nodemailer from 'nodemailer';
import Logger from '../utils/logger';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private isConfigured: boolean = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
        const emailPort = parseInt(process.env.EMAIL_PORT || '587');

        if (!emailUser || !emailPass) {
            Logger.warn('Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env file');
            this.isConfigured = false;
            return;
        }

        try {
            this.transporter = nodemailer.createTransport({
                host: emailHost,
                port: emailPort,
                secure: emailPort === 465, // true for 465, false for other ports
                auth: {
                    user: emailUser,
                    pass: emailPass,
                },
            });

            this.isConfigured = true;
            Logger.info('✅ Email service configured successfully');
        } catch (error: any) {
            Logger.error('Failed to configure email service: ' + error.message);
            this.isConfigured = false;
        }
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        if (!this.isConfigured || !this.transporter) {
            Logger.warn('Email service not configured. Email not sent.');
            return false;
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"CampSpot" <${process.env.EMAIL_USER}>`,
                to: options.to,
                subject: options.subject,
                text: options.text || '',
                html: options.html,
            });

            Logger.info(`Email sent successfully: ${info.messageId}`);
            return true;
        } catch (error: any) {
            Logger.error('Failed to send email: ' + error.message);
            return false;
        }
    }

    // Contact form confirmation email to user
    async sendContactConfirmation(
        userEmail: string,
        userName: string,
        message: string
    ): Promise<boolean> {
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .message-box { background-color: white; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Contacting CampSpot!</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>We've received your message and our team will get back to you as soon as possible, typically within 24-48 hours.</p>
              
              <div class="message-box">
                <strong>Your Message:</strong>
                <p>${message}</p>
              </div>
              
              <p>If you have any urgent concerns, please don't hesitate to call us at <strong>+33 1 23 45 67 89</strong>.</p>
              
              <p>Best regards,<br>The CampSpot Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CampSpot. All rights reserved.</p>
              <p>123 Camping Avenue, 75001 Paris, France</p>
            </div>
          </div>
        </body>
      </html>
    `;

        return this.sendEmail({
            to: userEmail,
            subject: 'Thank you for contacting CampSpot',
            html,
            text: `Hi ${userName},\n\nWe've received your message and our team will get back to you as soon as possible.\n\nYour Message:\n${message}\n\nBest regards,\nThe CampSpot Team`,
        });
    }

    // Contact form notification email to admin
    async sendContactNotification(
        userName: string,
        userEmail: string,
        userPhone: string,
        message: string,
        equipmentInterest: string
    ): Promise<boolean> {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

        if (!adminEmail) {
            Logger.warn('Admin email not configured');
            return false;
        }

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-row { margin: 10px 0; padding: 10px; background-color: white; border-radius: 4px; }
            .label { font-weight: bold; color: #0d9488; }
            .message-box { background-color: white; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Contact Form Submission</h1>
            </div>
            <div class="content">
              <h2>Contact Details</h2>
              
              <div class="info-row">
                <span class="label">Name:</span> ${userName}
              </div>
              
              <div class="info-row">
                <span class="label">Email:</span> <a href="mailto:${userEmail}">${userEmail}</a>
              </div>
              
              <div class="info-row">
                <span class="label">Phone:</span> ${userPhone || 'Not provided'}
              </div>
              
              <div class="info-row">
                <span class="label">Equipment Interest:</span> ${equipmentInterest}
              </div>
              
              <div class="message-box">
                <strong>Message:</strong>
                <p>${message}</p>
              </div>
              
              <p><em>Submitted on ${new Date().toLocaleString()}</em></p>
            </div>
          </div>
        </body>
      </html>
    `;

        return this.sendEmail({
            to: adminEmail,
            subject: `New Contact Form: ${userName}`,
            html,
            text: `New Contact Form Submission\n\nName: ${userName}\nEmail: ${userEmail}\nPhone: ${userPhone || 'Not provided'}\nEquipment Interest: ${equipmentInterest}\n\nMessage:\n${message}\n\nSubmitted on ${new Date().toLocaleString()}`,
        });
    }

    isReady(): boolean {
        return this.isConfigured;
    }
}

export default new EmailService();
