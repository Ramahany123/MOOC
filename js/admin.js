import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInAnonymously, getUsers } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCnCovkec0YaXmgpcnNLx1qiCpGG7-iipU",
  authDomain: "educational-site-f1fac.firebaseapp.com",
  projectId: "educational-site-f1fac",
  storageBucket: "educational-site-f1fac.firebasestorage.app",
  messagingSenderId: "868437050505",
  appId: "1:868437050505:web:8ca5d61feee67a67647258"
};

// --- Constants ---
const TOTAL_VIDEOS = 4;
const TOTAL_AUDIOS = 3;

// ✅ Updated quiz names to match your DB
const QUIZ_NAMES = ['quiz_1', 'quiz_2', 'quiz_3', 'quiz_4'];
const QUIZ_QUESTIONS = { quiz_1: 7, quiz_2: 7, quiz_3: 6, quiz_4: 6 };

let db, auth;

async function initializeAndAuthenticate() {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);

    await signInAnonymously(auth);
    console.log("Signed in anonymously to fetch admin data.");

    fetchAdminData();
  } catch (error) {
    console.error("Firebase initialization/authentication error:", error);
  }
}

async function fetchAdminData() {
  const tableBody = document.getElementById('stats-table-body');
  try {
    // 1. Fetch the tracking data
    const trackingSnapshot = await get(ref(db, 'tracking'));
    const trackingData = trackingSnapshot.val() || {};

    // 2. Fetch the users data
    const usersSnapshot = await get(ref(db, 'users'));
    const users = usersSnapshot.val() || {};

    // Check if data was retrieved (you need both for statistics)
    if (Object.keys(trackingData).length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No student tracking data found.</td></tr>';
        // You may still show 0s in the cards by calling processStatistics(users, {})
        processStatistics({}, {}); 
        return;
    }

    // Process both sets of data
    processStatistics(users, trackingData);
  } catch (error) {
    // This will catch any permission errors (PERMISSION_DENIED)
    console.error("Error fetching admin data (Check Firebase Rules!):", error);
    
    // Update UI to show the error
    document.getElementById('total-students').textContent = 'N/A';
    document.getElementById('avg-completion').textContent = 'N/A';
    document.getElementById('avg-quiz-score').textContent = 'N/A';
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-red-500">❌ Data fetch failed. Check console for "PERMISSION_DENIED" errors.</td></tr>';
  }
}

function processStatistics(users, trackingData) {
  const studentUIDs = Object.keys(trackingData);
  const totalStudents = studentUIDs.length;

  let totalCompletionSum = 0;
  let totalQuizScoreSum = 0;
  let quizCount = 0;
  let tableData = [];

  for (const uid of studentUIDs) {
    const studentTracking = trackingData[uid];
    const userName = users[uid]?.name || uid; // fallback to uid if no name

    // ✅ Videos and audios tracked dynamically
    const videoTrack = studentTracking.video_tracking || {};
    const audioTrack = studentTracking.audio_tracking || {};

    const completedVideos = countCompleted(videoTrack);
    const completedAudios = countCompleted(audioTrack);

    const totalCompletedItems = completedVideos + completedAudios;
    const totalAvailableItems = TOTAL_VIDEOS + TOTAL_AUDIOS;
    const completionRate = totalAvailableItems > 0 ? (totalCompletedItems / totalAvailableItems) : 0;
    totalCompletionSum += completionRate;

    // ✅ Quizzes
    const quizzes = studentTracking.quizzes || {};
    let studentQuizScores = {};

    for (const quizId of QUIZ_NAMES) {
      const quizResult = quizzes[quizId];
      if (quizResult && quizResult.score !== undefined) {
        totalQuizScoreSum += quizResult.score;
        quizCount++;
        // just show percentage instead of correct count
        studentQuizScores[quizId] = quizResult.score + '%';
      } else {
        studentQuizScores[quizId] = 'N/A';
      }
    }

    tableData.push({
      name: userName,
      videosCompleted: completedVideos,
      audiosCompleted: completedAudios,
      quizResults: studentQuizScores
    });
  }

  // ✅ Compute averages
  const avgCompletion = totalStudents > 0 ? (totalCompletionSum / totalStudents) * 100 : 0;
  const avgQuizScore = quizCount > 0 ? totalQuizScoreSum / quizCount : 0;

  document.getElementById('total-students').textContent = totalStudents;
  document.getElementById('avg-completion').textContent = avgCompletion.toFixed(1) + '%';
  document.getElementById('avg-quiz-score').textContent = avgQuizScore.toFixed(1) + '%';

  generateStudentTable(tableData);
}

function countCompleted(track) {
  let count = 0;
  for (const key in track) {
    if (track[key].completed === true) count++;
  }
  return count;
}

function generateStudentTable(data) {
  const tableBody = document.getElementById('stats-table-body');
  tableBody.innerHTML = '';
  data.forEach(student => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td class="student-name">${student.name}</td>
      <td>${createProgressCell(student.videosCompleted, TOTAL_VIDEOS)}</td>
      <td>${createProgressCell(student.audiosCompleted, TOTAL_AUDIOS)}</td>
      <td>${createQuizScoreSpan(student.quizResults.quiz_1)}</td>
      <td>${createQuizScoreSpan(student.quizResults.quiz_2)}</td>
      <td>${createQuizScoreSpan(student.quizResults.quiz_3)}</td>
      <td>${createQuizScoreSpan(student.quizResults.quiz_4)}</td>
    `;
  });
}

function createProgressCell(completed, total) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  return `
    <div class="progress-cell">
      <div class="progress-bar bg-gray-200 rounded-full h-2.5">
        <div class="progress-bar-fill h-2.5 rounded-full bg-blue-500" style="width: ${percentage.toFixed(0)}%;"></div>
      </div>
      <span class="text-xs text-gray-500 mt-1">${completed}/${total}</span>
    </div>`;
}

function createQuizScoreSpan(result) {
  if (result === 'N/A') return `<span class="text-gray-400">N/A</span>`;
  const score = parseInt(result);
  let scoreClass = 'text-red-500';
  if (score >= 80) scoreClass = 'text-green-600 font-bold';
  else if (score >= 50) scoreClass = 'text-yellow-600';
  return `<span class="${scoreClass}">${result}</span>`;
}

document.addEventListener('DOMContentLoaded', initializeAndAuthenticate);
