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
function checkWatchable(link){
    if (window.location.href.indexOf("watch?") > -1) {
        return true;
    }
    else{
        console.log("NOT A WATCHABLE LINK");
        return false;
    }
}

$(document).ready(async function(){
    //window.addEventListener("hashchange", func)
    var currentURL = window.location.href;
    //var videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
    //var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
    /* window.onhashchange = function(){
        console.log("HASHCHANGE!");
    } */
    let grabTitlePromise = grabTitle();
    grabTitlePromise.then(async function(videoTitle){
        var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
        var videoTitle = videoTitle.textContent;
        console.log("Video Title: " + videoTitle);
        console.log("Channel Name: " + channelName);


        console.log("Current URL: " + currentURL);
        var video = document.querySelector("video");
        console.log("Video Duration: " + video.duration);

        var videolink = checkWatchable(window.location.href);

        /* if (window.location.href.indexOf("watch?") > -1) {
            videolink = true;
        }
        else{
            console.log("NOT A WATCHABLE LINK");
        } */

        if(videolink) {
            console.log("starting from videolink");
            var ct = video.currentTime;
            var videoDuration = video.duration;
            var timeCheck = false;
            var port = chrome.runtime.connect({name:"ytar-content"});
            port.postMessage({videolink: currentURL, time: -1, duration: videoDuration, title:videoTitle, channel: channelName},function(){
                console.log("SENT: " + currentURL + " , -1");
            });
            port.onMessage.addListener(async (message)=>{
                console.log("RECIEVED: " + message.videolink +" , " + message.time);
                /* if(message.videolink != currentURL){
                    console.log("CONTENT.JS PAGE NAVIGATION DETECTED");
                    timeCheck = falsse;
                    currentURL = message.videolink;

                    let gtpromise = grabTitle();
                    gtpromise.then(()=>{
                        channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
                        videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                        timeCheck = true;
                        port.postMessage({videolink: currentURL, time: -1, duration: videoDuration, title:videoTitle, channel: channelName}, function(){
                            console.log("SENT: " + currentURL + " , -1");
                            timeCheck = true;
                            videoDuration = video.duration;
                        });
                    });
                }
                else */ if(message.time != -1 && timeCheck == false){
                    console.log("AT SET TIME");
                    video.currentTime = message.time;
                    console.log("Setting timecheck true");
                    timeCheck = true;
                }
                else{
                    console.log("Setting timecheck true");
                    timeCheck = true;
                }
                document.addEventListener('yt-navigate-finish', function() {
                    console.log("yt-page-data-updated event logged");
                });
                video.ontimeupdate = async function(){

                    if(currentURL != window.location.href && timeCheck == true){
                        console.log("PAGE NAVIGATION DETECTED! TURNING OFF TIMECHECK.");
                        channelName = null;
                        videoTitle = null;
                        timeCheck = false;
                        currentURL = window.location.href;
                        if(checkWatchable(window.location.href)){
                            let gtPromise = grabTitle();
                            gtPromise.then(()=>{
                                console.log("GRABBED PAGE INFO. SETTING TIMECHECK TO TRUE");
                                channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
                                videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                                console.log("New video title: " + videoTitle);
                                console.log("New channel name: " + channelName);
                                video = document.querySelector("video");
                                /* while(Number.isNaN(video.duration)){
                                    console.log("duration is NaN waiting to send initial message");
                                } */
                                port.postMessage({videolink: currentURL, time: -1, duration: video.duration, title:videoTitle, channel: channelName},function(){
                                    timeCheck = true;   
                                });
                                
                            })
                        }
                    }
                    if(timeCheck && !Number.isNaN(video.duration) && channelName!=null && videoTitle!=null){
                        //console.log("TC - " + video.currentTime + "/" + video.duration);
                        ct = video.currentTime;
                        port.postMessage({videolink: currentURL, time: ct, duration: video.duration, title: videoTitle, channel: channelName},()=>{
                            console.log("SENT: " + currentURL +" , " + ct);
                        })
                    }
                };
            
        });


        }
    })

});