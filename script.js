class Task {
    constructor(A, W, n) {
        this.A = A;
        this.W = W;
        this.n = n;
    }
}

class Pos {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

var testType = "fitts";

var pasSquares = [];
var pasCurrentTarget = 0;
var pasSquareSize = 50;
var pasNumSquares = 10;
var pasClickData = [];
var pasTasks = [];

var tasks = [];
var uncalibratedTasks = [];
var taskIdx = 0;

var clickNumber = 0;

var isMute = true;
var isTrailing = false;
var isTaskRunning = false;
var isTaskFinished = false;
var beginFlag = false;

var isCalibrating = false;
var calibrationScale = 1;
let calibrationSlider;

var participantCode = "";
var sessionCode = "";
var conditionCode = "";
var eyeDominance = "";
var pointingDevice = "";
var deviceExperience = "";

var lastClickTime = 0;
var currentClickTime = 0;

var clickData = [];
var aggregateTaskResult = [];
var overallMeanResult = [];
var servdown = false;
var resultsview = true;

let clickDataHeader = ["Participant Code", "Session Code", "Condition Code", "Test Type", "Eye Dominance", "Pointing Device", "Device Experience", "Amplitude", "Width", "Number of Targets", "Task Index", "Click Number", "Completion Time (ms)", "Source X", "Source Y", "Target X", "Target Y", "Click X", "Click Y", "Source-Target Distance", "dx", "Incorrect"];
let aggregateTaskResultHeader = ["Participant Code", "Session Code", "Condition Code", "Test Type", "Eye Dominance", "Pointing Device", "Device Experience", "Amplitude", "Width", "Number of Targets", "Task Index", "Mean Completion Time (ms)", "Error (%)", "SDx", "We", "IDe", "Ae", "Throughput (bps)"];
let overallMeanResultHeader = ["Participant Code", "Session Code", "Condition Code", "Test Type", "Eye Dominance", "Pointing Device", "Device Experience", "Mean Completion Time (ms)", "Mean Click Error (%)", "Mean Throughput (bps)"];
let PASDataHeader = ["Participant Code", "Session Code", "Condition Code", "Test Type", "Eye Dominance", "Pointing Device", "Device Experience", "Amplitude", "Width", "Number of Targets", "Task Index", "Click Number", "Completion Time (ms)", "Square X", "Square Y", "Click X", "Click Y", "Distance to Square Center", "Incorrect"];

$(document).ready(function() {
    $("#main_menu").hide();

    // Retrieving server download requirement from metadata
    if ($("#webfitt-meta").data()["servdown"] == "True") {
        servdown = true;
    }

    // Retrieving result view requirement from metadata
    if ($("#webfitt-meta").data()["resultsview"] == "False") {
        resultsview = false;
    }

    // Change GitHub logo on hover
    $("#github_logo").hover(function() {
        $("#github_logo").attr("src", "assets/github_hover.png");
    }, function() {
        $("#github_logo").attr("src", "assets/github_default.png");
    });

    // Change header logo on hover
    $("#header_logo").hover(function() {
        $("#header_logo").attr("src", "assets/header_logo_hover.png");
    }, function() {
        $("#header_logo").attr("src", "assets/header_logo.png");
    });

    // Change calibrate icon on hover
    $("#calibration_icon").hover(function() {
        $("#calibration_icon").attr("src", "assets/calibrate_hover.png");
    }, function() {
        $("#calibration_icon").attr("src", "assets/calibrate.png");
    });

    // Change volume icon on hover
    $("#volume_icon").hover(function() {
        renderVolumeImage(true);
    }, function() {
        renderVolumeImage(false);
    });

    // Change trail icon on hover
    $("#trail_icon").hover(function() {
        renderTrailImage(true);
    }, function() {
        renderTrailImage(false);
    });

    // Register mouse click on canvas
    // $(document).on("click", "canvas", function() {
    //     if (isTaskRunning) {
    //         onCanvasClick();
    //     }
    // });

    $(document).on("keydown", function(event) {
        if (isTaskRunning && event.code === "Space") {
            event.preventDefault(); // Prevent default spacebar behavior
            onCanvasClick();
        }
    });

    // Register mouse click on UI elements
    $(document).on("click", ".ui_item", function() {
        var id = $(this).attr("id");
        if (id == "volume_icon") {
            isMute = !isMute;
            renderVolumeImage(true);
        }
        else if (id == "trail_icon") {
            isTrailing = !isTrailing;
            renderTrailImage(true);
        }
        else if (id == "calibration_icon") {
            beginCalibration();
        }
    });

    $(document).on("click", "#confirm_calibration_btn", function() {
        setCalibrationValue();
        if (getCookie("webfitt-calibration") == "") {
            $('#calibration-modal').modal('show');
        } else {
            setCalibrationCookie(calibrationScale);
            $('#calibrated-modal').modal('show');
        }
    });

    // Refresh page when header-logo is clicked
    $("#header_logo").click(function() {
        window.location.reload();
    });

    // Open GitHub project page when GitHub logo is clicked
    $("#github_logo").click(function() {
        window.open("https://github.com/adildsw/WebFitt");
    });

    $('#calibration-modal')
        .modal({
            closable: false,
            onApprove: function() {
                setCalibrationCookie(calibrationScale);
                endCalibration();
                return true;
            },
            onDeny: function() {
                endCalibration();
                return true;
            }
        });

    $('#calibrated-modal')
        .modal({
            closable: false,
            onApprove: function() {
                setCalibrationCookie(calibrationScale);
                endCalibration();
                return true;
            }
        });

    // Load saved input values from cookies
    if (getCookie("webfitt-participant-code") != "") $("#participant-code").val(getCookie("webfitt-participant-code"));
    if (getCookie("webfitt-session-code") != "") $("#session-code").val(getCookie("webfitt-session-code"));
    if (getCookie("webfitt-condition-code") != "") $("#condition-code").val(getCookie("webfitt-condition-code"));
    if (getCookie("webfitt-eye-dominance") != "") $("input[name='eye-dominance'][value='" + getCookie("webfitt-eye-dominance") + "']").prop("checked", true);
    if (getCookie("webfitt-pointing-device") != "") $("input[name='pointing-device'][value='" + getCookie("webfitt-pointing-device") + "']").prop("checked", true);
    if (getCookie("webfitt-device-experience") != "") $("input[name='device-experience'][value='" + getCookie("webfitt-device-experience") + "']").prop("checked", true);
    if (getCookie("webfitt-amplitude") != "") $("#amplitude").val(getCookie("webfitt-amplitude"));
    if (getCookie("webfitt-width") != "") $("#width").val(getCookie("webfitt-width"));
    if (getCookie("webfitt-number-of-targets") != "") $("#number-of-targets").val(getCookie("webfitt-number-of-targets"));

    // Validate input and starting the task
    $(document).on("click", "#start-test-btn", function() {
        participantCode = $("#participant-code").val();
        sessionCode = $("#session-code").val();
        conditionCode = $("#condition-code").val();

        testType = $("#test-type").val();

        eyeDominance = $("input[name='eye-dominance']:checked").val();
        pointingDevice = $("input[name='pointing-device']:checked").val();
        deviceExperience = $("input[name='device-experience']:checked").val();
        var A_raw = $("#amplitude").val();
        var W_raw = $("#width").val();
        var n = parseInt($("#number-of-targets").val());
        pasNumSquares = n;

        // Save Input Values to Cookie
        setCookie("webfitt-participant-code", participantCode, 3650);
        setCookie("webfitt-session-code", sessionCode, 3650);
        setCookie("webfitt-condition-code", conditionCode, 3650);
        setCookie("webfitt-eye-dominance", eyeDominance, 3650);
        setCookie("webfitt-pointing-device", pointingDevice, 3650);
        setCookie("webfitt-device-experience", deviceExperience, 3650);
        setCookie("webfitt-amplitude", A_raw, 3650);
        setCookie("webfitt-width", W_raw, 3650);
        setCookie("webfitt-number-of-targets", n, 3650);

        var policy = false;
        if ($("#policy").is(":checked")) {
            policy = true;
        }
        var A = A_raw.replace(" ", '').split(",");
        var W = W_raw.replace(" ", '').split(",");

        var correctFlag = true;
        var errorMsg = "";

        // Check empty values
        if (participantCode == "") {
            correctFlag = false;
            errorMsg = "ERROR: Participant Code is empty.";
        }
        if (sessionCode == "") {
            correctFlag = false;
            errorMsg = "ERROR: Session Code is empty.";
        }
        if (conditionCode == "") {
            correctFlag = false;
            errorMsg = "ERROR: Condition Code is empty.";
        }
        if (A.length == 0) {
            correctFlag = false;
            errorMsg = "ERROR: Amplitude is empty.";
        }
        if (W.length == 0) {
            correctFlag = false;
            errorMsg = "ERROR: Width is empty.";
        }

        // Parsing amplitude and width values
        if (isArrayOfNumbers(A)) {
            A = parseArrayOfNumbers(A);
        }
        else {
            correctFlag = false;
            errorMsg = "ERROR: Incorrect amplitude value(s) entered."
        }
        if (isArrayOfNumbers(W)) {
            W = parseArrayOfNumbers(W);
        }
        else {
            correctFlag = false;
            errorMsg = "ERROR: Incorrect width value(s) entered."
        }

        // Checking data usage policy agreement
        if (!policy && servdown) {
            correctFlag = false;
            errorMsg = "ERROR: Data usage policy agreement is required."
        }

        if (correctFlag) {
            // Hide Main Menu
            $("#main_menu").hide();

            // Begin App
            console.log("Tasks:", tasks);
            console.log("Task Index:", taskIdx);

            beginApp(A, W, n);
        }
        else {
            alert(errorMsg);
        }
    });

    // Hide header logo at main menu
    $("#header_logo").hide();

    // Hide data policy checkbox at main menu if servdown is false
    if (!servdown) {
        $(".servdown-policy").hide();
    }

});

function setCalibrationCookie(calibrationScale) {
    setCookie("webfitt-calibration", calibrationScale, 365);
}

// Begins the display calibration process
function beginCalibration() {
    isCalibrating = true;
    $("#main_menu").hide();
    $(".ui_item").hide();
    $("#header_logo").show();
    $("#confirm_calibration_btn").show();
    slider.value(calibrationScale);
}

function endCalibration() {
    isCalibrating = false;
    $("#main_menu").show();
    $(".ui_item").show();
    $("#header_logo").hide();
    $("#confirm_calibration_btn").hide();
    slider.value(calibrationScale);
    // hide slider
    slider.style('display', 'none');
}

/*
 * Starts the WebFitt Application.
 *
 * Parameters
 * a_list: (Integer[]) List of amplitude values
 * w_list: (Integer[]) List of width values
 * n: (Integer) Number of targets
 *
 */
function beginApp(a_list, w_list, n) {
    console.log("Amplitude List:", a_list);
    console.log("Width List:", w_list);
    console.log("Number of Targets:", n);
    if (testType === "pas") {
        console.log("Beginning PAS Test");

        // PAS test initialization with multiple parameters
        pasTasks = [];

        // Generate all combinations of amplitude and width
        for (var i = 0; i < a_list.length; i++) {
            for (var j = 0; j < w_list.length; j++) {
                pasTasks.push({
                    amplitude: a_list[i] * calibrationScale,
                    width: w_list[j] * calibrationScale,
                    numSquares: n
                });
            }
        }

        // Shuffle the task order
        for (var i = pasTasks.length - 1; i > 0; i--) {
            var k = Math.floor(Math.random() * (i + 1));
            var temp = pasTasks[i];
            pasTasks[i] = pasTasks[k];
            pasTasks[k] = temp;
        }

        pasSquares = generatePASSquares(pasTasks[0].numSquares, pasTasks[0].amplitude);
        pasSquareSize = pasTasks[0].width;
        pasCurrentTarget = 0;
        pasClickData = [];
        taskIdx = 0;
        lastClickTime = millis();
        isTaskRunning = true;
        $("#header_logo").show();
    } else {
        // Existing Fitts test code
        taskIdx = 0;
        clickNumber = 0;
        clickData = [];
        aggregateTaskResult = [];
        overallMeanResult = [];
        tasks = generateTaskSequence(a_list, w_list, n);
        uncalibratedTasks = generateUncalibratedTaskSequence(a_list, w_list, n);

        for (var i = tasks.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = tasks[i];
            tasks[i] = tasks[j];
            tasks[j] = temp;

            var temp = uncalibratedTasks[i];
            uncalibratedTasks[i] = uncalibratedTasks[j];
            uncalibratedTasks[j] = temp;
        }

        if (tasks.length == 0) {
            alert("ERROR: No task to run.");
        } else {
            isTaskRunning = true;
            $("#header_logo").show();
        }
    }
}


function preload() {
    creditCardImg = loadImage("assets/credit_card.png");
    robotoLightFont = loadFont("./assets/roboto-light.ttf");
    robotoRegularFont = loadFont("./assets/roboto-regular.ttf");
    correctAudio = loadSound("assets/correct_audio.mp3");
    incorrectAudio = loadSound("assets/incorrect_audio.mp3");
    correctAudio.setVolume(0.2);
    incorrectAudio.setVolume(0.2);
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);
    background(255);

