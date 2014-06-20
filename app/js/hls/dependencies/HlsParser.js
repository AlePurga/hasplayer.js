/*
 * The copyright in this software is being made available under the BSD License, included below. This software may be subject to other third party and contributor rights, including patent rights, and no such rights are granted under this license.
 * 
 * Copyright (c) 2013, Orange
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * •  Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * •  Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * •  Neither the name of the Digital Primates nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

Hls.dependencies.HlsParser = function () {
	var TAG_EXTM3U = "#EXTM3U",
		/*TAG_EXTXMEDIASEQUENCE = "#EXT-X-MEDIA-SEQUENCE",
		TAG_EXTXKEY = "#EXT-X-KEY",
		TAG_EXTXPROGRAMDATETIME = "#EXT-X-PROGRAM_DATE_TIME",
		TAG_EXTXDISCONTINUITY = "#EXT-X-DISCONTINUITY",
		TAG_EXTXALLOWCACHE = "#EXT-X-ALLOW-CACHE",*/
		TAG_EXTINF = "#EXTINF",
		TAG_EXTXVERSION	= "#EXT-X-VERSION",
		TAG_EXTXTARGETDURATION = "#EXT-X-TARGETDURATION",
		TAG_EXTXMEDIA = "#EXT-X-MEDIA",
		TAG_EXTXMEDIASEQUENCE = "#EXT-X-MEDIA-SEQUENCE";
		TAG_EXTXSTREAMINF = "#EXT-X-STREAM-INF",
		TAG_EXTXENDLIST = "#EXT-X-ENDLIST",
		ATTR_BANDWIDTH = "BANDWIDTH",
		ATTR_PROGRAMID = "PROGRAM-ID",
		ATTR_AUDIO = "AUDIO",
		ATTR_SUBTITLES = "SUBTITLES",
		ATTR_RESOLUTION = "RESOLUTION",
		ATTR_CODECS = "CODECS",
		/*ATTR_METHOD = "METHOD",
		ATTR_IV = "IV",*/
		ATTR_URI = "URI",
		ATTR_TYPE = "TYPE",
		ATTR_GROUPID = "GROUP-ID",
		ATTR_NAME = "NAME",
		ATTR_DEFAULT = "DEFAULT",
		ATTR_AUTOSELECT = "AUTOSELECT",
		ATTR_LANGUAGE = "LANGUAGE",
		VAL_YES = "YES";


	var  _splitLines = function(oData) {
		oData = oData.split('\n');
		//remove empty lines
		for (var i = 0; i < oData.length; i++) {
			if (oData[i] === "" || oData[i] === " ") {
				oData.splice(i, 1);
				i--;
			}
		}
		return oData;
	};

	var _getAttrValue = function(data, attrKey) {
		// remove attrKey + '='
		var value = data.substring(data.indexOf(attrKey)+attrKey.length+1);
		// remove quottes
		if (value.charAt(0) == '"') {
			value = value.substring(1,value.length-1);
		}
		return value;
	};

	var _containsTag = function(data, tag) {
		return (data.indexOf(tag) > -1);
	};

	var _getTagValue = function(data, tag) {
		// +1 to remove ':' character
		return data.substring(tag.length + 1, data.length);
	};

	var _parseStreamInf = function(streamInfArray) {
		var stream = {
				programId: "",
				bandwidth: 0,
				resolution: "0x0",
				codecs: ""
			},
			name = "",
			value = "",
			i,
			streamParams = _getTagValue(streamInfArray[0], TAG_EXTXSTREAMINF).split(',');

		for (i = streamParams.length - 1; i >= 0; i--) {

			name = streamParams[i].trim().split('=')[0];
			value = streamParams[i].trim().split('=')[1];

			switch (name) {
				case ATTR_PROGRAMID:
					stream.programId = value;
					break;
				case ATTR_BANDWIDTH:
					stream.bandwidth = parseInt(value, 10);
					break;
				case ATTR_RESOLUTION:
					stream.resolution = value;
					break;
				case ATTR_CODECS:
					stream.codecs = value;
					break;

				// > HLD v3
				case ATTR_AUDIO:
					stream.audioId = value;
					break;
				case ATTR_SUBTITLES:
					stream.subtitlesId = value;
					break;

				default:
					break;

			}
		}

		// Get variant stream URI
		stream.uri = streamInfArray[1];

		return stream;
	};

	// Parse #EXTINF tag
	//	#EXTINF:<duration>,<title>
	//	<url>
	var _parseExtInf = function(extInf) {
		var media = {},
			mediaParams = _getTagValue(extInf[0], TAG_EXTINF).split(',');

		media.duration = parseInt(mediaParams[0]);
		media.title = mediaParams[1];
		media.uri = extInf[1];

		return media;
	};

	/* > HLS v3
	var _parseMediaInf = function(mediaLine) {
		var mediaObj = {};
		var infos = mediaLine.split(',');
		for (var i = infos.length - 1; i >= 0; i--) {
			if(infos[i].indexOf(ATTR_TYPE)>-1) {
				mediaObj.type = _getAttrValue(infos[i],ATTR_TYPE);
			} else if(infos[i].indexOf(ATTR_GROUPID)>-1) {
				mediaObj.groupId = _getAttrValue(infos[i],ATTR_GROUPID);
			} else if(infos[i].indexOf(ATTR_NAME)>-1) {
				mediaObj.name = _getAttrValue(infos[i],ATTR_NAME);
			} else if(infos[i].indexOf(ATTR_DEFAULT)>-1) {
				mediaObj.default = _getAttrValue(infos[i],ATTR_DEFAULT) == VAL_YES ? true : false;
			} else if(infos[i].indexOf(ATTR_AUTOSELECT)>-1) {
				mediaObj.autoSelect = _getAttrValue(infos[i],ATTR_AUTOSELECT) == VAL_YES ? true : false;
			} else if(infos[i].indexOf(ATTR_LANGUAGE)>-1) {
				mediaObj.language = _getAttrValue(infos[i],ATTR_LANGUAGE);
			} else if(infos[i].indexOf(ATTR_URI)>-1) {
				mediaObj.uri = _getAttrValue(infos[i],ATTR_URI);
			}
		}
		return mediaObj;
	};*/

	var _getVariantStreams = function(data) {
		var streamsArray = [];
		
		for (var i = 0; i < data.length; i++) {

			if (_containsTag(data[i], TAG_EXTXSTREAMINF)) {
				streamsArray.push(_parseStreamInf([data[i], data[i+1]]));
			}
		}
		return streamsArray;
	};

	var _parsePlaylist = function(deferred, data, representation) {
		var segmentList,
			segment,
			version,
			media,
			duration = 0,
			i;

		data = _splitLines(data);

		// Check playlist header
		if (data && data.length && data[0].trim() !== TAG_EXTM3U) {
			deferred.resolve();
			return;
		}

		// Intitilaize SegmentList
		segmentList = {
			name: "SegmentList",
			isRoot: false,
			isArray: false,
			// children: [],
			duration: 0,
			startNumber: 0,
			timescale: 1,
			BaseURL: representation.BaseURL,
			SegmentURL_asArray: []
		};
		representation[segmentList.name] = segmentList;

		// Set representation duration, by default set to  (="dynamic")
		representation.duration = 0;

		// Parse playlist
		for (i = 1; i < data.length; i++) {
			if (_containsTag(data[i], TAG_EXTXVERSION)) {
				version = _getTagValue(data[i], TAG_EXTXVERSION);
			} else if (_containsTag(data[i], TAG_EXTXTARGETDURATION)) {
				segmentList.duration = parseInt(_getTagValue(data[i], TAG_EXTXTARGETDURATION), 10);
			} else if (_containsTag(data[i], TAG_EXTXMEDIASEQUENCE)) {
				segmentList.startNumber = parseInt(_getTagValue(data[i], TAG_EXTXMEDIASEQUENCE), 10);
			} else if (_containsTag(data[i], TAG_EXTINF)) {
				media = _parseExtInf([data[i], data[i+1]]);
				segment = {
					name: "SegmentURL",
					isRoot: false,
					isArray: true,
					//parent: segmentList,
					// children: [],
					media: segmentList.BaseURL + media.uri
				};
				segmentList.SegmentURL_asArray.push(segment);
				duration += media.duration;
			} else if (_containsTag(data[i], TAG_EXTXENDLIST)) {
				// "static" playlist => set duration
				representation.duration = duration;
			}
		}

		deferred.resolve();
	};


	var postProcess = function(manifest) {
		var deferred = Q.defer(),
			period = manifest.Period_asArray[0],
			adaptationSet = period.AdaptationSet_asArray[0],
			representation = adaptationSet.Representation_asArray[0],
			i,
			initialization,
			request = new MediaPlayer.vo.SegmentRequest(),
			self = this;


		period.start = 0;

		// Copy duration from first representation's duration
		adaptationSet.duration = representation.duration;
		period.duration = representation.duration;
		manifest.mediaPresentationDuration = representation.duration;

		// Set manifest type, "static" vs "dynamic"
		manifest.type = (manifest.mediaPresentationDuration === 0) ? "dynamic": "static";

		// Dynamic use case
		if (manifest.type === "dynamic") {
			// => set manifest refresh period as the duration of 1 fragment/chunk
			manifest.minimumUpdatePeriod = adaptationSet.Representation_asArray[0].SegmentList.duration;

			// => set availabilityStartTime property
			var mpdLoadedTime = new Date();
			var manifestDuration = representation.SegmentList.duration * representation.SegmentList.SegmentURL_asArray.length;
			manifest.availabilityStartTime = new Date(mpdLoadedTime.getTime() - manifestDuration);
		}

		// Set initialization segment for each representation
		// And download initialization data (PSI, IDR...) to obtain codec information
		var requestPromiseArray = [];
		for (i = 0; i < adaptationSet.Representation_asArray.length; i++) {
			representation = adaptationSet.Representation_asArray[i];
			
			// Set initialization segment info
			initialization = {
				name: "InitializationSegment",
				sourceURL: representation.SegmentList.SegmentURL_asArray[0].media
			};
			representation.SegmentList.InitializationSegment = initialization;

		}

		// Download initialization data (PSI, IDR...) of 1st representation to obtain codec information
		representation = adaptationSet.Representation_asArray[0];
        request.type = "Initialization Segment";
        request.url = initialization.sourceURL;
        //request.range = "0-18799";

        var onLoaded = function(representation, response) {

			// Parse initialization data to obtain codec information
			var tracks = this.hlsDemux.getTracks(new Uint8Array(response.data));

			deferred.resolve();
        };

        var onError = function() {
			// ERROR
			deferred.resolve();
        };

		self.debug.log("[HlsParser]", "Load initialization segment: " + request.url);
		self.fragmentLoader.load(request).then(onLoaded.bind(self, representation), onError.bind(self));


        return deferred.promise;
	};


	var processManifest = function(data, baseUrl) {
		var deferred = Q.defer(),
			mpd,
			period,
			adaptationsSets = [],
			adaptationSet,
			representations = [],
			representation,
			representationId = 0,
			streams = [],
			stream,
			requestsToDo = [],
			self = this;

		if (!data || data.length <=0 || data[0].trim() !== TAG_EXTM3U) {
			deferred.reject(new Error("Can't parse manifest"));
			return deferred.promise;
		}

		// MPD
		mpd = {};
        mpd.name = "mpd";
        mpd.isRoot = true;
        mpd.isArray = true;
        mpd.parent = null;
        // mpd.children = [];
        mpd.BaseURL = baseUrl;

        mpd.profiles= "urn:mpeg:dash:profile:isoff-live:2011";
        mpd.type = "static"; // Updated in postProcess()
        mpd.mediaPresentationDuration = 0; // Updated in postProcess()
        
        // PERIOD
        period = {};
        period.name = "Period";
        period.isRoot = false;
        period.isArray = false;
        period.parent = mpd;
        period.duration = 0; // To be set at variant playlist parsing
        period.BaseURL = mpd.BaseURL;
        
        mpd.Period = period;
        mpd.Period_asArray = [period];

        // ADAPTATION SET
		adaptationsSets = [];
		period.AdaptationSet = adaptationsSets;
        period.AdaptationSet_asArray = adaptationsSets;

        // Get variant streams
        streams = _getVariantStreams(data.slice(1));

		// Sort streams by bandwidth 
		streams.sort(function(a,b){return a.bandwidth-b.bandwidth;});

		// Only one adaptationSet (HLS v3)
		adaptationSet = {
			name: "AdaptationSet",
			isRoot: false,
			isArray: true,
			//parent: period,
			// children: [],
			id: "",
			lang: "",
			contentType: "video",
			mimeType: "video/mp4",
			maxWidth: 0,
			maxHeight: 0,
			BaseURL: period.BaseURL,
			Representation: representations,
			Representation_asArray: representations
		};

		// 
		for(var i = 0; i < streams.length; i++) {
			// Do not consider representation with bandwidth <= 64K which corresponds to audio only variant stream
			stream = streams[i];
			if(stream.bandwidth > 64000) {
				representation = {
					name: "Representation",
					isRoot: false,
					isArray: true,
					//parent: streamAdaptationSet,
					// children: [],
					id: representationId.toString(),
					mimeType: "video/mp4",
					codecs: "avc1.42E01E, mp4a.40.2",
					bandwidth: stream.bandwidth,
					width: parseInt(stream.resolution.split('x')[0], 10),
					height: parseInt(stream.resolution.split('x')[1], 10),
					BaseURL: adaptationSet.BaseURL,
					url: (stream.uri.indexOf('http') > -1) ? stream.uri : adaptationSet.BaseURL + stream.uri
				};
				representations.push(representation);
				representationId++;
				requestsToDo.push({"url": representation.url, "parent": representation});
			}
		}
		adaptationsSets.push(adaptationSet);

		// alternative renditions of the same content (alternative audio tarcks or subtitles) #EXT-X-MEDIA
		// HLS > v3
		/*if(medias) {
			for (var j = medias.length - 1; j >= 0; j--) {
				var mediaAdaptationSet = {
					name: "AdaptationSet",
					isRoot: false,
					isArray: true,
					//parent: period,
					// children: [],
					id: medias[j].name,
					lang: medias[j].language,
					contentType: medias[j].type.toLowerCase(),
					mimeType: "video/MP2T",
					maxWidth: "",//FIXME
					maxHeight: "",//FIXME
					groupId: medias[j].groupId,
					default: medias[j].default,
					autoSelect: medias[j].autoSelect,
					BaseURL: period.BaseURL
				};
				var mediaRepresentation = {
					name: "mediaRepresentation",
					isRoot: false,
					isArray: true,
					//parent: mediaAdaptationSet,
					// children: [],
					id: 0,
					bandwidth: "",
					width: "",
					height: "",
					codecs: "",
					BaseURL: mediaAdaptationSet.BaseURL,
					url: medias[j].uri.indexOf('http')>-1 ? medias[j].uri : mediaAdaptationSet.BaseURL + medias[j].uri
				};

				requestsToDo.push({"url": mediaRepresentation.url, "parent": mediaRepresentation});
				
				mediaAdaptationSet.Representation = mediaRepresentation;
				mediaAdaptationSet.Representation_asArray = [mediaRepresentation];
				adaptationsSet.push(mediaAdaptationSet);
			}
		}*/
		
		// store all playlist requests to do
		
		var requestPromiseArray = [];
		for (var k= 0; k < requestsToDo.length; k++) {
			requestPromiseArray.push(Custom.utils.doRequestWithPromise(requestsToDo[k].url, _parsePlaylist, requestsToDo[k].parent));
		}
		// wait for all request are done
		Q.all(requestPromiseArray).then(function() {
			postProcess.call(self, mpd).then(function() {
				deferred.resolve(mpd);
			});
		});

        return deferred.promise;
	};

	var internalParse = function(data, baseUrl) {
		this.debug.log("[HlsParser]", "Doing parse.");
		return processManifest.call(this, _splitLines(data),baseUrl);
	};

	return {
        debug: undefined,
        fragmentLoader: undefined,
        hlsDemux: undefined,

        parse: internalParse
    };
};

Hls.dependencies.HlsParser.prototype =  {
    constructor: Hls.dependencies.HlsParser
};
