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
Custom.models.CustomMetricsModel = function () {
    "use strict";
    var rslt = Custom.utils.copyMethods(MediaPlayer.models.MetricsModel);

    rslt.addRepresentationBoundaries = function (streamType, t, min, max) {
        var vo = new Custom.vo.metrics.RepresentationBoundaries();

        vo.t = t;
        vo.min = min;
        vo.max = max;

        this.parent.getMetricsFor(streamType).RepBoundariesList.push(vo);
        return vo;
    };

    rslt.addBandwidthBoundaries = function (streamType, t, min, max) {
        var vo = new Custom.vo.metrics.BandwidthBoundaries();

        vo.t = t;
        vo.min = min;
        vo.max = max;

        this.parent.getMetricsFor(streamType).BandwidthBoundariesList.push(vo);
        return vo;
    };

    rslt.addDownloadSwitch = function (streamType, startTime, downloadTime, quality) {
        var ds = new Custom.vo.metrics.DownloadSwitch();

        ds.type = streamType;
        ds.mediaStartTime = startTime;
        ds.downloadStartTime = downloadTime;
        ds.quality = quality;

        this.parent.getMetricsFor(streamType).DwnldSwitchList = [ds];
        return ds;
    };

    rslt.setBandwidthValue = function (streamType, value) {
        var bwv = new Custom.vo.metrics.BandwidthValue();

        bwv.value = value;
        
        this.parent.getMetricsFor(streamType).BandwidthValue = bwv;
        return bwv;
    };

    return rslt;
};

Custom.models.CustomMetricsModel.prototype = {
    constructor: Custom.models.CustomMetricsModel
};
