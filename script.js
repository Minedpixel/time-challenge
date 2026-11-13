
// HTML에서 필요한 요소들을 가져옴
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


// 게임 진행 상태를 저장하는 변수
let startTime = 0;
let targetTime = 0;
let animationId = null;
let playing = false;

// 효과음을 생성하기 위한 오디오 객체
let audioContext = null;

// PERFECT 축하 화면의 닫기 가능 여부와 타이머
let celebrationCanClose = false;
let celebrationTimeout = null;


// 최근 기록을 저장하는 변수
let gameRecords = loadRecords();


// 등급별 이름과 오차 범위를 저장
// maxError는 밀리초 단위
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


// 밀리초를 초 단위로 변환하고 소수점 셋째 자리까지 반올림
function formatTime(ms) {
    return (Math.round(ms) / 1000).toFixed(3);
}


// 저장된 기록을 불러오는 함수
function loadRecords() {

    try {
        const savedRecords = localStorage.getItem("timeChallengeRecords");

        if (!savedRecords) return [];

        const parsedRecords = JSON.parse(savedRecords);

        if (!Array.isArray(parsedRecords)) return [];

        return parsedRecords.slice(0, 10);

    } catch (error) {

        console.error("기록을 불러오지 못했습니다.", error);
        return [];
    }
}


