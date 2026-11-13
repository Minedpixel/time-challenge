
// ========================================
// 1. HTML 요소 가져오기
// ========================================

const timer = document.getElementById("timer");
const duration = document.getElementById("duration");

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const resetBtn = document.getElementById("resetBtn");

const gradeTableBtn = document.getElementById("gradeTableBtn");
const gradeModal = document.getElementById("gradeModal");
const closeGradeBtn = document.getElementById("closeGradeBtn");

const historyModal = document.getElementById("historyModal");
const closeHistoryBtn = document.getElementById("closeHistoryBtn");
const historyList = document.getElementById("historyList");

const message = document.getElementById("message");

const finalTimeDisplay = document.getElementById("finalTime");
const errorDisplay = document.getElementById("error");
const gradeDisplay = document.getElementById("grade");
const gradeRangeDisplay = document.getElementById("gradeRange");
const scoreDisplay = document.getElementById("score");

const celebration = document.getElementById("celebration");
const achievement = document.getElementById("achievement");
const historyBtn = document.getElementById("historyBtn");

// ========================================
// 2. 게임 상태 변수
// ========================================

let startTime = 0;
let targetTime = 0;

let animationId = null;
let playing = false;

let audioContext = null;

let celebrationCanClose = false;
let celebrationTimeout = null;


// 최근 기록 불러오기
let gameRecords = loadRecords();


// ========================================
// 3. 등급 데이터
// ========================================

// 오차 범위는 밀리초 단위

const grades = [
    { name: "PERFECT", maxError: 0, range: "0.000초" },
    { name: "EXCELLENT", maxError: 10, range: "0.001 ~ 0.010초" },
    { name: "GREAT", maxError: 20, range: "0.011 ~ 0.020초" },
    { name: "VERY GOOD", maxError: 40, range: "0.021 ~ 0.040초" },
    { name: "GOOD", maxError: 70, range: "0.041 ~ 0.070초" },
    { name: "NICE", maxError: 100, range: "0.071 ~ 0.100초" },
    { name: "COOL", maxError: 150, range: "0.101 ~ 0.150초" },
    { name: "NOT BAD", maxError: 200, range: "0.151 ~ 0.200초" },
    { name: "SOSO", maxError: 300, range: "0.201 ~ 0.300초" },
    { name: "OKAY", maxError: 500, range: "0.301 ~ 0.500초" },
    { name: "CLOSE", maxError: 750, range: "0.501 ~ 0.750초" },
    { name: "ALMOST", maxError: 1000, range: "0.751 ~ 1.000초" },
    { name: "BAD", maxError: 1500, range: "1.001 ~ 1.500초" },
    { name: "POOP", maxError: 2000, range: "1.501 ~ 2.000초" },
    { name: "TRY AGAIN", maxError: Infinity, range: "2.000초 초과" }
];


// ========================================
// 4. 시간 표시 함수
// ========================================

// 밀리초를 초 단위로 변환
// 소수점 셋째 자리까지 표시

function formatTime(ms) {
    return (Math.round(ms) / 1000).toFixed(3);
}


// ========================================
// 5. 최근 기록 관리
// ========================================

// 브라우저에 저장된 기록 불러오기

function loadRecords() {

    try {
        const savedRecords = localStorage.getItem("timeChallengeRecords");

        if (!savedRecords) {
            return [];
        }

        const parsedRecords = JSON.parse(savedRecords);

        if (!Array.isArray(parsedRecords)) {
            return [];
        }

        return parsedRecords.slice(0, 10);

    } catch (error) {

        console.error("기록을 불러오지 못했습니다.", error);

        return [];
    }
}


// 새로운 기록 저장

function saveRecord(record) {

    // 가장 최근 기록을 맨 앞에 추가
    gameRecords.unshift(record);

    // 최대 10개까지만 유지
    gameRecords = gameRecords.slice(0, 10);

    try {

        localStorage.setItem(
            "timeChallengeRecords",
            JSON.stringify(gameRecords)
        );

    } catch (error) {

        console.error("기록을 저장하지 못했습니다.", error);
    }
}


// 최근 기록 화면에 표시

