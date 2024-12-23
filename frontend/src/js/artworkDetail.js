"use strict";

document.addEventListener('DOMContentLoaded', async () => {
    
    try {
        // get the id of the artwork from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const artworkId = urlParams.get('id');

        // Fetch artwork data securely from the server
        const response = await fetch(`http://localhost:3002/api/artwork/${artworkId}`, { credentials: 'include' });

        if (!response.ok) {
            console.error('Error fetching artwork:', response);
            return;
        } else {
            console.log('Artwork fetched successfully');
        }

        // Parse the JSON response
        const data = await response.json();

        // Extract artwork and comments (if available)
        const { artwork, comments } = data;

        // Fetch comments for the artwork if there are any
        const commentList = document.getElementById('comments-list');
        const commentP = document.getElementById('commentP');

        if ( comments && comments.length > 0) {
            commentP.textContent = 'Comments: ';
            comments.forEach(comment => {
                const commentElement = document.createElement('li');
                commentElement.textContent = comment.userId + ": " + comment.content;
                commentList.appendChild(commentElement);
            });
        } else {
            commentP.textContent = 'No comments for this artwork yet!';
        }

        

        // populate the artwork details
        const artworkImage = document.getElementById('artwork-image')
        artworkImage.src = artwork.image;
        artworkImage.classList.add('artworkImage');
        // get artist
        document.getElementById('artwork-artist').textContent = artwork.artist;

        document.getElementById('artwork-title').textContent = artwork.title;
        document.getElementById('artwork-technique').textContent = `Technique: ${artwork.technique}`;
        document.getElementById('artwork-production_date').textContent = `Production: ${artwork.production_date}`;
     
        // Dynamically update the navigation links
        updateNavLinks();

        // attach the event listener to the comment form
        const commentForm = document.getElementById('commentForm');
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            addComment();
        });

    } catch (error) {
        console.error('Error fetching artwork:', error);
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

// here we handle the comments
async function addComment() {
    try {
        const comment = document.getElementById('comment').value;
        const urlParams = new URLSearchParams(window.location.search);
        const artworkId = urlParams.get('id');
        const response = await fetch(`http://localhost:3002/api/artwork/${artworkId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                artworkId: artworkId,
                comment: comment
            }),
            credentials: 'include'
        });
        const data = await response.json();
        console.log(data);
        if (response.ok) {
            alert("Comment added successfully!");
            document.getElementById('comment').value = '';
        } else {
            alert("Comment failed. Please try again.");
        }
    }
    catch (error) {
        console.error('Error adding comment:', error);
    }
}




