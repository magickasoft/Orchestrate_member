var socket = io(API_SOCKET);
var playAudioTrack;
var isTrackPlay = false;
var __log;
var fileURL;
var memberActivStatus;
var initinalGain;

var limitLockTimer = 600 * 3; // in sec
var isRelease;
// app to send the contact forms
angular.module('app', ["ngRoute", "restangular", "ngAnimate", "rzModule", "uiSwitch"]);
angular.module('app').config(AppRouteProvider).run(AppRunner);

angular.module('app').factory('SoundRecording', [SoundRecordingModel]);
angular.module('app').factory('Group', ['Restangular', GroupModel]);
angular.module('app').factory('Song', ['Restangular', SongModel]);
angular.module('app').factory('Member', ['Restangular', MemberModel]);
angular.module('app').factory('Instrument', ['Restangular', InstrumentModel]);
angular.module('app').factory('Recording', ['Restangular', RecordingModel]);

angular.module('app').controller('MemberController', ['$scope', '$rootScope', 'Member', 'Instrument', 'Group', 'SoundRecording', MemberController]);
angular.module('app').controller('GroupController', ['$scope', '$rootScope', 'Group', 'Member', GroupController]);
angular.module('app').controller('RecordController', ['$location', '$scope', '$rootScope', '$http', 'Recording', RecordController]);
angular.module('app').controller('RecordDetailsController', ['$location', '$scope', '$routeParams', '$rootScope', '$http', 'Recording', RecordDetailsController]);
/*
 function __log  ( x , type) {
 console.log( x );
 var d = new Date();
 var pad3 = function(x) { return (( x > 100 ) ? x : "0" + ( x >= 10 ? x : "0" + x )); };
 //jQuery("#output").prepend( d.toUTCString() + "." + pad3( d.getMilliseconds()) + " - " + JSON.stringify( x ) + "\n" );
 };*/


function supportsAudio() {
    var a = document.createElement('audio');
    return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
}

var historyStatus = (function () {
    var historyMemberStatus = [];

    function in_lastStatus(value, array) {
        if(array[array.length -1] == value) return true;
        return false;
    }
    function addStatus(status) {
        if (historyMemberStatus.length == 0){
            historyMemberStatus.push(status);
        }else{
            if(!in_lastStatus(status,historyMemberStatus)){
                historyMemberStatus.push(status);
            }
        }
    }
    function getLastStatus() {
        return historyMemberStatus[historyMemberStatus.length -1];
    }
    function gethistoryStatus() {
        return historyMemberStatus;
    }
    return {
        addStatus: addStatus,
        in_lastStatus:in_lastStatus,
        getLastStatus:getLastStatus,
        gethistoryStatus:gethistoryStatus
    }
}());


var localLibraryAudio = (function () {
    function onError(err) {
        console.log('ERR:', err);
    }

    function deleteLocalLibraryAudio(obq) {

        var localLibraryAudio = localStorage.getItem('localLibraryAudio');
        if (localLibraryAudio === null) {
            return [];
        } else {

            var objectLibraryAudio = JSON.parse(localStorage.getItem('localLibraryAudio'));

            var temp = [];
            for (var i = 0; i < objectLibraryAudio.length; i++) {
                if (objectLibraryAudio[i].RecordingId !== obq.RecordingId) {
                    temp.push(objectLibraryAudio[i]);
                }
            }
            localStorage.setItem('localLibraryAudio', JSON.stringify(temp));


            window.resolveLocalFileSystemURL(obq.fileURL, function (file) {
                file.remove(function () {
                    console.log(obq.fileURL + " deleted");
                }, localLibraryAudio.onError);
            }, localLibraryAudio.onError);

            return JSON.parse(localStorage.getItem('localLibraryAudio'));
        }

    }

    function getLocalLibraryAudio() {

        var localLibraryAudio = localStorage.getItem('localLibraryAudio');
        if (localLibraryAudio === null) {
            return [];
        } else {
            return JSON.parse(localStorage.getItem('localLibraryAudio'));
        }

    }

    function setLocalLibraryAudio(obq) {
        console.log(obq);
        var dt = new Date();
        var tmpObqTrack = {};

        var fileURL = obq.fileURL;
        var fileName = fileURL.split('/');
        var filterName = fileName[fileName.length - 1].slice(0, -3);

        if (obq.hasOwnProperty('tracks')) {
            var tracks = obq.tracks;
            for (var i = 0; i < tracks.length; i++) {
                var wavTrack = tracks[i].wav;
                if (wavTrack.indexOf(filterName) !== -1) {
                    tmpObqTrack = tracks[i];
                }
            }
        }
        console.log(tmpObqTrack);


        var localLibraryAudio = localStorage.getItem('localLibraryAudio');
        var newObject = {};
        var objectLibraryAudio = [];
        if (localLibraryAudio === null && !$.isEmptyObject(tmpObqTrack)) {
            newObject = {
                date: dt,
                Name: obq.Name,
                RecordingId: obq.RecordingId,
                fileURL: obq.fileURL,
                track: tmpObqTrack
            };
            objectLibraryAudio.push(newObject);
            localStorage.setItem('localLibraryAudio', JSON.stringify(objectLibraryAudio));
        } else if (!$.isEmptyObject(tmpObqTrack)) {
            objectLibraryAudio = JSON.parse(localStorage.getItem('localLibraryAudio'));

            var temp = [];
            for (var i = 0; i < objectLibraryAudio.length; i++) {
                if (objectLibraryAudio[i].RecordingId !== obq.RecordingId) {
                    temp.push(objectLibraryAudio[i]);
                } else if (objectLibraryAudio[i].RecordingId == obq.RecordingId) {

                }
            }
            objectLibraryAudio = temp;
            newObject = {
                date: dt,
                Name: obq.Name,
                RecordingId: obq.RecordingId,
                fileURL: obq.fileURL,
                track: tmpObqTrack
            };
            objectLibraryAudio.push(newObject);
            localStorage.setItem('localLibraryAudio', JSON.stringify(objectLibraryAudio));

        }
        //localStorage.setItem('localLibraryAudio', JSON.stringify(objectmas));

        /*var  dt = new Date();
         var  localLibraryAudio = localStorage.getItem('localLibraryAudio');

         console.log(obq);
         var objectmas =[];
         if (localLibraryAudio === null) {
         localLibraryAudio = obq;
         localLibraryAudio.date = dt;
         objectmas.push(localLibraryAudio);
         } else {
         objectmas = JSON.parse(localStorage.getItem('localLibraryAudio'));

         var temp = [];
         for (var i = 0; i < objectmas.length; i++) {
         if (!(objectmas[i].RecordingId === obq.RecordingId && objectmas[i].fileURL === obq.fileURL)) {
         temp.push(objectmas[i]);
         }
         }
         objectmas = temp;
         var local = {};
         local = obq;
         local.date = dt;
         objectmas.push(local);
         }
         localStorage.setItem('localLibraryAudio', JSON.stringify(objectmas));*/

    }

    return {
        setLocalLibraryAudio: setLocalLibraryAudio,
        getLocalLibraryAudio: getLocalLibraryAudio,
        deleteLocalLibraryAudio: deleteLocalLibraryAudio,
        onError: onError
    }
}());

function InstrumentModel(Restangular) {
    this.promise = {
        to: {
            get: function (params) {
                var sGroupId = localStorage.getItem("memberGroup");
                return Restangular.all('instruments').getList({GroupId: sGroupId});
            }
        }
    };
    return this;
}


function GroupModel(Restangular) {
    this.promise = {
        to: {
            get: function (params) {
                return Restangular.all('groups').getList(params);
            },
            find: function (code) {
                return Restangular.all('groups').getList({"InvitationCode": code});
            },
            destroy: function (id) {
                return Restangular.one('groups', id).remove();
            },
            put: function (form) {
                return Restangular.all('groups').put(form);
            },
            save: function (id, form) {
                return Restangular.one('groups', id).customPOST(form);
            }
        }
    };
    return this;
}

