// Function to validate email format
const isValidEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

function validateQuantity(input) {
    const regex = /^[0-9]*$/; // Accepts only digits (no decimals, negatives, or special characters)
    return regex.test(input);
}

export {
    isValidEmail,
    validateQuantity
}