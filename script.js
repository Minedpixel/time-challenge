
// HTML에서 필요한 요소들을 가져옴
const timer = document.getElementById("timer");
const duration = document.getElementById("duration");

const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const resetBtn = document.getElementById("resetBtn");

const gradeTableBtn = document.getElementById("gradeTableBtn");
const gradeModal = document.getElementById("gradeModal");
const closeGradeBtn = document.getElementById("closeGradeBtn");

const message = document.getElementById("message");

const finalTimeDisplay = document.getElementById("finalTime");
const errorDisplay = document.getElementById("error");
const gradeDisplay = document.getElementById("grade");
const gradeRangeDisplay = document.getElementById("gradeRange");
const scoreDisplay = document.getElementById("score");

const celebration = document.getElementById("celebration");


// 게임 진행 상태를 저장하는 변수
let startTime = 0;
let targetTime = 0;
let animationId = null;
let playing = false;

// 효과음을 생성하기 위한 오디오 객체
let audioContext = null;


// 등급별 이름과 오차 범위를 저장
// maxError는 밀리초 단위이며, 1ms는 0.001초임
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
    { name: "POOR", maxError: 2000, range: "1.501 ~ 2.000초" },
    { name: "TRY AGAIN", maxError: Infinity, range: "2.000초 초과" }
];


// 시간을 소수점 셋째 자리까지 내림하여 표시
// 넷째 자리부터는 표시와 판정에서 무시
function formatTime(ms) {
    return (Math.floor(ms) / 1000).toFixed(3);
}


// 결과 화면과 축하 화면을 초기 상태로 되돌림
function clearResults() {
    timer.textContent = "0.000";

    finalTimeDisplay.textContent = "-";
    errorDisplay.textContent = "-";
    gradeDisplay.textContent = "-";
    gradeRangeDisplay.textContent = "-";
    scoreDisplay.textContent = "-";

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

    // 초기화할 때 등급표도 닫음
    gradeModal.hidden = true;
}


// 등급표 버튼을 누르면 등급표를 표시
gradeTableBtn.addEventListener("click", () => {
    gradeModal.hidden = false;
});


// 등급표 닫기 버튼을 누르면 팝업을 닫음
closeGradeBtn.addEventListener("click", () => {
    gradeModal.hidden = true;
});


// 등급표 바깥쪽 배경을 눌러도 팝업을 닫음
gradeModal.addEventListener("click", (event) => {
    if (event.target === gradeModal) {
        gradeModal.hidden = true;
    }
});


// ESC 키를 누르면 등급표를 닫음
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        gradeModal.hidden = true;
    }
});


// 게임 시작 버튼을 눌렀을 때 실행
startBtn.addEventListener("click", () => {

    // 이미 게임이 진행 중이면 시작하지 않음
    if (playing) return;

    const inputDuration = Number(duration.value);

    // 목표 시간 입력값이 올바른지 검사
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

    clearResults();

    // 게임 시작 시각 기록
    startTime = performance.now();

    playing = true;

    message.textContent = "목표 시간에 맞춰 SPACE!";

    // 게임 중에는 목표 시간 변경과 시작 버튼 사용을 막음
    startBtn.disabled = true;
    duration.disabled = true;

    retryBtn.hidden = true;

    // 타이머 업데이트 시작
    updateTimer();
});


// 화면에 경과 시간을 실시간으로 표시
function updateTimer() {

    // 게임이 종료되었다면 타이머를 업데이트하지 않음
    if (!playing) return;

    const elapsed = performance.now() - startTime;

    // 소수점 셋째 자리까지 표시
    timer.textContent = formatTime(elapsed);

    // 다음 화면 갱신 때 다시 실행
    animationId = requestAnimationFrame(updateTimer);
}


// 스페이스바 입력을 감지하여 게임 종료
document.addEventListener("keydown", (event) => {

    // 스페이스바가 아닌 키는 무시
    if (event.code !== "Space") return;

    // 게임이 진행 중이 아니면 무시
    if (!playing) return;

    // 스페이스바를 눌렀을 때 페이지가 스크롤되는 것을 방지
    event.preventDefault();

    // 스페이스바를 계속 누르고 있어도 한 번만 입력되도록 설정
    if (event.repeat) return;

    // 스페이스바를 누른 시점의 경과 시간 계산
    const inputTime = performance.now() - startTime;

    // 목표 시간과 실제 입력 시간의 차이 계산
    const error = inputTime - targetTime;

    // 게임 종료 및 결과 계산
    finishGame(inputTime, error);
});


// 오차에 따라 등급을 결정하는 함수
function getGrade(errorMs) {

    // 등급 목록을 위에서부터 확인하여 해당 등급을 찾음
    for (const grade of grades) {

        if (errorMs <= grade.maxError) {
            return grade;
        }
    }

    // 기본적으로 마지막 등급을 반환
    return grades[grades.length - 1];
}


