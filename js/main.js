// Bruno

/* Teamnaam en Thema */
// Elementen ophalen uit de DOM
const startButton = document.getElementById("startButton");
const nameInput = document.getElementById("name");
const teamName = document.getElementById("TeamName");
const playerNameElement = document.getElementById("playerName");
const themeButtons = document.querySelectorAll(".thema__buttons a");

// Uit te voeren bij het laden van de pagina
window.onload = function () {
    // Functionaliteit voor de startknop op index.html
    if (startButton && nameInput) {
        startButton.onclick = function () {
            const playerName = nameInput.value.trim(); // Haal de naam van de gebruiker op

            // Validatie van de ingevoerde naam
            if (playerName === "") {
                alert("Vul een naam in om de quiz te starten.");
            } else if (playerName.length > 8) {
                alert("Je naam mag niet langer zijn dan 8 tekens.");
            } else {
                // Opslaan van naam en doorgaan naar het themascherm
                sessionStorage.setItem("playername", playerName);
                window.location.href = "pages/themascherm.html";
            }
        };
    }

    // Laad de spelernaam op het themascherm
    const playerName = sessionStorage.getItem("playername");
    if (playerNameElement && playerName) {
        playerNameElement.innerText = playerName;
    }
    if (teamName && playerName) {
        teamName.innerText = "Team: " + playerName;
    }

    // Thema selectieknoppen functionaliteit
    themeButtons.forEach(button => {
        button.onclick = function () {
            const theme = this.innerText; // Haal het geselecteerde thema op
            sessionStorage.setItem("theme", theme); // Sla het thema op in sessionStorage
            window.location.href = "quizscherm.html"; // Ga naar het quizscherm
        };
    });

    // Controleer of de gebruiker op het eindscherm is
    if (window.location.pathname.includes("eindscherm.html")) {
        loadEndScreen(); // Laad de eindschermlogica
    }
};

/* Timer en Quiz Functionaliteit */
let timer; // Variabele voor de timer
let tijd = 15; // Aantal seconden per vraag
let quizData = []; // Array met quizvragen
let currentQuestionIndex = 0; // Huidige vraagindex
let selectedTheme = sessionStorage.getItem("theme"); // Opgehaald thema uit sessionStorage
let userAnswers = []; // Opslag van gegeven antwoorden
let shuffledQuestions = []; // Opslag van geshuffelde vragen

// Timer starten
function startTimer() {
    tijd = 15; // Reset de timer voor elke vraag
    updateTimerDisplay(); // Update de timerweergave
    timer = setInterval(() => {
        tijd--;
        updateTimerDisplay();

        // Controleer of de tijd op is
        if (tijd <= 0) {
            clearInterval(timer); // Stop de timer
            alert("Tijd is om!");
            saveAnswer(null); // Sla een leeg antwoord op
            loadNextQuestion(); // Ga naar de volgende vraag
        }
    }, 1000);
}

// Update de weergave van de timer
function updateTimerDisplay() {
    const timerElement = document.getElementById("timer");
    if (timerElement) {
        timerElement.innerText = tijd;
    }
}

// Quizdata laden en starten
async function loadQuiz() {
    const response = await fetch("../data/quiz.json"); // Haal de quizdata op
    const data = await response.json();
    quizData = shuffleArray(data[selectedTheme]); // Shuffle de vragen
    currentQuestionIndex = 0; // Begin bij de eerste vraag
    loadNextQuestion(); // Laad de eerste vraag
}

// Laad de volgende vraag
function loadNextQuestion() {
    if (currentQuestionIndex >= quizData.length) {
        // Opslaan van antwoorden en navigeren naar eindscherm
        sessionStorage.setItem("userAnswers", JSON.stringify(userAnswers));
        sessionStorage.setItem("shuffledQuestions", JSON.stringify(shuffledQuestions));
        window.location.href = "eindscherm.html";
        return;
    }

    const question = quizData[currentQuestionIndex];
    displayQuestion(question); // Toon de vraag
    currentQuestionIndex++; // Verhoog de vraagindex
    startTimer(); // Start de timer voor de nieuwe vraag
}

// Tycho
// Vraag weergeven
function displayQuestion(question) {
    const header = document.querySelector("h1");
    const image = document.querySelector(".quiz-pictures");
    const buttons = document.querySelectorAll(".quiz-button");

    if (header) header.innerText = question.vraag; // Toon de vraagtekst
    if (image) {
        image.src = question.img; // Toon de afbeelding
        image.alt = question.alt; // Voeg een alternatieve tekst toe
    }

    // Shuffle de antwoorden en sla de volgorde op
    const answers = shuffleArray([...question.antwoorden]);
    shuffledQuestions.push({
        vraag: question.vraag,
        antwoorden: answers,
        correct: answers.indexOf(question.antwoorden[question.correct]), // Index van het juiste antwoord
    });

    // Antwoordknoppen vullen en kliklogica toevoegen
    buttons.forEach((button, index) => {
        button.innerText = answers[index];
        button.onclick = () => {
            clearInterval(timer); // Stop de timer
            saveAnswer(index); // Sla het gekozen antwoord op
            loadNextQuestion(); // Laad de volgende vraag
        };
    });
}

