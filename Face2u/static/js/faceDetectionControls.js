let forwardTimes = [];
let withFaceLandmarks = false;
let withBoxes = true;
const TINY_FACE_DETECTOR = 'tiny_face_detector';
const MODEL_URL = '../static/models';
let selectedFaceDetector = TINY_FACE_DETECTOR;
let inputSize = 512;
let scoreThreshold = 0.5;

$(document).ready(function () {
    $('.parallax').parallax();
    $(".button-collapse").sideNav();
    var video = $('#inputVideo');
    video[0].addEventListener('play', function () {
        var offset = video.offset();
        var height = video.height();
        var width = video.width();
        var canvas = $('#overlay');
        canvas.css({position: "absolute", 'top': offset.top, 'left': offset.left, 'height': height, 'width': width});
        // console.log(canvas.offset());
    })
    run()
    face_return = new Vue({
        el: '#face_return',
        data: {
            Gender: '',
            Age: '',
            face_detect: '#'
        }
    })
    myChart = echarts.init(document.getElementById('GraphMain'));
    // document.getElementById('file').onchange = function () {
    //     var file = document.getElementById('file').files[0];
    //     var url = getFileURL(file);
    //     console.log(url);
    //     document.getElementById("inputVideo").src = url;
    // }
    document.getElementById('file').onchange = function (e) {
        var canvas = $('#overlay');
        canvas.css({position: "absolute", 'top': 0, 'left': 0, 'height': 0, 'width': 0});
        var file = e.target.files[0],
            reader = new FileReader(),
            result = '';
        if (file) {
            reader.readAsDataURL(file)
        }
        reader.onabort = function () {
            //读取中断
            console.log("读取中断")
        };
        reader.onerror = function () {
            //读取发生错误
            console.log("读取发生错误")
        };
        reader.onload = function () {

            var url = getFileURL(file);
            console.log(url);
            document.getElementById("inputVideo").src = url;
            var video = $('#inputVideo');
            onPlay(video.get(0));
        }


    }
});


function getFileURL(file) {

    var getUrl = null;

    if (window.createObjectURL !== undefined) { // basic

        getUrl = window.createObjectURL(file);

    } else if (window.URL !== undefined) { // mozilla(firefox)

        getUrl = window.URL.createObjectURL(file);

    } else if (window.webkitURL !== undefined) { // webkit or chrome

        getUrl = window.webkitURL.createObjectURL(file);

    }

    return getUrl;

}

function emotion_analysis() {
    analysis = 1
}

function onChangeWithFaceLandmarks(e) {
    $('#button_analysis').show()
    withFaceLandmarks = $(e.target).prop('checked')
}

function onChangeHideBoundingBoxes(e) {
    withBoxes = !$(e.target).prop('checked')
}

function updateTimeStats(timeInMs) {
    forwardTimes = [timeInMs].concat(forwardTimes).slice(0, 30)
    const avgTimeInMs = forwardTimes.reduce((total, t) => total + t) / forwardTimes.length
    $('#time').val(`${Math.round(avgTimeInMs)} ms`)
    $('#fps').val(`${faceapi.round(1000 / avgTimeInMs)}`)
}

async function onPlay() {
    const videoEl = $('#inputVideo').get(0)

    if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
        return setTimeout(() => onPlay())


    const options = getFaceDetectorOptions()

    const ts = Date.now()

    const faceDetectionTask = faceapi.detectSingleFace(videoEl, options)
    const result = withFaceLandmarks
        ? await faceDetectionTask.withFaceLandmarks()
        : await faceDetectionTask

    updateTimeStats(Date.now() - ts)

    const drawFunction = withFaceLandmarks
        ? drawLandmarks
        : drawDetections

    if (result) {
        drawFunction(videoEl, $('#overlay').get(0), [result], withBoxes)
    }

    setTimeout(() => onPlay())
}

function updateResults() {
}

async function run() {
    const MODEL_URL = '../static/models'
    const inputSizeSelect = $('#inputSize')
    inputSizeSelect.val(inputSize)
    inputSizeSelect.on('change', onInputSizeChanged)
    inputSizeSelect.material_select()
    await faceapi.loadTinyFaceDetectorModel(MODEL_URL)
    await faceapi.loadFaceLandmarkModel(MODEL_URL)
    changeInputSize(320)

    // start processing frames
    var video = $('#inputVideo');
    onPlay(video.get(0));
}

function getFaceDetectorOptions() {
    return new faceapi.TinyFaceDetectorOptions({inputSize, scoreThreshold})
}

function onInputSizeChanged(e) {
    changeInputSize(e.target.value)
    updateResults()
}

function changeInputSize(size) {
    inputSize = parseInt(size)

    const inputSizeSelect = $('#inputSize')
    inputSizeSelect.val(inputSize)
    inputSizeSelect.material_select()
}

function onIncreaseScoreThreshold() {
    scoreThreshold = Math.min(faceapi.round(scoreThreshold + 0.1), 1.0)
    $('#scoreThreshold').val(scoreThreshold)
    updateResults()
}

function onDecreaseScoreThreshold() {
    scoreThreshold = Math.max(faceapi.round(scoreThreshold - 0.1), 0.1)
    $('#scoreThreshold').val(scoreThreshold)
    updateResults()
}

function getCurrentFaceDetectionNet() {
    if (selectedFaceDetector === TINY_FACE_DETECTOR) {
        return faceapi.nets.tinyFaceDetector
    }
}

function isFaceDetectionModelLoaded() {
    return !!getCurrentFaceDetectionNet().params
}

async function changeFaceDetector(detector) {
    if (!isFaceDetectionModelLoaded()) {
        await getCurrentFaceDetectionNet().load(MODEL_URL)
    }
}
