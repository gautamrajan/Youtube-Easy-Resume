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

const DEBUG = true;
var nvarray = {videos:[]};
var initialLinkIsVideo;
var directLoopDone;
var ytNavLoop;
var previousURL;
var previousTitle;
var previousChannel;
$(document).ready(async function(){
    DEBUG && console.log("document ready, starting");
    ytNavLoop = false;
    if(checkWatchable(window.location.href)){initialLinkIsVideo = true}
    else{initialLinkIsVideo = false};

    initStorage().then(async()=>{
    document.addEventListener('yt-navigate-finish',async ()=>{
        DEBUG && console.log("yt-navigate-finish EVENT DETECTED.")
        if(initialLinkIsVideo){
            DEBUG && console.log("SETTING initialLinkIsVideo FALSE AND STARTING mainVideoProcess()");
            initialLinkIsVideo = false;
            waitYtNav().then(()=>{
                DEBUG && console.log("ytnav set. startin mvp process in event listener loop");
            })
            .then(async ()=>{
                mainVideoProcess().then(()=>{
                    return;
                })
            })
        }
        else{
            DEBUG && console.log("initialLinkIsVideo never triggered. starting mvp");
            ytNavLoop = true;
            mainVideoProcess().then(()=>{
                return;
            })
        }
    })

        if(initialLinkIsVideo &&  !ytNavLoop){
            DEBUG && console.log("RUNNING DIRECT LOOP");
            mainVideoProcess().then(()=>
            {
                DEBUG && console.log("initial link loop complete. setting ytnav true");
                ytNavLoop = true;
                return;
            });
        }
    })
});



function extractWatchID(link){
    var start = 0;
    var end = 0;
    for(var i=0;i<link.length;i++){
        if(link[i]=='v' && link[i+1] == '='){
            start = i+2;
        }
        else if(link[i] =='&'){
            end = i;
            break;
        }
        else if(i==link.length-1){
            end=i+1;
        }
    }
    var result = link.slice(start,end);
    return result;
}
function grabTitle(){
    var videoTitle;
    var cN;
    return new Promise(function(resolve,reject){
        if(!checkWatchable(window.location.href)){
            DEBUG && console.log("rejecting grabTitle. link not watchable");
            reject();
        };
        videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0];
        if(videoTitle==null || videoTitle==undefined || videoTitle.textContent==""){
            DEBUG && console.log("VIDEO TITLE OR CHANNEL NAME IS NULL. TRYING AGAIN IN ONE SECOND.");
            var interval = setInterval(()=>{
                videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0];
                cN = $("ytd-video-owner-renderer.style-scope.ytd-video-secondary-info-renderer yt-formatted-string#text.style-scope.ytd-channel-name")[0]
                if(!(videoTitle==null || videoTitle==undefined)){
                    resolve(videoTitle);
                    clearInterval(interval);
                }
            },2000)
        }
        else{
            DEBUG && console.log("resolving, videotitle -" + videoTitle.textContent);
            resolve(videoTitle);
        }
    });
}
function checkWatchable(link){
    if(window.location.href.indexOf("watch?") > -1 && window.location.href.indexOf("?t=")>-1){
        DEBUG && console.log("IGNORING TIMESTAMPED LINK");
        return false;
    }
    
    else if (window.location.href.indexOf("watch?") > -1) {
        return true;
    }
    else{
        DEBUG && console.log("NOT A WATCHABLE LINK");
        return false;
    }
}
function initStorage(){
    return new Promise(function(resolve){
        var bytesUsed;
        chrome.storage.local.getBytesInUse("videos", function(bytes){
            bytesUsed = bytes;
        
            DEBUG && console.log("BYTES USED: " + bytesUsed);
            if(bytesUsed == 0 || bytesUsed == undefined){
                DEBUG && console.log("BYTES USED ZERO OR undefined");
                chrome.storage.local.set(nvarray,()=>{return;});  
            }
            else{
                DEBUG && console.log("Storage not empty");
            }
            resolve();
        });
        chrome.storage.local.getBytesInUse("settings",(bytes)=>{
            if(bytes == undefined || bytes == 0){
                chrome.storage.local.set(
                {
                    settings:{
                        pauseResume:false,
                    }
                })
            }
        })

    })
    
}
function waitYtNav(){

    return new Promise(function(resolve){
        var ytNavInterval = setInterval(()=>{
            DEBUG && console.log("ytnav waiting");
            if(ytNavLoop == true){
                DEBUG && console.log("ytnav waiting");
                resolve();
                clearInterval(ytNavInterval);
            }
        },1000)
    })
}

