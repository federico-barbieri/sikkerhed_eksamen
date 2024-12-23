"use strict";

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch user data securely from the server
        const response = await fetch('http://localhost:3002/api/dashboard', { credentials: 'include' });

        if (!response.ok) {
            window.location.href = 'login.html';
            return;
        }

        const user = await response.json();
        console.log(user);

        // Show role-specific functionality
        const userParagraph = document.querySelector('.userReference');
        userParagraph.textContent = `Welcome home, ${user.role === 'ADMIN' ? 'my god' : 'user peasant'}, ${user.username}!`;

        // users profile picture
        const profilePicture = document.getElementById('profilePicture'); 
        profilePicture.classList.add('profilePicture');
        profilePicture.src = `http://localhost:3002${user.profilePicture}`;
        console.log(user.profilePicture);


        // append btn to this div if user is user
        const usersDiv = document.querySelector('.users-div');

        if (user.role === 'ADMIN') {
            fetchUsers(); // Fetch users only if admin
            fetchArtworks(user.role);
        } else if (user.role === 'USER') {
            fetchArtworks(user.role); // Fetch artworks only if user
            document.getElementById('usersH2').textContent = 'Edit profile';
            const profileBtn = document.createElement('button');
            profileBtn.textContent = 'Edit';
            profileBtn.style.cursor = 'pointer';
            profileBtn.addEventListener('click', () => {
                window.location.href = 'http://127.0.0.1:5500/frontend/src/editProfile.html'; // Redirect to the editProfile page
            });
            usersDiv.appendChild(profileBtn);

        }else {
            console.error('Unknown role:', user.role);
        }

        // Dynamically update the navigation links
        updateNavLinks();

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

// if user is user, fetch artworks

async function fetchArtworks(role) {
    try {
        const response = await fetch('http://localhost:3002/api/artworks', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch artworks');
        }

        const artworks = await response.json();

        // Display artworks
        const artworksList = document.querySelector('.artworkList');
        artworksList.classList.add('artworkList');

        artworks.forEach(artwork => {
            const artworkElement = document.createElement('li');
            artworkElement.classList.add('artworkLi');
            const artworkImage = document.createElement('img');
            artworkImage.src = artwork.image;
            artworkImage.style.cursor = 'pointer';

            // create an event listener to redirect to the specific artwork detail page
            artworkImage.addEventListener('click', function () {
                const artworkId = artwork.id; // Get artwork ID
                const encodedArtworkId = encodeURIComponent(artworkId);
                // Redirect to the details page with the ID as a query parameter
                window.location.href = `artworkDetail.html?id=${encodedArtworkId}`;
              });

            const artworkTitle = document.createElement('h3');
            artworkTitle.textContent = `${artwork.title}`;
            const artworkTechnique = document.createElement('p');
            artworkTechnique.textContent = `Technique: ${artwork.technique}`;
            const artworkYear = document.createElement('p');
            artworkYear.textContent = `Production: ${artwork.production_date}`;

            // create delete artwork button if user is admin
            if (role === 'ADMIN') {
                let deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete artwork';
                deleteButton.classList.add('deleteButton');
                deleteButton.addEventListener('click', () => {
                    deleteArtwork(artwork.id);
                });
                artworkElement.appendChild(deleteButton);
            }

            artworkElement.appendChild(artworkImage)
            artworkElement.appendChild(artworkTitle);
            artworkElement.appendChild(artworkTechnique);
            artworkElement.appendChild(artworkYear);

            
            artworksList.appendChild(artworkElement);
        });

    } catch (error) {
        console.error(error);
    }
}

// if user is admin, fetch users

async function fetchUsers() {
    try {
        const response = await fetch('http://localhost:3002/api/admin/users', { credentials: 'include' },
            {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        const users = await response.json();
        // Display users
        let usersContainer = document.querySelector('.userList');

        users.forEach(fetchedUser => {
            let userDiv = document.createElement('div');
            userDiv.classList.add('userDiv');
            let userElement = document.createElement('li');
            userElement.classList.add('userLi');
            userElement.textContent = `
                Username: ${fetchedUser.username} - Email:  ${fetchedUser.email} - Role: ${fetchedUser.role}
            `;
            userDiv.appendChild(userElement);
            
            if (fetchedUser.role !== 'ADMIN') {
                // only add the delete button if the user is NOT an admin
                let deleteButton = document.createElement('button');
                deleteButton.addEventListener('click', () => {
                    deleteUser(fetchedUser.id);
                });
                deleteButton.textContent = 'Delete user';
                deleteButton.classList.add('deleteButton');
                userDiv.appendChild(deleteButton);
            }
            usersContainer.appendChild(userDiv);
        });
    }
    catch (error) {
        console.error(error);
    }
}

// create a function that will delete a user
async function deleteUser(id) {
    try {
        const response = await fetch(`http://localhost:3002/api/admin/users/${id}`,
            {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to delete user');
        }
        
        // Display users
        let usersContainer = document.querySelector('.userList');
        usersContainer.innerHTML = '';
        usersContainer.replaceChildren();
        // fetch users again
        await fetchUsers();
    }
    catch (error) {
        console.error(error);
    }
}

// create a function that will delete an artwork
// create a function that will delete a user
async function deleteArtwork(id) {
    try {
        const response = await fetch(`http://localhost:3002/api/admin/artworks/${id}`,
            {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to delete artwork');
        }
        
        // Display artworks
        let artworksContainer = document.querySelector('.artworkList');
        artworksContainer.replaceChildren();
        // fetch artworks again
        await fetchArtworks();
    }
    catch (error) {
        console.error(error);
    }
}


