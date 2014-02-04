'use strict';

angular.module('DashSourcesService', ['ngResource']).
    factory('Sources', function($resource){
        return $resource('app/sources.json', {}, {
            query: {method:'GET', isArray:false}
        });
    });

angular.module('DashNotesService', ['ngResource']).
    factory('Notes', function($resource){
        return $resource('app/notes.json', {}, {
            query: {method:'GET', isArray:false}
        });
    });

angular.module('DashContributorsService', ['ngResource']).
    factory('Contributors', function($resource){
        return $resource('app/contributors.json', {}, {
            query: {method:'GET', isArray:false}
        });
    });

angular.module('DashPlayerLibrariesService', ['ngResource']).
    factory('PlayerLibraries', function($resource){
        return $resource('app/player_libraries.json', {}, {
            query: {method:'GET', isArray:false}
        });
    });

angular.module('DashShowcaseLibrariesService', ['ngResource']).
    factory('ShowcaseLibraries', function($resource){
        return $resource('app/showcase_libraries.json', {}, {
            query: {method:'GET', isArray:false}
        });
    });

var app = angular.module('DashPlayer', [
    'DashSourcesService',
    'DashNotesService',
    'DashContributorsService',
    'DashPlayerLibrariesService',
    'DashShowcaseLibrariesService',
    'angularTreeview'
]);

app.directive('chart', function() {
    return {
        restrict: 'E',
        link: function (scope, elem, attrs) {
            var chart = null,
                options = {
                    series: {
                        shadowSize: 0
                    },
                    yaxis: {
                        min: 0,
                        max: 15
                    },
                    xaxis: {
                        show: false
                    }
                };

            // If the data changes somehow, update it in the chart
            scope.$watch('bufferData', function(v) {
                if (v === null || v === undefined) {
                    return;
                }

                if (!chart) {
                    chart = $.plot(elem, v , options);
                    elem.show();
                }
                else {
                    chart.setData(v);
                    chart.setupGrid();
                    chart.draw();
                }
            });

            scope.$watch('invalidateChartDisplay', function(v) {
                if (v && chart) {
                    var data = scope[attrs.ngModel];
                    chart.setData(data);
                    chart.setupGrid();
                    chart.draw();
                    scope.invalidateDisplay(false);
                }
            });
        }
    };
});

