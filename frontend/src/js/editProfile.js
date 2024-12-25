"use strict";

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch user data securely from the server
        const response = await fetch('http://localhost:3002/api/userprofile', { credentials: 'include' });

        if (!response.ok) {
            window.location.href = 'login.html';
            return;
        }

        const user = await response.json();
        console.log(user);

        // form to change data
        const form = document.getElementById('edit-profile-form');
        // profilePicture
        const profilePicture = document.getElementById('profilePicture');
        // username
        const usernameInput = document.getElementById('username');
        usernameInput.placeholder = user.username;
        // email
        const emailInput = document.getElementById('email');
        emailInput.placeholder = user.email;
        // password
        const passwordInput = document.getElementById('password');
        passwordInput.placeholder = "Enter new password";
        // confirm password
        const confirmPasswordInput = document.getElementById('confirmPassword');
        confirmPasswordInput.placeholder = "Confirm new password";

        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // create a new FormData object
            const sendTheData = new FormData(e.target);
            // get the new data
            const newProfilePicture = profilePicture.value;
            const newUsername = usernameInput.value;
            const newPassword = passwordInput.value;
            const newConfirmPassword = confirmPasswordInput.value;
            // check if the password and confirm password are the same
            if (newPassword !== newConfirmPassword) {
                alert("Passwords do not match");
                return;
            }
            // check if the username is empty
            if (newUsername === "") {
                alert("Username cannot be empty");
                return;
            }
            
            // check if the password is empty
            if (newPassword === "") {
                alert("Password cannot be empty");
                return;
            }

            // check if the Confirmpassword is empty
            if (newConfirmPassword === "") {
                alert("Password cannot be empty");
                return;
            }


            // send the new data to the server
            const response = await fetch('http://localhost:3002/api/userprofile/edit', {
                method: 'PUT',
                body: sendTheData,
                credentials: 'include'
            });
            if (response.ok) {
                alert("Profile updated successfully");
                window.location.href = "dashboard.html";
            }
            else {
                alert("Profile update failed. Please try again.");
            }
        });

        

        // Dynamically update the navigation links
        updateNavLinks(user.role);

    } catch (error) {
        console.error('Error fetching user:', error);
        window.location.href = 'login.html';
    }
});

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
function updateNavLinks(role) {
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

    // do the same but for "documentation", only if the user is an admin
    if (role === 'ADMIN') {
        const documentationLi = document.createElement('li');
        const documentationLink = document.createElement('a');
        documentationLink.href = "http://localhost:3002/api-docs";
        documentationLink.textContent = "Documentation";
        documentationLi.classList.add('documentation');
        // Add rel="noopener noreferrer" to external anchor tags (links)
        documentationLink.rel = 'noopener noreferrer';
        // add _blank
        documentationLink.target = '_blank';
        documentationLi.appendChild(documentationLink);
        navLinks.appendChild(documentationLi);
    }

    // Append the Logout link to the nav list if not already present
    if (!document.querySelector('#nav-links a[href="#logout"]')) {
        logoutLink.id = 'logout';
        navLinks.appendChild(logoutLi);
    }
}