function SongModel(Restangular) {

    this.promise = {
        to: {
            get: function (params) {
                var sGroupId = localStorage.getItem("memberGroup");
                return Restangular.one('groups', sGroupId).all('songs').getList(params);
            },
            read: function (id) {
                var sGroupId = localStorage.getItem("memberGroup");
                return Restangular.one('groups', sGroupId).one('songs', id).get();
            },
            destroy: function (id) {
                var sGroupId = localStorage.getItem("memberGroup");
                return Restangular.one('groups', sGroupId).one('songs', id).remove();
            },
            put: function (form) {
                var sGroupId = localStorage.getItem("memberGroup");
                return Restangular.one('groups', sGroupId).all('songs').post(form);
            },
            save: function (id, form) {
                var sGroupId = localStorage.getItem("memberGroup");
                return Restangular.one('groups', sGroupId).one('songs', id).customPOST(form);
            }
        }
    };
    return this;
}

function MemberModel(Restangular) {
    this.promise = {
        to: {
            destroy: function (socket_id) {
                var sGroupId = localStorage.getItem("memberGroup");
                return Restangular.one('groups', sGroupId).one('members', socket_id).remove();
            },
            save: function (sGroupId, socket_id, form) {
                return Restangular.one('groups', sGroupId).one('members', socket_id).customPOST(form);
            }
        }
    };
    return this;
}

function RecordingModel(Restangular) {
    this.promise = {
        to: {
            get: function (params) {
                var sGroupId = localStorage.getItem("memberGroup");
                if (sGroupId !== undefined && sGroupId !== "undefined" && sGroupId !== "" && sGroupId !== null && sGroupId !== "null") {
                    return Restangular.one('groups', JSON.parse(sGroupId).GroupId).all('recordings').getList(params);
                }
            },
            read: function (id) {
                var sGroupId = localStorage.getItem("memberGroup");
                if (sGroupId !== undefined && sGroupId !== "undefined" && sGroupId !== "" && sGroupId !== null && sGroupId !== "null") {
                    return Restangular.one('groups', JSON.parse(sGroupId).GroupId).one('recordings', id).get();
                }
            },
            destroy: function (id) {
                var sGroupId = localStorage.getItem("memberGroup");
                if (sGroupId !== undefined && sGroupId !== "undefined" && sGroupId !== "" && sGroupId !== null && sGroupId !== "null") {
                    return Restangular.one('groups', JSON.parse(sGroupId).GroupId).one('recordings', id).remove();
                }
            },
            start: function (sSongId) {
                var sGroupId = localStorage.getItem("memberGroup");
                if (sGroupId !== undefined && sGroupId !== "undefined" && sGroupId !== "" && sGroupId !== null && sGroupId !== "null") {
                    return Restangular.one('groups', JSON.parse(sGroupId).GroupId).one('songs', sSongId).all('recordings').post({});
                }
            },
            stop: function (sRecordingId) {
                var sGroupId = localStorage.getItem("memberGroup");
                if (sGroupId !== undefined && sGroupId !== "undefined" && sGroupId !== "" && sGroupId !== null && sGroupId !== "null") {
                    return Restangular.one('groups', JSON.parse(sGroupId).GroupId).one('recordings', sRecordingId).customPOST({Status: "Stopped"});
                }
            }
        }
    };
    return this;
}

function SoundRecordingModel() {

    var audio_context;
    var recorder;
    var testrecorder;

    /*var log = function( x , type) {
     console.log( x );
     var d = new Date();
     var pad3 = function(x) { return (( x > 100 ) ? x : "0" + ( x >= 10 ? x : "0" + x )); };
     $rootScope.syslog.unshift({messageText: d.toUTCString() + "." + pad3( d.getMilliseconds()) + " - " + JSON.stringify( x ) + "",massageStatus:type});
     console.log($rootScope.syslog);
     //jQuery("#output").prepend( d.toUTCString() + "." + pad3( d.getMilliseconds()) + " - " + JSON.stringify( x ) + "\n" );
     };*/
    this.set_Gain = function (value) {
        if (recorder && recorder !==null) {
            console.log('VALUE: ',value);
            recorder.setGain(value);
        }else {
            console.log('RECORDER NULL');
        }
    };
    this.startUserMedia = function (stream) {
        var input = audio_context.createMediaStreamSource(stream);
        __log('Media stream created.', 'system');
        __log("input sample rate " + input.context.sampleRate, 'system');
        //input.connect(audio_context.destination);
        __log('Input connected to audio context destination.', 'system');

        recorder = new Recorder(input, {numChannels: 1});
        __log('Web API Recorder initialised.', 'record');
    };
    this.testRecord_start = function () {
        if (typeof( Media ) !== "undefined") {

            var directory = "";

            var extension = "amr";

            if (device.platform.indexOf("iOS") >= 0) {
                extension = "wav";
            } else {
            }

            var amrName = encodeURIComponent('test_track.' + extension);
            fileURL = '';

            console.log("media: folder=" + directory + " platform=" + device.platform);
            console.log("media: prepare recording with name = " + amrName);

            var src = directory + amrName;
            var captureSuccess = function () {
                if (device.platform == 'iOS') {
                    fileURL = src = cordova.file.tempDirectory + amrName;
                }
            };
            var captureError = function (error) {
                console.log('testrecords',error);
            };

            testrecorder = new Media(src, captureSuccess, captureError);

            var gotFileEntry = function (fileEntry) {
                fileURL = fileEntry.toURL();
                console.log("fileSystem: getFileEntry=" + fileURL);
                console.log(fileEntry);
                console.log('media: recording.start() ');
                testrecorder.startRecord();
            };

            var gotFS = function (fileSystem) {
                console.log("fileSystem: gotFS " + JSON.stringify(fileSystem));
                fileSystem.root.getFile(src, {create: true, exclusive: false}, gotFileEntry, fail);
            };

            var fail = function (e) {
                console.log("fileSystem: FAILURE " + JSON.stringify(e));
            };

            console.log('media: cordova.file.tempDirectory=' + cordova.file.tempDirectory);
            if (device.platform == 'Android') {
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
            } else if (device.platform == 'iOS') {
                console.log('media: recording.start() for iOS', 'record');
                fileURL = src;
                testrecorder.startRecord();
            }
        }
    };
    this.testRecord_stop = function () {
        if (typeof( Media ) !== "undefined") {
            console.log('media: recording.stop()');
            if (typeof( testrecorder ) === "undefined") {
                return;
            }
            testrecorder.stopRecord();
            testrecorder = null;
        }
    };
    this.start = function (data) {
        if (typeof( Media ) !== "undefined") {

            // var directory = cordova.file.externalApplicationStorageDirectory;
            // if  ( !directory ) { directory = cordova.file.applicationStorageDirectory; }
            var directory = "";

            var gr = JSON.parse(localStorage.getItem("memberGroup"));
            var track = JSON.parse(localStorage.getItem("track"));
            var mi = JSON.parse(localStorage.getItem("memberInfo"));
            var esc = function (x) {
                return unescape(x.replace(" ", "-"));
            };

            var extension = "amr";
            var options = new FileUploadOptions();
            options.fileKey = "file";
            options.chunkedMode = false;

            if (device.platform.indexOf("iOS") >= 0) {
                extension = "wav";
                //extension = "amr";
                // directory = cordova.file.dataDirectory;
                options.mimeType = "audio/wav";
            } else {
                options.mimeType = "audio/AMR";
            }

            options.headers = {
                'X-Group': localStorage.getItem("memberGroup"),
                'X-Device': localStorage.getItem("device"),
                "Connection": "close"
            };

            //var amrName = encodeURIComponent(md5(esc(mi.Instrument + "_" + mi.FirstName + "_" + mi.LastName) +
            //    '_' + track.RecordingId) + '.' + extension);
            var amrName = encodeURIComponent(esc(mi.Instrument + "_" + mi.FirstName + "_" + mi.LastName) +
                    '_' + track.RecordingId + '.' + extension);
            fileURL = '';

            __log("media: folder=" + directory + " platform=" + device.platform, 'record');
            __log("media: prepare recording with name = " + amrName, 'record');

            var src = directory + amrName;
            var captureSuccess = function () {
                if (device.platform == 'iOS') {
                    fileURL = src = cordova.file.tempDirectory + amrName;
                    //fileURL = src = cordova.file.documentsDirectory + amrName;
                }
                __log("capture: Recorded to " + src, 'record');

                options.fileName = src.substr(src.lastIndexOf('/') + 1);

                var ft = new FileTransfer();
                var urlUpload = API_ROOT + '/groups/' + gr.GroupId + "/recordings/" + track.RecordingId + "/files";

                __log("capture: uploading " + options.fileName, 'record');
                ft.onprogress = function (progressEvent) {
                    if (progressEvent.lengthComputable) {
                        //__log( "upload: progress " + Math.round( 100*( progressEvent.loaded / progressEvent.total ) ) + "%" , 'record');
                    } else {
                        //__log( "upload: " + JSON.stringify( progressEvent ) , 'record');
                    }
                };

                ft.upload(fileURL, encodeURI(urlUpload), function (r) {
                    __log("upload: Code = " + r.responseCode, 'record');
                    __log("upload: Response = " + r.response, 'record');
                    __log("upload: Sent = " + r.bytesSent, 'record');
                }, function (error) {
                    __log("upload: ERROR " + JSON.stringify(error), 'error');
                }, options);

            };
            var captureError = function (error) {
                var msg = 'An error occurred during capture: ' + error.code;
                __log("media: ERROR: " + error.message, 'error');
            };

            recorder = new Media(src, captureSuccess, captureError);

            var gotFileEntry = function (fileEntry) {
                fileURL = fileEntry.toURL();
                __log("fileSystem: getFileEntry=" + fileURL, 'system');
                console.log(fileEntry);

                __log('media: recording.start() ', 'record');
                recorder.startRecord();
               // this.set_Gain(initinalGain);
                recorder.setGain(initinalGain);
            };

            var gotFS = function (fileSystem) {
                __log("fileSystem: gotFS " + JSON.stringify(fileSystem), 'system');
                fileSystem.root.getFile(src, {create: true, exclusive: false}, gotFileEntry, fail);
            };

            var fail = function (e) {
                __log("fileSystem: FAILURE " + JSON.stringify(e), 'error');
            };

            __log('media: cordova.file.tempDirectory=' + cordova.file.tempDirectory, 'record');
            if (device.platform == 'Android') {
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
            } else if (device.platform == 'iOS') {
                __log('media: recording.start() for iOS', 'record');
                //__log( JSON.stringify( cordova.file ) );
                fileURL = src;
                recorder.startRecord();
                this.set_Gain(initinalGain);
            }

        } else {
            __log('web api: recording.start()', 'record');
            recorder.clear();
            recorder.record();
        }
    };
    this.stop = function (data) {

        if (typeof( Media ) !== "undefined") {

            __log('media: recording.stop()', 'record');
            if (typeof( recorder ) === "undefined") {
                return;
            }

            recorder.stopRecord();
            recorder = null;
        } else {

            __log('web api: recording.stop()', 'record');
            recorder.getBuffer();
            recorder.stop();
            recorder.exportWAV(function (blob) {
                __log('web api: wav file seems to be ready.. Please wait...', 'record');
                recorder.clear();
            });
        }

    };

    this.init = function () {
        if (socket.id !== undefined) {
            __log("Connected to server as " + socket.id, 'system');
        }

        if (typeof( Media ) !== "undefined") {

            __log("media: initialized successfully", 'record');


        } else {

            try {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                navigator.getUserMedia = ( navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
                window.URL = window.URL || window.webkitURL;
                audio_context = new AudioContext();
                __log('web api: audio context set up.', 'record');
                __log('web api: navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'), 'record');

                navigator.getUserMedia({audio: true}, this.startUserMedia, function (e) {
                    __log('ERROR: No live audio input: ' + e, 'error');
                });

            } catch (e) {
                __log('ERROR: No web audio support in this browser!', 'error');
            }


        }
    };

    return this;
}


