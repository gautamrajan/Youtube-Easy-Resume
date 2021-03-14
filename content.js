//content.js

var currentURL = window.location.href;
console.log("Current URL: " + currentURL);

var videolink = false;
if (window.location.href.indexOf("watch?") > -1) {
    videolink = true;
}

if(videolink) {
    var video = document.querySelector("video");
    var ct = video.currentTime;
    /* video.ontimeupdate = function(){
        ct = video.currentTime;
        console.log("Current time: " + ct);
    }; */
    
    var port = chrome.runtime.connect({name:"ytar-content"});
    port.postMessage({videolink: currentURL, time: -1},function(response){
        console.log("SENT: " + currentURL + " , -1");
        console.log("RECIEVED: " + response.videolink +" , " + response.time);
 /*        if(response.time != -1){
            video.currentTime = response.time;
        } */
    });
    video.ontimeupdate = function(){
        ct = video.currentTime;
        port.postMessage({videolink: currentURL, time: ct},function(response){
            console.log("SENT: " + currentURL +" , " + ct);
            console.log("RECIEVED: " + response.videolink + " , " + response.time);
/*             if(response.time == ct){
                console.log("Successfully logged video " + currentURL + " at " + ct); 
            } */
        })
    };
    /* port.onMessage.addListener(function(message,sender){
        
    }); */
    
}


