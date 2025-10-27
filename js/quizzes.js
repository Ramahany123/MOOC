import { ref, update, get, child, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
    // ... (Existing QUIZ DATA, STATE VARIABLES, and DOM ELEMENTS remain the same) ...

    // --- QUIZ DATA ---
    const quizData = {
        // ... (existing quiz data) ...
        "quiz-1": {
            title: "Découvrir ma famille",
            questions: [
                { type: "mcq", question: "Complète : C'est ______ père.", options: ["mon", "ma", "mes"], answer: "mon" },
                { type: "mcq", question: "Quelle est la phrase correcte?", options: ["C'est ma mère.", "C'est mon mère."], answer: "C'est ma mère." },
                { type: "mcq", question: "Qui est la sœur de ton père?", options: ["ma tante", "ma mère", "ma grand-mère"], answer: "ma tante" },
                { type: "written", question: "Complète la phrase: Voici ma ______.", answers: ["sœur", "soeur", "mère", "mere"] },
                { type: "mcq", question: "Les sons [ã] et [õ] sont des voyelles nasales.", options: ["Vrai", "Faux"], answer: "Vrai" },
                { 
                    type: "match", 
                    question: "Relie les deux colonnes :", 
                    columnA: ["mon père", "ma mère", "ma sœur", "mon frère"], 
                    columnB: ["le papa", "la maman", "la fille de mes parents", "le garçon de mes parents"], 
                    answer: { "mon père": "le papa", "ma mère": "la maman", "ma sœur": "la fille de mes parents", "mon frère": "le garçon de mes parents" } 
                },
                { type: "written", question: "Écris une phrase avec « Voici » et un membre de ta famille.", answers: ["voici ma mere", "voici ma mère", "voici ma soeur", "voici ma sœur", "voici mon pere", "voici mon père", "voici mon frere", "voici mon frère"] },
            ],
        },
        "quiz-2": {
            title: "Poser des questions sur la famille",
            questions: [
                { type: "mcq", question: "Complète la question: Tu ______ un frère ?", options: ["as", "ai", "a"], answer: "as" },
                { type: "written", question: "Réponds à la question : Tu as une sœur ?", answers: ["Oui, j'ai une sœur", "Non, je n'ai pas de sœur", "Oui, j'ai une soeur", "Non, je n'ai pas de soeur"] },
                { type: "mcq", question: "Quelle phrase est négative?", options: ["J'ai un frère.", "Je n'ai pas de frère."], answer: "Je n'ai pas de frère." },
                { type: "written", question: "Écris la phrase correcte avec la liaison : Tu ___ un frère ?", answers: ["as"] },
                { type: "mcq", question: "Dans la question, la voix monte à la fin.", options: ["Vrai", "Faux"], answer: "Vrai" },
                { type: "written", question: "Réécris la phrase en forme de question : Tu as une sœur.", answers: ["As-tu une sœur ?", "Tu as une sœur ?", "As tu une sœur", "As-tu une soeur ?", "Tu as une soeur ?", "As tu une soeur"] },
                { type: "mcq", question: "Quelle phrase a une intonation montante (↑)?", options: ["Tu as un frère.", "Tu as un frère ?"], answer: "Tu as un frère ?" },
            ],
        },
        "quiz-3": {
            title: "Compter et dire son âge",
            questions: [
                { type: "mcq", question: "Complète la question: Quel ______ as-tu ?", options: ["âge", "ans", "nombre"], answer: "âge" },
                { type: "mcq", question: "Coche la bonne réponse: J'ai dix ______.", options: ["an", "ans", "âge"], answer: "ans" },
                { type: "mcq", question: "Écris la phrase correcte:", options: ["J'ai dix ans.", "Je suis dix ans."], answer: "J'ai dix ans." },
                { type: "mcq", question: 'Les sons [ã] dans "ans" sont nasalisés.', options: ["Vrai", "Faux"], answer: "Vrai" },
                { 
                    type: "match", 
                    question: "Relie les deux colonnes :", 
                    columnA: ["Il a 5 ans", "Elle a 8 ans", "J'ai 10 ans", "Mon frère a 12 ans"], 
                    columnB: ["cinq ans", "huit ans", "dix ans", "douze ans"], 
                    answer: { "Il a 5 ans": "cinq ans", "Elle a 8 ans": "huit ans", "J'ai 10 ans": "dix ans", "Mon frère a 12 ans": "douze ans" } 
                },
                { type: "mcq", question: "Quelle phrase a une intonation descendante (↓)?", options: ["Quel âge as-tu?", "J'ai dix ans."], answer: "J'ai dix ans." },
            ],
        },
        "quiz-4": {
            title: "Les animaux domestiques",
            questions: [
                { type: "mcq", question: "Complète: J'ai un ______.", options: ["chat", "chien", "poisson"], answer: "chat" },
                { type: "mcq", question: "Quel animal fait 'ouaf ouaf' ?", options: ["le chat", "le chien", "le lapin"], answer: "le chien" },
                { type: "mcq", question: "On fait la liaison dans 'un_hamster'.", options: ["Vrai", "Faux"], answer: "Vrai" },
                { 
                    type: "match", 
                    question: "Relie les deux colonnes :", 
                    columnA: ["le chat", "le chien", "le poisson", "le lapin"], 
                    columnB: ["miaulement", "aboiement", "silence", "saute"], 
                    answer: { "le chat": "miaulement", "le chien": "aboiement", "le poisson": "silence", "le lapin": "saute" } 
                },
                { type: "mcq", question: "Le mot « chien » contient un son nasal.", options: ["Vrai", "Faux"], answer: "Vrai" },
                { type: "mcq", question: "Quelle phrase a une intonation montante (↑)?", options: ["Tu as un chat.", "Tu as un chat ?"], answer: "Tu as un chat ?" },
            ],
        },
    };

    // --- STATE VARIABLES ---
    let currentQuizId = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let questions = [];

    // --- DOM ELEMENTS ---
    const quizSelectionDiv = document.getElementById("quiz-selection");
    const quizMenuDiv = quizSelectionDiv.querySelector(".quiz-menu");
    const quizContainerDiv = document.getElementById("quiz-container");
    const resultsContainerDiv = document.getElementById("results-container");
    const quizTitleEl = document.getElementById("quiz-title");
    const quizProgressEl = document.getElementById("quiz-progress");
    const questionTextEl = document.getElementById("question-text");
    const answerContainerEl = document.getElementById("answer-container");
    const feedbackEl = document.getElementById("feedback");
    const quizActionBtn = document.getElementById("quiz-action-btn");
    const scoreTextEl = document.getElementById("score-text");
    const restartQuizBtn = document.getElementById("restart-quiz-btn");
    const backToMenuBtn = document.getElementById("back-to-menu-btn");

    // ... (Existing init, showQuizSelection, startQuiz, shuffleArray, normalize, showQuestion, 
    //      renderMcqQuestion, renderMatchQuestion, renderWrittenQuestion, 
    //      checkMcqAnswer, checkMatchAnswer, checkWrittenAnswer, handleActionClick, showNextQuestion) ...
    
    function init() {
        showQuizSelection();
        quizActionBtn.addEventListener("click", handleActionClick);
        restartQuizBtn.addEventListener("click", startQuiz);
        backToMenuBtn.addEventListener("click", showQuizSelection);
    }

    function showQuizSelection() {
        quizContainerDiv.style.display = "none";
        resultsContainerDiv.style.display = "none";
        quizSelectionDiv.style.display = "block";

        quizMenuDiv.innerHTML = "";
        for (const quizId in quizData) {
            const button = document.createElement("button");
            button.className = "quiz-choice-btn";
            button.textContent = quizData[quizId].title;
            button.addEventListener("click", () => {
                currentQuizId = quizId;
                startQuiz();
            });
            quizMenuDiv.appendChild(button);
        }
    }

    function startQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        questions = quizData[currentQuizId].questions;
        quizSelectionDiv.style.display = "none";
        resultsContainerDiv.style.display = "none";
        quizContainerDiv.style.display = "block";
        showQuestion();
    }

    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Function to normalize strings for comparison
    const normalize = (str) => {
        if (typeof str !== "string") return "";
        return str
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "") // Remove punctuation
            .replace(/\s+/g, ""); // Remove spaces
    };

    function showQuestion() {
        const question = questions[currentQuestionIndex];
        quizTitleEl.textContent = quizData[currentQuizId].title;
        quizProgressEl.textContent = `Question ${currentQuestionIndex + 1} / ${questions.length}`;
        questionTextEl.textContent = question.question;
        answerContainerEl.innerHTML = "";
        feedbackEl.textContent = "";
        quizActionBtn.style.display = "none";
        quizActionBtn.disabled = false; // Reset disabled state

        switch (question.type) {
            case "mcq":
                renderMcqQuestion(question);
                break;
            case "match":
                renderMatchQuestion(question);
                break;
            case "written":
                renderWrittenQuestion(question);
                break;
        }
    }

    function renderMcqQuestion(question) {
        const shuffledOptions = shuffleArray(question.options);
        shuffledOptions.forEach((option) => {
            const button = document.createElement("button");
            button.className = "option-btn";
            button.textContent = option;
            button.addEventListener("click", () => checkMcqAnswer(option, button));
            answerContainerEl.appendChild(button);
        });
    }

    function renderMatchQuestion(question) {
        const shuffledColumnB = shuffleArray(question.columnB);
        const grid = document.createElement("div");
        grid.className = "matching-grid";

        question.columnA.forEach((itemA) => {
            const itemADiv = document.createElement("div");
            itemADiv.className = "match-item";
            itemADiv.textContent = itemA;

            const select = document.createElement("select");
            select.className = "match-select";
            select.innerHTML =
                `<option value="">Select a match</option>` +
                shuffledColumnB
                    .map((itemB) => `<option value="${itemB}">${itemB}</option>`)
                    .join("");

            grid.appendChild(itemADiv);
            grid.appendChild(select);
        });

        answerContainerEl.appendChild(grid);
        quizActionBtn.textContent = "Check Answers";
        quizActionBtn.style.display = "block";
        quizActionBtn.disabled = true; 

        // Add event listeners to enable button
        const selects = grid.querySelectorAll(".match-select");
        selects.forEach((select) => {
            select.addEventListener("change", () => {
                const allAnswered = Array.from(selects).every((s) => s.value !== "");
                quizActionBtn.disabled = !allAnswered;
            });
        });
    }

    function renderWrittenQuestion(question) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "written-input";
        input.placeholder = "Type your answer here...";
        answerContainerEl.appendChild(input);
        quizActionBtn.textContent = "Check Answer";
        quizActionBtn.style.display = "block";
        quizActionBtn.disabled = true;

        input.addEventListener("input", () => {
            quizActionBtn.disabled = input.value.trim() === "";
        });
    }

    function checkMcqAnswer(selectedOption, selectedButton) {
        const question = questions[currentQuestionIndex];
        const isCorrect = selectedOption === question.answer;

        if (isCorrect) {
            score++;
            selectedButton.classList.add("correct");
            feedbackEl.textContent = "Correct!";
            feedbackEl.style.color = "var(--correct-answer)";
        } else {
            selectedButton.classList.add("incorrect");
            feedbackEl.textContent = `Incorrect. The correct answer is: ${question.answer}`;
            feedbackEl.style.color = "var(--incorrect-answer)";
            const correctButton = Array.from(
                answerContainerEl.querySelectorAll(".option-btn")
            ).find((btn) => btn.textContent === question.answer);
            if (correctButton) correctButton.classList.add("correct");
        }

        Array.from(answerContainerEl.querySelectorAll(".option-btn")).forEach(
            (btn) => (btn.disabled = true)
        );
        quizActionBtn.textContent = "Next Question";
        quizActionBtn.style.display = "block";
        quizActionBtn.disabled = false;
    }

    function checkMatchAnswer() {
        const question = questions[currentQuestionIndex];
        let allCorrect = true;
        const selects = answerContainerEl.querySelectorAll(".match-select");
        const itemsA = question.columnA;

        selects.forEach((select, index) => {
            const selectedValue = select.value;
            const correctValue = question.answer[itemsA[index]];

            if (selectedValue === correctValue) {
                select.classList.add("correct");
            } else {
                select.classList.add("incorrect");
                allCorrect = false;
            }
            select.disabled = true;
        });

        if (allCorrect) {
            score++;
            feedbackEl.textContent = "All matches are correct!";
            feedbackEl.style.color = "var(--correct-answer)";
        } else {
            feedbackEl.textContent =
                "Some matches are incorrect. Correct pairs are highlighted.";
            feedbackEl.style.color = "var(--incorrect-answer)";
        }

        quizActionBtn.textContent = "Next Question";
        quizActionBtn.style.display = "block";
        quizActionBtn.disabled = false;
    }

    function checkWrittenAnswer() {
        const question = questions[currentQuestionIndex];
        const input = answerContainerEl.querySelector(".written-input");

        const userAnswer = normalize(input.value);
        const isCorrect = question.answers.some(
            (correctAnswer) => normalize(correctAnswer) === userAnswer
        );

        if (isCorrect) {
            score++;
            input.classList.add("correct");
            feedbackEl.textContent = "Correct!";
            feedbackEl.style.color = "var(--correct-answer)";
        } else {
            input.classList.add("incorrect");
            feedbackEl.textContent = `Incorrect. A possible answer is: ${question.answers[0]}`;
            feedbackEl.style.color = "var(--incorrect-answer)";
        }

        input.disabled = true;
        quizActionBtn.textContent = "Next Question";
        quizActionBtn.style.display = "block";
        quizActionBtn.disabled = false;
    }

    function handleActionClick() {
        if (quizActionBtn.disabled) return;

        const question = questions[currentQuestionIndex];

        if (
            question.type === "match" &&
            quizActionBtn.textContent === "Check Answers"
        ) {
            checkMatchAnswer();
        } else if (
            question.type === "written" &&
            quizActionBtn.textContent === "Check Answer"
        ) {
            checkWrittenAnswer();
        } else {
            // This case handles "Next Question"
            showNextQuestion();
        }
    }

    function showNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showResults();
        }
    }

    function showResults() {
        quizContainerDiv.style.display = "none";
        resultsContainerDiv.style.display = "block";
        const percentage = Math.round((score / questions.length) * 100);
        scoreTextEl.textContent = `You scored ${score} out of ${questions.length} (${percentage}%)!`;
        
        // ⭐ CRITICAL: Save the quiz result to Firebase with attempt limit
        saveQuizResult(currentQuizId, percentage, score, questions.length);
    }

    // ------------------------------------------------------------------
    // ⭐ MODIFIED CORE: FIREBASE QUIZ SAVING FUNCTION WITH ATTEMPT LIMIT
    // ------------------------------------------------------------------

    /**
     * Gets the current user's phone number from localStorage.
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
     * Saves the student's quiz score to Firebase Realtime Database, 
     * limiting the number of attempts to 3 and storing each score.
     */
    async function saveQuizResult(quizId, scorePercentage, correctCount, totalCount) {
        const userPhone = getCurrentUserPhone();
        const ATTEMPT_LIMIT = 3;
        
        // Helper to display messages
        const displayMessage = (text, isError = false) => {
            const existingMsg = resultsContainerDiv.querySelector('.result-message');
            if (existingMsg) existingMsg.remove();
            
            const msg = document.createElement('div');
            msg.className = `result-message px-4 py-3 rounded mt-4 ${isError ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'}`;
            msg.textContent = text;
            resultsContainerDiv.appendChild(msg);
            
            setTimeout(() => { msg.remove(); }, 5000);
        };

        if (!userPhone || !window.db) {
            displayMessage("Cannot save quiz: User phone is missing or database is not initialized.", true);
            return;
        }

        const quizAttemptsRef = ref(window.db, `tracking/${userPhone}/quizzes/${quizId}/attempts`);

        try {
            const snapshot = await get(quizAttemptsRef);
            const attemptsData = snapshot.val() || {};
            const currentAttempts = Object.keys(attemptsData).length;

            if (currentAttempts >= ATTEMPT_LIMIT) {
                displayMessage(`Quiz attempts limit reached (${ATTEMPT_LIMIT}). Score not saved.`, true);
                return;
            }

            // Determine the next attempt key (e.g., attempt_1, attempt_2, attempt_3)
            const nextAttemptKey = `attempt_${currentAttempts + 1}`;

            const quizDataEntry = {
                score: parseFloat(scorePercentage.toFixed(2)),
                attempt_date: new Date().toISOString(),
                correct_answers: correctCount,
                total_questions: totalCount
            };

            // Path: tracking/PHONE_NUMBER/quizzes/QUIZ_ID/attempts/attempt_N
            const newAttemptRef = ref(window.db, `tracking/${userPhone}/quizzes/${quizId}/attempts/${nextAttemptKey}`);

            await set(newAttemptRef, quizDataEntry);

            // Also update a summary for quick view, if needed (e.g., last score, highest score)
            const summaryRef = ref(window.db, `tracking/${userPhone}/quizzes/${quizId}`);
            await update(summaryRef, {
                last_score: scorePercentage,
                last_attempt_date: new Date().toISOString(),
                total_attempts: currentAttempts + 1,
            });

            displayMessage(`Quiz result saved successfully as ${nextAttemptKey}! Score: ${scorePercentage}%`);
        } catch (error) {
            console.error("Error saving quiz result: ", error);
            displayMessage('Error saving quiz results. Check console for details.', true);
        }
    }

    // --- START THE APP ---
    init();
});