function MemberController($scope, $rootScope, Member, Instrument, Group, SoundRecording) {
    //$rootScope.styleNavElem = device.platform == 'Android'? {'font-size': '18px'}: {'font-size': '14px'};
    //setTimeout(function(){
    //    $('.app-navbar-nav').sticky({ topSpacing: 0 });
    //},150);
    setTimeout(function() {
        if (device){
            if (device.platform == 'Android') {
                $(".slider-mic").hide();$(".switch-mic").show();
            }
            if (device.platform.indexOf("iOS") >= 0) {
                $(".slider-mic").show();$(".switch-mic").hide();
            }
        }
    },10);
    var isConnectedGroup = localStorage.getItem("isConnectedGroup");
    if (isConnectedGroup === undefined || isConnectedGroup === "undefined" || isConnectedGroup === "" || isConnectedGroup === null || isConnectedGroup === "null") {
        $rootScope.isConnectedGroup = false;
    } else {
        $rootScope.isConnectedGroup = true;
    }
    $rootScope.PauseAudio = isTrackPlay;
    //$rootScope.isConnectedGroup = false;
    $rootScope.loading = false;
    $scope.instruments = Instrument.promise.to.get().$object;

    var mi = localStorage.getItem("memberInfo");
    $scope.memberInfo = {};
    $scope.haveMemberInfo = false;
    if (mi !== undefined && mi !== "undefined" && mi !== "" && mi !== null && mi !== "null") {
        $scope.memberInfo = JSON.parse(mi);
        $scope.haveMemberInfo = true;
    }

    var mg = localStorage.getItem("memberGroup");
    $scope.memberGroup = {InvitationCode: "", GroupId: "", GroupName: ""};

    if (mg !== undefined && mg !== "undefined" && mg !== "" && mg !== null && mg !== "null") {
        $scope.memberGroup ={
            InvitationCode: JSON.parse(mg).InvitationCode,
            GroupId: JSON.parse(mg).GroupId,
            GroupName: JSON.parse(mg).GroupName
        };
    }

    $scope.ObjectEquals = function( firstObj, secondObject ) {
        if ((null==firstObj)||(null==secondObject)) return false;
        if (('object'!=typeof firstObj) && ('object'!=typeof secondObject))  return firstObj==secondObject;
        else if (('object'!=typeof firstObj) || ('object'!=typeof secondObject)) return false;

        if ((firstObj instanceof Date) && (secondObject instanceof Date)) return firstObj.getTime()==secondObject.getTime();
        else if ((firstObj instanceof Date) && (secondObject instanceof Date)) return false;

        var keysFirstObj = Object.keys( firstObj );
        var keysSecondObject = Object.keys( secondObject );
        if ( keysFirstObj.length != keysSecondObject.length ) {return false;}
        return !keysFirstObj.filter(function( key ){
            if ( typeof firstObj[key] == "object" ||  Array.isArray( firstObj[key] ) ) {
                return !Object.equals(firstObj[key], secondObject[key]);
            } else {
                return firstObj[key] !== secondObject[key];
            }
        }).length;
    };

    $scope.onChangeMember = function () {
        var mi = localStorage.getItem("memberInfo");
        if (mi !== undefined && mi !== "undefined" && mi !== "" && mi !== null && mi !== "null") {
            console.log('OLD: ',JSON.parse(mi));
            if ($scope.memberInfo && $scope.haveMemberInfo) {
                console.log('NEW: ',$scope.memberInfo);
                console.log("ObjectEquals: ",$scope.ObjectEquals($scope.memberInfo,JSON.parse(mi)));
                if ($scope.ObjectEquals($scope.memberInfo,JSON.parse(mi))){
                    $scope.isChangeMember = false;
                }else{
                    if ($scope.isConnectedGroup) {
                        $scope.isChangeMember = true;
                    }
                }
            }
        }
    };
    $scope.onChangeInviteCode = function () {
        var mg = localStorage.getItem("memberGroup");
        if (mg !== undefined && mg !== "undefined" && mg !== "" && mg !== null && mg !== "null") {
            console.log('OLD: ',JSON.parse(mg));
            if ($scope.memberGroup && $scope.isConnectedGroup) {
                var stateMemberGroup = $scope.memberGroup;
                stateMemberGroup.InvitationCode = $scope.memberGroup.InvitationCode.toString();
                console.log('NEW: ',stateMemberGroup);
                console.log("ObjectEquals: ",$scope.ObjectEquals(stateMemberGroup,JSON.parse(mg)));
                if ($scope.ObjectEquals(stateMemberGroup,JSON.parse(mg))){
                    $scope.isChangeInviteCode = false;
                }else{
                    if ($scope.isConnectedGroup) {
                        $scope.isChangeInviteCode = true;
                    }
                }
            }
        }
    };
    $scope.refresh = function () {
        Member.promise.to.get().then(function (data) {
            $scope.members = data;
        });
    };

    $scope.isValid = function () {
        var o = $scope.memberInfo;
        var k = $scope.memberGroup;
        return o.Instrument && o.FirstName && o.LastName && k.InvitationCode;
    };
    $scope.submit = function () {
        if ($scope.isValid()) {
            var LastName = $scope.memberInfo.LastName;
            var FirstName = $scope.memberInfo.FirstName;

            var memberInfo = {
                    FirstName: FirstName.replace(/[^\w\s]/gi, '').replace(/\s+/g, '').replace(/_/g, ''),
                    LastName: LastName.replace(/[^\w\s]/gi, '').replace(/\s+/g, '').replace(/_/g, ''),
                    Instrument: $scope.memberInfo.Instrument
            };
            $scope.memberInfo = memberInfo;

            localStorage.setItem("memberInfo", JSON.stringify($scope.memberInfo));
            $scope.haveMemberInfo = true;
            $scope.isChangeMember = false;


            var mg = localStorage.getItem("memberGroup");
            if (mg !== undefined && mg !== "undefined" && mg !== "" && mg !== null && mg !== "null") {
                console.log('OLD: ',JSON.parse(mg));
                if ($scope.memberGroup && $scope.isConnectedGroup) {
                    //console.log('NEW: ',$scope.memberGroup);
                    var stateMemberGroup = $scope.memberGroup;
                    stateMemberGroup.InvitationCode = $scope.memberGroup.InvitationCode.toString();
                    console.log('NEW: ',stateMemberGroup);
                    console.log("ObjectEquals: ",$scope.ObjectEquals(stateMemberGroup,JSON.parse(mg)));
                    if ($scope.ObjectEquals(stateMemberGroup,JSON.parse(mg))){

                    }else{
                        if ($scope.isConnectedGroup && $scope.isChangeInviteCode) {
                            $scope.disconnectUI();
                            $scope.connect();
                        }
                    }
                }
            }
            $scope.isChangeInviteCode = false;
            __reintroduce();
            //window.location.href = "#/groups";
        }
    };
    $scope.connect = function () {
        SoundRecording.testRecord_start();
        setTimeout(function(){SoundRecording.testRecord_stop()},1000);
        $rootScope.log("connect()", 'system');
        if ($scope.isValid()) {
            console.log($scope.memberGroup.InvitationCode);
            Group.promise.to.find($scope.memberGroup.InvitationCode).then(function (data) {
                console.log('SSSSSS: ',data);
                if (data.length > 0) {
                    $rootScope.isConnectedGroup = true;
                    localStorage.setItem("isConnectedGroup", 'true');
                    var groupFound = data[0];
                    $scope.memberGroup = {
                        InvitationCode: groupFound.InvitationCode,
                        GroupId: groupFound._id,
                        GroupName: groupFound.Name
                    };
                    localStorage.setItem("memberGroup", JSON.stringify($scope.memberGroup));
                    $rootScope.log("Invitation Code " + $scope.memberGroup.InvitationCode + ", Group #" + $scope.memberGroup.GroupId + ", " + $scope.memberGroup.GroupName, 'system');
                    __reintroduce();
                    __memberStatus('Locked');
                    window.location.href = "#/groups";
                    delete $rootScope.connectError;
                }else {
                    $rootScope.connectError = 'Invitation code is invalid';
                }

            });
        }
    };
    $scope.disconnect = function () {
        $('#modalByDisconnect').modal('hide');
        $scope.memberGroup = {InvitationCode: "", GroupId: "", GroupName: ""};
        localStorage.removeItem("memberGroup");
        localStorage.removeItem("isConnectedGroup");
        $rootScope.isConnectedGroup = false;
        $scope.isChangeMember = false;
        $scope.isChangeInviteCode = false;
        $rootScope.isRelease = isRelease = false;
        $rootScope.log("disconnect()", 'system');
        $rootScope.introduce(0, {});
        //window.location.href = "#/profile";
    };
    $scope.disconnectUI = function () {
        $('#modalByDisconnect').modal('hide');
        localStorage.removeItem("memberGroup");
        localStorage.removeItem("isConnectedGroup");
        $rootScope.isConnectedGroup = false;
        $scope.isChangeMember = false;
        $scope.isChangeInviteCode = false;
        $rootScope.isRelease = isRelease = false;
        $rootScope.log("disconnect()", 'system');
        $rootScope.introduce(0, {});
        //window.location.href = "#/profile";
    };
}

