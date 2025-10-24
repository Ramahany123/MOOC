import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, update, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Ensure 'db' and 'auth' are available globally from your HTML setup script (as shown previously)

document.addEventListener('DOMContentLoaded', function () {
    const audioHeaders = document.querySelectorAll('.audio-header');
    const audioElements = document.querySelectorAll('.audio-player');

    // --- Accordion Logic ---
    audioHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const currentlyActiveItem = document.querySelector('.audio-item.active');
            const clickedItem = header.parentElement;

            if (currentlyActiveItem && currentlyActiveItem !== clickedItem) {
                currentlyActiveItem.classList.remove('active');
                
                const audioPlayer = currentlyActiveItem.querySelector('audio');
                if (audioPlayer) {
                  audioPlayer.pause();
                }
            }
            clickedItem.classList.toggle('active');
        });
    });

    // --- Audio Tracking Logic ---
    onAuthStateChanged(window.auth, (user) => {
        if (!user) {
            console.warn("User not authenticated. Audio tracking disabled.");
            return;
        }
        
        audioElements.forEach((audio, index) => {
            // Generate a unique ID for the audio track
            const audioTitle = audio.closest('.audio-item').querySelector('.audio-title') 
                             ? audio.closest('.audio-item').querySelector('.audio-title').textContent.trim().replace(/[.:\s]/g, '_')
                             : `audio_track_${index + 1}`;
            const audioId = `audio_${index + 1}_${audioTitle}`; 

            // Load last listened time on audio load
            loadLastProgress(user.uid, audioId, audio);

            let completedOnce = false; 
            
            // 1. Time Update (Save progress periodically)
            let lastSavedTime = 0;
            const SAVE_INTERVAL = 10; 

            audio.addEventListener('timeupdate', () => {
                const currentTime = Math.floor(audio.currentTime);
                if (!audio.paused && currentTime > lastSavedTime + SAVE_INTERVAL) {
                    saveProgressToFirebase(user.uid, audioId, audio, false);
                    lastSavedTime = currentTime;
                }
            });

            // 2. Pause/Seek (Save progress on pause/manual seek)
            audio.addEventListener('pause', () => {
                saveProgressToFirebase(user.uid, audioId, audio, false);
            });
            audio.addEventListener('seeking', () => {
                saveProgressToFirebase(user.uid, audioId, audio, false);
            });

            // 3. Ended (Mark as completed)
            audio.addEventListener('ended', () => {
                if (!completedOnce) {
                    saveProgressToFirebase(user.uid, audioId, audio, true);
                    completedOnce = true;
                    console.log(`Audio ${audioId} marked as completed.`);
                }
            });
        });
    });
});


/**
 * Saves the current audio progress to Firebase Realtime Database.
 */
function saveProgressToFirebase(userId, audioId, audioElement, isCompleted) {
    // Path: tracking/USER_UID/audio_tracking/AUDIO_ID  <-- KEY CHANGE HERE
    const trackingRef = ref(window.db, `tracking/${userId}/audio_tracking/${audioId}`);
    const currentTime = Math.floor(audioElement.currentTime);
    const totalDuration = Math.floor(audioElement.duration);

    if (isNaN(totalDuration) || totalDuration === 0) return;

    const updateData = {
        audio_name: audioElement.closest('.audio-item').querySelector('.audio-title').textContent.trim(),
        total_duration: totalDuration,
        last_listened_time: currentTime,
        last_update_timestamp: new Date().toISOString()
    };
    
    if (isCompleted) {
        updateData.completed = true;
    }

    update(trackingRef, updateData)
    .catch(error => {
        console.error(`Error saving audio progress for ${audioId}:`, error);
    });
}


/**
 * Loads the last listened time from Firebase and sets the audio time.
 */
async function loadLastProgress(userId, audioId, audioElement) {
    const trackingRef = ref(window.db, `tracking/${userId}/audio_tracking/${audioId}`);
    
    try {
        const snapshot = await get(trackingRef);
        const data = snapshot.val();
        if (data && data.last_listened_time) {
            const lastTime = data.last_listened_time;
            audioElement.addEventListener('loadedmetadata', () => {
                 if (audioElement.readyState >= 2) {
                    audioElement.currentTime = lastTime;
                    console.log(`Resumed audio ${audioId} at ${lastTime}s.`);
                }
            }, { once: true });
        }
    } catch(error) {
        console.error(`Error loading audio progress for ${audioId}:`, error);
    }
}