    slider = createSlider(0.5, 2, 1, 0.01);
    slider.style('width', '200px');
    slider.style('display', 'none');
    slider.position(width / 2 - 100, height / 2 + 320);
    $("#confirm_calibration_btn").css({'width': 150, 'top': height / 2 + 350, 'left': width / 2 - 75});

    // If the display has never been calibrated before, begin the calibration process
    if (isDisplayCalibrated()) {
        calibrationScale = getCalibrationValue();
    } else {
        beginCalibration();
    }
}

function draw() {
    background(255);

    if (isCalibrating) {
        renderCalibrationPanel();
    }
    else if (isTaskRunning) {
        if (testType === "pas") {
            renderPASSquares();
            renderPASInfo();
        } else {
            renderTrail();
            runPipeline();
            renderInfoText();
        }
    }
    else if (isTaskFinished) {
        if (resultsview) {
            renderTaskCompleteMessage();
        }
        else {
            window.location.reload();
        }
    }
    else {
        $("#main_menu").show();
    }
}

function renderCalibrationPanel() {
    background(255);

    noStroke();
    textSize(64);
    fill(0);
    textFont(robotoRegularFont);
    textAlign(CENTER, CENTER);
    text("Display Calibration", width / 2, 140);
    textFont(robotoLightFont);
    textSize(32);
    text("Please adjust the slider below so that the card on your screen matches a physical credit card.", width / 2, 210);

    let val = slider.value();
    slider.style('display', 'block');

    cardWidth = 500 * val;
    cardHeight = cardWidth / 1.586
    image(creditCardImg, (width / 2) - (cardWidth / 2), (height / 2) - (cardHeight / 2) + 30, cardWidth, cardHeight);
}

