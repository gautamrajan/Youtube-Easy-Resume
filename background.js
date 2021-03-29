//background.js
console.log("BACKGROUND IS LOADED");
var nvarray = {videos:[]};
initStorage();
/* 
    video:{
        videolink,
        time,
        duration,
        title,
        channel,

    }
*/


chrome.runtime.onConnect.addListener(async function(port){
/*     var currentURL = null;
    var sentChangeURL = null; */
    port.onMessage.addListener(async function(message){ 
        console.log(message.videolink + ", " + message.title);
        /*  = null;
         = message.videolink; */
/*         chrome.webNavigation.onHistoryStateUpdated.addListener(async function(details){
            var urlString = details.url;
            currentURL = urlString;
            if((sentChangeURL!=null && sentChangeURL != urlString) || sentChangeURL == null){
                sentChangeURL = urlString;
                if(extractWatchID(message.videolink)!=extractWatchID(urlString)){
                    console.log("PAGE NAVIGATION DETECTED!");
                    console.log("MESSAGE URL: " + message.videolink);
                    console.log("UPDATED URL: " + urlString);
                    let vDBPromise = checkStoredLinks(urlString);
                    vDBPromise.then(async function(storedLinkIndex){
                        if(storedLinkIndex != -1){
                            let ltpromise = getStoredLinkVideo(storedLinkIndex);
                            ltpromise.then(function(linkVideo){
                                console.log("sending response");
                                //sentChangeURL = urlString;
                                port.postMessage({videolink:linkVideo.videolink , time: linkVideo.time,
                                    duration: linkVideo.duration,title:linkVideo.title,channel:linkVideo.channel});
                            })
                        }
                        else{
                            //sentChangeURL = urlString;
                            port.postMessage({videolink:urlString, time:-1,
                                duration: 0, title:"", channel:""});
                        }
                        
                    });
                }
            }
        }) */
        //if((currentURL==null)||(currentURL!=null && message.videolink==currentURL)){
            if(message.time == -1){
                let checkStorePromise = checkStoredLinks(message.videolink);
                checkStorePromise.then(function(storedLinkIndex){
                    console.log("STORED LINK INDEX: " + storedLinkIndex);
                    if(storedLinkIndex != -1){
                        let linktimepromise = getStoredLinkVideo(storedLinkIndex);
                        linktimepromise.then(function(linkVideo){
                            console.log("sending response");
                            port.postMessage({videolink:linkVideo.videolink , time: linkVideo.time,
                                duration: linkVideo.duration,title:linkVideo.title,channel:linkVideo.channel});
                        })
                    }
                    else{
                        /* console.log("sending response"); */
                        let addVideoPromise = addNewVideo({videolink:message.videolink, time:-1,
                            duration: message.duration, title:message.title, channel:message.channel});
                        addVideoPromise.then(
                            port.postMessage({videolink:message.videolink, time:-1,
                                duration: message.duration, title:message.title, channel:message.channel})
                        );
                    }
                });

            }
            else{
                console.log("else");
                let promise2 = setTime(message);
                promise2.then(/* console.log("UPDATED VIDEO TIME") */);
            }
        //}
    });
  });

function extractWatchID(link){
    //console.log("extractWatchID " + link);
    var start;
    var end;
    for(var i=0;i<link.length;i++){
        if(link[i]=='v' && link[i+1] == '='){
            start = i+2;
        }
        else if(link[i] =='&'){
            end = i-1;
        }
        else if(i==link.length-1){
            end=i;
        }
    }
    return link.substr(start, end);
}
//printDB();
/* addNewVideo("https://www.youtube.com/watch?v=3dzPcy9VyfQ");
console.log("FINISHED ADDING LINK");
printDB(); */
//addNewVideo("https://www.youtube.com/watch?v=6O2fZxDXjYw");
//printDB();
/* var newVideo = {
    videolink: 'https://www.youtube.com/watch?v=3dzPcy9VyfQ',
    time: -1
}
var newVideo2 = {
    videolink:'https://www.youtube.com/watch?v=6O2fZxDXjYw',
    time: -1
}
var newVideo3 = {
    videolink: 'https://www.youtube.com/watch?v=EpjhWr7zIzA',
    time: -1
} */


// chrome.storage.sync.set(nvarray);

/* var temparr = []; 
chrome.storage.sync.get("videos",function(data){
    temparr = data;
    console.log(temparr);
    temparr.videos.push(newVideo);
    temparr.videos.push(newVideo2);
    temparr.videos.push(newVideo3);
    chrome.storage.sync.set(temparr,()=>{
        console.log("DB AFTER PUSHING 3RD: ");
        chrome.storage.sync.get("videos", (data)=>{console.log(data)});
    });
}) */


/* console.log("ADDING SECOND VIDEO TO DB (2); Current DB: ");


chrome.storage.sync.get("videos",function(data){
    var newVideoDB = data.videos;
    newVideoDB.push(newVideo2);
    chrome.storage.sync.set(data,()=>{
        data.videos = newVideoDB;
    });
})

chrome.storage.sync.get("videos",function(data){
    console.log(data);
}) */


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

function checkStoredLinks(link){
    var result = -1;
    return new Promise(function(resolve){

        chrome.storage.local.get("videos",function(data){
            console.log("videos.length at checkStoredLinks: "+ data.videos.length);
            if(data.videos.legnth != 0)
            {
                for(i=0;i<data.videos.length;i++){
                    if(data.videos[i].videolink == link){
                        console.log("link == videolink; INDEX: " + i);
                        console.log("MATCH FOUND: " + data.videos[i].title + ", " + data.videos[i].channel);
                        //return i;
                        result = i;
                        break;
                    }
                    /* else{
                        console.log("link != videolink");
                    } */
                    //return -1;
                    //resolve(-1);
                }
            }
            //return -1;
            resolve(result);
        });
        //return -1;

   /*      if(done == false){
            console.log("third resolve statement: ");
            resolve(-1);
        } */
    });
}
function getStoredLinkVideo(index){
    return new Promise(function(resolve){
        chrome.storage.local.get("videos",function(data){
            resolve(data.videos[index]);
        })
    })

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

async function setTime(video){
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

function printDB(){
    console.log("CURRENT VIDEO DB: ");
    chrome.storage.local.get("videos", function(data){
        for(i=0;i<data.videos.length;i++){
            console.log(data.videos[i]);
        }
    });    
    
    return;
}