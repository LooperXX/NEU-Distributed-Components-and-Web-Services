analysis = 0
const ROUTE_FACEPLUSPLUS = '/faceplusplus'

function resizeCanvasAndResults(dimensions, canvas, results) {
    const {width, height} = dimensions instanceof HTMLVideoElement
        ? faceapi.getMediaDimensions(dimensions)
        : dimensions
    var video = $('#inputVideo');
    // const width  = video.width();
    // const height  = video.height();
    canvas.width = width;
    canvas.height = height;

    // resize detections (and landmarks) in case displayed image is smaller than
    // original size
    return results.map(res => res.forSize(width, height))
}

function drawDetections(dimensions, canvas, detections) {
    const resizedDetections = resizeCanvasAndResults(dimensions, canvas, detections)
    faceapi.drawDetection(canvas, resizedDetections)
}

async function getCanvas(obj) {
    const regionsToExtract = [
        new faceapi.Rect(obj.shift.x, obj.shift.y, obj.imageWidth, obj.imageHeight)
    ]
// actually extractFaces is meant to extract face regions from bounding boxes
// but you can also use it to extract any other region
    const canvases = await faceapi.extractFaces($('#inputVideo').get(0), regionsToExtract)
    var strDataURI = canvases[0].toDataURL("image/png");
    $('#face_crop').attr("src", strDataURI);
    $('#face_crop').show();
    if (analysis === 1) {
        analysis = 0
        var data = {
            data: JSON.stringify({
                "URL": strDataURI
            })
        };

        $.ajax({
            url: ROUTE_FACEPLUSPLUS,
            type: 'POST',
            data: data,
            success: function (data) {
                console.log(data)
                if (data.faces.length === 0)
                    console.log('Defect No Face')
                else {
                    var attr = data.faces[0].attributes
                    face_return.Gender = attr.gender.value
                    face_return.Age = attr.age.value
                    $('#face_detect').attr("src", strDataURI);
                    draw_emotion(attr.emotion)
                    $('#face_return').show();
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log('ajax Err code:' + XMLHttpRequest.status + ' ' + XMLHttpRequest.readyState + ' ' + textStatus);
            }
        })
    }
}

function drawLandmarks(dimensions, canvas, results, withBoxes = true) {
    const resizedResults = resizeCanvasAndResults(dimensions, canvas, results)

    if (withBoxes) {
        faceapi.drawDetection(canvas, resizedResults.map(det => det.detection))
    }

    const faceLandmarks = resizedResults.map(det => det.landmarks)
    getCanvas(faceLandmarks[0])
    const drawLandmarksOptions = {
        lineWidth: 2,
        drawLines: true,
        color: 'green'
    }
    faceapi.drawLandmarks(canvas, faceLandmarks, drawLandmarksOptions)
}


function draw_emotion(data) {
    var option = {
        title: {
            text: '情绪识别结果',
            subtext:'伤心、平静、厌恶、愤怒、惊讶、恐惧、高兴'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['情绪概率值']
        },
        toolbox: {
            show: true,
            feature: {
                mark: {show: true},
                dataView: {show: true, readOnly: false},
                magicType: {show: true, type: ['line', 'bar']},
                restore: {show: true},
                saveAsImage: {show: true}
            }
        },
        calculable: true,
        xAxis: [
            {
                type: 'category',
                data: ['伤心', '平静', '厌恶', '愤怒', '惊讶', '恐惧', '高兴']
            }
        ],
        yAxis: [
            {
                type: 'value'
            }
        ],
        series: [
            {
                name: '情绪概率值',
                type: 'bar',
                data: [data.sadness, data.neutral, data.disgust, data.anger, data.surprise, data.fear, data.happiness],
                markPoint: {
                    data: [
                        {type: 'max', name: '最大值'},
                        {type: 'min', name: '最小值'}
                    ]
                }
            }
        ]
    };
    myChart.setOption(option);
}