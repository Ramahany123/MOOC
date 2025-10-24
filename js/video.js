import { ref, update, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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
    const currentUserPhone = getCurrentUserPhone();
    
    if (!currentUserPhone) {
        console.warn("User not authenticated. Please log in with phone number.");
        // We can skip tracking logic if the user isn't identified.
        return;
    }

    console.log("Tracking videos for user with phone:", currentUserPhone);

    videoElements.forEach((video, index) => {
        const videoTitle = video.closest('.video-item').querySelector('.video-title').textContent.trim().replace(/[.:\s]/g, '_');
        const videoId = `video_${index + 1}_${videoTitle}`; 

        loadLastProgress(currentUserPhone, videoId, video);

        let completedOnce = false; 
        
        let lastSavedTime = 0;
        const SAVE_INTERVAL = 10; 

        video.addEventListener('timeupdate', () => {
            const currentTime = Math.floor(video.currentTime);
            if (!video.paused && currentTime > lastSavedTime + SAVE_INTERVAL) {
                saveProgressToFirebase(currentUserPhone, videoId, video, false);
                lastSavedTime = currentTime;
            }
        });

        video.addEventListener('pause', () => {
            saveProgressToFirebase(currentUserPhone, videoId, video, false);
        });
        video.addEventListener('seeking', () => {
            saveProgressToFirebase(currentUserPhone, videoId, video, false);
        });

        video.addEventListener('ended', () => {
            if (!completedOnce) {
                saveProgressToFirebase(currentUserPhone, videoId, video, true);
                completedOnce = true;
                console.log(`Video ${videoId} marked as completed.`);
            }
        });
    });
});

/**
 * Gets the current user's phone number from your custom auth system
 */
function getCurrentUserPhone() {
    const loggedUserStr = localStorage.getItem('loggedUser');
    if (loggedUserStr) {
        try {
            const user = JSON.parse(loggedUserStr);
            return user.phone; // Extract phone from the stored object
        } catch (e) {
            console.error("Error parsing loggedUser from localStorage:", e);
        }
    }
    return null;
}


/**
 * Saves the current video progress to Firebase Realtime Database.
 */
function saveProgressToFirebase(userPhone, videoId, videoElement, isCompleted) {
    if (!window.db) {
        console.error("Firebase DB not available for saving progress.");
        return;
    }
    
    // Path: tracking/PHONE_NUMBER/video_tracking/VIDEO_ID
    const trackingRef = ref(window.db, `tracking/${userPhone}/video_tracking/${videoId}`);
    const currentTime = Math.floor(videoElement.currentTime);
    const totalDuration = Math.floor(videoElement.duration);

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
    .then(() => {
        // console.log(`Progress saved for user ${userPhone}, video ${videoId}`);
    })
    .catch(error => {
        console.error(`Error saving progress for ${videoId}:`, error);
    });
}

/**
 * Loads the last watched time from Firebase and sets the video time.
 */
async function loadLastProgress(userPhone, videoId, videoElement) {
    if (!window.db) return;
    
    const trackingRef = ref(window.db, `tracking/${userPhone}/video_tracking/${videoId}`);
    
    try {
        const snapshot = await get(trackingRef);
        const data = snapshot.val();
        if (data && data.last_watched_time) {
            const lastTime = data.last_watched_time;
            // Set the video playback time only after video metadata is loaded
            videoElement.addEventListener('loadedmetadata', () => {
                 if (videoElement.readyState >= 2) {
                     videoElement.currentTime = lastTime;
                     console.log(`Resumed video ${videoId} at ${lastTime}s for user ${userPhone}.`);
                 }
            }, { once: true });
        }
    } catch(error) {
        console.error(`Error loading progress for ${videoId}:`, error);
    }
}