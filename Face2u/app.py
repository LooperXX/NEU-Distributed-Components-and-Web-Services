from flask import Flask, request, render_template, json, jsonify
from flask_restful import reqparse, abort, Api, Resource
import requests

faceplusplus_url = 'https://api-cn.faceplusplus.com/facepp/v3/detect'
faceplusplus_beauty_url = 'https://api-cn.faceplusplus.com/facepp/beta/beautify'
api_key = 'V5Yuct_b8FztrP3SE_F6dqy8nx5DRWZk'
api_secret = 'aJIWpStoR6CoNJF67zL5jTL2hfr-NJQW'

app = Flask(__name__)
api = Api(app)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/face')
def face():
    return render_template('face.html')


@app.route('/face_webcam')
def face_webcam():
    return render_template('face_webcam.html')


@app.route('/face_beauty')
def face_beauty():
    return render_template('face_beauty.html')


@app.route("/faceplusplus", methods=['POST'])
def get_data():
    data = json.loads(request.form.get('data'))
    URL = data['URL']
    return jsonify(get_face(URL))


def get_face(URL):
    params = {
        'api_key': api_key,
        'api_secret': api_secret,
        'image_base64': URL,
        # 'return_landmark': 0,
        'return_attributes': 'gender,age,emotion'
    }
    response = requests.post(faceplusplus_url, data=params)
    response = response.content.decode('utf-8')
    req_dict = json.JSONDecoder().decode(response)
    req_dict['msg'] = 'OK'
    return req_dict


@app.route("/faceplusplus_beauty", methods=['POST'])
def get_data_beauty():
    data = json.loads(request.form.get('data'))
    URL = data['URL']
    whitening = data['whitening']
    smoothing = data['smoothing']
    return jsonify(get_beauty(URL, whitening, smoothing))


def get_beauty(URL, whitening, smoothing):
    params = {
        'api_key': api_key,
        'api_secret': api_secret,
        'image_base64': URL,
        'whitening': whitening,
        'smoothing': smoothing
    }
    response = requests.post(faceplusplus_beauty_url, data=params)
    response = response.content.decode('utf-8')
    req_dict = json.JSONDecoder().decode(response)

    params = {
        'api_key': api_key,
        'api_secret': api_secret,
        'image_base64': URL,
        'return_attributes': 'gender,age,emotion,beauty,ethnicity,skinstatus'
    }
    response = requests.post(faceplusplus_url, data=params)
    response = response.content.decode('utf-8')
    req_dict__ = json.JSONDecoder().decode(response)
    array = req_dict__['faces']
    if len(array) == 0:
        req_dict['faces'] = 'No'
    else:
        req_dict['faces'] = array
    return req_dict


if __name__ == '__main__':
    app.run()
