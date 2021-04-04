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
var previousURL;
var previousTitle;
var previousChannel;
$(document).ready(async function(){
    /* chrome.storage.local.clear(()=>{
        console.log("CLEARED STORAGE: ");
    }); */
    console.log("document ready, starting");
    ytNavLoop = false;
    if(checkWatchable(window.location.href)){initialLinkIsVideo = true}
    else{initialLinkIsVideo = false};

    initStorage().then(async()=>{
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
    })
});
function extractWatchID(link){
    //console.log("extractWatchID " + link);
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
    //var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0];
    return new Promise(function(resolve,reject){
        if(!checkWatchable(window.location.href)){
            console.log("rejecting grabTitle. link not watchable");
            reject();
        };
        videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0];
        //channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0];
        if(videoTitle==null || videoTitle==undefined || videoTitle.textContent==""){
            console.log("VIDEO TITLE OR CHANNEL NAME IS NULL. TRYING AGAIN IN ONE SECOND.");
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
            console.log("resolving, videotitle -" + videoTitle.textContent);
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
    return new Promise(function(resolve){
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
            resolve();
        });

    })
    
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

function checkStoredLinks(link){
    var result = -1;
    var resultFound = false;
    return new Promise(function(resolve,reject){
        chrome.storage.local.get("videos",function(data){
            console.log("videos.length at checkStoredLinks: "+ data.videos.length);
            if(data.videos.legnth != 0)
            {
                for(var i=0;i<data.videos.length;i++){
                    if(extractWatchID(data.videos[i].videolink) == extractWatchID(link)){
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
                if(extractWatchID(currentVideos.videos[i].videolink) == extractWatchID(video.videolink)){
                    //currentVideos.videos[i] = video;
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
            //if(checkWatchable(window.location.href)){
                if(!initialLinkIsVideo && !ytNavLoop){resolve();}
            grabTitlePromise.then(function(videoTitle){
                if(!initialLinkIsVideo && !ytNavLoop){resolve();}
                if(checkWatchable(window.location.href)){
                    var channelName = $("ytd-video-owner-renderer.style-scope.ytd-video-secondary-info-renderer yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
                    var vTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                    console.log("Video Title: " + vTitle);
                    console.log("Channel Name: " + channelName);


                    console.log("Current URL: " + currentURL);
                }
                //return;
                return;
            },()=>{console.log("grabtitlepromise reject")})
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
                    console.log("returning from cslPromise")

                    //return;
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
                    console.log("starting from videolink");
                    var timeCheck = true;
                    var lastTitle;
                    try{
                        lastTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                    }catch(err){console.log("caught last title err")}
                    document.querySelector("video").ontimeupdate = async function(){     
                        if(!initialLinkIsVideo && !ytNavLoop){
                            resolve();
                        }   
                        currentURL = window.location.href;
                        console.log("ontimeupdate");
                        var videoTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                        var channelName = $("yt-formatted-string#text.style-scope.ytd-channel-name")[0].textContent;
                        if(!Number.isNaN(document.querySelector("video").duration) && document.querySelector("video").duration!=0 
                            && !(document.querySelector("video").currentTime<0) && channelName!=null && videoTitle!=null
                            /* && (initialLinkIsVideo || ytNavLoop) */ 
                            ){
                            ct = document.querySelector("video").currentTime;
                            if($("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent!=lastTitle){
                                lastTitle = $("h1.title.style-scope.ytd-video-primary-info-renderer")[0].textContent;
                                //timeCheck=false;
                                //if(checkWatchable(window.location.href)){
                                    
                                    if(initialLinkIsVideo && !ytNavLoop){
                                        console.log("TITLE CHANGE DURING INITIAL LINK LOOP. RESOLVING.");
                                        resolve();
                                    }
                                    else if(!initialLinkIsVideo && !ytNavLoop){
                                        console.log("TITLE CHANGE DURING TRADEOFF.RESOLVING.");
                                        resolve();
                                    }
                            }
                            else if(!initialLinkIsVideo && !ytNavLoop){
                                resolve();
                            }
                            else if(timeCheck){
                                console.log("TC - " + document.querySelector("video").currentTime + "/" 
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

                //}
            })
        //}
        }
        else{
            console.log("NOT WATCHABLE: RESOLVING");
        }
    });
}