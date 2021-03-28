"use strict";

//content.js

/* 
    video:{
        videolink,
        time,
        duration,
        title,
        channel,

    }
*/
$(document).ready(function () {
  //document.addEventListener("DOMContentLoaded",function(event){
  var currentURL = window.location.href;
  /* var grabbedInfo = false; 
  while(!grabbedInfo){
      try{
          
          grabbedInfo = true;
      }
      catch(err){
          console.log("CAUGHT DEFFERED EXCEPTION ERROR");
      }
  }; */

  var videoTitle = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer");
  /*    if(videoTitle!=null){
         console.log("VIDEO TITLE != NULL");
         videoTitle = videoTitle.textContent;
     }
     else{
         console.log("VIDEO TITLE == NULL");
     }
     
     if(channelName != null){
         channelName = 
     } */

  var channelName = document.querySelector("yt-formatted-string#text.style-scope.ytd-channel-name").textContent;
  console.log("Video Title: " + videoTitle);
  console.log("Channel Name: " + channelName);
  console.log("Current URL: " + currentURL);
  var video = document.querySelector("video");
  console.log("Video Duration: " + video.duration);
  var videolink = false;

  if (window.location.href.indexOf("watch?") > -1) {
    videolink = true;
  } else {
    console.log("NOT A WATCHABLE LINK");
  }

  if (videolink) {
    console.log("starting from videolink");
    var ct = video.currentTime;
    var videoDuration = video.duration;
    var timeCheck = false;
    var port = chrome.runtime.connect({
      name: "ytar-content"
    });
    port.postMessage({
      videolink: currentURL,
      time: -1,
      duration: videoDuration,
      title: videoTitle,
      channel: channelName
    }, function () {
      console.log("SENT: " + currentURL + " , -1");
    });
    port.onMessage.addListener(function (message) {
      console.log("RECIEVED: " + message.videolink + " , " + message.time);

      if (message.time != -1 && timeCheck == false) {
        console.log("AT SET TIME");
        video.currentTime = message.time;
        console.log("Setting timecheck true");
        timeCheck = true;
      } else {
        console.log("Setting timecheck true");
        timeCheck = true;
      }
    });

    video.ontimeupdate = function () {
      if (timeCheck) {
        console.log("timecheck passed");
        ct = video.currentTime;
        port.postMessage({
          videolink: currentURL,
          time: ct,
          duration: video.duration,
          title: videoTitle,
          channel: channelName
        }, function () {
          console.log("SENT: " + currentURL + " , " + ct);
        });
      }
    };
  }
});