var ROUTE_FACEBEAUTY = '/faceplusplus_beauty'
$(document).ready(function () {
    $('.parallax').parallax();
    $(".button-collapse").sideNav();
    face_beauty = new Vue({
        el: '#face_beauty',
        data: {
            Gender: '',
            Age: '',

        }
    })
    play();
    myChart = echarts.init(document.getElementById('GraphMain'));
});

function play() {
    var aVideo = document.getElementById('video');
    var aCanvas = document.getElementById('canvas');
    var ctx = aCanvas.getContext('2d');

    // const stream = navigator.mediaDevices.getUserMedia({video: {}})
    // const videoEl = $('#inputVideo').get(0)
    // videoEl.srcObject = stream

    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia; //获取媒体对象（这里指摄像头）
    navigator.getUserMedia({
        video: true
    }, gotStream, noStream); //参数1获取用户打开权限；参数二成功打开后调用，并传一个视频流对象，参数三打开失败后调用，传错误信息

    function gotStream(stream) {
        video.srcObject = stream;
        video.onerror = function () {
            stream.stop();
        };
        stream.onended = noStream;
        video.onloadedmetadata = function () {
            console.log('摄像头成功打开！');
        };
    }

    function noStream(err) {
        alert(err);
    }

    document.getElementById("snap").addEventListener("click", function () {

        ctx.drawImage(aVideo, 0, 0, 640, 480); //将获取视频绘制在画布上
    });

    document.getElementById("beauty").addEventListener("click", function () {
        var url = aCanvas.toDataURL("image/png");
        var whitening = $('#whitening').val();
        var smoothing = $('#smoothing').val();
        console.log('crop ok')
        var data = {
            data: JSON.stringify({
                "URL": url,
                "whitening": whitening,
                "smoothing": smoothing
            })
        };

        $.ajax({
            url: ROUTE_FACEBEAUTY,
            type: 'POST',
            data: data,
            success: function (data) {
                console.log(data)
                let url = data.result;
                $('#face_').attr("src", 'data:image/jpeg;base64,' + url);
                let face = data.faces;
                if (face === 'No') {
                    console.log("Detect No Face")
                } else {
                    let attr = face[0].attributes
                    face_beauty.Gender = attr.gender.value
                    face_beauty.Age = attr.age.value
                    face_beauty.female_score = attr.beauty.female_score
                    face_beauty.male_score = attr.beauty.male_score
                    face_beauty.ethnicity = attr.ethnicity.value
                    face_beauty.skinstatus_health = attr.skinstatus.health
                    face_beauty.skinstatus_stain = attr.skinstatus.stain
                    face_beauty.skinstatus_acne = attr.skinstatus.acne
                    face_beauty.skinstatus_dark_circle = attr.skinstatus.dark_circle
                    draw_emotion(attr.emotion)
                    $('#face_beauty').show()
                }

            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log('ajax Err code:' + XMLHttpRequest.status + ' ' + XMLHttpRequest.readyState + ' ' + textStatus);
            }
        })
    });
}

function draw_emotion(data) {
    var option = {
        title: {
            text: '情绪识别结果',
            subtext: '伤心、平静、厌恶、愤怒、惊讶、恐惧、高兴'
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