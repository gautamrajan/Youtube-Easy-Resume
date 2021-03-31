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


var nvarray = {videos:[]};
var initialLinkIsVideo;
var directLoopDone;
var ytNavLoop;
$(document).ready(async function(){
    /* chrome.storage.local.clear(()=>{
        console.log("CLEARED STORAGE: ");
    }); */
    console.log("document ready, starting");
    ytNavLoop = false;
    if(checkWatchable(window.location.href)){initialLinkIsVideo = true}
    else{initialLinkIsVideo = false};
    initStorage();
    document.addEventListener('yt-navigate-finish',async ()=>{
        console.log("yt-navigate-finish EVENT DETECTED.")
        if(initialLinkIsVideo){
            console.log("SETTING initialLinkIsVideo FALSE AND STARTING mainVideoProcess()");
            initialLinkIsVideo = false;
            waitYtNav().then(()=>{
                console.log("ytnav set. startin mvp process in event listener loop");
            })
            .then(async ()=>{
                mainVideoProcess().then(()=>{
                    return;
                })
            })
        }
        else{
            console.log("initialLinkIsVideo never triggered. starting mvp");
            ytNavLoop = true;
            mainVideoProcess().then(()=>{
                return;
            })
        }
            
       
        //waitYtNav().then(mainVideoProcess().then(()=>{return}));
    })

        if(initialLinkIsVideo &&  !ytNavLoop){
            //loopPromise().then(()=>{return;})
            console.log("RUNNING DIRECT LOOP");
            mainVideoProcess().then(()=>
            {
                console.log("initial link loop complete. setting ytnav true");
                ytNavLoop = true;
                return;
            });
        }
        
});
function grabTitle(){
    var videoTitle;
    //var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0];
    return new Promise(function(resolve,reject){
        if(!checkWatchable(window.location.href)){
            console.log("rejecting grabTitle. link not watchable");
            reject();
        };
        videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0];
        //channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0];
        if(videoTitle==null || videoTitle==undefined){
            console.log("VIDEO TITLE OR CHANNEL NAME IS NULL. TRYING AGAIN IN ONE SECOND.");
            /* setTimeout(()=>{
                let grabTitlePromise = grabTitle();
                grabTitlePromise.then(function(videoTitle){
                    resolve(videoTitle);
                })
            },1000) */
            var interval = setInterval(()=>{
                videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0];
                if(!(videoTitle==null || videoTitle==undefined)){
                    resolve(videoTitle);
                    clearInterval(interval);
                }
            },2000)
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
    chrome.storage.local.getBytesInUse("videos", function(bytes){
        bytesUsed = bytes;
    
        console.log("BYTES USED: " + bytesUsed);
        if(bytesUsed == 0 || bytesUsed == undefined){
            console.log("BYTES USED ZERO OR undefined");
            chrome.storage.local.set(nvarray,()=>{return;});  
        }
        else{
            console.log("Storage not empty");
        }
    });
}

function waitYtNav(){

    return new Promise(function(resolve){
        var ytNavInterval = setInterval(()=>{
            console.log("ytnav waiting");
            if(ytNavLoop == true){
                console.log("ytnav waiting");
                resolve();
                clearInterval(ytNavInterval);
            }
        },1000)
    })
}
function loopPromise(){
    return new Promise(function(resolve){
        console.log("RUNNING DIRECT LOOP");
        mainVideoProcess()
            .then(()=>
            {
                console.log("FINISHED MAIN VIDEO PROCESS");
                setTimeout(()=>{
                    if(initialLinkIsVideo){
                        console.log("RUNNING AGAIN");
                        loopPromise().then(()=>{resolve()});
                    }
                    else{
                        console.log("initialLinkIsVideo VALUE CHANGED. RESOLVING");
                        resolve();
                    }
                },1000)
            })


    })
}

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
        chrome.storage.local.get("videos", async function(data){
            currentVideos = data;
            currentVideos.videos.push(newVideo);
            chrome.storage.local.set(currentVideos,()=>{resolve();});
        });
        
    })
    
}

function setTime(video){
    return new Promise(function(resolve){
        var currentVideos = [];
        chrome.storage.local.get("videos", function(data){
            currentVideos = data;
            for(var i=0;i<currentVideos.videos.length;i++){
                if(currentVideos.videos[i].videolink == video.videolink){
                    
                    currentVideos.videos[i] = video;
                    /* currentVideos.splice(i,1);
                    currentVideos.push(video);    */         
                    chrome.storage.local.set(currentVideos,()=>{return;});
                    break;
                }
            }
        });
        resolve();
    })

}

