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
    if(window.location.href.indexOf("watch?") > -1 && window.location.href.indexOf("?t=")>-1){
        console.log("IGNORING TIMESTAMPED LINK");
        return false;
    }
    
    else if (window.location.href.indexOf("watch?") > -1) {
        return true;
    }
    else{
        console.log("NOT A WATCHABLE LINK");
        return false;
    }
}
function initStorage(){
    var bytesUsed;
    chrome.storage.local.getBytesInUse(null, function(bytes){
        bytesUsed = bytes;
    });
    console.log("BYTES USED: " + bytesUsed);
    if(bytesUsed == 0 || bytesUsed == undefined){
        console.log("BYTES USED ZERO OR undefined");
        chrome.storage.local.set(nvarray);  
    }
    else{
        console.log("Storage not empty");
    }
}

var nvarray = {videos:[]};
$(document).ready(async function(){
    var currentURL = window.location.href;
    let grabTitlePromise = grabTitle();
    initStorage();
    /* let cslPromise = checkStoredLinks(window.location.href);
    cslPromise.then((vid)=>{
        
    }) */
    if(checkWatchable(window.location.href)){
        grabTitlePromise.then(async function(videoTitle){
            
            var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
            var videoTitle = videoTitle.textContent;
            console.log("Video Title: " + videoTitle);
            console.log("Channel Name: " + channelName);


            console.log("Current URL: " + currentURL);
            var video = document.querySelector("video");
            //console.log("Video Duration: " + video.duration); 
            let cslPromise = checkStoredLinks(window.location.href);
            cslPromise.then(
                (vid)=>{
                    if(vid.time>0){
                        video.currentTime = vid.time;
                    }
                    return;
                },
                ()=>{
                    var duration;
                    var currentTime;
                    if(Number.isNaN(video.duration) || video.duration <0){duration = 0}
                    else{duration = video.duration};

                    if(Number.isNaN(video.currentTime) || video.currentTime < 0){currentTime = 0}
                    else{currentTime = video.currentTime};

                    var newVid = {videolink: window.location.href, time: video.currentTime, duration: duration,
                        title: $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent,
                        channel: $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent};
                    addNewVideo(newVid).then(()=>{ return;})
                }
            ); 
            console.log("returning grabTitlePromise");
            return;
        })/* .then(()=>{


        }) */
        .then(async ()=>{
            //var videolink = checkWatchable(window.location.href);
            //if(videolink) {
                var video = document.querySelector("video");
                console.log("starting from videolink");
                var ct = video.currentTime;
                //var videoDuration = video.duration;
                var timeCheck = true;
                var lastTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                video.ontimeupdate = function(){        
                    currentURL = window.location.href;
                    var videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                    var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
                    if(!Number.isNaN(video.duration) && video.duration!=0 && !(video.currentTime<0)
                        && channelName!=null && videoTitle!=null){
                        ct = video.currentTime;
                        if($("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent!=lastTitle){
                            /* port.postMessage({videolink: window.location.href, time: -1, duration: video.duration,
                                title: $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent,
                                channel: $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent},()=>{
                                console.log("SENT: " + currentURL +" , " + ct);
                                lastTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                            }) */
                            lastTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                            timeCheck=false;
                            if(checkWatchable(window.location.href)){
                                console.log("TITLE CHANGE. WATCHABLE. CHECKING DB");
                                checkStoredLinks(window.location.href).then(
                                    (vid)=>{
                                        if(vid.time>0){
                                            document.querySelector("video").currentTime = vid.time;
                                        }
                                        timeCheck=true;
                                    },
                                    ()=>{
                                        console.log("vid not found in db. adding vid");
                                        addNewVideo({videolink: window.location.href, time: video.currentTime, duration: video.duration,
                                            title: $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent,
                                            channel: $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent})
                                        .then(()=>{
                                            timeCheck=true;
                                            return;
                                        })
                                        
                                    }
                                )
                            }
                            else{
                                console.log("TITLE CHANGE. NOT WATCHABLE");
                            }
                        }
                        else if(timeCheck){
                            console.log("TC - " + video.currentTime + "/" + video.duration +", " +  $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent);
                            /* port.postMessage({videolink: window.location.href, time: ct, duration: video.duration,
                            title: $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent,
                            channel: $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent},()=>{
                            console.log("SENT: " + currentURL +" , " + ct);
                            }) */
                            setTime({videolink: window.location.href, time: video.currentTime, duration: video.duration,
                                title: $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent,
                                channel: $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent})
                            .then(()=>{return});
                        }
                    }
                };

            //}
        })
    }
});

function checkStoredLinks(link){
    var result = -1;
    var resultFound = false;
    return new Promise(function(resolve,reject){
        chrome.storage.local.get("videos",function(data){
            console.log("videos.length at checkStoredLinks: "+ data.videos.length);
            if(data.videos.legnth != 0)
            {
                for(var i=0;i<data.videos.length;i++){
                    if(data.videos[i].videolink == link){
                        console.log("link == videolink; INDEX: " + i);
                        console.log("MATCH FOUND: " + data.videos[i].title + ", " + data.videos[i].channel);
                        result = i;
                        resultFound=true;
                        console.log("resolving checkStoredLinks");
                        resolve(data.videos[i]);
                        break;
                    }
                }
            }
            if(!resultFound){
                console.log("rejecting checkStoredLinks");
                reject(-1);
            };
            //resolve(result);
        });
    });
}
function addNewVideo(video){
    return new Promise(function(resolve){
        console.log("ADDING LINK: " + video.videolink);
        var currentVideos = [];
        var newVideo = {videolink:video.videolink, time:-1,
            duration: video.duration, title:video.title, channel:video.channel}
        chrome.storage.local.get("videos", function(data){
            currentVideos = data;
            currentVideos.videos.push(newVideo);
            chrome.storage.local.set(currentVideos);
        });
        resolve();
    })
    
}

function setTime(video){
    return new Promise(function(resolve){
        var currentVideos = [];
        chrome.storage.local.get("videos", function(data){
            currentVideos = data;
            for(var i=0;i<currentVideos.videos.length;i++){
                if(currentVideos.videos[i].videolink == video.videolink){
                    /* var nv = {
                        videolink:link,
                        time: time
                    }; */
                    /* var nv = currentVideos.videos[i];
                    nv.time = time; */
                    currentVideos.videos[i] = video;            
                    chrome.storage.local.set(currentVideos);
                    break;
                }
            }
        });
        resolve();
    })

}