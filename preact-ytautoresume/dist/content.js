//content.js
var LocalDate = require("@js-joda/core").LocalDate;
const DEBUG = true;
//const $ = document.querySelector
var initialLinkIsVideo; //Sets whether or not the user's entry point is a video link (not the youtube homepage, etc.)
var directLoopDone; //Handles hand-off from direct link process and yt-nav process
var ytNavLoop;     //Set to true when the main process runs as a result of a yt-navigation event
var userSettings;  //Holds the user's settings
var blacklist = false; //Holds the current video's blacklist status.
var grabTitleComplete = false;  

window.addEventListener('load', async function () {
    //Initialize storage -> Grab user settings -> Begin main process
    initStorage()
    .then(()=>getUserSettings())
    .then((usettings)=>{userSettings = usettings})
    .then(()=>{
        DEBUG && console.log("CHECK PAUSED SETTING: " + userSettings.pauseResume);
        DEBUG && console.log("CHECK MIN WATCH TIME SETTING: " + userSettings.minWatchTime);
        DEBUG && console.log("CHECK MIN VID LENGTH SETTING: " + userSettings.minVideoLength);
        //If the user has paused all resuming, no need to continue.
        if(!userSettings.pauseResume){
            DEBUG && console.log("document ready, starting");
            //To begin initialize ytNavLoop to false.
            ytNavLoop = false;
            if(checkWatchable(window.location.href)){
                //if this link is watchable, that means we can go directly to the main process.
                initialLinkIsVideo = true;
                //If it's watchable, we can add the button to the video player now.
                injectPlayerButton()
                //.then(()=>{startPlayerButtonListener()});
            }
            else{initialLinkIsVideo = false};
            //This listens to events fired by YouTube when a user navigates within the website.
            document.addEventListener('yt-navigate-finish',async ()=>{
                grabTitleComplete = false;
                DEBUG && console.log("yt-navigate-finish EVENT DETECTED.")
                //If at this point initialLinkIsVideo is true, that means a user entered the website
                //through a direct link, and then went to another video from within. 
                if(initialLinkIsVideo){
                    DEBUG && console.log("SETTING initialLinkIsVideo FALSE AND STARTING mainVideoProcess()");
                    initialLinkIsVideo = false;
                    //The main video process loops using onTimeUpdate. We have to wait for it to hit 
                    //a statement that checks ytNavLoop and initialLinkIsVideo in order for it to resolve. 
                    waitYtNav().then(()=>{
                        DEBUG && console.log("ytnav set. startin mvp process in event listener loop");
                        //The button state was set to according to the previous video, we have to reset it here.
                        resetButton()/* .then(()=>{
                            startPlayerButtonListener();
                        }) */;
                    })
                    .then(async ()=>{
                        //Now we can start the mainVideoProcess.
                        mainVideoProcess().then(()=>{
                            return;
                        })
                    })
                }
                else{
                    DEBUG && console.log("initialLinkIsVideo never triggered. starting mvp");
                    //In this case, the user navigated to youtube through an unwatchable link, like the homepage,
                    //or through another video. This means the initial loop is never triggered.
                    //As a result, we go straight to the ytNavLoop after resetting the button.
                    resetButton().then(()=>{
                        //this.document.querySelector("#YTAutoResumePlayerSwitch").unbind("click");
                        //startPlayerButtonListener();
                    });
                    //We set ytNavLoop true here to indicate the state.
                    ytNavLoop = true;
                    mainVideoProcess().then(()=>{
                        return;
                    })
                }
            })
            //If initialLinkIsVideo==true and ytNavLoop is false, that means we went straight to a video link.
            if(initialLinkIsVideo &&  !ytNavLoop){
                DEBUG && console.log("RUNNING DIRECT LOOP");
                mainVideoProcess().then(()=>
                {
                    //If the main video process is resolving, that means that it's handing 
                    //off to ytNavLoop.
                    DEBUG && console.log("initial link loop complete. setting ytnav true");
                    ytNavLoop = true;
                    return;
                });
            }
        }
        else{
            DEBUG && console.log("paused");
        }
    });
}
);
function injectPlayerButton(){
    return new Promise((resolve)=>{
        DEBUG && console.log("checking blacklist for: " + window.location.href);
        //Check if video is blacklisted so that the initial state of the button is set properly.
        checkBlacklist(window.location.href).then((blacklisted)=>{
            var imgSrc;
            var tooltip;
            if(blacklisted){
                imgSrc = chrome.runtime.getURL("icons/playericon_inactive.svg");
                tooltip = "Video will not auto-resume";
            }
            else{
                imgSrc = chrome.runtime.getURL("icons/playericon.svg");
                tooltip = "Video will auto-resume";
            }
            DEBUG && console.log("starting image src:" + imgSrc);

            var button = document.createElement("div");
            button.classList.add("ytp-button");
            button.classList.add("YTAutoResume");
            button.onclick = onPlayerButtonClick;
            button.name = "YTAutoResumeSwitch";
            button.id = "YTAutoResumePlayerSwitch";
            button.title = tooltip;
            button.ariaLabel = tooltip;
            button.style.verticalAlign = "top";
            var img_element = document.createElement("img");
            img_element.id = "YTAutoResumeSwitchIcon";
            img_element.src = imgSrc;
            img_element.style.height = "90%";
            img_element.style.display = "block";
            img_element.style.margin = "auto";
            button.appendChild(img_element);
            //$(button).prop("checked",!blacklisted);
            button.checked = !blacklisted;
            if (document.querySelector("div.ytp-right-controls") !== null) {
                document.querySelector("div.ytp-right-controls").prepend(button);
            }
            resolve();
        })
    })
    
}
function onPlayerButtonClick() {
    let grabTitlePromise = new Promise((resolve)=>{
        if(!grabTitleComplete){
            grabTitle().then(()=>{
                resolve();
            })
        } else{resolve();}  
    })

    grabTitlePromise.then(()=>{
        DEBUG && console.log("button.prop: " + document.querySelector("#YTAutoResumePlayerSwitch").checked);
        var video = document.querySelector("video");
        var markPlayed = false;
            var timeRemaining = video.duration - video.currentTime;
            if(timeRemaining < userSettings.markPlayedTime){
                markPlayed=true;
                DEBUG && console.log("marking played");
            }
            else{
                markPlayed=false;
            }
        if (document.querySelector("#YTAutoResumePlayerSwitch").checked == true) {
            DEBUG && console.log("PLAYER BUTTON CLICK TRUE");
            blacklist = true;
            document.querySelector("#YTAutoResumePlayerSwitch").checked = false;

            document.querySelector("#YTAutoResumeSwitchIcon").setAttribute("src", chrome.runtime.getURL("icons/playericon_inactive.svg"));

            document.querySelector("#YTAutoResumePlayerSwitch").setAttribute("title","Video will not auto-resume");
            setTime({
                videolink: window.location.href, time: document.querySelector("video").currentTime,
                duration: document.querySelector("video").duration,
                title: document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent,
                channel: document.querySelector("ytd-video-owner-renderer.style-scope.ytd-video-secondary-info-renderer yt-formatted-string#text.style-scope.ytd-channel-name").textContent,
                complete:markPlayed, doNotResume:true})
                .then(()=>{
                    DEBUG && console.log("Video blacklisted successfully");
                });
        }
        else {
            DEBUG && console.log("PLAYER BUTTON CLICK FALSE");
            blacklist = false;

            document.querySelector("#YTAutoResumePlayerSwitch").checked = true;

            document.querySelector("#YTAutoResumeSwitchIcon").setAttribute("src",chrome.runtime.getURL("icons/playericon.svg"));

            document.querySelector("#YTAutoResumePlayerSwitch").setAttribute("title","Video will auto-resume");
            setTime({videolink: window.location.href, time: document.querySelector("video").currentTime,
                duration: document.querySelector("video").duration,
                title: document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent,
                channel: document.querySelector("ytd-video-owner-renderer.style-scope.ytd-video-secondary-info-renderer yt-formatted-string#text.style-scope.ytd-channel-name").textContent,
                complete:markPlayed, doNotResume:false})
                .then(()=>{
                    DEBUG && console.log("Video removecd from blacklist successfully");
                });
            
        }
    //}
    });
}
//This function resets the button if the element is present, if element doesn't exist on page,
//the button is added.
function resetButton(){
    return new Promise ((resolve) =>{
        if(document.querySelectorAll("#YTAutoResumePlayerSwitch").length>0){
            DEBUG && console.log("resetting button");
            checkBlacklist(window.location.href).then((blacklisted)=>{
                var imgSrc;
                var tooltip;
                if(blacklisted){
                    blacklist=true;
                    imgSrc = chrome.runtime.getURL("icons/playericon_inactive.svg");
                    tooltip = "Video will not auto-resume";
                }
                else{
                    blacklist=false;
                    imgSrc = chrome.runtime.getURL("icons/playericon.svg");
                    tooltip = "Video will auto-resume";
                }
                DEBUG && console.log("starting image src:" + imgSrc);


                document.querySelector("#YTAutoResumePlayerSwitch").setAttribute("title",tooltip)
                document.querySelector("#YTAutoResumePlayerSwitch").setAttribute("aria-label",tooltip);

                document.querySelector("#YTAutoResumePlayerSwitch").checked = !blacklisted;

                document.querySelector("#YTAutoResumeSwitchIcon").setAttribute("src",imgSrc);
                resolve();
            })
        }
        else{
            DEBUG && console.log("button does not exist. injecting button");
            injectPlayerButton().then(()=>{
                resolve();
            })
        }
    })
}
//Grabs user's settings from storage.
function getUserSettings(){
    return new Promise((resolve)=>{
        chrome.storage.local.get("settings",(data)=>{
            resolve(data.settings);
        })
    })
}
function initStorage(){
    return new Promise(function(resolve){
        Promise.all([initDB(),initSettings()]).then((values)=>{
            resolve();
        });
    })
    
}
//This function checks if the video db exists,
//if it doesn't then it stores an empty array.
function initDB(){
    return new Promise((resolve)=>{
        var bytesUsed;
        chrome.storage.local.getBytesInUse("videos", function(bytes){
            bytesUsed = bytes;
        
            DEBUG && console.log("BYTES USED: " + bytesUsed);
            if(bytesUsed == 0 || bytesUsed == undefined){
                DEBUG && console.log("BYTES USED ZERO OR undefined");
                chrome.storage.local.set({videos:[]},()=>{resolve();});  
            }
            else{
                DEBUG && console.log("Storage not empty");
                resolve();
            }
            
        });
    })
   
}
//Same as initDB(), but for settings.
function initSettings(){
    return new Promise((resolve)=>{
        chrome.storage.local.getBytesInUse("settings",(bytes)=>{
            if (bytes == undefined || bytes == 0) {
                DEBUG && console.log("Settings BYTES USED ZERO OR undefined");
                chrome.storage.local.set(
                    {
                        settings: {
                            pauseResume: false,
                            minWatchTime: 60,
                            minVideoLength: 480,
                            markPlayedTime: 60,
                            deleteAfter: 30
                        }
                    }, () => { resolve(); })
            }
            else {
                DEBUG && console.log("Settings storage not empty");
                chrome.storage.local.get("settings", (data) => {
                    DEBUG && console.log(data.settings);
                    let current_settings = data.settings;
                    if (!current_settings.hasOwnProperty('deleteAfter')) {
                        DEBUG && console.log("here");

                        chrome.storage.local.set(
                            {
                                settings: {
                                    pauseResume: current_settings.pauseResume,
                                    minVideoLength: current_settings.minVideoLength,
                                    minWatchTime: current_settings.minWatchtime,
                                    markPlayedTime: current_settings.markPlayedTime,
                                    deleteAfter: 30
                                }
                            }, () => { resolve(); })
                    }
                });
                resolve();
            }
            
        })
    })
    
}
//The same video can have multiple types of links, but always has the same watchID
//This function extracts just the watchID from the link.
function extractWatchID(link){
    var start = 0;
    var end = 0;
    let result = ""
    for(var i=0;i<link.length;i++){
        if(link[i]== 'v' && link[i+1] == '='){
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
    result = link.slice(start,end);
    DEBUG && console.log("start: " + start + ", end: " + end); 
    DEBUG && console.log("extractWatchID: " + result);
    return result;
}
//Promise that tries to get the channel name and title from the site. If they aren't loaded yet,
//it tries again every 2 seconds, and then returns.
function grabTitle(){
    var videoTitle;
    var cN;
    return new Promise(function(resolve,reject){
        if(!checkWatchable(window.location.href)){
            DEBUG && console.log("rejecting grabTitle. link not watchable");
            reject();
        };
        videoTitle = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer");
        if(videoTitle==null || videoTitle==undefined || videoTitle.textContent==""){
            DEBUG && console.log("VIDEO TITLE OR CHANNEL NAME IS NULL. TRYING AGAIN IN ONE SECOND.");
            var interval = setInterval(()=>{
                videoTitle = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer");
                cN = document.querySelector("ytd-video-owner-renderer.style-scope.ytd-video-secondary-info-renderer yt-formatted-string#text.style-scope.ytd-channel-name");
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
//Check's if a link is watchable and NOT a timestamped link.
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
//Wait's for the ytNav loop to complete.
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
//Checks if a video exists in the DB with the same link as the one provided.
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
//Adds a new video to the database. 
function addNewVideo(video){
    return new Promise(function (resolve) {
        //Fix for a weird glitch where the process triggers on a link
        //that isn't a video link
        if (extractWatchID(video.videolink).length==0) {
            resolve();
        }
        else {
            DEBUG && console.log("ADDING LINK: " + video.videolink);
            var currentVideos = [];
            var newVideo = {videolink:video.videolink, time:-1,
                duration: video.duration, title:video.title, channel:video.channel, timestamp: LocalDate.now().toString()}
            chrome.storage.local.get("videos", async function(data){
                currentVideos = data;
                currentVideos.videos.push(newVideo);
                chrome.storage.local.set(currentVideos,()=>{resolve();});
            });
        }
        
    })
    
}
//Attempts to set the time on a video, if the video doesn't exist then it is added.
function setTime(video){
    return new Promise(function(resolve){
        var currentVideos = [];
        var videoFound = false;
        chrome.storage.local.get("videos", (data)=>{
            currentVideos = data;
            for(var i=0;i<currentVideos.videos.length;i++){
                if(extractWatchID(currentVideos.videos[i].videolink) == extractWatchID(video.videolink)){
                    currentVideos.videos.splice(i,1);
                    currentVideos.videos.push(video);          
                    chrome.storage.local.set(currentVideos,()=>{return;});
                    videoFound = true;
                    break;
                }
            }
            if(!videoFound){
                addNewVideo(video);
            }
            resolve();
        });  
    })
}
//Checks if the video meets the user's criteria for minimum duration. 
function checkDuration(){
    const video = document.querySelector("video");
    if(video.duration < userSettings.minVideoLength){
        DEBUG && console.log("Video does not meet user's minVideoLength setting");
        return false;
    }
    else{
        DEBUG && console.log("Video meets user's minVideoLength setting");
        return true;
    }
}
//Checks if the video is set to not resume.
function checkBlacklist(link){
    return new Promise((resolve)=>{
        var vidNotFound = true;
        chrome.storage.local.get("videos",(data)=>{
            for(var i=0;i<data.videos.length;i++){
                if(extractWatchID(link) == extractWatchID(data.videos[i].videolink)){
                    DEBUG && console.log("checkBlackList match found");
                    if(data.videos[i].doNotResume){
                        DEBUG && console.log("VIDEO IS BLACKLISTED");
                        vidNotFound = false;
                        resolve(true);
                    }
                    if (data.videos[i].hasOwnProperty('timestamp')
                        && userSettings.hasOwnProperty('deleteAfter')&&
                        daysSince(LocalDate.parse(data.videos[i].timestamp)) > userSettings.deleteAfter) {
                        resolve(true);
                    }
                }
            }
            if(vidNotFound){
                DEBUG && console.log(link + "VIDEO IS NOT BLACKLISTED");
                resolve(false);
            }
        });
    })
}
//time1-> LocalDate
function daysSince(time1) {
    return JSJoda.ChronoUnit.DAYS.between(time1, time2);
}
//The mainVideoProcess handles keeping track of the current time and storing it in the db.
//It also handles resuming the video if it exists in the database. 
async function mainVideoProcess(){
    grabTitleComplete = false;
    return new Promise(async function(resolve){
        var currentURL = window.location.href;
        if(checkWatchable(window.location.href) && checkDuration()/*  && (checkBlacklist(window.location.href)==false) */){
            let grabTitlePromise = grabTitle();
                if(!initialLinkIsVideo && !ytNavLoop){resolve();}
            grabTitlePromise.then((videoTitle)=>{
                grabTitleComplete = true;
                //Handoff condition
                if(!initialLinkIsVideo && !ytNavLoop){resolve();}
                if(checkWatchable(window.location.href)){
                    var channelName = document.querySelector("ytd-video-owner-renderer.style-scope.ytd-video-secondary-info-renderer yt-formatted-string#text.style-scope.ytd-channel-name").textContent;
                    var vTitle = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent;
                    DEBUG && console.log("Video Title: " + vTitle);
                    DEBUG && console.log("Channel Name: " + channelName);
                    DEBUG && console.log("Current URL: " + currentURL);
                }
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
                    if(vid.time>userSettings.minWatchTime && !vid.complete && !vid.doNotResume){
                        document.querySelector("video").currentTime = vid.time;
                    }
                    else{
                        DEBUG && console.log("Video does not meet user's minWatchTime or video is complete. Not Auto Resuming.");
                    }

                    if(vid.doNotResume){
                        blacklist=true;
                        DEBUG && console.log("Video is blacklisted");
                    }
                    DEBUG && console.log("returning from cslPromise")

                },
                async ()=>{
                    DEBUG && console.log("New video, setting blacklist to false by default");
                    blacklist = false;
                    if(!initialLinkIsVideo && !ytNavLoop){
                            resolve();
                        }
                    return;
                }
            )
            .then(async ()=>{
                if(!initialLinkIsVideo && !ytNavLoop){
                    resolve();
                }
                DEBUG && console.log("starting from videolink");
                var lastTitle;
                try{
                    lastTitle = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent;
                }catch(err){DEBUG && console.log("caught last title err")}
                //ontimeupdate function triggers when the time changes for the video.
                document.querySelector("video").ontimeupdate = async function(){     
                    if(!initialLinkIsVideo && !ytNavLoop){
                        resolve();
                    }   
                    currentURL = window.location.href;
                    DEBUG && console.log("ontimeupdate");
                    var videoTitle = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent;
                    var channelName = document.querySelector("yt-formatted-string#text.style-scope.ytd-channel-name").textContent;
                    if(!Number.isNaN(document.querySelector("video").duration) && document.querySelector("video").duration!=0 
                        && !(document.querySelector("video").currentTime<0) && channelName!=null && videoTitle!=null
                        ){
                        ct = document.querySelector("video").currentTime;
                        if(document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent!=lastTitle){
                            lastTitle = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent;
                                //Detecting a title change means that the loop should reset.
                                if(initialLinkIsVideo && !ytNavLoop){
                                    DEBUG && console.log("TITLE CHANGE DURING INITIAL LINK LOOP. RESOLVING.");
                                    resolve();
                                }
                                else if(!initialLinkIsVideo && !ytNavLoop){
                                    DEBUG && console.log("TITLE CHANGE DURING TRADEOFF. RESOLVING.");
                                    resolve();
                                }
                        }
                        else if(!initialLinkIsVideo && !ytNavLoop){
                            resolve();
                        }
                        //If the video is not blacklisted, then proceeed with storing the video time. 
                        else if(!blacklist){
                            var video = document.querySelector("video");
                            var markPlayed = false;
                            var timeRemaining = video.duration - video.currentTime;
                            if(timeRemaining < userSettings.markPlayedTime){
                                markPlayed=true;
                                DEBUG && console.log("marking played");
                            }
                            else{
                                markPlayed=false;
                            }
                            DEBUG && console.log("TC - " + document.querySelector("video").currentTime + "/" 
                            + document.querySelector("video").duration +", " 
                            + document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent + ", "
                            + document.querySelector("ytd-video-owner-renderer.style-scope.ytd-video-secondary-info-renderer yt-formatted-string#text.style-scope.ytd-channel-name").textContent);
                            let link = window.location.href;
                            if (!checkWatchable(link)) { resolve() }
                            else {
                                setTime({videolink: link, time: document.querySelector("video").currentTime,
                                duration: document.querySelector("video").duration,
                                title: document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent,
                                channel: document.querySelector("ytd-video-owner-renderer.style-scope.ytd-video-secondary-info-renderer yt-formatted-string#text.style-scope.ytd-channel-name").textContent,
                                complete:markPlayed, doNotResume:false})
                                .then(() => { return });
                            }
                        }
                    }
                    else if(!initialLinkIsVideo && !ytNavLoop){
                        resolve();
                    }
                    
                };
            })
        }
        else{
            DEBUG && console.log("NOT WATCHABLE OR DOES NOT MEET USER CRITERIA: RESOLVING");
        }
    });
}