function runPipeline() {
    var A = tasks[taskIdx].A;
    var W = tasks[taskIdx].W ;
    var n = tasks[taskIdx].n;
    var mainTarget = getTargetIdxFromClickNumber(clickNumber, n);
    renderTargets(A, W, n, mainTarget);

    if (clickNumber == n + 1) {
        if (taskIdx < tasks.length - 1) {
            taskIdx++;
        }
        else {
            isTaskRunning = false;
            isTaskFinished = true;
            computeAggregateTaskResult();
            computeOverallMeanResult();
            var filename = "WebFitts_" + participantCode + "_" + sessionCode + "_" + conditionCode + "_" + pointingDevice;
			saveAsZipFile(filename);
            if (servdown) {
                uploadResult();
            }
        }
        clickNumber = 0;
        beginFlag = false;
    }
}

function onCanvasClick() {
    if (testType === "pas") return;

    var A = tasks[taskIdx].A;
    var W = tasks[taskIdx].W;
    var n = tasks[taskIdx].n;
    var mainTarget = getTargetIdxFromClickNumber(clickNumber, n);
    var clickPos = new Pos(mouseX, mouseY);

    var correct = isClickCorrect(A, W, n, mainTarget, clickPos);
    // if (correct && !isMute) {
    //     correctAudio.play();
    // }
    // else if (beginFlag && !isMute) {
    //     incorrectAudio.play();
    // }
    //
    // if (correct && !beginFlag) {
    //     beginFlag = true;
    //     lastClickTime = millis();
    //     currentClickTime = lastClickTime;
    //     clickNumber++;
    // }
    // else if (beginFlag) {
    //     currentClickTime = millis();
    //     computeClickData(clickPos);
    //     clickNumber++;
    //     lastClickTime = currentClickTime;
    // }
    if (correct) {
        if (!isMute) {
            correctAudio.play();
        }

        if (!beginFlag) {
            beginFlag = true;
            lastClickTime = millis();
            currentClickTime = lastClickTime;
            clickNumber++;
        }
        else {
            currentClickTime = millis();
            computeClickData(clickPos);
            clickNumber++;
            lastClickTime = currentClickTime;
        }
    }
    else {
        if (beginFlag && !isMute) {
            incorrectAudio.play();
        }
        // Incorrect click - don't advance, just record error data
        if (beginFlag) {
            currentClickTime = millis();
            computeClickData(clickPos);
            lastClickTime = currentClickTime;
        }
    }
}