function GroupController($scope, $rootScope, Group) {
    //$rootScope.styleNavElem = device.platform == 'Android'? {'font-size': '18px'}: {'font-size': '14px'};
    //setTimeout(function(){
    //    $('.app-navbar-nav').sticky({ topSpacing: 0 });
    //},150);
    delete $rootScope.connectError;
    $rootScope.isRelease = isRelease ? isRelease: false;
    console.log('GroupController');
    setTimeout(function() {
        if (device){
            if (device.platform == 'Android') {
                $(".slider-mic").hide();$(".switch-mic").show();
            }
            if (device.platform.indexOf("iOS") >= 0) {
                $(".slider-mic").show();$(".switch-mic").hide();
            }
        }
    },10);

    $rootScope.PauseAudio = isTrackPlay;
    $rootScope.loading = false;
    var isConnectedGroup = localStorage.getItem("isConnectedGroup");
    if (isConnectedGroup === undefined || isConnectedGroup === "undefined" || isConnectedGroup === "" || isConnectedGroup === null || isConnectedGroup === "null") {
        $rootScope.isConnectedGroup = false;
    } else {
        $rootScope.isConnectedGroup = true;
        if ($rootScope.isRelease !== true){
            __memberStatus('Locked');
        }

    }

    var mi = localStorage.getItem("memberInfo");
    var mg = localStorage.getItem("memberGroup");
    $scope.memberGroup = {InvitationCode: "", GroupId: "", GroupName: ""};

    //if ( (mi === undefined || mi === "undefined" || mi === "" || mi === null || mi === "null") || (mg === undefined || mg === "undefined" || mg === "" || mg === null || mg === "null")) {
    //    window.location.href = "#/profile";
    //    return;
    //}

    if (mi !== undefined && mi !== "undefined" && mi !== "" && mi !== null && mi !== "null") {
        $scope.memberInfo = JSON.parse(mi);
    }

    if (mg !== undefined && mg !== "undefined" && mg !== "" && mg !== null && mg !== "null") {
        $scope.memberGroup = JSON.parse(mg);
    }

    $scope.direct = function (path) {
        window.location.href = path;
        setTimeout(function() {
            if (device){
                if (device.platform == 'Android') {
                    $(".slider-mic").hide();$(".switch-mic").show();
                }
                if (device.platform.indexOf("iOS") >= 0) {
                    $(".slider-mic").show();$(".switch-mic").hide();
                }
            }
        },10);
    };

    $scope.isConnected = function () {
        setTimeout(function() {
            if (device){
                if (device.platform == 'Android') {
                    $(".slider-mic").hide();$(".switch-mic").show();
                }
                if (device.platform.indexOf("iOS") >= 0) {
                    $(".slider-mic").show();$(".switch-mic").hide();
                }
            }
        },10);
        return $scope.memberGroup.GroupId;
    };

    $scope.release = function () {
        if ($rootScope.isRelease ===false){
            Group.promise.to.find($scope.memberGroup.InvitationCode).then(function (data) {
                if (data.length > 0) {
                    $rootScope.isRelease = isRelease = true;
                    __memberStatus('Ready');
                    $rootScope.limitLockTimer = limitLockTimer;
                    $rootScope.startTimerLocker();
                }

            });
        } else if ($rootScope.isRelease ===true) {
            $rootScope.isRelease = isRelease = false;
            __memberStatus('Locked');
            $rootScope.stopTimerLocker();
        }
    };

    $rootScope.stopTimerLocker = function () {
        console.log('STOP timerLocker');
        if ($rootScope.timerLocker){
            clearInterval($rootScope.timerLocker);
            delete $rootScope.timerLocker;
        }
    };
    $rootScope.startTimerLocker = function () {
        console.log('START timerLocker');
            $rootScope.stopTimerLocker();

            $rootScope.timerLocker = setInterval(function () {
                $rootScope.limitLockTimer--;
                $rootScope.$apply();
                console.log("timerLocker: ",$rootScope.limitLockTimer);
                if ($rootScope.limitLockTimer === 0) {
                    if ($rootScope.recording === 1){
                        __stop();
                    }
                    $scope.release()
                }
            }, 1000);
    };

    $scope.connect = function () {
        $rootScope.log("connect()", 'system');
        Group.promise.to.find($scope.memberGroup.InvitationCode).then(function (data) {
            if (data.length > 0) {
                $rootScope.isConnectedGroup = true;
                localStorage.setItem("isConnectedGroup", 'true');
                var groupFound = data[0];
                $scope.memberGroup = {
                    InvitationCode: groupFound.InvitationCode,
                    GroupId: groupFound._id,
                    GroupName: groupFound.Name
                };
                localStorage.setItem("memberGroup", JSON.stringify($scope.memberGroup));
                $rootScope.log("Invitation Code " + $scope.memberGroup.InvitationCode + ", Group #" + $scope.memberGroup.GroupId + ", " + $scope.memberGroup.GroupName, 'system');
                __reintroduce();
                __memberStatus('Locked');
            }

        });
    };

    $scope.disconnect = function () {
        $scope.memberGroup = {InvitationCode: "", GroupId: "", GroupName: ""};
        localStorage.removeItem("memberGroup");
        localStorage.removeItem("isConnectedGroup");
        $rootScope.isConnectedGroup = false;
        $rootScope.isRelease = false;
        $rootScope.log("disconnect()", 'system');
        $rootScope.introduce(0, {});
        window.location.href = "#/profile";
    };

}

