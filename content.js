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
function grabTitle(){
    var videoTitle;
    //var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0];
    return new Promise(function(resolve){
        videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0];
        //channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0];
        if(videoTitle==null){
            console.log("VIDEO TITLE OR CHANNEL NAME IS NULL. TRYING AGAIN IN ONE SECOND.");
            setTimeout(()=>{
                let grabTitlePromise = grabTitle();
                grabTitlePromise.then(function(videoTitle){
                    resolve(videoTitle);
                })
            },1000)
        }
        else{
            console.log("resolving");
            resolve(videoTitle);
        }
    });
}

$(document).ready(async function(){
    var currentURL = window.location.href;
    //var videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
    //var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
   
    let grabTitlePromise = grabTitle();
    grabTitlePromise.then(function(videoTitle){
        var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
        var videoTitle = videoTitle.textContent;
        console.log("Video Title: " + videoTitle);
        console.log("Channel Name: " + channelName);


        console.log("Current URL: " + currentURL);
        var video = document.querySelector("video");
        console.log("Video Duration: " + video.duration);

        var videolink = false;
        if (window.location.href.indexOf("watch?") > -1) {
            videolink = true;
        }
        else{
            console.log("NOT A WATCHABLE LINK");
        }

        if(videolink) {
            console.log("starting from videolink");
            var ct = video.currentTime;
            var videoDuration = video.duration;
            var timeCheck = false;
            var port = chrome.runtime.connect({name:"ytar-content"});
            port.postMessage({videolink: currentURL, time: -1, duration: videoDuration, title:videoTitle, channel: channelName},function(){
                console.log("SENT: " + currentURL + " , -1");
            });
            port.onMessage.addListener((message)=>{
                console.log("RECIEVED: " + message.videolink +" , " + message.time);
                if(message.time != -1 && timeCheck == false){
                    console.log("AT SET TIME");
                    video.currentTime = message.time;
                    console.log("Setting timecheck true");
                    timeCheck = true;
                }
                else{
                    console.log("Setting timecheck true");
                    timeCheck = true;
                }
            });
            video.ontimeupdate = function(){
                if(timeCheck){
                    console.log("timecheck passed");
                    ct = video.currentTime;
                    port.postMessage({videolink: currentURL, time: ct, duration: video.duration, title: videoTitle, channel: channelName},()=>{
                        console.log("SENT: " + currentURL +" , " + ct);
                    })
                }
            };


        }
    })

});