// Antwoord opslaan
function saveAnswer(answerIndex) {
    userAnswers.push(answerIndex);
}

/* Helper functies */
// Functie om een array te shuffelen
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

/* Eindscherm Functionaliteit */
async function loadEndScreen() {
    // Quizgegevens ophalen
    const response = await fetch("../data/quiz.json");
    const data = await response.json();
    const quizData = data[selectedTheme];
    const maxScore = quizData.length;

    // Data ophalen
    const userAnswers = JSON.parse(sessionStorage.getItem("userAnswers")) || [];
    const shuffledQuestions = JSON.parse(sessionStorage.getItem("shuffledQuestions")) || [];
    const playerName = sessionStorage.getItem("playername") || "Speler";

    // Score berekenen
    const playerScore = userAnswers.reduce((score, answer, index) => {
        return answer === shuffledQuestions[index].correct ? score + 1 : score;
    }, 0);

    // Unieke key per thema
    const scoreboardKey = `scoreboard_${selectedTheme}`;
    const scoreboard = JSON.parse(localStorage.getItem(scoreboardKey)) || [];

    // Controleren of speler al op het scoreboard staat
    const existingPlayerIndex = scoreboard.findIndex(entry => entry.name === playerName);
    if (existingPlayerIndex !== -1) {
        // Alleen hoogste score opslaan
        if (scoreboard[existingPlayerIndex].score < playerScore) {
            scoreboard[existingPlayerIndex].score = playerScore;
        }
    } else {
        scoreboard.unshift({ name: playerName, score: playerScore });
    }

    // Scoreboard sorteren en herschikken
    scoreboard.sort((a, b) => b.score - a.score);

    // Plaats speler met 10 punten bovenaan als er meerdere met 10 punten zijn
    if (playerScore === 10) {
        const indexOfPlayer = scoreboard.findIndex(entry => entry.name === playerName);
        if (indexOfPlayer > 0) {
            const [playerEntry] = scoreboard.splice(indexOfPlayer, 1);
            scoreboard.unshift(playerEntry);
        }
    }

    const topScores = scoreboard.slice(0, 3);

    // Opslaan in localStorage
    localStorage.setItem(scoreboardKey, JSON.stringify(scoreboard));

    // Scoreboard in DOM bijwerken
    document.getElementById("playerName").innerText = playerName;
    document.getElementById("playerScore").innerText = playerScore;
    document.getElementById("maxScore").innerText = maxScore;

    const scoreBoardSection = document.querySelector(".scoreBoardSection");
    if (scoreBoardSection) {
        const highScore1 = document.getElementById("highScore1");
        const highScore2 = document.getElementById("highScore2");
        const highScore3 = document.getElementById("highScore3");

        if (highScore1) highScore1.innerText = topScores[0] ? `${topScores[0].name} ${topScores[0].score} punten` : "";
        if (highScore2) highScore2.innerText = topScores[1] ? `${topScores[1].name} ${topScores[1].score} punten` : "";
        if (highScore3) highScore3.innerText = topScores[2] ? `${topScores[2].name} ${topScores[2].score} punten` : "";
    }

    // Vraagresultaten in DOM bijwerken
    const questionSections = document.querySelectorAll(".question-section");
    questionSections.forEach((section, index) => {
        if (index < shuffledQuestions.length) {
            const question = shuffledQuestions[index];
            const userAnswer = userAnswers[index];
            const correctAnswer = question.correct;

            // Vraag invullen
            section.querySelector(".show-answer").innerText = question.vraag;

            // Antwoorden invullen
            section.querySelector("p:nth-of-type(2) span").innerText =
                question.antwoorden[userAnswer] || "Geen antwoord gegeven";
            section.querySelector("p:nth-of-type(3) span").innerText =
                question.antwoorden[correctAnswer];

            // Correct of fout aangeven
            section.querySelector(".answer").style.display = userAnswer === correctAnswer ? "inline" : "none";
            section.querySelector(".wrong-answer").style.display = userAnswer !== correctAnswer ? "inline" : "none";
        } else {
            section.style.display = "none";
        }
    });
}

/* Quiz starten */
// Start de quiz als de gebruiker zich op het quizscherm bevindt
if (window.location.pathname.includes("quizscherm.html")) {
    loadQuiz();
}