/*
 * Generates a randomized sequence of tasks.
 *
 * Parameters
 * a_list: (Integer[]) List of amplitude values
 * w_list: (Integer[]) List of width values
 * n: (Integer) Number of targets
 * 
 * Returns
 * (Task[]) Randomized sequence of tasks
 * 
 */
function generateTaskSequence(a_list, w_list, n) {
    // Calibrating amplitude and width values
    var a_list_temp = []
    var w_list_temp = []
    for (var i = 0; i < a_list.length; i++) {
        a_list_temp.push(a_list[i] * calibrationScale);
    }
    for (var i = 0; i < w_list.length; i++) {
        w_list_temp.push(w_list[i] * calibrationScale);
    }

    // Creating an array with a cross product of a_list and w_list
    var taskSequence = [];
    for (var i = 0; i < a_list_temp.length; i++) {
        for (var j = 0; j < w_list_temp.length; j++) {
            taskSequence.push(new Task(a_list_temp[i], w_list_temp[j], n));
        }
    }

    console.log("Generated Task Sequence:", taskSequence); // Debugging
    return taskSequence;
}

function generateUncalibratedTaskSequence(a_list, w_list, n) {
    // Creating an array with a cross product of a_list and w_list
    var taskSequence = [];
    for (var i = 0; i < a_list.length; i++) {
        for (var j = 0; j < w_list.length; j++) {
            taskSequence.push(new Task(a_list[i], w_list[j], n));
        }
    }

    return taskSequence;
}

/*
 * Checks if the correct target is clicked.
 * 
 * Parameters
 * A: (Integer) Amplitude, defined as the distance between the centers of the screen and each target
 * W: (Integer) Width (radius) of the targets
 * n: (Integer) Number of targets
 * mainTarget: (Integer) Index of the main target
 * clickPos: (Pos) Position of the mouse click
 * 
 * Returns
 * (Boolean) True if the correct target is clicked, false otherwise
 * 
 */
function isClickCorrect(A, W, n, mainTarget, clickPos) {
    var pos = getTargetPosition(A, n, mainTarget);
    var dist = sqrt(pow(clickPos.x - pos.x, 2) + pow(clickPos.y - pos.y, 2));
    if (dist < W / 2) {
        return true;
    }
    else {
        return false;;
    }
}

// Maps key pres to UI controls
function keyPressed() {
    if (key === 't') {
        isTrailing = !isTrailing;
        renderTrailImage(false);
    }
    else if (key == 's') {
        isMute = !isMute;
        renderVolumeImage(false);
    }
}

// Renders trail on mouse cursor
function renderTrail() {
    if (!isTrailing || !beginFlag) {
        background(255);
    }
    if (isTrailing && beginFlag) {
        noStroke();
        fill("#AAAAAA");
        circle(mouseX, mouseY, 2);
        stroke("#AAAAAA");
        strokeWeight(2);
        line(mouseX, mouseY, pmouseX, pmouseY);
    }
}

// Renders task information text
function renderInfoText() {
    noStroke();
    textSize(28);
    fill(0);
    textFont(robotoRegularFont);
    textAlign(LEFT);
    text("Task " + (taskIdx + 1) + " of " + tasks.length, width - 400, 50);
    textFont(robotoLightFont);
    text("Amplitude " + uncalibratedTasks[taskIdx].A + " | Width " + uncalibratedTasks[taskIdx].W, width - 400, 85);
}

// Renders a message and aggregate info when the task(s) are complete
function renderTaskCompleteMessage() {
    background(255);

    if (testType === "fitts" && overallMeanResult.length > 0) {
        noStroke();
        textSize(28);
        fill(0);
        textFont(robotoRegularFont);
        textAlign(LEFT);
        text("Overall Mean Result", width - 400, 50);
        textFont(robotoLightFont);
        text("Mean Time (ms): " + Math.round(overallMeanResult[0][7] * 100) / 100, width - 400, 85);
        text("Mean Error (%): " + Math.round(overallMeanResult[0][8] * 100) / 100, width - 400, 120);
        text("Mean Throughput (bps): " + Math.round(overallMeanResult[0][9] * 100) / 100, width - 400, 155);
    }

    noStroke();
    textSize(64);
    fill(0);
    textFont(robotoLightFont);
    textAlign(CENTER, CENTER);

    let totalTasks = (testType === "pas") ? pasTasks.length : tasks.length;
    if (totalTasks == 1) {
        text("Task Complete!", width / 2, height / 2);
    }
    else {
        text("Tasks Complete!", width / 2, height / 2);
    }

    if (servdown) {
        textSize(16);
        text("A copy of your result has been uploaded to the server.", width / 2, (height / 2) + 60);
    }
}