function RecordController($location, $scope, $rootScope, $http, Recording) {
    //$rootScope.styleNavElem = device.platform == 'Android'? {'font-size': '18px'}: {'font-size': '14px'};
    //setTimeout(function(){
    //    $('.app-navbar-nav').sticky({ topSpacing: 0 });
    //},150);
    setTimeout(function() {
        if (device){
            if (device.platform == 'Android') {
                $(".slider-mic").hide();$(".switch-mic").show();
            }
            if (device.platform.indexOf("iOS") >= 0) {
                $(".slider-mic").show();$(".switch-mic").hide();
            }
        }
    },10);

    $rootScope.PauseAudio = isTrackPlay;
    //if (!$rootScope.isConnectedGroup) {
    //    console.log($rootScope.isConnectedGroup);
    //    window.history.go(-1);
    //    return;
    //}
    $scope.selectedTrack = function (trackObq) {
        $rootScope.selected = trackObq;
    };
    $scope.destroy = function (obq) {
        console.log(obq);
        $('#modalByDelete').modal('hide');
        $scope.recordings = localLibraryAudio.deleteLocalLibraryAudio(obq);
        //location.href = "#/recordings";
    };
    $scope.nice_audio = function (track) {
        if (playAudioTrack) {
            playAudioTrack.pause();
        }
        console.log(track);
        var basepath = '';
        if (typeof( track.mp3 ) !== "undefined") {
            basepath = track.mp3.substring(track.mp3.indexOf("/public") + "/public".length);
            if (typeof( API_STORAGE_ROOT ) !== "undefined") {
                basepath = API_STORAGE_ROOT.substring(0, API_STORAGE_ROOT.length - 1) + basepath;
            }
        } else {

            if (typeof( track.wav ) === "undefined") return basepath;
            basepath = track.wav.substring(track.wav.indexOf("/public") + "/public".length);
            if (typeof( API_STORAGE_ROOT ) !== "undefined") {
                basepath = API_STORAGE_ROOT.substring(0, API_STORAGE_ROOT.length - 1) + basepath;
            }
        }
        console.log(basepath);
        if (typeof( Media ) !== "undefined") {
            playAudioTrack = new Media(basepath,
                function () {
                    console.log("playAudio(): Audio Success");
                },
                function (err) {
                    console.log("playAudio(): Audio Error: " + err);
                },
                __s_oSoundtrack_loop
            );
            console.log("media loaded " + track);

            playAudioTrack.setVolume(1);
            $('.pause-audio').show();
            $rootScope.PauseAudio = isTrackPlay = true;
            setTimeout(function () {
                playAudioTrack.play();
                console.log("Media: Playing sound " + track);
            }, 100);

        } else if (supportsAudio()) {
            playAudioTrack = new Audio(track);
            $('.pause-audio').show();
            $rootScope.PauseAudio = isTrackPlay = true;
            setTimeout(function () {
                playAudioTrack.play();
                console.log("Audio: Playing sound " + track);
            }, 100);

            console.log("using Web Api audio");
        }
    };
    $scope.formatDate = function (data) {
        var CurrentDate = new Date();
        var differenceDate = CurrentDate.getTime() - new Date(data).getTime();
        if (differenceDate <= 1000 * 60 * 60 || differenceDate < 0) {
            return jQuery.format.prettyDate(data);
        } else if (differenceDate > 1000 * 60 * 60 && differenceDate <= 1000 * 60 * 60 * 24) {
            return $.format.date(data, 'H:mm')
        } else {
            return $.format.date(data, 'd MMM. yyyy, H:mm');
        }
    };
    $scope.formatDuration = function (data) {
        var parseDuration = data.split('=');
        var Duration = parseDuration[0].slice(0, -4);
        return Duration;
    };
    $rootScope.loading = true;
    $scope.recordings = localLibraryAudio.getLocalLibraryAudio();
    console.log($scope.recordings);
    $rootScope.loading = false;
    //рекординг лист
    /*Recording.promise.to.get().then( function( data ) {
     console.log(data);
     $scope.recordings = data;
     $rootScope.loading = false;
     });*/
}
function RecordDetailsController($location, $scope, $routeParams, $rootScope, $http, Recording) {
    //$rootScope.styleNavElem = device.platform == 'Android'? {'font-size': '18px'}: {'font-size': '14px'};
    //setTimeout(function(){
    //    $('.app-navbar-nav').sticky({ topSpacing: 0 });
    //},150);
    setTimeout(function() {
        if (device){
            if (device.platform == 'Android') {
                $(".slider-mic").hide();$(".switch-mic").show();
            }
            if (device.platform.indexOf("iOS") >= 0) {
                $(".slider-mic").show();$(".switch-mic").hide();
            }
        }
    },10);
    $rootScope.PauseAudio = isTrackPlay;
    $rootScope.loading = true;
    Recording.promise.to.read($routeParams.rid).then(function (data) {
        $scope.object = data;
        $rootScope.loading = false;
    });

    $scope.filesVisible = false;
    $scope.tableStyle = {'width': $('body').width()};

    $scope.nice_audio = function (track) {
        if (playAudioTrack) {
            playAudioTrack.pause();
        }
        console.log(track);
        var basepath = '';
        if (typeof( track.mp3 ) !== "undefined") {
            basepath = track.mp3.substring(track.mp3.indexOf("/public") + "/public".length);
            if (typeof( API_STORAGE_ROOT ) !== "undefined") {
                basepath = API_STORAGE_ROOT.substring(0, API_STORAGE_ROOT.length - 1) + basepath;
            }
        } else {

            if (typeof( track.wav ) === "undefined") return basepath;
            basepath = track.wav.substring(track.wav.indexOf("/public") + "/public".length);
            if (typeof( API_STORAGE_ROOT ) !== "undefined") {
                basepath = API_STORAGE_ROOT.substring(0, API_STORAGE_ROOT.length - 1) + basepath;
            }
        }
        console.log(basepath);
        if (typeof( Media ) !== "undefined") {
            playAudioTrack = new Media(basepath,
                function () {
                    console.log("playAudio(): Audio Success");
                },
                function (err) {
                    console.log("playAudio(): Audio Error: " + err);
                },
                __s_oSoundtrack_loop
            );
            console.log("media loaded " + basepath);

            playAudioTrack.setVolume(1);
            $('.pause-audio').show();
            $rootScope.PauseAudio = isTrackPlay = true;
            setTimeout(function () {
                playAudioTrack.play();
                console.log("Media: Playing sound " + basepath);
            }, 100);

        } else if (supportsAudio()) {
            playAudioTrack = new Audio(basepath);
            $('.pause-audio').show();
            $rootScope.PauseAudio = isTrackPlay = true;
            setTimeout(function () {
                playAudioTrack.play();
                console.log("Audio: Playing sound " + basepath);
            }, 100);

            console.log("using Web Api audio");
        }
    };
    $scope.toggleFiles = function () {
        $scope.filesVisible = !$scope.filesVisible;
        if ($scope.filesVisible) {
            setTimeout(function () {
                var copyTextarea = document.querySelector('#files');
                copyTextarea.select();
                try {
                    var successful = document.execCommand('copy');
                    var msg = successful ? 'successful' : 'unsuccessful';
                    console.log("copy to clipboard - " + msg);
                } catch (err) {
                    console.log('Oops, unable to copy');
                }
            }, 500);
        }
    };

    $scope.getFiles = function () {
        var arr = [];
        if (typeof( $scope.object.tracks ) !== "undefined") {
            for (var l = 0; l < $scope.object.tracks.length; l++) {
                var t = $scope.object.tracks[l];
                var url = "";
                if (typeof( t.mp3 ) !== "undefined") {
                    url = t.mp3;
                } else if (typeof( t.wav ) !== "undefined") {
                    url = t.wav;
                }
                if (url) {

                    var basepath = url.substring(url.indexOf("/public") + "/public".length);
                    if (typeof( API_STORAGE_ROOT ) !== "undefined") {
                        basepath = API_STORAGE_ROOT.substring(0, API_STORAGE_ROOT.length - 1) + basepath;
                    } else {
                        basepath = "http://" + location.hostname + basepath;
                    }
                    arr.push(basepath);
                }
            }
        }
        return arr.join("\r\n");
    };

    $scope.downloadFiles = function () {
        var link = document.createElement('a');
        link.download = "channels" + $scope.object._id + ".txt";
        link.href = "data:text/csv," + encodeURIComponent($scope.getFiles());
        link.click();
    };

    $scope.destroy = function () {
        Recording.promise.to.destroy($routeParams.rid).then(function () {
            location.href = "#/recordings";
        });
    };
    setTimeout(function () {
        $(".col-md-12.table-recording").css('width', $('.ng-scope:nth-child(1)').width() + 5);
    }, 100);

}

