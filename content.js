//content.js

var currentURL = window.location.href;
console.log("Current URL: " + currentURL);

var videolink = false;
if (window.location.href.indexOf("watch?") > -1) {
    videolink = true;
}
else{
    console.log("NOT A WATCHABLE LINK");
}

if(videolink) {
    console.log("starting from videolink");
    var video = document.querySelector("video");
    var ct = video.currentTime;
    var timeCheck = false;
    var port = chrome.runtime.connect({name:"ytar-content"});
    port.postMessage({videolink: currentURL, time: -1},function(){
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
            port.postMessage({videolink: currentURL, time: ct},()=>{
                console.log("SENT: " + currentURL +" , " + ct);
            })
        }
    };



    
   /*  var port = chrome.runtime.connect({name:"ytar-content"});
    port.postMessage({videolink: currentURL, time: -1},function(response){
        console.log("SENT: " + currentURL + " , -1");
        console.log("RECIEVED: " + response.videolink +" , " + response.time);
    });
    video.ontimeupdate = function(){
        ct = video.currentTime;
        port.postMessage({videolink: currentURL, time: ct},function(response){
            console.log("SENT: " + currentURL +" , " + ct);
            console.log("RECIEVED: " + response.videolink + " , " + response.time);
        })
    }; */





  /*   chrome.runtime.sendMessage({videolink:currentURL, time:-1},function(response){
        console.log("CONTENT.JS RECIEVED: " + response.videolink + " , " + response.time);
        if(response.time!=-1){
            //if time is -1 then video need not be resumed
        }
        else{
            video.currentTime = response.time;
        }
    })

    video.ontimeupdate = function (){
        ct = video.currentTime;
        chrome.runtime.sendMessage({videolink: currentURL, time:ct},function(response){
            
        })
    } */

}