app.controller('DashController', function($scope, Sources, Notes, Contributors, PlayerLibraries, ShowcaseLibraries) {
    var player,
        video,
        context,
        videoSeries = [],
        audioSeries = [],
        maxGraphPoints = 50,
        firstAccess = true,
        updateInterval = 333;

    ////////////////////////////////////////
    //
    // Metrics
    //
    ////////////////////////////////////////

    function initMetrics() {

        $scope.videoBitrate = 0;
        $scope.videoIndex = 0;
        $scope.videoPendingIndex = "";
        $scope.videoMaxIndex = 0;
        $scope.videoBufferLength = 0;
        $scope.videoDroppedFrames = 0;
        $scope.videoWidth = 0;
        $scope.videoHeight = 0;
        $scope.videoCodecs = "-";

        $scope.audioBitrate = 0;
        $scope.audioIndex = 0;
        $scope.audioPendingIndex = "";
        $scope.audioMaxIndex = 0;
        $scope.audioBufferLength = 0;
        $scope.audioDroppedFrames = 0;
        $scope.audioCodecs = "-";

        $('#sliderBitrate').labeledslider({
            max: 0,
            step: 1,
            values: [0],
            tickLabels: [],
            orientation: 'vertical',
            range: true,
            stop: function(evt, ui) {
                //player.setQualityBoundariesFor("video", ui.values[0], ui.values[1]);
            }
        });
        $('#sliderAudio').labeledslider({
            max:0,
            step:1,
            orientation:'vertical',
            range:false,
            tickLabels: [],
        });
        firstAccess=true;
    }


    initMetrics();

    var converter = new MetricsTreeConverter();
    $scope.videoMetrics = null;
    $scope.audioMetrics = null;
    $scope.audioTracks  = [];

    $scope.getVideoTreeMetrics = function () {
        var metrics = player.getMetricsFor("video");
        var metricsExt = player.getMetricsExt();
        $scope.videoMetrics = converter.toTreeViewDataSource(metrics,metricsExt);
    };

    $scope.getAudioTreeMetrics = function () {
        var metrics = player.getMetricsFor("audio");
        var metricsExt = player.getMetricsExt();
        $scope.audioMetrics = converter.toTreeViewDataSource(metrics,metricsExt);
    };

    function initAudioTracks(){
        var  audioDatas=  player.getAudioTracks();
        $scope.audioTracks = audioDatas;
        // position to the first audioTrack the select
        $scope.audioData = $scope.audioTracks[0];
    }

    $scope.selectAudioTrack = function(track){
        player.setAudioTrack(track);
   };


    function getCribbedMetricsFor(type) {
        var metrics = player.getMetricsFor(type),
            metricsExt = player.getMetricsExt(),
            repSwitch,
            bufferLevel,
            httpRequest,
            droppedFramesMetrics,
            bitrateIndexValue,
            bandwidthValue,
            pendingValue,
            numBitratesValue,
            bitrateValues,
            bufferLengthValue = 0,
            lastFragmentDuration,
            lastFragmentDownloadTime,
            droppedFramesValue = 0,
            videoWidthValue = 0,
            videoHeightValue = 0,
            codecsValue;

        if (metrics && metricsExt) {
            repSwitch = metricsExt.getCurrentRepresentationSwitch(metrics);
            bufferLevel = metricsExt.getCurrentBufferLevel(metrics);
            httpRequest = metricsExt.getCurrentHttpRequest(metrics);
            droppedFramesMetrics = metricsExt.getCurrentDroppedFrames(metrics);

            if (repSwitch !== null) {
                bitrateIndexValue = metricsExt.getIndexForRepresentation(repSwitch.to);
                bandwidthValue = metricsExt.getBandwidthForRepresentation(repSwitch.to);
                bandwidthValue = bandwidthValue / 1000;
                bandwidthValue = Math.round(bandwidthValue);
                videoWidthValue = metricsExt.getVideoWidthForRepresentation(repSwitch.to);
                videoHeightValue = metricsExt.getVideoHeightForRepresentation(repSwitch.to);
                codecsValue = metricsExt.getCodecsForRepresentation(repSwitch.to);

                var codecsInfo = metricsExt.getH264ProfileLevel(codecsValue);
                if (codecsInfo !== "")
                {
                    codecsValue += " (" + codecsInfo + ")";
                }
            }

            numBitratesValue = metricsExt.getMaxIndexForBufferType(type);
            bitrateValues = metricsExt.getBitratesForType(type);

            if (bufferLevel !== null) {
                bufferLengthValue = bufferLevel.level.toPrecision(5);
            }

            if (httpRequest !== null) {
                lastFragmentDuration = httpRequest.mediaduration;
                lastFragmentDownloadTime = httpRequest.tresponse.getTime() - httpRequest.trequest.getTime();

                // convert milliseconds to seconds
                lastFragmentDownloadTime = lastFragmentDownloadTime / 1000;
                lastFragmentDuration = lastFragmentDuration.toPrecision(4);
            }

            if (droppedFramesMetrics !== null) {
                droppedFramesValue = droppedFramesMetrics.droppedFrames;
            }

            if (isNaN(bandwidthValue) || bandwidthValue === undefined) {
                bandwidthValue = 0;
            }

            if (isNaN(bitrateIndexValue) || bitrateIndexValue === undefined) {
                bitrateIndexValue = 0;
            }

            if (isNaN(numBitratesValue) || numBitratesValue === undefined) {
                numBitratesValue = 0;
            }

            if (isNaN(bufferLengthValue) || bufferLengthValue === undefined) {
                bufferLengthValue = 0;
            }

            pendingValue = player.getQualityFor(type);

            return {
                bandwidthValue: bandwidthValue,
                bitrateIndexValue: bitrateIndexValue + 1,
                pendingIndex: (pendingValue !== bitrateIndexValue) ? "(-> " + (pendingValue + 1) + ")" : "",
                numBitratesValue: numBitratesValue,
                bitrateValues : bitrateValues,
                bufferLengthValue: bufferLengthValue,
                droppedFramesValue: droppedFramesValue,
                videoWidthValue: videoWidthValue,
                videoHeightValue: videoHeightValue,
                codecsValue: codecsValue
            };
        }
        else {
            return null;
        }
    }

    

    function update() {
        var metrics,
            point,
            treeData;

        metrics = getCribbedMetricsFor("video");
        if (metrics) {
            $scope.videoBitrate = metrics.bandwidthValue;
            $scope.videoIndex = metrics.bitrateIndexValue;
            $scope.videoPendingIndex = metrics.pendingIndex;
            $scope.videoMaxIndex = metrics.numBitratesValue;
            $scope.videoBufferLength = metrics.bufferLengthValue;
            $scope.videoDroppedFrames = metrics.droppedFramesValue;
            $scope.videoCodecs = metrics.codecsValue;
            $scope.videoWidth = metrics.videoWidthValue;
            $scope.videoHeight = metrics.videoHeightValue;

            // Update bitrates slider
            if ($('#sliderBitrate').labeledslider( "option", "max" ) == 0)
            {
                var labels = [];
                for (var i = 0; i < metrics.bitrateValues.length; i++)
                {
                    labels.push(Math.round(metrics.bitrateValues[i] / 1000) + "k");
                }
                $('#sliderBitrate').labeledslider({ max: (metrics.numBitratesValue - 1), step: 1, values: [ 0, (metrics.numBitratesValue - 1 )], tickLabels: labels});
                $('#sliderBitrate').labeledslider({stop: function( event, ui ) {
                    player.setQualityBoundariesFor("video", ui.values[0], ui.values[1]);
                }});
            }

            point = [parseFloat(video.currentTime), Math.round(parseFloat(metrics.bufferLengthValue))];
            videoSeries.push(point);

            if (videoSeries.length > maxGraphPoints) {
                videoSeries.splice(0, 1);
            }
        }

        metrics = getCribbedMetricsFor("audio");
        if (metrics) {
            //to avoid update tree on each update we do it one time
            if(firstAccess){
               initAudioTracks();
               firstAccess = false;
            }
            
            $scope.audioBitrate = metrics.bandwidthValue;
            $scope.audioIndex = metrics.bitrateIndexValue;
            $scope.audioPendingIndex = metrics.pendingIndex;
            $scope.audioMaxIndex = metrics.numBitratesValue;
            $scope.audioBufferLength = metrics.bufferLengthValue;
            $scope.audioDroppedFrames = metrics.droppedFramesValue;
            $scope.audioCodecs = metrics.codecsValue;

            //console.info("audioIndex : ",$scope.audioIndex);

            point = [parseFloat(video.currentTime), Math.round(parseFloat(metrics.bufferLengthValue))];
            audioSeries.push(point);


            if (audioSeries.length > maxGraphPoints) {
                audioSeries.splice(0, 1);
            }
        }

        $scope.invalidateDisplay(true);
        $scope.$apply();

        setTimeout(update, updateInterval);
    }

    ////////////////////////////////////////
    //
    // Error Handling
    //
    ////////////////////////////////////////

    function onError(e) {
        console.error(e);
    }

    ////////////////////////////////////////
    //
    // Debugging
    //
    ////////////////////////////////////////

    $scope.invalidateChartDisplay = false;

    $scope.invalidateDisplay = function (value) {
        $scope.invalidateChartDisplay = value;
    }

    $scope.bufferData = [
        {
            data: videoSeries,
            label: "Video",
            color: "#2980B9"
        },
        {
            data: audioSeries,
            label: "Audio",
            color: "#E74C3C"
        }
    ];

    $scope.showCharts = false;
    $scope.setCharts = function (show) {
        $scope.showCharts = show;
    };

    $scope.showDebug = false;
    $scope.setDebug = function (show) {
        $scope.showDebug = show;
    };

    ////////////////////////////////////////
    //
    // Player Setup
    //
    ////////////////////////////////////////

    video = document.querySelector(".dash-video-player video");
    context = new Custom.di.CustomContext();
    player = new MediaPlayer(context);

    
    $scope.version = player.getVersion();

    player.startup();
    player.addEventListener("error", onError.bind(this));

    player.attachView(video);
    player.setAutoPlay(true);

    ////////////////////////////////////////
    //
    // Player Methods
    //
    ////////////////////////////////////////

    $scope.abrEnabled = true;

    $scope.setAbrEnabled = function (enabled) {
        $scope.abrEnabled = enabled;
        player.setAutoSwitchQuality(enabled);
    };

    $scope.abrUp = function (type) {
        var newQuality,
            metricsExt = player.getMetricsExt(),
            max = metricsExt.getMaxIndexForBufferType(type);

        newQuality = player.getQualityFor(type) + 1;
        // zero based
        if (newQuality >= max) {
            newQuality = max - 1;
        }
        player.setQualityFor(type, newQuality);
    };

    $scope.abrDown = function (type) {
        var newQuality = player.getQualityFor(type) - 1;
        if (newQuality < 0) {
            newQuality = 0;
        }
        player.setQualityFor(type, newQuality);
    };

    ////////////////////////////////////////
    //
    // Page Setup
    //
    ////////////////////////////////////////

    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        return vars;
    }

    // Get url params...
    var vars = getUrlVars(),
        browserVersion,
        filterValue;

    if (vars && vars.hasOwnProperty("version")) {
        browserVersion = vars.version;
    }
    else {
        browserVersion = "stable";
    }

    switch(browserVersion) {
        case "beta":
            filterValue = "b";
            break;
        case "canary":
            filterValue = "c";
            break;
        case "dev":
            filterValue = "d";
            break;
        case "explorer":
            filterValue = "i";
            break;
        case "all":
            filterValue = "a";
            break;
        case "stable":
        default:
            filterValue = "s";
            break;
    }

    $scope.isStreamAvailable = function (str) {
        if (filterValue === "a") {
            return true;
        }
        else {
            return (str.indexOf(filterValue) != -1);
        }
    };

    Sources.query(function (data) {
        $scope.availableStreams = data.items;
    });

    Notes.query(function (data) {
        $scope.releaseNotes = data.notes;
    });

    Contributors.query(function (data) {
        $scope.contributors = data.items;
    });

    PlayerLibraries.query(function (data) {
        $scope.playerLibraries = data.items;
    });

    ShowcaseLibraries.query(function (data) {
        $scope.showcaseLibraries = data.items;
    });

    $scope.setStream = function (item) {
        $scope.selectedItem = item;
    };

    $scope.doLoad = function () {

        initMetrics();
        player.attachSource($scope.selectedItem.url);
        setTimeout(update, updateInterval);
    };

    $scope.hasLogo = function (item) {
        return (item.hasOwnProperty("logo")
                && item.logo !== null
                && item.logo !== undefined
                && item.logo !== "");
    };

    // Get initial stream if it was passed in.
    var paramUrl = null;

    if (vars && vars.hasOwnProperty("url")) {
        paramUrl = vars.url;
    }

    if (vars && vars.hasOwnProperty("mpd")) {
        paramUrl = vars.mpd;
    }

    if (paramUrl !== null) {
        var startPlayback = true;
    
        $scope.selectedItem = {};
        $scope.selectedItem.url = paramUrl;

        if (vars.hasOwnProperty("autoplay")) {
            startPlayback = (vars.autoplay === 'true');
        }

        if (startPlayback) {
            $scope.doLoad();
        }
    }
});
