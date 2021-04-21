// ==UserScript==
// @name         no-flash-plz
// @namespace    https://github.com/brfish
// @version      0.3
// @description  使用 HTML5 播放器替换学在西电课程回放平台原本的 Flash 播放器
// @author       brfish
// @match        http://newes.learning.xidian.edu.cn/threepart/index.html*

// ==/UserScript==

function requireJS(src) {
    let script = document.createElement("script");
    script.src = src;
    document.head.appendChild(script);
    return script;
}

function requireCSS(rel, href) {
    let css = document.createElement("link");
    css.rel = rel;
    css.href = href;
    document.head.appendChild(css);
    return css;
}

function getVideoSource() {
    let result = window.location.search.substr(1).match(
        new RegExp("(^|&)info=([^&]*)(&|$)")
    );
    let infoStr = decodeURIComponent(result[2]);
    let info = JSON.parse(infoStr);
    return info.videoPath.mobile;
}

function main() {
    let jsExtern = {
        videojs: requireJS("https://unpkg.com/video.js/dist/video.js"),
        videojsHS: requireJS("https://unpkg.com/@videojs/http-streaming/dist/videojs-http-streaming.js"),
    };
    let videojsCSS = requireCSS("stylesheet", "https://unpkg.com/video.js/dist/video-js.css");

    jsExtern.videojs.onload = function() {
        let player = videojs("h5VideoPlayer", {
            bigPlayButton: true,
            playbackRates: [0.5, 1, 1.5, 2, 2.5, 3],
            loop: false,
            preload: "auto",
            userActions: {
                hotkeys: function(event) {
                    // SPACE
                    if (event.which == 32) {
                        if (this.paused()) {
                            this.play();
                        } else {
                            this.pause();
                        }
                    }

                    // LEFT
                    if (event.which == 37) {
                        let time = this.currentTime() - 5;
                        if (time < 0) {
                            time = 0;
                        }
                        this.currentTime(time);
                    }

                    // RIGHT
                    if (event.which == 39) {
                        let time = this.currentTime() + 5;
                        this.currentTime(time);
                    }

                    // UP
                    if (event.which == 38) {
                        let volume = this.volume();
                        volume += 0.1;
                        if (volume > 1.0)
                            volume = 1.0;
                        this.volume(volume);
                    }

                    // DOWN
                    if (event.which == 40) {
                        let volume = this.volume();
                        volume -= 0.1;
                        if (volume > 1.0)
                            volume = 0.0;
                        this.volume(volume);
                    }
                }
            }
        });
    }

    let videoPlayer = document.createElement("video");
    videoPlayer.id = "h5VideoPlayer";
    videoPlayer.width = document.body.clientWidth;
    videoPlayer.height = document.body.clientHeight;
    videoPlayer.className = "video-js vjs-default-skin";
    videoPlayer.controls = true;

    let videoSource = document.createElement("source");
    videoSource.src = getVideoSource();
    videoSource.type = "application/x-mpegURL";
    videoPlayer.appendChild(videoSource);

    let oldVideoPlayer = document.getElementsByClassName("main clearfix")[0];
    oldVideoPlayer.parentElement.replaceChild(videoPlayer, oldVideoPlayer);

    let installFlash = document.getElementsByClassName("install-flash");
    if (installFlash.length != 0) {
        installFlash[0].parentElement.removeChild(installFlash[0]);
    }
}

(function() {
    main();
})();