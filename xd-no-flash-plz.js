// ==UserScript==
// @name         xd-no-flash-plz
// @namespace    https://github.com/brfish
// @version      0.5.0
// @description  使用 HTML5 播放器替换学在西电课程回放平台原本的 Flash 播放器
// @author       brfish
// @match        http://newes.learning.xidian.edu.cn/threepart/index*
// @match        http://newes.chaoxing.com/threepart/index*
// @match        http://newesxidian.chaoxing.com/live/*

// ==/UserScript==

"use strict";

let _COMMON = {
  loadScript: (src) => {
    let scriptElement = document.createElement("script");
    scriptElement.src = src;
    document.head.appendChild(scriptElement);
    return scriptElement;
  },

  loadCSS: (href) => {
    let styleElement = document.createElement("link");
    styleElement.rel = "stylesheet";
    styleElement.href = href;
    document.head.appendChild(styleElement);
    return styleElement;
  },

  createCSS: (styleText) => {
    let styleElement = document.createElement("style");
    styleElement.type = "text/css";
    styleElement.innerText = styleText;
    document.head.appendChild(styleElement);
  },

  clamp: (value, minValue, maxValue) => {
    return Math.min(Math.max(value, minValue), maxValue);
  },

  getURLSearchParam: (search, key) => {
    let result = search.substr(1).match(
      new RegExp("(^|&)" + key + "=([^&]*)(&|$)")
    );
    if (result != null) {
      return result[2];
    }
    return null;
  },

  getURLParam: (url, key) => {
    let tmpURL = new URL(url);
    return _COMMON.getURLSearchParam(tmpURL.search, key);
  }
};

class ContextMenuItem {
  #el;
  #callbacks;
  #parentMenu;

  constructor(parentMenu, text, callbacks) {
    this.#parentMenu = parentMenu;
    this.#callbacks = callbacks;
    this.#el = document.createElement("div");
    this.#el.className = "item";
    this.#el.textContent = text;
    this.#el.onclick = () => {
      if (this.#callbacks.onClick) {
        this.#callbacks.onClick(this);
      }
      this.#parentMenu.hide();
    };
  }

  getElement() {
    return this.#el;
  }

  getText() {
    return this.#el.innerHTML;
  }

  getCallback(name) {
    return this.#callbacks[name];
  }

  getParentMenu() {
    return this.#parentMenu;
  }

  setText(newText) {
    this.#el.innerHTML = newText;
  }

  setCallback(name, callback) {
    this.#callbacks[name] = callback;
  }
}

class ContextMenu {
  #el;
  #items;

  constructor(id) {
    this.#el = document.createElement("div");
    this.#el.className = "context-menu";
    this.#el.id = id;
    this.#items = [];
  }

  getElement() {
    return this.#el;
  }

  addItem(text, callbacks) {
    let item = new ContextMenuItem(this, text, callbacks);
    this.#items.push(item);
    this.#el.appendChild(item.getElement());
    return item;
  }

  addItems(itemInfo) {
    for (let i = 0; i < itemInfo.length; ++i) {
      this.addItem(itemInfo[i].text, itemInfo[i].callbacks);
    }
  }

  removeItem(item) {
    this.#el.removeChild(item.getElement());
    let index = this.#items.indexOf(item);
    if (index != -1) {
      this.#items.splice(index, 1);
    }
  }

  isVisible() {
    return this.#el.classList.contains("visible");
  }

  hide() {
    this.#items.forEach((v, i) => {
      if (v.getCallback("onHide")) {
        v.getCallback("onHide")(v);
      }
    });
    this.#el.classList.remove("visible");
  }

  show() {
    this.#items.forEach((v, i) => {
      if (v.getCallback("onShow")) {
        v.getCallback("onShow")(v);
      }
    });
    this.#el.classList.add("visible");
  }

  showAt(x, y) {
    const { x: tx, y: ty } = this.#normalizePosition(x, y);
    this.#el.style.left = tx + "px";
    this.#el.style.top = ty + "px";
    this.show();
  }

  #normalizePosition(x, y) {
    const parent = this.#el.parentElement;

    const { left: scopeOffsetX, top: scopeOffsetY } = parent.getBoundingClientRect();

    const scopeX = x - scopeOffsetX;
    const scopeY = y - scopeOffsetY;

    let resultX = x;
    let resultY = y;

    if (scopeX + this.#el.clientWidth > parent.clientWidth) {
      resultX = scopeOffsetX + parent.clientWidth - this.#el.clientWidth;
    }

    if (scopeY + this.#el.clientHeight > parent.clientHeight) {
      resultY = scopeOffsetY + parent.clientHeight - this.#el.clientHeight; 
    }

    return { x: resultX, y: resultY };
  }
}


