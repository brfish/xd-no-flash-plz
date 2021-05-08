// ==UserScript==
// @name         xd-no-flash-plz
// @namespace    https://github.com/brfish
// @version      0.4.2 
// @description  使用 HTML5 播放器替换学在西电课程回放平台原本的 Flash 播放器
// @author       brfish
// @match        http://newes.learning.xidian.edu.cn/threepart/index*
// @match        http://newes.chaoxing.com/threepart/index*

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

function getPlaybackSource() {
  let result = window.location.search.substr(1).match(
    new RegExp("(^|&)info=([^&]*)(&|$)")
  );
  let infoStr = decodeURIComponent(result[2]);
  let info = JSON.parse(infoStr);
  return info.videoPath.mobile;
}

function changeVolume(player, deltaVolume) {
  let newVolume = player.volume() + deltaVolume;
 
  if (newVolume > 1.0) {
    newVolume = 1.0;
  }
  player.volume(newVolume);
  return newVolume;
}

function seekTime(player, deltaTime) {
  let newTime = player.currentTime() + deltaTime;

  if (newTime < 0) {
    newTime = 0;
  }
  player.currentTime(newTime);
  return newTime;
}

function flipPlayState(player) {
  player.paused() ? player.play() : player.pause();
}

function createContextMenu() {
  var styleText = 
    "#player-context-menu {position: fixed; z-index: 10000; width: 150px; background: #1b1a1a; border-radius: 5px; display: none}\n" +
    "#player-context-menu .item {padding: 8px 10px; font-size: 15px; color: #eee; cursor: pointer; border-radius: inherit;}\n" +
    "#player-context-menu .item:hover {background: #343434;}\n" +
    "#player-context-menu.visible {display: block;}";
  let menuStyle = document.createElement("style");
  menuStyle.type = "text/css";
  menuStyle.innerText = styleText;
  document.head.appendChild(menuStyle);

  let menuElement = document.createElement("div");
  menuElement.id = "player-context-menu";
  document.body.appendChild(menuElement);

  return menuElement;
}

function addContextMenuItems(menu, items) {
  for (let item of items) {
    let itemElement = document.createElement("div");
    itemElement.className = "item";
    itemElement.textContent = item.text;
    itemElement.onclick = item.callback;
    menu.appendChild(itemElement);
  }
}

function main() {
  let jsExtern = {
    videojs: requireJS("https://unpkg.com/video.js/dist/video.js"),
    videojsHS: requireJS("https://unpkg.com/@videojs/http-streaming/dist/videojs-http-streaming.js"),
  };
  let videojsCSS = requireCSS("stylesheet", "https://unpkg.com/video.js/dist/video-js.css");

  let playbackSource = getPlaybackSource();

  jsExtern.videojs.onload = function() {
    var player = videojs("h5VideoPlayer", {
      autoplay: false,
      controls: true,
      loop: false,
      playbackRates: [0.5, 1, 1.5, 2, 2.5, 3],
      preload: "auto",
      userActions: {
        hotkeys: function(event) {
          let keys = {
            SPACE: 32,
            LEFT: 37,
            RIGHT: 39,
            UP: 38,
            DOWN: 40,
            M: 77
          };

          let playerId = this.el().querySelector(".vjs-tech").id;

          if (document.activeElement.id != playerId) {
            return;
          }
      
          if (event.which == keys.SPACE) {
            flipPlayState(this);
          } else if (event.which == keys.LEFT) {
            seekTime(this, -5);
          } else if (event.which == keys.RIGHT) {
            seekTime(this, 5);
          } else if (event.which == keys.UP) {
            changeVolume(this, 0.1);
          } else if (event.which == keys.DOWN) {
            changeVolume(this, -0.1);
          } else if (event.which == keys.M) {
            player.muted() ? player.muted(false) : player.muted(true);
          } else {
            return;
          }

          event.preventDefault();
        }
      }
    });

    player.ready(function() {
      let playerElement = player.el().querySelector(".vjs-tech");

      playerElement.focus();

      let playerMenu = createContextMenu();
      addContextMenuItems(playerMenu, [
        {
          text: "播放",
          callback: function() {
            if (player.paused()) {
              player.play();
              playerMenu.childNodes[0].innerHTML = "暂停";
            } else {
              player.pause();
              playerMenu.childNodes[0].innerHTML = "播放";
            }
            playerMenu.classList.remove("visible");
          }
        },
        {
          text: "静音",
          callback: function() {
            if (player.muted()) {
              player.muted(false);
              playerMenu.childNodes[1].innerHTML = "静音";
            } else {
              player.muted(true);
              playerMenu.childNodes[1].innerHTML = "取消静音";
            }
            playerMenu.classList.remove("visible");
          }
        },
        {
          text: "在新标签页打开",
          callback: function() {
            window.open(window.location.search, "_blank");
            playerMenu.classList.remove("visible");
          }
        },
        {
          text: "获取视频地址",
          callback: function() {
            let tmpInput = document.createElement("input");
            tmpInput.value = playbackSource;
            document.body.appendChild(tmpInput);
            tmpInput.select();
            document.execCommand("copy");
            document.body.removeChild(tmpInput);
            
            alert("已复制到剪贴板");
            playerMenu.classList.remove("visible");
          }
        }
      ])

      playerElement.addEventListener("contextmenu", function(event) {
        event.preventDefault();
        playerMenu.style.left = event.clientX + "px";
        playerMenu.style.top = event.clientY + "px";
        
        playerMenu.classList.add("visible");
      });

      playerElement.addEventListener("click", function(event) {
        if (event.target.offsetParent != playerMenu) {
          playerMenu.classList.remove("visible");
        }
      });

      window.addEventListener("resize", function(event) {
        let w = player.el().parentElement.offsetWidth;
        let h = w * (9.0 / 16.0);

        player.width(w);
        player.height(h);
      });
    });
  }

  let videoPlayer = document.createElement("video");
  videoPlayer.id = "h5VideoPlayer";
  videoPlayer.width = document.body.clientWidth;
  videoPlayer.height = document.body.clientHeight;
  videoPlayer.className = "video-js vjs-big-play-centered vjs-default-skin";

  let videoSource = document.createElement("source");
  videoSource.src = playbackSource;
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