/*
 * Processes click data and appends it to clickData array.
 *
 * Parameters
 * clickPos: (Pos) Coordinate of the mouse click
 * 
 */
function computeClickData(clickPos) {
    var A = uncalibratedTasks[taskIdx].A;
    var W = uncalibratedTasks[taskIdx].W;
    var n = uncalibratedTasks[taskIdx].n;
    var clickTime = currentClickTime - lastClickTime;
    var sourcePos = getTargetPosition(A, n, getTargetIdxFromClickNumber(clickNumber - 1, n));
    var targetPos = getTargetPosition(A, n, getTargetIdxFromClickNumber(clickNumber, n));

    var sourceTargetDist = sqrt(pow(sourcePos.x - targetPos.x, 2) + pow(sourcePos.y - targetPos.y, 2));
    var sourceClickDist = sqrt(pow(clickPos.x - sourcePos.x, 2) + pow(clickPos.y - sourcePos.y, 2));
    var targetClickDist = sqrt(pow(clickPos.x - targetPos.x, 2) + pow(clickPos.y - targetPos.y, 2));
    var dx = (pow(sourceClickDist, 2) - pow(targetClickDist, 2) - pow(sourceTargetDist, 2)) / (2 * sourceTargetDist);
    var isIncorrect = isClickCorrect(tasks[taskIdx].A, tasks[taskIdx].W, n, getTargetIdxFromClickNumber(clickNumber, n), clickPos) ? 0 : 1;

    var data = [];
    data.push(participantCode);
    data.push(sessionCode);
    data.push(conditionCode);
    data.push(testType);
    data.push(eyeDominance);
    data.push(pointingDevice);
    data.push(deviceExperience);
    data.push(A);
    data.push(W);
    data.push(n);
    data.push(taskIdx);
    data.push(clickNumber);
    data.push(clickTime);
    data.push(sourcePos.x);
    data.push(sourcePos.y);
    data.push(targetPos.x);
    data.push(targetPos.y);
    data.push(clickPos.x);
    data.push(clickPos.y);
    data.push(sourceTargetDist);
    data.push(dx);
    data.push(isIncorrect);

    clickData.push(data);
}

// Computes the aggregate task results and appends it to aggregateTaskResult array.
function computeAggregateTaskResult() {
    for (var i = 0; i < tasks.length; i++) {
        var A = uncalibratedTasks[i].A;
        var W = uncalibratedTasks[i].W;
        var n = uncalibratedTasks[i].n;
        var clickTimeList = [];
        var errorList = [];
        var dxList = [];
        var avgEffectiveAmplitudeList = [];
        for (var j = i * n; j < (i + 1) * n; j++) {
            clickTimeList.push(clickData[j][11]);
            errorList.push(clickData[j][20]);
            dxList.push(clickData[j][19]);
            avgEffectiveAmplitudeList.push((clickData[j][18] + clickData[j][19]));
        }
        var meanTime = computeMean(clickTimeList);
        var error = computeMean(errorList) * 100;
        var sdx = computeStandardDeviation(dxList);
        var ae = computeMean(avgEffectiveAmplitudeList);
        var we = 4.133 * sdx;
        var ide = Math.log2(ae / we + 1.0);
        var throughput = ide * 1000 / meanTime;

        var aggRes = [];
        aggRes.push(participantCode);
        aggRes.push(sessionCode);
        aggRes.push(conditionCode);
        aggRes.push(testType);
        aggRes.push(eyeDominance);
        aggRes.push(pointingDevice);
        aggRes.push(deviceExperience);
        aggRes.push(A);
        aggRes.push(W);
        aggRes.push(n);
        aggRes.push(i);
        aggRes.push(meanTime);
        aggRes.push(error);
        aggRes.push(sdx);
        aggRes.push(we);
        aggRes.push(ide);
        aggRes.push(ae);
        aggRes.push(throughput);

        aggregateTaskResult.push(aggRes);
    }
}

// Computes overall mean task results and appends it to overallMeanResult array.
function computeOverallMeanResult() {
    var meanTimes = [];
    var errors = [];
    var throughputs = [];
    for (var i = 0; i < tasks.length; i++) {
        meanTimes.push(aggregateTaskResult[i][10]);
        errors.push(aggregateTaskResult[i][11]);
        throughputs.push(aggregateTaskResult[i][16]);
    }
    var overallMeanTime = computeMean(meanTimes);
    var overallMeanError = computeMean(errors);
    var overallMeanThroughput = computeMean(throughputs);
    
    var ovRes = [];
    ovRes.push(participantCode);
    ovRes.push(sessionCode);
    ovRes.push(conditionCode);
    ovRes.push(testType);
    ovRes.push(eyeDominance);
    ovRes.push(pointingDevice);
    ovRes.push(deviceExperience);
    ovRes.push(overallMeanTime);
    ovRes.push(overallMeanError);
    ovRes.push(overallMeanThroughput);

    overallMeanResult.push(ovRes);
}

// Generates individual click result string
function generateClickResultString(){
    var resultString = clickDataHeader.join(",") + "\n";
    for(var i = 0; i < clickData.length; i++){
        resultString += clickData[i].join(",") + "\n";
    }
    return resultString;
}