async function mainVideoProcess(){
    return new Promise(async function(resolve){
        var currentURL = window.location.href;
        if(checkWatchable(window.location.href)){
            let grabTitlePromise = grabTitle();
            //if(checkWatchable(window.location.href)){
            grabTitlePromise.then(function(videoTitle){
                if(checkWatchable(window.location.href)){
                    var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
                    var vTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                    console.log("Video Title: " + vTitle);
                    console.log("Channel Name: " + channelName);


                    console.log("Current URL: " + currentURL);
                    //console.log("Video Duration: " + video.duration); 
                    /* let cslPromise = checkStoredLinks(window.location.href);
                    cslPromise.then(
                        (vid)=>{
                            if(vid.time>0){
                                document.querySelector("video").currentTime = vid.time;
                            }
                            console.log("returning from cslPromise")

                            //return;
                        },
                        async ()=>{
                            var duration;
                            var currentTime;
                            if(Number.isNaN(video.duration) || video.duration <0){duration = 0}
                            else{duration = video.duration};

                            if(Number.isNaN(video.currentTime) || video.currentTime < 0){currentTime = 0}
                            else{currentTime = video.currentTime};

                            var newVid = {videolink: window.location.href, time: currentTime, duration: duration,
                                title: $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent,
                                channel: $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent};
                            addNewVideo(newVid).then(()=>{ return;})
                        }
                    ) *///.then(()=>{console.log("returning grabTitlePromise"); return;}) 
                    
                }
                //return;
                return;
            },()=>{console.log("grabtitlepromise reject")})
            .then(()=>{
                return checkStoredLinks(window.location.href);
            })
            .then(
                (vid)=>{
                    if(vid.time>0){
                        document.querySelector("video").currentTime = vid.time;
                    }
                    console.log("returning from cslPromise")

                    //return;
                },
                async ()=>{
                    var duration;
                    var currentTime;
                    var video = document.querySelector("video");
                    if(Number.isNaN(video.duration) || video.duration <0){duration = 0}
                    else{duration = video.duration};

                    if(Number.isNaN(video.currentTime) || video.currentTime < 0){currentTime = 0}
                    else{currentTime = video.currentTime};

                    var newVid = {videolink: window.location.href, time: currentTime, duration: duration,
                        title: $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent,
                        channel: $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent};
                    addNewVideo(newVid).then(()=>{ return;})
                }
            )
            
            .then(async ()=>{
                //var videolink = checkWatchable(window.location.href);
                //if(videolink) {
                    //var video = document.querySelector("video");
                    console.log("starting from videolink");
                    //var ct = document.querySelector("video").currentTime;
                    //var videoDuration = video.duration;
                    var timeCheck = true;
                    var lastTitle;
                    try{
                        lastTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                    }catch(err){console.log("caught last title err")}
                    document.querySelector("video").ontimeupdate = async function(){        
                        currentURL = window.location.href;
                        var videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                        var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
                        if(!Number.isNaN(document.querySelector("video").duration) && document.querySelector("video").duration!=0 
                            && !(document.querySelector("video").currentTime<0) && channelName!=null && videoTitle!=null
                            && (initialLinkIsVideo || ytNavLoop) 
                            ){
                            ct = document.querySelector("video").currentTime;
                            if($("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent!=lastTitle){
                                lastTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                                timeCheck=false;
                                //if(checkWatchable(window.location.href)){
                                    
                                    if(initialLinkIsVideo && !ytNavLoop){
                                        console.log("TITLE CHANGE DURING INITIAL LINK LOOP. RESOLVING.");
                                        resolve();
                                    }
                                    else if(!initialLinkIsVideo && !ytNavLoop){
                                        console.log("TITLE CHANGE DURING TRADEOFF.RESOLVING.");
                                        resolve();
                                    }
                                    /* checkStoredLinks(window.location.href).then(
                                        (vid)=>{
                                            if(vid.time>0){
                                                document.querySelector("video").currentTime = vid.time;
                                            }
                                            timeCheck=true;
                                        },
                                        ()=>{
                                            console.log("vid not found in db. adding vid");
                                            var duration;
                                            var currentTime;
                                            if(Number.isNaN(document.querySelector("video").duration)
                                            || document.querySelector("video").duration <0) {duration = 0}
                                            else{duration = document.querySelector("video").duration};
                                            if(Number.isNaN(document.querySelector("video").currentTime)
                                            || document.querySelector("video").currentTime < 0) {currentTime = 0}
                                            else{currentTime = document.querySelector("video").currentTime};
                                            addNewVideo({videolink: window.location.href, time: currentTime,
                                                duration: duration,
                                                title: $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent,
                                                channel: $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent})
                                            .then(()=>{
                                                timeCheck=true;
                                                return;
                                            })
                                            
                                        }
                                    ) */
                                //}
                                //else{
                                //   console.log("TITLE CHANGE. NOT WATCHABLE");
                                //}
                            }
                            else if(!initialLinkIsVideo && !ytNavLoop){
                                resolve();
                            }
                            else if(timeCheck){
                                console.log("TC - " + document.querySelector("video").currentTime + "/" + document.querySelector("video").duration +", " +  $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent);
                                /* port.postMessage({videolink: window.location.href, time: ct, duration: video.duration,
                                title: $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent,
                                channel: $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent},()=>{
                                console.log("SENT: " + currentURL +" , " + ct);
                                }) */
                                setTime({videolink: window.location.href, time: document.querySelector("video").currentTime,
                                    duration: document.querySelector("video").duration,
                                    title: $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent,
                                    channel: $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent})
                                .then(()=>{return});
                            }
                        }
                        else if(!initialLinkIsVideo && !ytNavLoop){
                            resolve();
                        }
                        
                    };

                //}
            })
        //}
        }
    });
}