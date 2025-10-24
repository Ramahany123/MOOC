import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
// NOTE: I am assuming you have firebase/analytics and other necessary imports in your final file.
// For this code block, I'm focusing purely on the database logic.

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyCnCovkec0YaXmgpcnNLx1qiCpGG7-iipU",
    authDomain: "educational-site-f1fac.firebaseapp.com",
    databaseURL: "https://educational-site-f1fac-default-rtdb.firebaseio.com",
    projectId: "educational-site-f1fac",
    storageBucket: "educational-site-f1fac.firebasestorage.app",
    messagingSenderId: "868437050505",
    appId: "1:868437050505:web:8ca5d61feee67a67647258",
    measurementId: "G-785N8W65W5"
};

// Initialize Firebase (Assuming getDatabase is available globally or imported)
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- CONSTANTS ---
const TOTAL_VIDEOS = 4;
const TOTAL_AUDIOS = 3;
const QUIZ_NAMES = ['quiz-1', 'quiz-2', 'quiz-3', 'quiz-4'];

// Helper to safely get the current user phone number for DB access (used by other scripts)
function getCurrentUserPhone() {
    const loggedUserStr = localStorage.getItem('loggedUser');
    if (loggedUserStr) {
        try {
            return JSON.parse(loggedUserStr).phone;
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Helper to determine completion based on 95% threshold
function isCompleted(item, timeKey) {
    if (item.completed === true) return true;
    if (item[timeKey] !== undefined && item.total_duration !== undefined && item.total_duration > 0) {
        // Use 95% threshold
        return (item[timeKey] / item.total_duration) >= 0.95; 
    }
    return false;
}

async function loadAdminDashboard() {
    // 1. DOM Elements
    const tableBody = document.getElementById("stats-table-body");
    const totalStudentsEl = document.getElementById("total-students");
    const avgCompletionEl = document.getElementById("avg-completion");
    const avgQuizScoreEl = document.getElementById("avg-quiz-score");

    try {
        const snapshot = await get(ref(db));
        if (!snapshot.exists()) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">No data found.</td></tr>`;
            return;
        }

        const data = snapshot.val();
        const users = data.users || {};
        const tracking = data.tracking || {};
        const adminRoles = data.roles?.admin || {}; // Map of Admin UIDs/Phones

        // 2. Aggregate Variables
        let studentCount = 0;
        let totalQuizScore = 0;
        let totalQuizAttempts = 0;
        let totalCompletionRateSum = 0; // Sum of individual student completion rates (0-1)

        let rows = "";

        // 3. Iterate over ALL users
        for (const [userId, userInfo] of Object.entries(users)) {
            // ⭐ CRITICAL FIX: Ensure the admin (01000000000) is skipped
            if (adminRoles[userId] === true) {
                console.log(`Skipping admin user: ${userId}`);
                continue; // Skip the admin user entirely
            }

            // This user is a student, so we count them.
            studentCount++;

            // Use tracking data keyed by userId (phone number)
            const userTracking = tracking[userId] || {};
            const quizzes = userTracking.quizzes || {};
            const videos = userTracking.video_tracking || {};
            const audios = userTracking.audio_tracking || {}; 

            // Detail Metrics
            let videosCompleted = Object.values(videos).filter(v => isCompleted(v, 'last_watched_time')).length;
            let audiosCompleted = Object.values(audios).filter(a => isCompleted(a, 'last_listened_time')).length;
            
            // Completion Rate (based on the total defined content)
            const totalTrackedItems = TOTAL_VIDEOS + TOTAL_AUDIOS;
            const studentCompletedItems = videosCompleted + audiosCompleted;
            const studentCompletionRate = totalTrackedItems > 0 ? (studentCompletedItems / totalTrackedItems) : 0;
            totalCompletionRateSum += studentCompletionRate; 

            // Quiz Scores (Formatted for the table)
            let quizScoresDisplay = [];
            for (const quizId of QUIZ_NAMES) {
                const quiz = quizzes[quizId];
                if (quiz && quiz.score !== undefined) {
                    console.log(`Quiz ${quizId} score: ${quiz.score}`);
                    quizScoresDisplay.push(`${quiz.score}%`);
                    totalQuizScore += quiz.score;
                    totalQuizAttempts++;
                } else {
                    quizScoresDisplay.push("-");
                }
            }
            
            // 4. Generate Table Row
            rows += `
                <tr>
                    <td class="student-name">${userInfo.name}</td>
                    <td>${videosCompleted} / ${TOTAL_VIDEOS}</td>
                    <td>${audiosCompleted} / ${TOTAL_AUDIOS}</td>
                    <td>${quizScoresDisplay[0]}</td>
                    <td>${quizScoresDisplay[1]}</td>
                    <td>${quizScoresDisplay[2]}</td>
                    <td>${quizScoresDisplay[3]}</td>
                </tr>
            `;
        }

        // 5. Calculate Averages for Summary Cards
        const finalAvgQuiz = totalQuizAttempts ? (totalQuizScore / totalQuizAttempts).toFixed(1) : 0;
        const finalAvgCompletion = studentCount > 0 ? (totalCompletionRateSum / studentCount * 100).toFixed(1) : 0;

        // 6. Update DOM
        totalStudentsEl.textContent = studentCount;
        avgQuizScoreEl.textContent = `${finalAvgQuiz}%`;
        avgCompletionEl.textContent = `${finalAvgCompletion}%`;

        tableBody.innerHTML = rows || `<tr><td colspan="8" class="text-center py-4 text-gray-500">No student data found.</td></tr>`;

    } catch (error) {
        console.error("Error fetching data:", error);
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-500">Failed to load data.</td></tr>`;
    }
}

// Ensure loadAdminDashboard() is called after all imports and definitions
// If your existing script already calls it, you can remove this line.
// loadAdminDashboard(); 