function renderHistory() {

    historyList.replaceChildren();

    // 기록이 없는 경우
    if (gameRecords.length === 0) {

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.className = "history-empty";
        cell.textContent = "아직 저장된 기록이 없습니다.";

        row.appendChild(cell);
        historyList.appendChild(row);

        return;
    }

    // 저장된 기록을 하나씩 화면에 추가
    gameRecords.forEach((record) => {

        const row = document.createElement("tr");

        const timeCell = document.createElement("td");
        const errorCell = document.createElement("td");
        const scoreCell = document.createElement("td");
        const gradeCell = document.createElement("td");

        timeCell.textContent = record.time + "초";
        errorCell.textContent = record.error;
        scoreCell.textContent = Number(record.score).toLocaleString();
        gradeCell.textContent = record.grade;

        gradeCell.className = "history-grade";

        row.append(
            timeCell,
            errorCell,
            scoreCell,
            gradeCell
        );

        historyList.appendChild(row);
    });
}


// ========================================
// 6. 게임 초기화
// ========================================

// 결과와 PERFECT 축하 화면 초기화

function clearResults() {

    timer.textContent = "0.000";

    finalTimeDisplay.textContent = "-";
    errorDisplay.textContent = "-";
    gradeDisplay.textContent = "-";
    gradeRangeDisplay.textContent = "-";
    scoreDisplay.textContent = "-";

    achievement.hidden = true;

    clearTimeout(celebrationTimeout);

    celebrationTimeout = null;
    celebrationCanClose = false;

    celebration.hidden = true;
}


// 게임 전체를 처음 상태로 되돌림

function resetGame() {

    playing = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    clearResults();

    message.textContent = "게임 시작 버튼을 눌러주세요.";

    startBtn.disabled = false;
    duration.disabled = false;

    retryBtn.hidden = true;

    gradeModal.hidden = true;
    historyModal.hidden = true;
}


// ========================================
// 7. 등급표 팝업
// ========================================

// 등급표 열기

gradeTableBtn.addEventListener("click", () => {

    gradeModal.hidden = false;
});


// 등급표 닫기

closeGradeBtn.addEventListener("click", () => {

    gradeModal.hidden = true;
});

// 최근 기록 팝업 열기
function openHistory() {

    // 게임 중이거나 축하 화면이 표시 중이면 열지 않음
    if (playing || !celebration.hidden) return;

    // 등급표가 열려 있으면 열지 않음
    if (!gradeModal.hidden) return;

    renderHistory();

    historyModal.hidden = false;
}


// 기록 버튼을 클릭하거나 터치하면 팝업 열기
historyBtn.addEventListener("click", openHistory);

// 팝업 바깥쪽 클릭 시 닫기

gradeModal.addEventListener("click", (event) => {

    if (event.target === gradeModal) {
        gradeModal.hidden = true;
    }
});


// ========================================
// 8. 최근 기록 팝업
// ========================================

// 최근 기록 닫기

closeHistoryBtn.addEventListener("click", () => {

    historyModal.hidden = true;
});


// 팝업 바깥쪽 클릭 시 닫기

historyModal.addEventListener("click", (event) => {

    if (event.target === historyModal) {
        historyModal.hidden = true;
    }
});


// R 키를 눌러 최근 기록 열기

document.addEventListener("keydown", (event) => {

    if (event.key.toLowerCase() !== "r") return;

    if (event.repeat) return;

    // 게임 중에는 기록을 열 수 없음
    if (playing) return;

    // 축하 화면이 표시 중이면 무시
    if (!celebration.hidden) return;

    // 다른 팝업이 열려 있으면 무시
    if (!gradeModal.hidden || !historyModal.hidden) return;

    // 입력창에 포커스가 있으면 무시
    const activeElement = document.activeElement;

    if (
        activeElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName)
    ) {
        return;
    }

    event.preventDefault();

    renderHistory();

    historyModal.hidden = false;
});


// ESC 키로 팝업 닫기

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        gradeModal.hidden = true;
        historyModal.hidden = true;
    }
});


// ========================================
// 9. 게임 시작
// ========================================

