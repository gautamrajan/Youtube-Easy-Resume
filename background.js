//background.js
console.log("BACKGROUND IS LOADED");
initStorage();
chrome.runtime.onConnect.addListener(function(port){
    port.onMessage.addListener(function(message,sender,sendResponse){
        if(message.time == -1){
            var storedLinkIndex = checkStoredLinks(message.videolink);
            if(storedLinkIndex != -1){
                sendResponse({'videolink':message.videolink, 'time':getStoredLinkTime(storedLinkIndex)})
            }
            else{
                addNewVideo(link);
            }
        }
        else{
            setTime(message.link, message.time);
            sendResponse({'videolink':message.link, 'time':message.time});
        }        
    });
  });

function initStorage(){
    var bytesUsed;
    chrome.storage.local.getBytesInUse(['videos'], function(bytes){
        bytesUsed = bytes;
    });
    if(bytesUsed == 0){
        chrome.storage.local.set({'videos': []});    
    }
}

function checkStoredLinks(link){
    chrome.storage.local.get('videos',function(data){
        if(data.legnth != 0);
        {
            for(i=0;i<data.length;i++){
                if(data[i].videolink == link){
                    return i;
                }
                return -1;
            }
        }
        return -1;
    })
}
function getStoredLinkTime(index){
    chrome.storage.local.get('videos',function(data){
        return data[index].time;
    })
}
function addNewVideo(link){
    var currentVideos;
    chrome.storage.local.get('videos', function(data){
        currentVideos = data.videos;
        var newVideo = {
            'videolink': link,
            'time': -1
        }
        currentVideos.push(newVideo);
    });
    chrome.storage.local.set({'videos': currentVideos});
}

function setTime(link, time){
    var currentVideos;
    chrome.storage.local.get('videos', function(data){
        currentVideos = data.videos;
    });
    for(i=0;i<currentVideos.length;i++){
        if(currentVideos[i].videolink == link){
            currentVideos[i].time = time;            
            chrome.storage.local.set({'videos': currentVideos});
        }
    }
}