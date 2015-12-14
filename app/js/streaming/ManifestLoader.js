/*
 * The copyright in this software is being made available under the BSD License, included below. This software may be subject to other third party and contributor rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Digital Primates
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * •  Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * •  Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * •  Neither the name of the Digital Primates nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
MediaPlayer.dependencies.ManifestLoader = function() {
    "use strict";

    var deferred = null,
        request = new XMLHttpRequest(),

        getDecodedResponseText = function(text) {
            var fixedCharCodes = [],
                i = 0,
                charCode;

            // Some content is not always successfully decoded by every browser.
            // Known problem case: UTF-16 BE manifests on Internet Explorer 11.
            // This function decodes any text that the browser failed to decode.
            if (text.length < 1) {
                return text;
            }

            // The troublesome bit here is that IE still strips off the BOM, despite incorrectly decoding the file.
            // So we will simply assume that the first character is < (0x3C) and detect its invalid decoding (0x3C00).
            if (text.charCodeAt(0) !== 0x3C00) {
                return text;
            }

            // We have a problem!
            for (i = 0; i < text.length; i++) {
                charCode = text.charCodeAt(i);

                // Swap around the two bytes that make up the character code.
                fixedCharCodes.push((charCode & 0xFF) << 8 | (charCode & 0xFF00) >> 8);
            }

            return String.fromCharCode.apply(null, fixedCharCodes);
        },

        parseBaseUrl = function(url) {
            var base = null;

            if (url.indexOf("/") !== -1) {
                if (url.indexOf("?") !== -1) {
                    url = url.substring(0, url.indexOf("?"));
                }
                base = url.substring(0, url.lastIndexOf("/") + 1);
            }

            return base;
        },

        abort = function() {
            if (request !== null && request.readyState > 0 && request.readyState < 4) {
                this.debug.log("[ManifestLoader] Manifest download abort.");
                request.abort();
            }

            this.parser.abort();
        },

        doLoad = function(url) {
            var baseUrl = parseBaseUrl(url),
                requestTime = new Date(),
                mpdLoadedTime = null,
                needFailureReport = true,
                onload = null,
                report = null,
                onabort = null,
                self = this;

            onabort = function() {
                request.aborted = true;
            };

            onload = function() {
                if (request.status < 200 || request.status > 299) {
                    return;
                }

                if (request.status === 200 && request.readyState === 4) {
                    self.debug.log("[ManifestLoader] Manifest downloaded");

                    // Get the redirection URL and use it as base URL
                    if (request.responseURL) {
                        self.debug.log("[ManifestLoader] Redirect URL: " + request.responseURL);
                        baseUrl = parseBaseUrl(request.responseURL);
                    }

                    needFailureReport = false;
                    mpdLoadedTime = new Date();

                    self.tokenAuthentication.checkRequestHeaderForToken(request);
                    self.metricsModel.addHttpRequest("stream",
                        null,
                        "MPD",
                        url,
                        null,
                        null,
                        requestTime,
                        mpdLoadedTime,
                        request.status,
                        null,
                        null);

                    self.parser.parse(getDecodedResponseText(request.responseText), baseUrl).then(
                        function(manifest) {
                            manifest.mpdUrl = url;
                            manifest.mpdLoadedTime = mpdLoadedTime;
                            self.metricsModel.addManifestUpdate("stream", manifest.type, requestTime, mpdLoadedTime, manifest.availabilityStartTime);
                            deferred.resolve(manifest);
                        },
                        function() {
                            self.debug.error("[ManifestLoader] Manifest parsing error");
                            deferred.reject({name: MediaPlayer.dependencies.ErrorHandler.prototype.MANIFEST_ERR_PARSE, message: "Failed to parse manifest"});
                        }
                    );
                }
            };

            report = function() {
                if (!needFailureReport) {
                    return;
                }
                needFailureReport = false;

                self.metricsModel.addHttpRequest("stream",
                    null,
                    "MPD",
                    url,
                    null,
                    null,
                    requestTime,
                    new Date(),
                    request.status,
                    null,
                    null);

                if (request.aborted) {
                    deferred.reject();
                } else {
                    deferred.reject({name: MediaPlayer.dependencies.ErrorHandler.prototype.DOWNLOAD_ERR_MANIFEST, message: "Failed to download manifest"});
                }
            };

            try {
                request.onload = onload;
                request.onloadend = report;
                request.onerror = report;
                request.onabort = onabort;
                request.open("GET", url, true);
                request.send();
            } catch (e) {
                request.onerror();
            }
        };

    return {
        debug: undefined,
        parser: undefined,
        errHandler: undefined,
        metricsModel: undefined,
        tokenAuthentication: undefined,
        load: function(url) {
            deferred = Q.defer();
            doLoad.call(this, url);
            return deferred.promise;
        },
        abort: abort
    };
};

MediaPlayer.dependencies.ManifestLoader.prototype = {
    constructor: MediaPlayer.dependencies.ManifestLoader
};