function startGame() {

    // 이미 게임이 진행 중이면 시작하지 않음
    if (playing) return;

    const inputDuration = Number(duration.value);

    // 입력한 목표 시간 검사
    if (
        !Number.isFinite(inputDuration) ||
        inputDuration < 0.01 ||
        inputDuration > 3600
    ) {

        alert("0.01초부터 3600초 사이의 시간을 입력해 주세요.");

        return;
    }

    // 초를 밀리초로 변환
    targetTime = inputDuration * 1000;

    // 이전 결과 초기화
    clearResults();

    // 시작 시간 기록
    startTime = performance.now();

    playing = true;

    message.textContent = "목표 시간에 맞춰 SPACE!";

    startBtn.disabled = true;
    duration.disabled = true;

    retryBtn.hidden = true;

    // 타이머 시작
    updateTimer();
}


// 시작 버튼 클릭 시 게임 시작

startBtn.addEventListener("click", startGame);


// ========================================
// 10. 타이머 업데이트
// ========================================

function updateTimer() {

    if (!playing) return;

    // 현재까지 경과한 시간 계산
    const elapsed = performance.now() - startTime;

    timer.textContent = formatTime(elapsed);

    // 다음 화면 갱신 예약
    animationId = requestAnimationFrame(updateTimer);
}


// ========================================
// 11. SPACE 키로 게임 종료
// ========================================

document.addEventListener("keydown", (event) => {

    if (event.code !== "Space") return;

    // 게임 중이 아닐 때는 무시
    if (!playing) return;

    // 스페이스바로 페이지가 스크롤되는 현상 방지
    event.preventDefault();

    // 키를 누르고 있을 때 반복 실행 방지
    if (event.repeat) return;

    // 실제 입력 시간 계산
    const inputTime = performance.now() - startTime;

    // 목표 시간과 실제 입력 시간의 차이
    const error = inputTime - targetTime;

    finishGame(inputTime, error);
});


// ========================================
// 12. 등급 판정
// ========================================

function getGrade(errorMs) {

    for (const grade of grades) {

        if (errorMs <= grade.maxError) {
            return grade;
        }
    }

    return grades[grades.length - 1];
}


// ========================================
// 13. 게임 결과 계산
// ========================================

function finishGame(inputTime, error) {

    playing = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // 입력 시간을 밀리초 단위로 반올림
    const roundedInputTime = Math.round(inputTime);

    // 오차의 절댓값을 먼저 반올림
    const errorMs = Math.round(Math.abs(error));

    // 반올림된 오차를 초로 변환
    const displayedError = errorMs / 1000;

    // 실제 오차 방향에 따라 부호 결정
    const sign = error > 0 ? "+" : error < 0 ? "-" : "";

    // 최종 시간 표시
    timer.textContent = formatTime(roundedInputTime);
    finalTimeDisplay.textContent = formatTime(roundedInputTime);

    // 오차 표시
    errorDisplay.textContent =
        `${sign}${displayedError.toFixed(3)}초`;

    // 등급 판정
    const grade = getGrade(errorMs);

    gradeDisplay.textContent = grade.name;
    gradeRangeDisplay.textContent = grade.range;

    // 점수 계산
    const score = Math.round(
        1000 * Math.pow(0.5, errorMs / 100)
    );

    scoreDisplay.textContent = score;

    // 최근 기록 저장
    saveRecord({

        time: formatTime(roundedInputTime),

        error: `${sign}${displayedError.toFixed(3)}초`,

        score: score,

        grade: grade.name
    });


    // PERFECT인 경우
    if (grade.name === "PERFECT") {

        message.textContent = "완벽한 타이밍!";

        achievement.hidden = false;
        achievement.textContent = "👑 타이밍의 왕! 👑";

        celebrate();

    } else {

        achievement.hidden = true;

        // 빠르게 눌렀는지 늦게 눌렀는지 표시
        message.textContent = error < 0
            ? "목표 시간보다 일찍 눌렀습니다."
            : "목표 시간보다 늦게 눌렀습니다.";

        // 등급에 맞는 효과음 재생
        playGradeSound(grade.name);
    }

    // 게임 종료 후 버튼 활성화
    startBtn.disabled = false;
    duration.disabled = false;

    retryBtn.hidden = false;
}


// ========================================
// 14. 등급별 효과음
// ========================================