// 게임 종료 후 결과를 계산하고 표시
function finishGame(inputTime, error) {

    playing = false;

    // 타이머 갱신 중단
    cancelAnimationFrame(animationId);

    // 최종 입력 시간 표시
    timer.textContent = formatTime(inputTime);
    finalTimeDisplay.textContent = formatTime(inputTime) + "초";

    // 오차의 절댓값을 밀리초 단위로 계산
    // 소수점 아래 밀리초는 버려서 0.001초 단위까지만 인정
    const errorMs = Math.floor(Math.abs(error));

    // 오차를 초 단위로 변환
    const displayedError = errorMs / 1000;

    // 목표 시간보다 빠르면 음수, 늦으면 양수로 표시
    const sign =
        error > 0 ? "+" :
        error < 0 ? "-" : "";

    // 소수점 셋째 자리까지 오차 표시
    errorDisplay.textContent =
        sign + displayedError.toFixed(3) + "초";


    // 계산된 오차를 기준으로 등급 판정
    const grade = getGrade(errorMs);

    gradeDisplay.textContent = grade.name;
    gradeRangeDisplay.textContent = grade.range;


    // 오차가 커질수록 점수가 낮아지는 점수 계산
    // 오차가 0.1초 증가할 때마다 점수가 절반으로 감소
    const score = Math.round(
        1000 * Math.pow(0.5, errorMs / 100)
    );

    scoreDisplay.textContent = score.toLocaleString() + "점";


    // PERFECT일 경우 특별한 축하 화면 표시
    if (grade.name === "PERFECT") {

        message.textContent = "완벽한 타이밍!";
        celebrate();

    } else {

        // 목표 시간보다 빨랐는지 늦었는지 안내
        if (error < 0) {
            message.textContent = "목표 시간보다 일찍 눌렀어요!";
        } else {
            message.textContent = "목표 시간보다 늦게 눌렀어요!";
        }

        // PERFECT가 아니어도 해당 등급의 효과음 재생
        playGradeSound(grade.name);
    }


    // 게임이 끝났으므로 버튼을 다시 활성화
    startBtn.disabled = false;
    duration.disabled = false;

    retryBtn.hidden = false;
}


// 등급마다 다른 음계와 패턴으로 효과음을 생성
function playGradeSound(gradeName) {

    // 브라우저의 오디오 기능을 가져옴
    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    // 지원하지 않는 브라우저에서는 효과음을 생략
    if (!AudioContextClass) return;

    // 오디오 객체가 없으면 새로 생성
    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    // 브라우저에서 오디오가 일시 중지된 경우 다시 실행
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    // 등급별로 재생할 음의 높이를 설정
    // 숫자가 클수록 높은 음
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
        "POOR": [329.63, 293.66],
        "TRY AGAIN": [261.63, 196.00]
    };

    // 현재 등급에 해당하는 음계 가져오기
    const notes = soundPatterns[gradeName];

    // 음계가 없으면 재생하지 않음
    if (!notes) return;

    // 오디오가 시작될 시각
    const start = audioContext.currentTime;

    // 등급에 따라 음색 변경
    const type =
        ["BAD", "POOR", "TRY AGAIN"].includes(gradeName)
            ? "sawtooth"
            : "triangle";

    // 음계들을 차례대로 재생
    notes.forEach((frequency, index) => {

        // 음을 생성하는 발진기
        const oscillator = audioContext.createOscillator();

        // 음량을 조절하는 객체
        const gain = audioContext.createGain();

        // 음의 높이와 종류 설정
        oscillator.frequency.value = frequency;
        oscillator.type = type;

        // 각 음의 재생 시작 시각
        const noteStart = start + index * 0.13;

        // 음량을 부드럽게 키웠다가 줄임
        gain.gain.setValueAtTime(0.001, noteStart);

        gain.gain.exponentialRampToValueAtTime(
            0.12,
            noteStart + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            noteStart + 0.22
        );

        // 발진기와 음량 조절기를 연결
        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        // 음 재생 시작과 종료
        oscillator.start(noteStart);
        oscillator.stop(noteStart + 0.23);
    });
}


// PERFECT를 달성했을 때 실행되는 축하 효과
function celebrate() {

    // 축하 화면 표시
    celebration.hidden = false;

    // PERFECT 전용 축하 음계 재생
    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    // 브라우저에서 오디오를 지원하지 않으면 화면 효과만 표시
    if (!AudioContextClass) return;

    // 오디오 객체 생성
    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    // 오디오가 중지되어 있으면 다시 실행
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    // PERFECT 전용 밝은 상승 음계
    const notes = [
        523.25,
        659.25,
        783.99,
        1046.50,
        1318.51
    ];

    // 음계를 차례대로 재생
    notes.forEach((frequency, index) => {

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        // 음색을 삼각파로 설정
        oscillator.frequency.value = frequency;
        oscillator.type = "triangle";

        // 음마다 재생 시각을 다르게 설정
        const time = audioContext.currentTime + index * 0.14;

        // 음량을 부드럽게 조절
        gain.gain.setValueAtTime(0.001, time);

        gain.gain.exponentialRampToValueAtTime(
            0.16,
            time + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            time + 0.35
        );

        // 오디오 연결
        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        // 음 재생
        oscillator.start(time);
        oscillator.stop(time + 0.36);
    });
}


// 다시 도전하기 버튼을 누르면 게임 초기화
retryBtn.addEventListener("click", resetGame);

// 게임 결과 화면에서 Enter 키를 누르면 즉시 다시 시작
document.addEventListener("keydown", (event) => {

    if (event.key !== "Enter") return;

    if (event.repeat) return;

    // 게임 진행 중이거나 등급표가 열려 있으면 무시
    if (playing || !gradeModal.hidden) return;

    // 결과 화면에서만 실행
    if (!retryBtn.hidden) {
        event.preventDefault();

        // 게임 초기화 후 시작 버튼을 자동으로 클릭
        resetGame();
        startBtn.click();
    }
});

// 오른쪽 상단 다시하기 버튼을 누르면 게임 초기화
resetBtn.addEventListener("click", resetGame);


// 페이지가 처음 열렸을 때 초기 상태 설정
resetGame();
