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
  const params = {
    email: userEmail,   // Fills {{email}}
    to_name: userName,  // Fills {{to_name}}
  };

  console.log("📨 Sending Approval Email...");

  try {
    const result = await emailjs.send(SERVICE_ID, APPROVAL_TEMPLATE_ID, params, PUBLIC_KEY);
    console.log("✅ Approval Email SUCCESS!", result.text);
    return result;
  } catch (err) {
    console.error("❌ Approval Email FAILED:", err);
    throw err;
  }
};

/**
 * 2. TASK ASSIGNMENT EMAIL
 * Triggered when a specific task is assigned to a volunteer.
 */
export const sendTaskAssignmentEmail = async (userEmail, userName, taskName, location) => {
  const params = {
    email: userEmail,    // Fills {{email}}
    to_name: userName,   // Fills {{to_name}}
    task_name: taskName, // Fills {{task_name}}
    location: location,  // Fills {{location}}
  };

  console.log(`📨 Sending Task Assignment (${taskName}) to:`, userEmail);

  try {
    const result = await emailjs.send(SERVICE_ID, TASK_TEMPLATE_ID, params, PUBLIC_KEY);
    console.log("🎯 Task Assignment Email SUCCESS!");
    return result;
  } catch (err) {
    console.error("❌ Task Assignment Email FAILED:", err);
    throw err;
  }
};

/**
 * 3. PLACEHOLDER (Registration)
 * Prevents errors in RegisterVolunteer.jsx without sending extra mail.
 */
export const sendApplicationReceivedEmail = async () => {
  console.log("ℹ️ Registration email skipped (Free Tier limits).");
  return null;
};