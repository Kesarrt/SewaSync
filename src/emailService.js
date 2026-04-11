import emailjs from '@emailjs/browser';

// 🔑 MASTER CREDENTIALS
const SERVICE_ID = 'service_dm45co5'; 
const PUBLIC_KEY = '9MX1Y95aeEg1hCTh_'; 

// 📄 TEMPLATE CONFIGURATION
const APPROVAL_TEMPLATE_ID = 'template_qzm3p2h'; // Approved Template
const TASK_TEMPLATE_ID = 'template_4jiyfsl';     // Task Assignment Template

// Initialize EmailJS
emailjs.init(PUBLIC_KEY);

/**
 * 1. APPROVAL EMAIL
 * Triggered from Dashboard.jsx when admin clicks the green checkmark.
 */
export const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const templateParams = {
      to_email: userEmail,
      to_name: userName,
    };

    const result = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID || SERVICE_ID,
      import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE || APPROVAL_TEMPLATE_ID,
      templateParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY || PUBLIC_KEY
    );
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * 2. TASK ASSIGNMENT EMAIL
 * Triggered when a specific task is assigned to a volunteer.
 */
export const sendTaskAssignmentEmail = async (userEmail, userName, taskName, location) => {
  try {
    const templateParams = {
      to_email: userEmail,
      to_name: userName,
      task_name: taskName,
      location: location
    };

    const result = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID || SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TASK_TEMPLATE || TASK_TEMPLATE_ID, 
      templateParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY || PUBLIC_KEY
    );
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * 3. PLACEHOLDER (Registration)
 * Prevents errors in RegisterVolunteer.jsx without sending extra mail.
 */
export const sendApplicationReceivedEmail = async (userEmail, userName) => {
  // Can be implemented if needed.
  return null;
};