// 새로운 기록을 브라우저에 저장
function saveRecord(record) {

    // 가장 최근 기록을 맨 앞에 추가
    gameRecords.unshift(record);

    // 최근 10개만 남김
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


// 최근 기록 팝업에 기록을 표시
function renderHistory() {

    historyList.replaceChildren();

    // 저장된 기록이 없는 경우
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

    // 저장된 기록을 하나씩 화면에 표시
    gameRecords.forEach((record) => {

        const row = document.createElement("tr");

        const timeCell = document.createElement("td");
        const errorCell = document.createElement("td");
        const scoreCell = document.createElement("td");
        const gradeCell = document.createElement("td");

        timeCell.textContent = record.time + "초";

        // 오차에는 이미 초가 포함되어 있으므로 그대로 표시
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


// 결과 화면과 축하 화면을 초기 상태로 되돌림
function clearResults() {

    timer.textContent = "0.000";

    finalTimeDisplay.textContent = "-";
    errorDisplay.textContent = "-";
    gradeDisplay.textContent = "-";
    gradeRangeDisplay.textContent = "-";
    scoreDisplay.textContent = "-";

    // PERFECT 메시지 초기화
    achievement.hidden = true;
    achievement.textContent = "👑 타이밍의 왕! 👑";

    // 축하 화면 타이머 초기화
    clearTimeout(celebrationTimeout);
    celebrationTimeout = null;

    celebrationCanClose = false;
    celebration.hidden = true;
}


// 게임을 처음 상태로 초기화
function resetGame() {

    playing = false;

    cancelAnimationFrame(animationId);

    clearResults();

    message.textContent = "게임 시작 버튼을 눌러주세요.";

    startBtn.disabled = false;
    duration.disabled = false;

    retryBtn.hidden = true;

    // 열려 있는 팝업 닫기
    gradeModal.hidden = true;
    historyModal.hidden = true;
}


// 등급표 버튼을 누르면 등급표 표시
gradeTableBtn.addEventListener("click", () => {
    gradeModal.hidden = false;
});


// 등급표 닫기 버튼
closeGradeBtn.addEventListener("click", () => {
    gradeModal.hidden = true;
});


// 등급표 바깥쪽을 누르면 닫기
gradeModal.addEventListener("click", (event) => {

    if (event.target === gradeModal) {
        gradeModal.hidden = true;
    }
});


// 최근 기록 닫기 버튼
closeHistoryBtn.addEventListener("click", () => {
    historyModal.hidden = true;
});


// 최근 기록 팝업 바깥쪽을 누르면 닫기
historyModal.addEventListener("click", (event) => {

    if (event.target === historyModal) {
        historyModal.hidden = true;
    }
});


// R 키를 눌러 최근 기록 확인
document.addEventListener("keydown", (event) => {

    if (event.key.toLowerCase() !== "r") return;

    if (event.repeat) return;

    // 게임 진행 중에는 무시
    if (playing) return;

    // PERFECT 축하 화면이 표시되는 동안에는 무시
    if (!celebration.hidden) return;

    // 다른 팝업이 열려 있으면 무시
    if (!gradeModal.hidden || !historyModal.hidden) return;

    // 입력창에 글자를 입력하는 중이면 무시
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


// ESC 키를 누르면 등급표와 최근 기록 팝업 닫기
document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {
        gradeModal.hidden = true;
        historyModal.hidden = true;
    }
});


// 게임 시작 버튼을 눌렀을 때 실행
startBtn.addEventListener("click", () => {

    if (playing) return;

    const inputDuration = Number(duration.value);

    // 목표 시간 입력값 검사
    if (
        !Number.isFinite(inputDuration) ||
        inputDuration < 0.01 ||
        inputDuration > 3600
    ) {
        alert("0.01초부터 3600초 사이의 시간을 입력해 주세요.");
        return;
    }

    // 입력한 초를 밀리초로 변환
    targetTime = inputDuration * 1000;

    // 이전 결과와 축하 화면 초기화
    clearResults();

    // 게임 시작 시각 기록
    startTime = performance.now();

    playing = true;

    message.textContent = "목표 시간에 맞춰 SPACE!";

    startBtn.disabled = true;
    duration.disabled = true;

    retryBtn.hidden = true;

    // 타이머 시작
    updateTimer();
});


// 화면에 경과 시간을 실시간으로 표시
function updateTimer() {

    if (!playing) return;

    const elapsed = performance.now() - startTime;

    // 실시간 시간도 소수점 셋째 자리까지 반올림하여 표시
    timer.textContent = formatTime(elapsed);

    animationId = requestAnimationFrame(updateTimer);
}


// 스페이스바 입력을 감지하여 게임 종료
document.addEventListener("keydown", (event) => {

    if (event.code !== "Space") return;

    if (!playing) return;

    event.preventDefault();

    // 키를 누르고 있는 동안 반복 실행되는 현상 방지
    if (event.repeat) return;

    const inputTime = performance.now() - startTime;

    // 실제 입력 시간과 목표 시간의 차이 계산
    const error = inputTime - targetTime;

    finishGame(inputTime, error);
});


// 반올림된 오차에 따라 등급을 결정
function getGrade(errorMs) {

    for (const grade of grades) {

        if (errorMs <= grade.maxError) {
            return grade;
        }
    }

    return grades[grades.length - 1];
}


// 게임 종료 후 결과 계산 및 표시
function finishGame(inputTime, error) {

    // 게임 종료 및 타이머 애니메이션 중단
    playing = false;
    cancelAnimationFrame(animationId);

    // 입력 시간을 밀리초 단위로 반올림
    const roundedInputTime = Math.round(inputTime);

    // 오차의 절댓값을 먼저 반올림
    // 음수 오차에서도 반올림이 비대칭적으로 처리되는 것을 방지
    const errorMs = Math.round(Math.abs(error));

    // 반올림된 오차를 초 단위로 변환
    const displayedError = errorMs / 1000;

    // 실제 오차의 방향에 따라 부호 결정
    const sign = error > 0 ? "+" : error < 0 ? "-" : "";

    // 최종 입력 시간을 소수점 셋째 자리까지 표시
    timer.textContent = formatTime(roundedInputTime);
    finalTimeDisplay.textContent = formatTime(roundedInputTime);

    // 반올림된 오차를 소수점 셋째 자리까지 표시
    errorDisplay.textContent =
        `${sign}${displayedError.toFixed(3)}초`;

    // 반올림된 오차를 기준으로 등급 판정
    const grade = getGrade(errorMs);

    gradeDisplay.textContent = grade.name;
    gradeRangeDisplay.textContent = grade.range;

    // 반올림된 오차를 기준으로 점수 계산
    const score = Math.round(
        1000 * Math.pow(0.5, errorMs / 100)
    );

    scoreDisplay.textContent = score;

    // 반올림된 결과를 최근 기록에 저장
    saveRecord({
        time: formatTime(roundedInputTime),
        error: `${sign}${displayedError.toFixed(3)}초`,
        score: score,
        grade: grade.name
    });

    // PERFECT 등급일 경우 특별 메시지와 축하 화면 표시
    if (grade.name === "PERFECT") {

        message.textContent = "완벽한 타이밍!";

        achievement.hidden = false;
        achievement.textContent = "👑 타이밍의 왕! 👑";

        // PERFECT 전용 축하 효과 실행
        celebrate();

    } else {

        // PERFECT가 아니면 특별 메시지 숨기기
        achievement.hidden = true;

        // 목표 시간보다 빠르거나 늦었는지 안내
        message.textContent = error < 0
            ? "목표 시간보다 일찍 눌렀습니다."
            : "목표 시간보다 늦게 눌렀습니다.";

        // 등급에 해당하는 효과음 재생
        playGradeSound(grade.name);
    }

    // 게임 종료 후 버튼과 입력창 다시 활성화
    startBtn.disabled = false;
    duration.disabled = false;

    // 다시 도전하기 버튼 표시
    retryBtn.hidden = false;
}


// 등급마다 다른 효과음 생성
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

    // 등급별 음계
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

    // 낮은 등급은 sawtooth, 나머지는 triangle 음색 사용
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


// PERFECT 축하 효과
function celebrate() {

    celebration.hidden = false;

    celebrationCanClose = false;

    const celebrationMessage =
        celebration.querySelector("p");

    celebrationMessage.textContent = "완벽한 타이밍!";

    clearTimeout(celebrationTimeout);

    // 3초 후 클릭하여 닫을 수 있도록 설정
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


// 축하 화면을 클릭하면 닫기
celebration.addEventListener("click", (event) => {

    // 클릭 이벤트가 다른 요소로 전달되지 않도록 방지
    event.stopPropagation();

    // 3초가 지나기 전에는 닫히지 않음
    if (!celebrationCanClose) return;

    clearTimeout(celebrationTimeout);

    celebrationTimeout = null;
    celebrationCanClose = false;

    // 축하 팝업만 닫음
    // 타이머와 결과 데이터는 초기화하지 않음
    celebration.hidden = true;
});


// 다시 도전하기 버튼을 누르면 게임 초기화
retryBtn.addEventListener("click", resetGame);


// 게임 결과 화면에서 Enter 키를 누르면 즉시 다시 시작
document.addEventListener("keydown", (event) => {

    if (event.key !== "Enter") return;

    if (event.repeat) return;

    if (playing) return;

    // 팝업이 열려 있으면 무시
    if (!gradeModal.hidden || !historyModal.hidden) return;

    // 축하 화면이 표시 중이면 무시
    if (!celebration.hidden) return;

    // 결과 화면에서만 실행
    if (!retryBtn.hidden) {

        event.preventDefault();

        resetGame();
        startBtn.click();
    }
});


// 오른쪽 상단 다시하기 버튼
resetBtn.addEventListener("click", resetGame);


// 페이지가 처음 열렸을 때 초기 상태 설정
resetGame();

// 저장된 기록 표시 준비
renderHistory();