function checkStoredLinks(link){
    var result = -1;
    var resultFound = false;
    return new Promise(function(resolve,reject){
        chrome.storage.local.get("videos",function(data){
            DEBUG && console.log("videos.length at checkStoredLinks: "+ data.videos.length);
            if(data.videos.legnth != 0)
            {
                for(var i=0;i<data.videos.length;i++){
                    if(extractWatchID(data.videos[i].videolink) == extractWatchID(link)){
                        DEBUG && console.log("link == videolink; INDEX: " + i);
                        DEBUG && console.log("MATCH FOUND: " + data.videos[i].title + ", " + data.videos[i].channel);
                        result = i;
                        resultFound=true;
                        DEBUG && console.log("resolving checkStoredLinks");
                        resolve(data.videos[i]);
                        break;
                    }
                }
            }
            if(!resultFound){
                DEBUG && console.log("rejecting checkStoredLinks");
                reject(-1);
            };
        });
    });
}
function addNewVideo(video){
    return new Promise(function(resolve){
        DEBUG && console.log("ADDING LINK: " + video.videolink);
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
                if(extractWatchID(currentVideos.videos[i].videolink) == extractWatchID(video.videolink)){
                    currentVideos.videos.splice(i,1);
                    currentVideos.videos.push(video);          
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
                if(!initialLinkIsVideo && !ytNavLoop){resolve();}
            grabTitlePromise.then(function(videoTitle){
                if(!initialLinkIsVideo && !ytNavLoop){resolve();}
                if(checkWatchable(window.location.href)){
                    var channelName = $("ytd-video-owner-renderer.style-scope.ytd-video-secondary-info-renderer yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
                    var vTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                    DEBUG && console.log("Video Title: " + vTitle);
                    DEBUG && console.log("Channel Name: " + channelName);


                    DEBUG && console.log("Current URL: " + currentURL);
                }
                //return;
                return;
            },()=>{DEBUG && console.log("grabtitlepromise reject")})
            .then(()=>{
                if(!initialLinkIsVideo && !ytNavLoop){
                    resolve();
                }
                return checkStoredLinks(window.location.href);
            })
            .then(
                (vid)=>{
                    if(!initialLinkIsVideo && !ytNavLoop){
                        resolve();
                    }
                    if(vid.time>0){
                        document.querySelector("video").currentTime = vid.time;
                    }
                    DEBUG && console.log("returning from cslPromise")

                },
                async ()=>{
                    if(!initialLinkIsVideo && !ytNavLoop){
                            resolve();
                        }
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
                if(!initialLinkIsVideo && !ytNavLoop){
                    resolve();
                }
                DEBUG && console.log("starting from videolink");
                var timeCheck = true;
                var lastTitle;
                try{
                    lastTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                }catch(err){DEBUG && console.log("caught last title err")}
                document.querySelector("video").ontimeupdate = async function(){     
                    if(!initialLinkIsVideo && !ytNavLoop){
                        resolve();
                    }   
                    currentURL = window.location.href;
                    DEBUG && console.log("ontimeupdate");
                    var videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                    var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
                    if(!Number.isNaN(document.querySelector("video").duration) && document.querySelector("video").duration!=0 
                        && !(document.querySelector("video").currentTime<0) && channelName!=null && videoTitle!=null
                        ){
                        ct = document.querySelector("video").currentTime;
                        if($("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent!=lastTitle){
                            lastTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                                
                                if(initialLinkIsVideo && !ytNavLoop){
                                    DEBUG && console.log("TITLE CHANGE DURING INITIAL LINK LOOP. RESOLVING.");
                                    resolve();
                                }
                                else if(!initialLinkIsVideo && !ytNavLoop){
                                    DEBUG && console.log("TITLE CHANGE DURING TRADEOFF.RESOLVING.");
                                    resolve();
                                }
                        }
                        else if(!initialLinkIsVideo && !ytNavLoop){
                            resolve();
                        }
                        else if(timeCheck){
                            DEBUG && console.log("TC - " + document.querySelector("video").currentTime + "/" 
                            + document.querySelector("video").duration +", " 
                            + $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent + ", "
                            + $("ytd-video-owner-renderer.style-scope.ytd-video-secondary-info-renderer yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent);

                            setTime({videolink: window.location.href, time: document.querySelector("video").currentTime,
                                duration: document.querySelector("video").duration,
                                title: $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent,
                                channel: $("ytd-video-owner-renderer.style-scope.ytd-video-secondary-info-renderer yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent})
                            .then(()=>{return});
                        }
                    }
                    else if(!initialLinkIsVideo && !ytNavLoop){
                        resolve();
                    }
                    
                };
            })
        }
        else{
            DEBUG && console.log("NOT WATCHABLE: RESOLVING");
        }
    });
}