/* =============== OUTER PART =============== */
/*    作用于外部的 newsxidian.chaoxing.com/    */
(function() {
  if (!/newesxidian\.chaoxing\.com/.test(location.hostname))
    return;

  function initBar() {
    let barElement = document.querySelector("body > div:nth-child(1) > div > div.w_wrap > ul");
  
    let classIdElement = barElement.children[3];
    let numPeopleElement = barElement.children[4];
    barElement.removeChild(classIdElement);
    barElement.removeChild(numPeopleElement);
  }

  let courseId = _COMMON.getURLSearchParam(location.search, "liveId");
  $.get("/live/getViewUrlHls", { liveId: courseId, status: 2, jie: '', isStudent: '' }, (data, status) => {
    if (status != "success")
      return;
    let info = _COMMON.getURLParam(data, "info");
    let frameURL = "http://newes.learning.xidian.edu.cn/threepart/index.html?info=" + info;
    $("#viewFrame").attr("src", frameURL);
  });

  initBar();

  $("#viewFrame").attr("allowfullscreen",       true);
  $("#viewFrame").attr("webkitallowfullscreen", true);
  $("#viewFrame").attr("mozallowfullscreen",    true);
  $("#viewFrame").attr("oallowfullscreen",      true);
  $("#viewFrame").attr("msallowfullscreen",     true);

})();
/* =============== OUTER PART =============== */