function AppRouteProvider(RestangularProvider, $routeProvider, $locationProvider) {
    // $locationProvider.hashPrefix('!');

    RestangularProvider.setBaseUrl(API_ROOT);
    RestangularProvider.setRestangularFields({id: "_id"});

    $routeProvider
        .when('/profile', {templateUrl: 'html/member/profile.html', controller: 'MemberController'})
        .when('/groups', {templateUrl: 'html/member/join.html', controller: 'GroupController'})
        .when('/groups/:id', {templateUrl: 'html/member/index.html', controller: 'SongDetailsController'})
        .when('/recordings', {templateUrl: 'html/member/recordings-list.html', controller: 'RecordController'})
        .when('/recordings/:rid', {
            templateUrl: 'html/member/recordings-details.html',
            controller: 'RecordDetailsController'
        })
        .otherwise({"redirectTo": "/profile"})
    ;
}
AppRouteProvider.$inject = ['RestangularProvider', '$routeProvider', '$locationProvider'];


function AppRunner($rootScope, Restangular, Member, SoundRecording, $timeout, $window, $location /*, $templateCache*/) {
    //init Locker Timer
    $rootScope.limitLockTimer = limitLockTimer;
    //Slider with selection bar
    $rootScope.switchMic = {
        state: true
    };
    $rootScope.switchMicGain = function (state) {
        console.log('SWITCHER ANDROID',state);
        if (state){
            SoundRecording.set_Gain(0.9);
            initinalGain = 0.9;
        }else{
            SoundRecording.set_Gain(0.1);
            initinalGain = 0.1;
        }

    };

    $rootScope.sliderMic = {
        value: 10,
        options: {
            showSelectionBar: true,
            ceil: 100,
            floor: 0,
            translate: function (value) {
                return value + '%';
            },
            onChange: function () {
                //console.log($rootScope.sliderMic.value/100);
                SoundRecording.set_Gain($rootScope.sliderMic.value/100);
            },
            onEnd: function () {
                //console.log($rootScope.sliderMic.value/100);
                SoundRecording.set_Gain($rootScope.sliderMic.value/100);
            }
        }
    };

    //setTimeout(function(){
    //    initinalGain = device.platform == 'Android'? $rootScope.switchMic.state * 1: $rootScope.sliderMic.value/100;
    //    //$rootScope.styleNavElem = device.platform == 'Android'? {'font-size': '18px'}: {'font-size': '14px'};
    //},700)
    $rootScope.disconnect = function () {
        console.log('disconnect');
        navigator.app.exitApp();
        //if ($rootScope.recording === 1){
        //    $rootScope.stop();
        //}
        //$rootScope.memberGroup = {InvitationCode: "", GroupId: "", GroupName: ""};
        //localStorage.removeItem("memberGroup");
        //localStorage.removeItem("isConnectedGroup");
        //$rootScope.isConnectedGroup = false;
        //$rootScope.isRelease = false;
        //$rootScope.log("disconnect()", 'system');
        //$rootScope.introduce(0, {});

        //window.location.href = "#/profile";
    };
    $rootScope.syslog = [];
    $rootScope.UIsys = true;
    $rootScope.sysFiltersName = [
        {displayName: 'All', filter: ''},
        {displayName: 'System', filter: 'system'},
        {displayName: 'Record', filter: 'record'},
        {displayName: 'Error', filter: 'error'}
    ];
    $rootScope.$watch(function () {
        console.log($rootScope.syslog);
        return $rootScope.syslog;
    }, function () {
        console.log($rootScope.syslog);
        $rootScope.syslog = $rootScope.syslog;
    }, true);
    setInterval(function () {
        $rootScope.$apply()
    }, 2000);

    $rootScope.sysLogFilter = $rootScope.sysFiltersName[0];
    $rootScope.clearLog = function () {
        $rootScope.syslog = [];
    };
    $rootScope.switchLog = function () {

        if ($rootScope.UIsys) {
            $rootScope.UIsys = false;
        } else {
            $rootScope.UIsys = true;
        }
    };

    $rootScope.pauseAudio = function () {
        console.log('pause');
        $('.pause-audio').hide();
        $rootScope.PauseAudio = isTrackPlay = false;
        playAudioTrack.pause();
    };
    $rootScope.s_oSoundtrack_loop = function (status) {
        console.log(status);
        if (status === Media.MEDIA_STOPPED) {
            console.log('MEDIA_STOPPED');
            //playAudioTrack.play();
            $('.pause-audio').hide();
            $rootScope.PauseAudio = isTrackPlay = false;
        }
    };
    __s_oSoundtrack_loop = $rootScope.s_oSoundtrack_loop;

    $rootScope.log = function (x, type) {
        var d = new Date();
        var pad3 = function (x) {
            return (( x > 100 ) ? x : "0" + ( x >= 10 ? x : "0" + x ));
        };
        //console.log( d.toUTCString() + "." + pad3( d.getMilliseconds()));
        $rootScope.syslog.unshift({
            messageText: d.toUTCString() + "." + pad3(d.getMilliseconds()) + " - " + JSON.stringify(x) + "",
            massageStatus: type
        });
        console.log($rootScope.syslog);
        //jQuery("#output").prepend( "sys: " + d.toUTCString() + "." + pad3( d.getMilliseconds()) + " - " + JSON.stringify( x ) + "\n" );
    };

    __log = $rootScope.log;

    $rootScope.introduce = function (nGroupId, form) {
        if (socket.id === undefined || !socket.id) return;
        var f = form;
        var hash = window.location.hash.substring(2);
        historyStatus.addStatus(( hash == "groups") ? 'Ready' : 'Busy');
        if ($rootScope.recording === 1){
            f.status = 'Recording';
        }else if ($rootScope.isRelease !== true){
            f.status ='Locked';
        }else if (isRelease !== true){
            f.status ='Locked';
        }else {
            f.status = ( hash == "groups") ? 'Ready' : 'Busy';
        }
        if (hash !== "recordings"){
            if (playAudioTrack){
                $rootScope.pauseAudio()
            }
        }

        $rootScope.log("Connecting to group " + nGroupId + ", socket id #" + socket.id + " " + JSON.stringify(f), 'system');
        $rootScope.socket = socket;
        Member.promise.to.save(nGroupId, socket.id, f);
        $rootScope.memberGroup = JSON.parse(localStorage.getItem("memberGroup"));
    };

    __introduce = $rootScope.introduce;

    __reintroduce = function () {
        var mg = localStorage.getItem("memberGroup");
        if (mg !== undefined && mg !== "undefined" && mg !== "" && mg !== null && mg !== "null") {
            var gr = JSON.parse(mg);
            if (gr && gr.GroupId) {
                var mi = localStorage.getItem("memberInfo");
                if (mi !== undefined && mi !== "undefined" && mi !== "" && mi !== null && mi !== "null") {
                    console.log(gr)
                    __introduce(gr.GroupId, JSON.parse(mi));
                }
            }
        }
    };
    $rootScope.memberStatus = function (status) {
        var mg = localStorage.getItem("memberGroup");
        if (mg !== undefined && mg !== "undefined" && mg !== "" && mg !== null && mg !== "null") {
            var gr = JSON.parse(mg);
            if (gr && gr.GroupId) {
                var mi = localStorage.getItem("memberInfo");
                if (mi !== undefined && mi !== "undefined" && mi !== "" && mi !== null && mi !== "null") {
                    console.log(gr)
                    if (socket.id === undefined || !socket.id) return;
                    var f = JSON.parse(mi);
                    f.status = status;

                    $rootScope.socket = socket;
                    Member.promise.to.save(gr.GroupId, socket.id, f);
                    $rootScope.memberGroup = JSON.parse(localStorage.getItem("memberGroup"));

                }
            }
        }
    };
    __memberStatus = $rootScope.memberStatus;

    __start = function (data) {
        var mg = localStorage.getItem("memberGroup");
        var gr = JSON.parse(mg);
        if (gr && gr.GroupId) {
            if (gr.GroupId != data.GroupId) {
                $rootScope.log("app: Recording other group " + JSON.stringify(data) + ", our group " + gr.GroupId, 'record');
            } else {
                var hash = window.location.hash.substring(2);
                var status = ( hash == "groups") ? 'Ready' : 'Busy';
                memberActivStatus = false;
                if (status == 'Ready' && $rootScope.isRelease) {
                    memberActivStatus = true;
                    $rootScope.log("app: Recording start " + JSON.stringify(data) + ", our group " + gr.GroupId, 'record');
                    $rootScope.recording = 1;
                    $rootScope.styleMemberRec={'pointer-events':'none','opacity':0.4};
                    //$('.MemberRec').addClass('disabledDiv');
                    $rootScope.recordingDuration = 0;
                    $rootScope.track = data;
                    $rootScope.$apply();

                    clearInterval($rootScope.timer);

                    $rootScope.timer = setInterval(function () {
                        $rootScope.recordingDuration++;
                        $rootScope.$apply();
                        //console.log("SYSYSYY:",$rootScope.limitRecord, $rootScope.recordingDuration);
                        if ($rootScope.recordingDuration >= $rootScope.limitRecord) {
                            //console.log("SONG DURATION:",$rootScope.recordingDuration);
                            $rootScope.stop();
                        }
                    }, 1000);

                    localStorage.setItem("track", JSON.stringify($rootScope.track));
                    $rootScope.switchMic.state = true;
                    initinalGain = 0.9;
                    SoundRecording.start(data);
                    $rootScope.limitLockTimer = limitLockTimer;
                    $rootScope.memberStatus('Recording');
                }
            }
        }
    };
    __refresh = function (data) {
        var CopyObject = data;
        CopyObject.fileURL = fileURL;
        //console.log(CopyObject);
        localLibraryAudio.setLocalLibraryAudio(CopyObject);

    };
    __recordStart = function (data) {
        console.log(data);
        var memberGroup = localStorage.getItem('memberGroup');

        if (memberGroup) {
            memberGroup = JSON.parse(localStorage.getItem('memberGroup'));
            if (data) {
                if (memberGroup.GroupId === data.GroupId) {
                    if (data.hasOwnProperty('RecordDuration')) {
                        $rootScope.limitRecord = data.RecordDuration;
                    }
                }
            }
        }
    };

    $rootScope.stop = function (data) {
        console.log('STOP: ', data);
        var mg = localStorage.getItem("memberGroup");
        var gr = JSON.parse(mg);
        if (gr && gr.GroupId) {
            if (data && data !== null) {
                if (gr.GroupId == data.GroupId) {
                    if (memberActivStatus === true) {
                        $rootScope.log("app: Recording stopped", 'record');
                        $rootScope.recording = 0;
                        $rootScope.styleMemberRec={};
                        //$('.MemberRec').removeClass('disabledDiv');
                        $rootScope.memberStatus(historyStatus.getLastStatus());
                        setTimeout(function () {
                            SoundRecording.stop(data);
                            clearInterval($rootScope.timer);
                        },1000);

                        $rootScope.$apply();
                    }
                    memberActivStatus = false;
                }
            } else {
                var data = JSON.parse(localStorage.getItem("track"));
                if (data !== null) {
                    if (gr.GroupId == data.GroupId) {
                        if (memberActivStatus === true) {
                            console.log('STOP record');
                            $rootScope.log("app: Recording stopped", 'record');
                            $rootScope.recording = 0;
                            $rootScope.styleMemberRec={};
                            //$('.MemberRec').removeClass('disabledDiv');
                            $rootScope.memberStatus(historyStatus.getLastStatus());
                            setTimeout(function () {
                                SoundRecording.stop(data);
                                clearInterval($rootScope.timer);
                            },1000);
                            $rootScope.$apply();
                        }
                        memberActivStatus = false;

                    }
                }

            }

        }
    };
    __stop = $rootScope.stop;
    $rootScope.initState = function () {
        //$rootScope.styleNavElem = device.platform == 'Android'? {'font-size': '18px'}: {'font-size': '14px'};
        if (device){
            if (device.platform == 'Android') {
                $(".slider-mic").hide();$(".switch-mic").show();
            }
            if (device.platform.indexOf("iOS") >= 0) {
                $(".slider-mic").show();$(".switch-mic").hide();
            }
        }
        initinalGain = device.platform == 'Android'? $rootScope.switchMic.state * 1: $rootScope.sliderMic.value/100;
    };
    __initState = $rootScope.initState;

    if (localStorage.getItem("memberGroup")) {
        $rootScope.memberGroup = JSON.parse(localStorage.getItem("memberGroup"));
    }
    if (localStorage.getItem("memberInfo") && localStorage.getItem("memberGroup")) {
        setTimeout(function(){
            location.href = "#/groups";
        },650);
    }

    var isConnectedGroup = localStorage.getItem("isConnectedGroup");
    if (isConnectedGroup === undefined || isConnectedGroup === "undefined" || isConnectedGroup === "" || isConnectedGroup === null || isConnectedGroup === "null") {
    } else {
    }

    // RESTANGULAR INTERCEPTION
    Restangular.setResponseInterceptor(function (response, operation, what) {
        // console.log( "ResponseInterceptor" );
        $rootScope.loading = false;
        return response;
    });

    Restangular.setRequestInterceptor(function (elem, operation, what, url) {
        // console.log( "RequestInterceptor" );
        $rootScope.errors = [];
        $rootScope.loading = true;

        var objHeaders = {
            'X-Group': localStorage.getItem("memberGroup"),
            'X-Device': localStorage.getItem("device")
        };
        if (typeof( window.device ) !== undefined) {
            objHeaders['X-Device'] = JSON.stringify(window.device);
        }
        Restangular.setDefaultHeaders(objHeaders);

        // Restangular.setDefaultHeaders({'Authorization':  'Bearer ' + AuthSvc.getToken() });
        // delete elem.extraInfo;
        return elem;
    });

    Restangular.setErrorInterceptor(function (response) {
        __log("ErrorInterceptor " + response.status, 'error');
        $rootScope.loading = false;
        if (response.data !== undefined) {
            if (response.data === null && response.status === 0) {
                $rootScope.errors.push("Unable to connect to the server. " +
                    "Please refresh the page when internet connection will be restored");
            } else if (response.status === 401) {
                $rootScope.errors = response.data.errors;
            } else {
                __log(response.data.errors, 'error');
                $rootScope.errors = response.data.errors;
                if ($rootScope.errors !== undefined && $rootScope.errors.length === 0) {
                    $rootScope.errors.push("Server response status: " + response.status);
                }
            }
        }
    });

    $rootScope.$on('$viewContentLoaded', function () {
        //$templateCache.removeAll();
    });
    $rootScope.$on('$routeChangeStart', function (event, toState, toParams, fromState, fromParams) {
        $rootScope.errors = [];
        $rootScope.back = function () {
            $window.history.back();
        };
    });

    $rootScope.$on('$routeChangeSuccess', function () {
        $timeout(function () {
            jQuery('html, body').animate({scrollTop: 0}, 'slow');
        }, 1);

        if (typeof( ga ) !== "undefined") {
            ga('send', 'event', 'Page Change', location.hash);
        }
        __reintroduce();
    });

    // SoundRecording.init();
    document.addEventListener("deviceready", SoundRecording.init, false);
    document.addEventListener("deviceready", function () {
        if (device.platform == 'Android') {
            //$(".android-only").show();
            $(".android-only").hide();
        }
        if (device.platform.indexOf("iOS") >= 0) {
            $(".ios-only").show();
        }
    });

}
AppRunner.$inject = ['$rootScope', 'Restangular', 'Member', 'SoundRecording', '$timeout', '$window', '$location' /*, '$templateCache'*/];

