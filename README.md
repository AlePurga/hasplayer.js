# hasplayer.js

hasplayer.js is a javascript implementation of a video player based on the W3C premium extensions, i.e. [MSE](https://dvcs.w3.org/hg/html-media/raw-file/tip/media-source/media-source.html) and [EME](https://dvcs.w3.org/hg/html-media/raw-file/tip/encrypted-media/encrypted-media.html).

hasplayer.js is an extension of the [dash.js](https://github.com/Dash-Industry-Forum/dash.js) project with the aim of supporting additional http adaptive streaming protocols such as Microsoft Smooth Streaming protocol.

If your intent is to use the player code without contributing back to this project, then use the MASTER branch which holds the approved and stable public releases.

If your goal is to improve or extend the code and contribute back to this project, then you should make your changes in, and submit a pull request against, the DEVELOPMENT branch. 


## Quick Start

Download desired branch, extract and open home page of any sample from the samples folder (hasplayer.js/samples/) in your web browser.
A build version can be obtained by running `grunt build`. The build files are generated under 'hasplayer.js/build' folder. 

## Demo

A demonstration application, based on dash.js project's home application, and using hasplayer.js is located here:
http://orange-opensource.github.io/hasplayer.js

## License

All code in this repository is covered by the [BSD-3 license](http://opensource.org/licenses/BSD-3-Clause). 
See LICENSE file for copyright details.


## Getting Started
Create a video element somewhere in your html. For our purposes, make sure to set the controls property to true.
```
<video id="videoPlayer" controls="true"></video>
```
Add hasplayer.js to the end of the body.
```
<body>
  ...
  <script src="yourPathToHasplayer/hasplayer.js"></script>
</body>
```
Now comes the good stuff. We need to create a 'custom' context (inherited from dash context and adding Smooth Streaming and HLS stuff). Then from that context we create a media player, initialize it, attach it to our "videoPlayer" and then tell it where to get the video from. We will do this in an anonymous self executing function, that way it will run as soon as the page loads. So, here is how we do it:
``` js
(function(){
    var url = "http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest";
    var context = new Custom.di.CustomContext();
    var player = new MediaPlayer(context);
    player.startup();
    player.attachView(document.querySelector("#videoPlayer"));
    player.attachSource(url);
})();
```

When it is all done, it should look similar to this:
```
<!doctype html>
<html>
    <head>
        <title>Hasplayer.js Rocks</title>
    </head>
    <body>
        <div>
            <video id="videoPlayer" controls="true"></video>
        </div>
        <script src="yourPathToHasplayer/hasplayer.js"></script>
        <script>
            (function(){
                var url = "http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest";
                var context = new Custom.di.CustomContext();
                var player = new MediaPlayer(context);
                player.startup();
                player.attachView(document.querySelector("#videoPlayer"));
                player.attachSource(url);
            })();
        </script>
    </body>
</html>
```
