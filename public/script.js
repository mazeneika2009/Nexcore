document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mainContactForm');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');

    // Simple Email Regex Validation
    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    };

    form.addEventListener('submit', (e) => {
        let isValid = true;

        if (!validateEmail(emailInput.value)) {
            emailError.style.display = 'block';
            emailInput.style.borderColor = '#ff4d4d';
            isValid = false;
        } else {
            emailError.style.display = 'none';
        }

        if (!isValid) {
            e.preventDefault();
        }
    });
});