socket.on('connect', function () {
    __log("Connected to server ID=" + socket.id, 'system');
    __reintroduce();
});

socket.on('disconnect', function () {
    __log("Disconnected", 'system');
    __introduce(0, {});
});

setTimeout(function () {
    socket.on('recording-start', __start);
    socket.on('recording-stop', __stop);
    socket.on('files-refresh', __refresh);
    socket.on('record-start', __recordStart);
}, 500);


if (typeof( FastClick ) !== "undefined" && 'addEventListener' in document) {
    document.addEventListener('DOMContentLoaded', function () {
        FastClick.attach(document.body);
    }, false);
}


function doOnOrientationChange() {
    console.log(window.orientation);
    switch (window.orientation) {
        case -90:
        case 90:
            console.log('landscape');
            screen.lockOrientation('landscape');
            screen.unlockOrientation();
            $(".col-md-12.table-recording").css('width', $('.ng-scope:nth-child(1)').width() + 5);
            break;
        default:
            console.log('portrait');
            screen.lockOrientation('portrait');
            screen.unlockOrientation();
            $(".col-md-12.table-recording").css('width', $('.ng-scope:nth-child(1)').width() + 5);
            break;
    }
}
function doOnOrientationChangeWeb() {
    console.log(window.orientation);
    switch (window.orientation) {
        case -90:
        case 90:
            console.log('landscape');
            $(".col-md-12.table-recording").css('width', $('.ng-scope:nth-child(1)').width() + 5);
            break;
        default:
            console.log('portrait');
            $(".col-md-12.table-recording").css('width', $('.ng-scope:nth-child(1)').width() + 5);
            break;
    }
}
$(document).on('DOMContentLoaded', function () {
    console.log('init DOMContentLoaded');
    window.addEventListener('orientationchange', doOnOrientationChangeWeb);
});
$(document).on('deviceready', function () {
    console.log('init deviceready');
    __initState();
    window.addEventListener('orientationchange', doOnOrientationChange);

    if (window.plugins.insomnia) {
        window.plugins.insomnia.keepAwake(function (msg) {
            console.log(msg);
        })
    } else {
        console.log('plugin insomnia not install');
    }

});