// Generates aggregate task result string
function generateTaskResultString(){
    var resultString = aggregateTaskResultHeader.join(",") + "\n";
    for(var i = 0; i < aggregateTaskResult.length; i++){
        resultString += aggregateTaskResult[i].join(",") + "\n";
    }
    return resultString;
}

// Generates overall mean result string
function generateMeanResultString(){
    var resultString = overallMeanResultHeader.join(",") + "\n";
    for(var i = 0; i < overallMeanResult.length; i++){
        resultString += overallMeanResult[i].join(",") + "\n";
    }
    return resultString;
}

function generatePASClickResultString() {
    var resultString = PASDataHeader.join(",") + "\n";
    for (var i = 0; i < pasClickData.length; i++) {
        resultString += pasClickData[i].join(",") + "\n";
    }
    return resultString;
}

// Concatenates all the result arrays into a string and returns it
function generateResultString() {
    if (testType === "pas"){
        return generatePASClickResultString();
    }

    var resultString = "";
    resultString = clickDataHeader.join(",") + "\n";
    for (var i = 0; i < clickData.length; i++) {
        resultString += clickData[i].join(",") + "\n";
    }
    resultString += "\n";
    resultString += aggregateTaskResultHeader.join(",") + "\n";
    for (var i = 0; i < aggregateTaskResult.length; i++) {
        resultString += aggregateTaskResult[i].join(",") + "\n";
    }
    resultString += "\n";
    resultString += overallMeanResultHeader.join(",") + "\n";
    for (var i = 0; i < overallMeanResult.length; i++) {
        resultString += overallMeanResult[i].join(",") + "\n";
    }
    return resultString;
}

// Uploads result string to the server
function uploadResult() {

    if (testType === "pas"){
        var clickResult = generatePASClickResultString();
    } else{
        var clickResult = generateClickResultString();
    }
    var taskResult = generateTaskResultString();
    var meanResult = generateMeanResultString();

    var filename = "WebFitts_" + participantCode + "_" + sessionCode + "_" + conditionCode + "_" + pointingDevice;
    var data = "filename=" + filename + "&click_result=" + clickResult + "&mean_result=" + meanResult + "&task_result=" + taskResult;
    var url = "/saveResult";
    postRequest(url, data, function() {
        console.log("Result uploaded to server!");
    });
}

/*
 * Renders the targets for the Fitt's Law experiment.
 *
 * Parameters
 * A: (Integer) Amplitude, defined as the distance between the centers of the screen and each target
 * W: (Integer) Width (radius) of the targets
 * n: (Integer) Number of targets
 * mainTarget: (Integer) Index of the main target
 * 
 */
function renderTargets(A, W, n, mainTarget) {
    // Clearing circle inner area
    for (var i = 0; i < n; i++) {
        var pos = getTargetPosition(A, n, i);
        noStroke();
        fill("#FFFFFF");
        circle(pos.x, pos.y, W);
    }

    // Creating circles with transparent inner areas
    for (var i = 0; i < n; i++) {
        var pos = getTargetPosition(A, n, i);
        stroke("#181818");
        strokeWeight(3);
        noFill();
        if (i == mainTarget) {
            fill("#3D9970");
        }
        circle(pos.x, pos.y, W);
    }
}

/*
 * Calculates the index of the next target.
 *
 * Parameters
 * c: (Integer) Click number
 * n: (Integer) Number of targets
 * 
 * Returns
 * (Integer) Index of the next target
 * 
 */
function getTargetIdxFromClickNumber(c, n) {
    var marker1 = -1;
    var marker2 = n / 2;
    if (n % 2 == 1) {
        marker2 = (n - 1) / 2;
    }
    var targetIdx = -1;

    for (var i = 0; i <= c; i++) {
        if (i % 2 == 0) {
            marker1++;
            marker1 = marker1 % n;
            targetIdx = marker1;
        }
        else {
            marker2++;
            marker2 = marker2 % n;
            targetIdx = marker2;
        }
    }

    return targetIdx;
}

/*
 * Calculates the position of the target.
 *
 * Parameters
 * A: (Integer) Amplitude, defined as the distance between the centers of the screen and each target
 * n: (Integer) Number of targets
 * idx: (Integer) Index of the target
 * 
 * Returns
 * (Pos) Position of the target
 * 
 */
function getTargetPosition(A, n, idx){
    var thetaX = 360 / n;
    var x = (width / 2) + cos(radians(idx * thetaX)) * A/2;
    var y = (height / 2) + sin(radians(idx * thetaX)) * A/2;
    return new Pos(x, y);
}

// Resizes the canvas to fit the window on resize
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    slider.position(width / 2 - 100, height / 2 + 320);
    $("#confirm_calibration_btn").css({'width': 150, 'top': height / 2 + 350, 'left': width / 2 - 75});
}

// Render volume image based on hover state and click
function renderVolumeImage(isHovering) {
    if (isHovering) {
        if (isMute) {
            $("#volume_icon").attr("src", "assets/volume_mute_hover.png");
        }
        else {
            $("#volume_icon").attr("src", "assets/volume_on_hover.png");
        }
    } 
    else {
        if (isMute) {
            $("#volume_icon").attr("src", "assets/volume_mute_default.png");
        }
        else {
            $("#volume_icon").attr("src", "assets/volume_on_default.png");
        }
    }
}

// Render trailing image based on hover state and click
function renderTrailImage(isHovering) {
    if (isHovering) {
        if (isTrailing) {
            $("#trail_icon").attr("src", "assets/trail_on_hover.png");
        }
        else {
            $("#trail_icon").attr("src", "assets/trail_off_hover.png");
        }
    } 
    else {
        if (isTrailing) {
            $("#trail_icon").attr("src", "assets/trail_on_default.png");
        }
        else {
            $("#trail_icon").attr("src", "assets/trail_off_default.png");
        }
    }
}

