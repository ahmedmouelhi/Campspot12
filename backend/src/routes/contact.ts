import { Router } from 'express';
import { submitContactForm, contactValidation, submitBookingSupportRequest, bookingSupportValidation } from '../controllers/contact';

const router = Router();

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: +33 1 23 45 67 89
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 example: I would like to inquire about camping equipment rentals.
 *               equipmentInterest:
 *                 type: string
 *                 enum: [Tents, Sleeping Bags, Backpacks, Cooking Equipment, Other, None]
 *                 example: Tents
 *     responses:
 *       200:
 *         description: Contact form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Thank you for contacting us! We will get back to you soon.
 *                 data:
 *                   type: object
 *                   properties:
 *                     submitted:
 *                       type: boolean
 *                       example: true
 *                     confirmationSent:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', contactValidation, submitContactForm);

// Booking support route
router.post('/booking-support', bookingSupportValidation, submitBookingSupportRequest);

export default router;