angular.module('app')
    .filter('nice_duration', function () {
        return function (t) {

            var pad2 = function (x) {
                return ( x >= 10 ? x : "0" + x );
            };

            var s = t % 60;
            var m = parseInt(t / 60, 10);
            var h = parseInt(m / 60, 10);
            m = m % 60;
            return pad2(h) + ":" + pad2(m) + ":" + pad2(s);
        };
    });
angular.module('app')
    .filter('nice_png', function () {
        return function (png) {
            var basepath = png.substring(png.indexOf("/public") + "/public".length);
            if (typeof( API_STORAGE_ROOT ) !== "undefined") {
                basepath = API_STORAGE_ROOT.substring(0, API_STORAGE_ROOT.length - 1) + basepath;
            }
            return basepath;
        };
    });
angular.module('app')
    .filter('before_dot', function () {
        return function (t) {
            return t.substr(0, t.indexOf("."));
        };
    });
angular.module('app')
    .filter('nice_track_name', function () {
        return function (t) {
            // console.log( t.original );
            var basename = t.original.substring(t.original.lastIndexOf("/") + 1);
            var arrParts = basename.substring(0, basename.length - 4).split("_");
            return arrParts[0] + " " + arrParts[1] + " " + arrParts[2];
        };
    });
angular.module('app')
    .filter('nice_datetime', function () {
        return function (strIso) {
            if (strIso) {
                var m_names = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
                    "Aug", "Sep", "Oct", "Nov", "Dec");

                var date = new Date(strIso.replace(/\-/g, "/").replace("T", " ").replace(/\..+$/, ''));

                var hours = date.getHours();
                var minutes = date.getMinutes();
                var ampm = hours >= 12 ? 'pm' : 'am';
                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                minutes = minutes < 10 ? '0' + minutes : minutes;

                var y = "";
                if (date.getUTCFullYear() != (new Date()).getUTCFullYear()) {
                    y = date.getUTCFullYear() + ", ";
                }
                return y + m_names[date.getUTCMonth()] + " " + (date.getUTCDate()) +
                    ' ' + hours + ':' + minutes + ' ' + ampm;
            }
            return "";
        };
    });
