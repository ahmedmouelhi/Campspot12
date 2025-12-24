import { Request, Response } from 'express';
import Newsletter from '../models/Newsletter';
import Logger from '../utils/logger';
import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = async () => {
    // If SMTP credentials are provided in environment, use them
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        Logger.info('📧 Using configured SMTP server');
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Otherwise, create a test account with Ethereal (for development/testing)
    try {
        const testAccount = await nodemailer.createTestAccount();
        Logger.info('📧 Using Ethereal test email account (emails won\'t be sent to real addresses)');
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    } catch (error) {
        Logger.error('Failed to create test email account:', error);
        throw error;
    }
};

// Subscribe to newsletter
export const subscribe = async (req: Request, res: Response) => {
    try {
        const { email, source } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Check if email already exists
        const existingSubscription = await Newsletter.findOne({ email: email.toLowerCase() });

        if (existingSubscription) {
            if (existingSubscription.isActive) {
                return res.status(400).json({
                    success: false,
                    error: 'This email is already subscribed to our newsletter'
                });
            } else {
                // Reactivate subscription
                existingSubscription.isActive = true;
                existingSubscription.subscribedAt = new Date();
                await existingSubscription.save();

                Logger.info(`Newsletter subscription reactivated: ${email}`);

                // Try to send welcome email
                try {
                    await sendWelcomeEmail(email);
                } catch (emailError) {
                    Logger.error(`Failed to send welcome email:`, emailError);
                }

                return res.json({
                    success: true,
                    message: 'Welcome back! Your subscription has been reactivated.',
                    data: { email: existingSubscription.email }
                });
            }
        }

        // Create new subscription
        const newsletter = new Newsletter({
            email: email.toLowerCase(),
            source: source || 'website'
        });

        await newsletter.save();
        Logger.info(`✅ New newsletter subscription: ${email}`);

        // Send welcome email (don't fail subscription if email fails)
        try {
            await sendWelcomeEmail(email);
            Logger.info(`📧 Welcome email sent to: ${email}`);
        } catch (emailError) {
            Logger.error(`⚠️ Failed to send welcome email to ${email}:`, emailError);
            // Don't fail the subscription if email fails
        }

        res.json({
            success: true,
            message: 'Successfully subscribed! Check your email for a welcome message.',
            data: { email: newsletter.email }
        });

    } catch (error: any) {
        Logger.error('Newsletter subscription error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'This email is already subscribed'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to subscribe to newsletter'
        });
    }
};

// Send welcome email
const sendWelcomeEmail = async (email: string) => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"CampSpot" <noreply@campspot.com>',
            to: email,
            subject: '🏕️ Welcome to CampSpot Newsletter!',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0D8ABC 0%, #0EA5E9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #0D8ABC; }
            .cta { display: inline-block; background: #0D8ABC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏕️ Welcome to CampSpot!</h1>
              <p>Your adventure starts here</p>
            </div>
            <div class="content">
              <h2>Thanks for subscribing!</h2>
              <p>We're thrilled to have you join our community of outdoor enthusiasts. Here's what you can expect from us:</p>
              
              <div class="feature">
                <h3>🌟 Exclusive Deals</h3>
                <p>Be the first to know about special offers and discounts on campsites, activities, and equipment.</p>
              </div>
              
              <div class="feature">
                <h3>📍 New Locations</h3>
                <p>Discover newly added premium campsites and hidden gems before anyone else.</p>
              </div>
              
              <div class="feature">
                <h3>💡 Camping Tips</h3>
                <p>Expert advice, packing lists, and outdoor skills to make every trip unforgettable.</p>
              </div>
              
              <div class="feature">
                <h3>🎯 Seasonal Guides</h3>
                <p>Curated recommendations for the best camping experiences throughout the year.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/campsites" class="cta">
                  Explore Campsites
                </a>
              </div>
              
              <p style="margin-top: 30px;">
                <strong>What makes CampSpot different?</strong>
              </p>
              <ul>
                <li>🌱 100% eco-friendly verified campsites</li>
                <li>🎯 All-in-one booking (sites + activities + equipment)</li>
                <li>👥 24/7 expert support from certified guides</li>
                <li>✓ Every location personally inspected</li>
              </ul>
              
              <p>Ready to start your next adventure? Browse our 500+ premium campsites and book your perfect outdoor escape today!</p>
            </div>
            <div class="footer">
              <p>You're receiving this email because you subscribed to CampSpot newsletter.</p>
              <p>CampSpot - Connecting adventurers with nature since 2019</p>
              <p style="margin-top: 10px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #0D8ABC;">Visit Website</a> | 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact" style="color: #0D8ABC;">Contact Us</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
Welcome to CampSpot Newsletter! 🏕️

Thanks for subscribing! We're thrilled to have you join our community of outdoor enthusiasts.

Here's what you can expect from us:

🌟 Exclusive Deals - Be the first to know about special offers
📍 New Locations - Discover newly added premium campsites
💡 Camping Tips - Expert advice and outdoor skills
🎯 Seasonal Guides - Curated recommendations year-round

What makes CampSpot different?
- 🌱 100% eco-friendly verified campsites
- 🎯 All-in-one booking (sites + activities + equipment)
- 👥 24/7 expert support from certified guides
- ✓ Every location personally inspected

Ready to start your next adventure? Visit ${process.env.FRONTEND_URL || 'http://localhost:5173'}/campsites

CampSpot - Connecting adventurers with nature since 2019
      `
        };

        const info = await transporter.sendMail(mailOptions);

        // Log preview URL for test emails
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            Logger.info(`📧 Preview email at: ${previewUrl}`);
            Logger.info(`   (This is a test email - open the URL above to view it)`);
        }

        return info;
    } catch (error) {
        Logger.error('Error sending welcome email:', error);
        throw error;
    }
};

// Unsubscribe from newsletter
export const unsubscribe = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        const subscription = await Newsletter.findOne({ email: email.toLowerCase() });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                error: 'Email not found in our newsletter list'
            });
        }

        subscription.isActive = false;
        await subscription.save();

        Logger.info(`Newsletter unsubscribed: ${email}`);

        res.json({
            success: true,
            message: 'Successfully unsubscribed from newsletter'
        });

    } catch (error) {
        Logger.error('Newsletter unsubscribe error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to unsubscribe from newsletter'
        });
    }
};

// Get all newsletter subscribers (admin only)
export const getAllSubscribers = async (req: Request, res: Response) => {
    try {
        const subscribers = await Newsletter.find({ isActive: true })
            .select('email subscribedAt source')
            .sort({ subscribedAt: -1 });

        res.json({
            success: true,
            data: subscribers,
            count: subscribers.length
        });

    } catch (error) {
        Logger.error('Get subscribers error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscribers'
        });
    }
};