/* =============== INNER PART =============== */
/*  作用于内联的 news.learning.xidian.edu.cn/  */
(function() {
  if (!(/newes\.learning\.xidian\.edu\.cn/.test(location.hostname)))
    return;

  let _videojs    = _COMMON.loadScript("https://cdn.bootcdn.net/ajax/libs/video.js/7.12.1/video.js");
  let _videojsHS  = _COMMON.loadScript("https://ghproxy.com/https://github.com/videojs/http-streaming/releases/download/v2.8.0/videojs-http-streaming.js");
  let _videojsCSS = _COMMON.loadCSS("https://cdn.bootcdn.net/ajax/libs/video.js/7.12.1/video-js.css");

  function getVideoSources() {
    let infoStr = decodeURIComponent(_COMMON.getURLSearchParam(location.search, "info"));
    let info = JSON.parse(infoStr);

    return {
      isPlayback:   (info.type == "2"),
      combined:     info.videoPath.mobile,
      ppt:          info.videoPath.pptVideo,
      teacherTrack: info.videoPath.teacherTrack
    };
  }

  const videoSources  = getVideoSources();
  const isPlayback    = videoSources.isPlayback;
  let player          = null;
  let playerMenu      = null;

  document.title = isPlayback ? "课程回放" : "课程直播";

  let playerUtils = {
    changeVolume: (deltaVolume) => {
      let newVolume = _COMMON.clamp(player.volume() + deltaVolume, 0.0, 1.0);
      player.volume(newVolume);
      return newVolume;
    },

    seekTime: (deltaTime) => {
      let newTime = _COMMON.clamp(player.currentTime() + deltaTime, 0, player.duration());
      player.currentTime(newTime);
      return newTime;
    }
  };
  
  function downloadVideo() {
    $.get(videoSources.combined, (data, status) => { 
      data.trim().split('\n').forEach((s, i) => {
        if (s.startsWith("#"))
          return;
        let fullPath = videoSources.combined.replace("playback.m3u8", s);
        $.ajax({
          url: fullPath, 
          success: (data, status, xhr) => {
            xhr.responseType = "arraybuffer";
        }});
      });
    });
  }

  _videojs.onload = () => {
    player = videojs("h5-video-player", {
      autoplay: false,
      controls: true,
      loop: false,
      playbackRates: videoSources.isPlayback ? [0.5, 1, 1.5, 2] : null,
      preload: "auto",
      userActions: {
        hotkeys: (event) => {
          const keys = {
            SPACE:  32, 
            M:      77,
            LEFT:   37, 
            RIGHT:  39,
            UP:     38, 
            DOWN:   40,
            ENTER:  13
          };

          let playerId = player.el().querySelector(".vjs-tech").id;

          if (document.activeElement.id != playerId) {
            return;
          }
          
          let keyCode = event.which;
          if (keyCode == keys.SPACE) {
            player.paused() ? player.play() : player.pause();
          } else if (keyCode == keys.LEFT) {
            playerUtils.seekTime(-5);
          } else if (keyCode == keys.RIGHT) {
            playerUtils.seekTime(5);
          } else if (keyCode == keys.UP) {
            playerUtils.changeVolume(0.1);
          } else if (keyCode == keys.DOWN) {
            playerUtils.changeVolume(-0.1);
          } else if (keyCode == keys.M) {
            player.muted() ? player.muted(false) : player.muted(true);
          } else if (keyCode == keys.ENTER) {
            player.requestFullscreen();
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
  
      initPlayerContextMenu();
  
      playerElement.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        playerMenu.showAt(event.clientX, event.clientY);
      });
  
      playerElement.addEventListener("click", (event) => {
        if (event.target.offsetParent != playerMenu.getElement()) {
          playerMenu.hide();
        }
      });

      playerElement.addEventListener("mousewheel", (event) => {
        if (!player.isFullscreen())
          return;
        event.preventDefault();

        let delta = _COMMON.clamp(event.wheelDelta, -1, 1);
        if (delta > 0) {
          playerUtils.changeVolume(0.1);
        }
        if (delta < 0) {
          playerUtils.changeVolume(-0.1);
        }
      })
    });
  };

  function initPlayerContextMenu() {
    let styleText = 
      ".context-menu {position: fixed; z-index: 10000; width: 150px; background: #1b1a1a; border-radius: 5px; display: none}\n" +
      ".context-menu .item {padding: 8px 10px; font-size: 15px; color: #eee; cursor: pointer; border-radius: inherit;}\n" +
      ".context-menu .item:hover {background: #343434;}\n" +
      ".context-menu.visible {display: block}";
    _COMMON.createCSS(styleText);
  
    playerMenu = new ContextMenu("player-context-menu");
    player.el().appendChild(playerMenu.getElement());
  
    playerMenu.addItems([
      {
        text: "播放", 
        callbacks: {
          onClick: (self) => {
            if (player.paused()) {
              player.play();
              self.setText("暂停");
            } else {
              player.pause();
              self.setText("播放");
            }
          },
          onShow: (self) => {
            player.paused() ? self.setText("播放") : self.setText("暂停");
          }
        }
      },
      {
        text: "静音",
        callbacks: {
          onClick: (self) => {
            if (player.muted()) {
              player.muted(false);
              self.setText("静音");
            } else {
              player.muted(true);
              self.setText("取消静音");
            }
          },
          onShow: (self) => {
            player.muted() ? self.setText("取消静音") : self.setText("静音");
          }
        }
      },
      {
        text: "全屏播放",
        callbacks: {
          onClick: (self) => {
            if (player.isFullscreen()) {
              player.exitFullscreen();
              self.setText("全屏播放");
            } else {
              player.requestFullscreen();
              self.setText("退出全屏");
            }
          },
          onShow: (self) => {
            player.isFullscreen() ? self.setText("退出全屏") : self.setText("全屏播放");
          }
        },
      },
      {
        text: "在新标签页打开",
        callbacks: {
          onClick: (self) => {
            window.open(window.location.search, "_blank");
          }
        }
      },
      {
        text: "获取视频地址",
        callbacks: {
          onClick: (self) => {
            let tmpInput = document.createElement("input");
            tmpInput.value = videoSources.combined;
            document.body.appendChild(tmpInput);
            tmpInput.select();
            document.execCommand("copy");
            document.body.removeChild(tmpInput);
            
            alert("已复制到剪贴板");
          }
        }
      }
    ]);

    /* TODO
    if (isPlayback) {
      playerMenu.addItem("下载", {
        onClick:(self) => {
          downloadVideo();
        }
      });
    }*/
  }

  let videoElement = document.createElement("video");
  videoElement.id = "h5-video-player";
  videoElement.width = document.body.clientWidth;
  videoElement.height = document.body.clientHeight;
  videoElement.className = "video-js vjs-big-play-centered vjs-default-skin";

  let srcElement = document.createElement("source");
  srcElement.src = videoSources.combined;
  srcElement.type = "application/x-mpegURL";
  videoElement.appendChild(srcElement);

  let oldVideoElement = document.getElementsByClassName("main clearfix")[0];
  oldVideoElement.parentElement.replaceChild(videoElement, oldVideoElement);

  let installFlashElement = document.getElementsByClassName("install-flash");
  if (installFlashElement.length != 0) {
    installFlashElement[0].parentElement.removeChild(installFlashElement[0]);
  }

})();
/* =============== INNER PART =============== */