/*
|----------------------------------------------------
| CALIBRATION FUNCTIONS
|----------------------------------------------------
*/

// Checks if the system has been calibrated before
function isDisplayCalibrated() {
    if (getCookie("webfitt-calibration") == "") return false;
    else return true;
}

// Sets the calibration value and saves it to the cookie
function setCalibrationValue() {
    calibrationScale = slider.value();
}

// Gets the calibration value from the cookie
function getCalibrationValue() {
    return getCookie("webfitt-calibration");
}

/*
 |----------------------------------------------------
 | HELPER FUNCTIONS
 |----------------------------------------------------
 */

// Computes mean of given data
function computeMean(data) {
    var sum = 0;
    for (var i = 0; i < data.length; i++) {
        sum += data[i];
    }
    return sum / data.length;
}

// Computes standard deviation of given data
function computeStandardDeviation(data) {
    var mean = computeMean(data);
    var sum = 0;
    for (var i = 0; i < data.length; i++) {
        sum += Math.pow(data[i] - mean, 2);
    }
    return Math.sqrt(sum / (data.length - 1));
}

// Generates a random number between min and max (inclusive)
function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Performs a post request to the given url and calls the callback function upon success
function postRequest(url, data, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() { 
        if (request.readyState == 4 && request.status == 200)
            callback(request.responseText);
    }
    request.open("POST", url, true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.send(data);
}

// Function to save results as a zip file
function saveAsZipFile(filename) {
	var zip = new JSZip();
    if (testType === "pas"){
        zip.file(filename + "_pas_clicks.csv", generatePASClickResultString());
    } else{
        zip.file(filename + "_click.csv", generateClickResultString());
        zip.file(filename + "_task.csv", generateTaskResultString());
        zip.file(filename + "_overall.csv", generateMeanResultString());
    }
	// zip.generateAsync({type:"base64"}).then(function (content) {
		 // location.href="data:application/zip;base64," + content;
	// });
	zip.generateAsync({type:"blob"}).then(function (content) {
		 saveAs(content, filename + ".zip"); // FileSaver.js Library Function
	});
}

// Checks if all elements in the array are numbers
function isArrayOfNumbers(array) {
    for (var i = 0; i < array.length; i++) {
        if (isNaN(array[i])) {
            return false;
        }
    }
    return true;
}

// Parses an array of stringed numbers into numbers
function parseArrayOfNumbers(array) {
    var parsedArray = [];
    for (var i = 0; i < array.length; i++) {
        parsedArray.push(parseInt(array[i]));
    }
    return parsedArray;
}

// Utility function to get cookie value
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// Utility function to set cookie value
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

/*
 |----------------------------------------------------
 | REFERENCE FUNCTIONS
 |----------------------------------------------------
 */

// Calculation Test
function testing() {
    var sX = [540, 227, 540, 227, 540, 227, 540, 227, 540, 227, 540, 227, 540, 227, 540, 227, 540, 227, 540, 227];
    var sY = [592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592];
    var tX = [227, 540, 227, 540, 227, 540, 227, 540, 227, 540, 227, 540, 227, 540, 227, 540, 227, 540, 227, 540];
    var tY = [592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592, 592];
    var cX = [218, 529, 195, 533, 209, 607, 231, 540, 231, 560, 207, 524, 239, 515, 180, 501, 215, 571, 215, 521];
    var cY = [534, 496, 608, 547, 651, 554, 650, 568, 642, 567, 653, 604, 704, 610, 675, 606, 666, 621, 690, 641];
    var mt = [262, 268, 248, 233, 251, 252, 283, 214, 301, 266, 258, 258, 248, 242, 241, 252, 243, 255, 252, 210];

    var a = [];
    var b = [];
    var c = [];
    var d = [];
    var aes = [];

    for (var i = 0; i < sX.length; i++) {
        a.push(Math.sqrt((sX[i] - tX[i]) * (sX[i] - tX[i]) + (sY[i] - tY[i]) * (sY[i] - tY[i])));
        b.push(Math.sqrt((tX[i] - cX[i]) * (tX[i] - cX[i]) + (tY[i] - cY[i]) * (tY[i] - cY[i])));
        c.push(Math.sqrt((sX[i] - cX[i]) * (sX[i] - cX[i]) + (sY[i] - cY[i]) * (sY[i] - cY[i])));
        d.push(((c[i] * c[i]) - (b[i] * b[i]) - (a[i] * a[i]))/(2.0 * a[i]));
        aes.push(a[i] + d[i]);
    }

    var mean_d = computeMean(d);
    var sd_d = computeStandardDeviation(d);
    var ae = computeMean(aes);
    var we = 4.133 * sd_d;
    var ide = Math.log2(ae / we + 1.0);
    var meant = computeMean(mt);
    var throughput = ide * 1000 / meant;

    console.log(d);
    console.log(mean_d);
    console.log(sd_d);
    console.log(ae);
    console.log(we);
    console.log(ide);
    console.log(meant);
    console.log(throughput);
}

function generatePASSquares(numSquares, amplitude) {
    var squares = [];
    var padding = 100;
    var maxAttempts = 250;
    //var maxDistance = amplitude / 2;
    var forbiddenZoneWidth = 150;  // Width of forbidden zone
    var forbiddenZoneHeight = 150; // Height of forbidden zone

    for (var i = 0; i < numSquares; i++) {
        var pos;
        var attempts = 0;

        do {
            pos = new Pos(
                Math.random() * (width - padding * 2) + padding,
                Math.random() * (height - padding * 2) + padding
            );
            attempts++;
        } while ((hasSquareCollision(squares, pos, amplitude) ||
                 isInForbiddenZone(pos, forbiddenZoneWidth, forbiddenZoneHeight, pasSquareSize)) &&
                 attempts < maxAttempts);

        if (attempts < maxAttempts) {
            squares.push({pos: pos, clicked: false, index: i});
        }
    }

    console.log(squares);
    return squares;
}

function hasSquareCollision(squares, newPos, amplitude) {
    var minAllowedDistance = Math.max(amplitude, pasSquareSize * 1.5);

    for (var i = 0; i < squares.length; i++) {
        var dist = sqrt(pow(squares[i].pos.x - newPos.x, 2) + pow(squares[i].pos.y - newPos.y, 2));
        if (dist < minAllowedDistance) {
            return true;
        }
    }
    return false;
}

function renderPASSquares() {
    for (var i = 0; i < pasSquares.length; i++) {
        var square = pasSquares[i];
        var isCurrentTarget = (i === pasCurrentTarget);
        var isClicked = square.clicked;

        // Draw square
        stroke(0);
        strokeWeight(3);

        if (isCurrentTarget) {
            fill("#3D9970"); // Green for current target
        } else if (isClicked) {
            fill("#90EE90"); // Light green for clicked
        } else {
            fill(255); // White for unclicked
        }

        rect(square.pos.x - pasSquareSize / 2, square.pos.y - pasSquareSize / 2, pasSquareSize, pasSquareSize);

        // Draw number
        fill(0);
        textSize(20);
        textFont(robotoRegularFont);
        textAlign(CENTER, CENTER);
        text(i + 1, square.pos.x, square.pos.y);
    }
}

function renderPASInfo() {
    noStroke();
    textSize(28);
    fill(0);
    textFont(robotoRegularFont);
    textAlign(LEFT);
    text("Task " + (taskIdx + 1) + " of " + pasTasks.length + " | Click squares in order: " + (pasCurrentTarget + 1) + " of " + pasNumSquares, width - 600, 50);
    textFont(robotoLightFont);
    text("Clicked: " + pasCurrentTarget + " | Remaining: " + (pasNumSquares - pasCurrentTarget), width - 600, 85);
}

$(document).on("keydown", function(event) {
    if (event.code === "Space") {
        event.preventDefault();
        if (testType === "fitts" && isTaskRunning) {
            onCanvasClick();
        } else if (testType === "pas" && isTaskRunning) {
            onPASClick();
        }
    }
});

function onPASClick() {
    var clickPos = new Pos(mouseX, mouseY);
    var currentSquare = pasSquares[pasCurrentTarget];
    var squareLeft = currentSquare.pos.x - pasSquareSize / 2;
    var squareRight = currentSquare.pos.x + pasSquareSize / 2;
    var squareTop = currentSquare.pos.y - pasSquareSize / 2;
    var squareBottom = currentSquare.pos.y + pasSquareSize / 2;

    var isCorrect = (clickPos.x > squareLeft && clickPos.x < squareRight &&
                     clickPos.y > squareTop && clickPos.y < squareBottom);

    var clickTime = millis() - lastClickTime;
    lastClickTime = millis();

    var data = [];
    data.push(participantCode);
    data.push(sessionCode);
    data.push(conditionCode);
    data.push(testType);
    data.push(eyeDominance);
    data.push(pointingDevice);
    data.push(deviceExperience);
    data.push(pasTasks[taskIdx].amplitude);
    data.push(pasTasks[taskIdx].width);
    data.push(pasTasks[taskIdx].numSquares);
    data.push(taskIdx);
    data.push(pasCurrentTarget + 1); // Click number
    data.push(clickTime);
    data.push(currentSquare.pos.x);
    data.push(currentSquare.pos.y);
    data.push(clickPos.x);
    data.push(clickPos.y);
    data.push(isCorrect ? 0 : 1); // Incorrect flag

    pasClickData.push(data);

    if (isCorrect) {
        if (!isMute) {
            correctAudio.play();
        }
        currentSquare.clicked = true;
        pasCurrentTarget++;

        if (pasCurrentTarget >= pasNumSquares) {
            // Task complete, move to next task
            taskIdx++;
            if (taskIdx >= pasTasks.length) {
                // All tasks complete
                isTaskRunning = false;
                isTaskFinished = true;

                var filename = "WebPAS_" + participantCode + "_" + sessionCode + "_" + conditionCode + "_" + pointingDevice;
                saveAsZipFile(filename);
                if (servdown) {
                    uploadResult();
                }
            } else {
                // Initialize next task
                pasSquares = generatePASSquares(pasTasks[taskIdx].numSquares, pasTasks[taskIdx].amplitude);
                pasSquareSize = pasTasks[taskIdx].width;
                pasCurrentTarget = 0;
                pasNumSquares = pasTasks[taskIdx].numSquares;
                lastClickTime = millis();
            }
        }
    } else {
        if (!isMute) {
            incorrectAudio.play();
        }
    }
}

function isInForbiddenZone(pos, zoneWidth, zoneHeight, squareSize) {
    // Check if square would overlap with top-left forbidden zone (header logo area)
    var squareRadius = squareSize / 2;
    return (pos.x - squareRadius < zoneWidth && pos.y - squareRadius < zoneHeight);
}