function playGradeSound(gradeName) {

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    // 등급별 음계 설정
    const soundPatterns = {

        "EXCELLENT": [1046.50, 1318.51],
        "GREAT": [987.77, 1174.66],
        "VERY GOOD": [880.00, 1046.50],
        "GOOD": [783.99, 987.77],
        "NICE": [739.99, 880.00],
        "COOL": [698.46, 783.99],
        "NOT BAD": [659.25, 783.99],
        "SOSO": [587.33, 698.46],
        "OKAY": [523.25, 659.25],
        "CLOSE": [493.88, 587.33],
        "ALMOST": [440.00, 523.25],
        "BAD": [392.00, 349.23],
        "POOP": [329.63, 293.66],
        "TRY AGAIN": [261.63, 196.00]
    };

    const notes = soundPatterns[gradeName];

    if (!notes) return;

    const start = audioContext.currentTime;

    // 낮은 등급은 sawtooth 음색 사용
    const type =
        ["BAD", "POOP", "TRY AGAIN"].includes(gradeName)
            ? "sawtooth"
            : "triangle";

    notes.forEach((frequency, index) => {

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        const noteStart = start + index * 0.13;

        gain.gain.setValueAtTime(0.001, noteStart);

        gain.gain.exponentialRampToValueAtTime(
            0.12,
            noteStart + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            noteStart + 0.22
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(noteStart);
        oscillator.stop(noteStart + 0.23);
    });
}


// ========================================
// 15. PERFECT 축하 효과
// ========================================

function celebrate() {

    celebration.hidden = false;

    celebrationCanClose = false;

    const celebrationMessage =
        celebration.querySelector("p");

    celebrationMessage.textContent = "완벽한 타이밍!";

    clearTimeout(celebrationTimeout);

    // 3초 후 축하 화면을 닫을 수 있도록 설정
    celebrationTimeout = setTimeout(() => {

        celebrationCanClose = true;

        celebrationMessage.textContent =
            "아무 곳이나 클릭하여 닫기";

    }, 3000);


    // PERFECT 전용 효과음
    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    // 밝은 상승 음계
    const notes = [
        523.25,
        659.25,
        783.99,
        1046.50,
        1318.51
    ];

    notes.forEach((frequency, index) => {

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.frequency.value = frequency;
        oscillator.type = "triangle";

        const time = audioContext.currentTime + index * 0.14;

        gain.gain.setValueAtTime(0.001, time);

        gain.gain.exponentialRampToValueAtTime(
            0.16,
            time + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            time + 0.35
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(time);
        oscillator.stop(time + 0.36);
    });
}


// 축하 화면 클릭 시 닫기

celebration.addEventListener("click", (event) => {

    event.stopPropagation();

    // 3초가 지나기 전에는 닫히지 않음
    if (!celebrationCanClose) return;

    clearTimeout(celebrationTimeout);

    celebrationTimeout = null;
    celebrationCanClose = false;

    // 축하 화면만 닫고 결과는 유지
    celebration.hidden = true;
});


// ========================================
// 16. 다시 도전하기
// ========================================

// 다시 도전하기 버튼

retryBtn.addEventListener("click", resetGame);


// ========================================
// 17. Enter 키 처리
// ========================================

// Enter 키를 누르면 첫 게임 시작 또는 다시 도전

document.addEventListener("keydown", (event) => {

    if (event.key !== "Enter") return;

    // 키를 누르고 있는 동안 반복 실행 방지
    if (event.repeat) return;

    // 게임이 진행 중이면 무시
    if (playing) return;

    // 등급표나 최근 기록이 열려 있으면 무시
    if (!gradeModal.hidden || !historyModal.hidden) return;

    // PERFECT 축하 화면이 열려 있으면 무시
    if (!celebration.hidden) return;

    // Enter의 기본 동작 방지
    event.preventDefault();

    // 결과가 없는 첫 시작 상태
    if (retryBtn.hidden) {

        startGame();

        return;
    }

    // 결과가 있는 경우 초기화 후 다시 시작
    resetGame();

    startGame();
});


// ========================================
// 18. 상단 다시하기 버튼
// ========================================

resetBtn.addEventListener("click", resetGame);


// ========================================
// 19. 페이지 최초 실행
// ========================================

// 페이지가 열리면 게임 초기화

resetGame();

// 최근 기록 화면 준비

renderHistory();
