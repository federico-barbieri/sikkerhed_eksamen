"use strict";

async function logIn(event) {
    event.preventDefault();

    // Clear previous error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show-error');
        el.textContent = '';
    });

    const formData = new FormData(logInForm);

    try {
        const email = sanitizeInput(formData.get('email').trim());
        const password = sanitizeInput(formData.get('password').trim());

        // Simple empty check
        if (!email || !password) {
            showError('email', 'Please fill in all fields');
            return;
        }

        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showError('email', 'Invalid email address');
            return;
        }

        // Validate password
       // const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=_]).{8,}$/;
       // if (!passwordPattern.test(password)) {
       //     showError('password', 'Password must be at least 8 characters long, include uppercase, lowercase, digit, and special character');
       //     return;
       // }

        // Send login data to the backend
        const response = await fetch('http://localhost:3002/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include', // Ensure cookies are sent
        });

        const result = await response.json();

        if (response.status !== 200) {
            console.error('Error response:', result);
            alert(result.error || 'Login failed. Please try again.');
            return;
        }

        if (response.status === 200) {
            const { redirect } = result;
        
            // Redirect to the dashboard
            window.location.href = redirect;
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An unexpected error occurred. Please try again.');
    }
}

// Dynamically update the navigation links
function updateNavLinks() {
    const navLinks = document.getElementById('nav-links');

    // Create a new <li> for Logout
    const logoutLi = document.createElement('li');
    const logoutLink = document.createElement('a');
    logoutLink.href = "#";
    logoutLink.textContent = "Logout";
    logoutLi.classList.add('logout');
    logoutLink.addEventListener('click', function (event) {
        event.preventDefault();
        logout();
    });

    logoutLi.appendChild(logoutLink);

    // Append the Logout link to the nav list if not already present
    if (!document.querySelector('#nav-links a[href="#logout"]')) {
        logoutLink.id = 'logout';
        navLinks.appendChild(logoutLi);
    }
}

// Function to log out the user
async function logout() {
    try {
        // Call the backend to clear the token securely
        const response = await fetch('http://localhost:3002/api/logout', { method: 'POST', credentials: 'include' });

        if (response.ok) {
            alert("Logged out successfully!");
            window.location.href = "login.html";
        } else {
            alert("Logout failed. Please try again.");
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Dynamically update the navigation links
updateNavLinks();

const logInForm = document.getElementById('logInForm');
logInForm.addEventListener('submit', logIn);

function showError(field, message) {
    const errorElement = document.getElementById(`${field}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show-error');
    } else {
        alert(message); // Fallback in case the error element is missing
    }
}

function sanitizeInput(input) {
    return input.replace(/[&<>"']/g, function (match) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
    });
}