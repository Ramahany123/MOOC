import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, update, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// 'db' and 'auth' are accessed globally as they were attached to the window object 
// in the modular setup script in the HTML.

document.addEventListener('DOMContentLoaded', function () {
    const videoHeaders = document.querySelectorAll('.video-header');
    const videoElements = document.querySelectorAll('.video-player');

    // --- Accordion Logic ---
    videoHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const currentlyActiveItem = document.querySelector('.video-item.active');
            const clickedItem = header.parentElement;

            if (currentlyActiveItem && currentlyActiveItem !== clickedItem) {
                currentlyActiveItem.classList.remove('active');
            }
            clickedItem.classList.toggle('active');
        });
    });

    // --- Video Tracking Logic ---
    // Wait for the authentication state to confirm the user is logged in
    onAuthStateChanged(window.auth, (user) => {
        if (!user) {
            console.warn("User not authenticated. Please log in.");
            // Optionally redirect to login page if user is essential
            return;
        }

        // Add user data to the 'users' node if it doesn't exist (helpful for admin)
        updateUserData(user.uid, user.displayName, user.email);

        videoElements.forEach((video, index) => {
            const videoTitle = video.closest('.video-item').querySelector('.video-title').textContent.trim().replace(/[.:\s]/g, '_');
            const videoId = `video_${index + 1}_${videoTitle}`; 

            // Load last watched time on video load
            loadLastProgress(user.uid, videoId, video);

            let completedOnce = false; 
            
            // 1. Time Update (Save progress periodically)
            let lastSavedTime = 0;
            const SAVE_INTERVAL = 10; // Save every 10 seconds of play

            video.addEventListener('timeupdate', () => {
                const currentTime = Math.floor(video.currentTime);
                if (!video.paused && currentTime > lastSavedTime + SAVE_INTERVAL) {
                    saveProgressToFirebase(user.uid, videoId, video, false);
                    lastSavedTime = currentTime;
                }
            });

            // 2. Pause/Seek (Save progress on pause/manual seek)
            video.addEventListener('pause', () => {
                saveProgressToFirebase(user.uid, videoId, video, false);
            });
            video.addEventListener('seeking', () => {
                saveProgressToFirebase(user.uid, videoId, video, false);
            });

            // 3. Ended (Mark as completed)
            video.addEventListener('ended', () => {
                if (!completedOnce) {
                    saveProgressToFirebase(user.uid, videoId, video, true);
                    completedOnce = true;
                    console.log(`Video ${videoId} marked as completed.`);
                }
            });
        });
    });
});

/**
 * Saves basic user profile data into the 'users' node for admin statistics.
 */
function updateUserData(userId, name, email) {
    const userRef = ref(window.db, `users/${userId}`);
    update(userRef, {
        name: name || 'N/A',
        email: email
    }).catch(error => console.error("Error updating user data:", error));
}


/**
 * Saves the current video progress to Firebase Realtime Database.
 */
function saveProgressToFirebase(userId, videoId, videoElement, isCompleted) {
    // Path: tracking/USER_UID/video_tracking/VIDEO_ID
    const trackingRef = ref(window.db, `tracking/${userId}/video_tracking/${videoId}`);
    const currentTime = Math.floor(videoElement.currentTime);
    const totalDuration = Math.floor(videoElement.duration);

    // Skip saving if video duration is not available yet
    if (isNaN(totalDuration) || totalDuration === 0) return;

    const updateData = {
        video_name: videoElement.closest('.video-item').querySelector('.video-title').textContent.trim(),
        total_duration: totalDuration,
        last_watched_time: currentTime,
        last_update_timestamp: new Date().toISOString()
    };
    
    if (isCompleted) {
        updateData.completed = true;
    }

    update(trackingRef, updateData)
    .catch(error => {
        console.error(`Error saving progress for ${videoId}:`, error);
    });
}


/**
 * Loads the last watched time from Firebase and sets the video time.
 */
async function loadLastProgress(userId, videoId, videoElement) {
    const trackingRef = ref(window.db, `tracking/${userId}/video_tracking/${videoId}`);
    
    try {
        const snapshot = await get(trackingRef);
        const data = snapshot.val();
        if (data && data.last_watched_time) {
            const lastTime = data.last_watched_time;
            // Set the video playback time only after video metadata is loaded
            videoElement.addEventListener('loadedmetadata', () => {
                 if (videoElement.readyState >= 2) {
                    videoElement.currentTime = lastTime;
                    console.log(`Resumed video ${videoId} at ${lastTime}s.`);
                }
            }, { once: true });
        }
    } catch(error) {
        console.error(`Error loading progress for ${videoId}:`, error);
    }
}


// ------------------------------------------------------------------
// ⭐ BONUS: Function to save a Quiz Result (Add this to your Quiz page script)
// ------------------------------------------------------------------

/**
 * Saves the student's quiz score to Firebase.
 * @param {string} userId - The Firebase UID of the student.
 * @param {string} quizId - Unique identifier (e.g., 'quiz_1', 'quiz_lecon_3').
 * @param {number} scorePercentage - Score as a percentage (0-100).
 * @param {number} correctCount - Number of correct answers.
 * @param {number} totalCount - Total number of questions.
 */
export function saveQuizResult(userId, quizId, scorePercentage, correctCount, totalCount) {
    if (!userId) {
        console.error("Cannot save quiz: User ID is missing.");
        return;
    }
    // Path: tracking/USER_UID/quizzes/QUIZ_ID
    const quizRef = ref(window.db, `tracking/${userId}/quizzes/${quizId}`);

    const quizData = {
        score: parseFloat(scorePercentage.toFixed(2)),
        attempt_date: new Date().toISOString(),
        correct_answers: correctCount,
        total_questions: totalCount
    };

    update(quizRef, quizData)
    .then(() => {
        console.log(`Quiz ${quizId} result saved! Score: ${scorePercentage}%`);
    })
    .catch(error => {
        console.error("Error saving quiz result: ", error);
    });
}

// Example usage on your quiz submission page:
// const currentUserId = window.auth.currentUser.uid;
// saveQuizResult(currentUserId, 'quiz_1', 95.5, 19, 20);