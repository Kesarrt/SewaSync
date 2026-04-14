import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

/**
 * 1. APPROVAL EMAIL
 * Triggered from Dashboard.jsx when admin clicks the green checkmark.
 */
export const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const emailParams = {
      email: userEmail,
      to_name: userName,
    };

    console.log("Welcome Email Params being sent:", emailParams);

    const result = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_APPROVAL_TEMPLATE_ID,
      emailParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
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
    const emailParams = {
      email: userEmail,
      to_name: userName,
      task_name: taskName,
      location: location
    };

    console.log("Email Params being sent:", emailParams);

    const result = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TASK_TEMPLATE_ID, 
      emailParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
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