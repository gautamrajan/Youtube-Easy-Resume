
/* let db =  getDB();
db.then((vdb)=>{
    console.log("DB size: " + vdb.length);
    var newVidButton;
    var fragment = document.createDocumentFragment();
    for(i=0;i<vdb.length;i++){
        console.log(i);
        newVidButton = generateListElement(vdb[i]);
        fragment.appendChild(newVidButton); //
        console.log("finished generating and appending one element");
    }
})
 */

/* var elements = document.getElementsByClassName("main-list-element");
for(var i=0;i<elements.length;i++){
    
} */
var maxBarWidth = 226;
var marginRight = 0;
var titleWidth = 216;
//switch maxBarWidth -> 211 if greater than 3 elements
generateList().then(()=>{
    $("button").click(()=>{
        //console.log("button clicked. requesting confirmation");
        var confirm = window.confirm("Are you sure you want to clear the database?");
        if(confirm){
            chrome.storage.local.set({videos:[]},()=>{
            /* chrome.storage.local.remove("videos",()=>{ */
                clearList();
                alert("Video databse cleared");
            });
        }
    })
})




function initSettingsDB(){
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
}

function clearList(){
    var mainElements = $("a.main-list-element");
    for(var i = 0; i<mainElements.length;i++){
        mainElements[i].remove();
    }
}

function generateList(){
    //var db;
    return new Promise(function(resolve){
        chrome.storage.local.get("videos",function(data){
            //db = data.videos;
            //resolve(db);
            if(data.videos.legnth != 0)
            {
                var fragment = document.createDocumentFragment();
                //console.log("video DB length: " + data.videos.length);
                if(data.videos.length >=4){
                    maxBarWidth = 211;
                    marginRight = 7;
                    titleWidth = 205;
                }
                for(var i=(data.videos.length - 1);!(i<0);i--){
                    console.log("generating item for video: " + i);
                    var newVidButton = generateListElement(data.videos[i]);
                    newVidButton.style.marginRight = marginRight + "px";
                    fragment.append(newVidButton);
                    //document.getElementById("main-list").append(videoButton)
                }
                document.getElementById("main-list").append(fragment);
                resolve();
            }
            /* else{
                //create no videos message
            } */
        });
    })
    

}

function secondsToHMS(timeInSeconds){
    /* var seconds = Math.floor(timeInSeconds);
    var temp = seconds;
    seconds = seconds % 60;
    var minutes = (temp - seconds)/60;
    if(seconds == 60){
        seconds = 0;
        minutes = minutes + 1;
    }
    temp = minutes;
    minutes = minutes % 60;
    var hours = temp/60;
    if(minutes == 60){
        minutes = 0;
        hours = hours +1;
    } */
    var inputSeconds = Math.floor(timeInSeconds);
    var hours = Math.floor(inputSeconds / 3600);
    var minutes = Math.floor(inputSeconds / 60) % 60;
    var seconds = inputSeconds % 60;
    if(hours == 0){
        minutes = minutes.toString();
        if(seconds <10){seconds = "0" + seconds.toString();}
        else{seconds = seconds.toString();};
        return minutes + ":" + seconds;
    }
    else{
        hours = hours.toString();
        if(minutes <10){minutes = "0" + minutes.toString();}
        else{minutes = minutes.toString();};

        if(seconds <10){seconds = "0" + seconds.toString();}
        else{seconds = seconds.toString();};
        return hours + ":" + minutes + ":" + seconds;
    }

}

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
    console.log("start: " + start + ", end: " + end); 
    console.log("extractWatchID:  " + result);
    return result;
}
function generateListElement(video){
    var videoButton = document.createElement("a");
    videoButton.classList.add('main-list-element');
    videoButton.setAttribute("href",video.videolink);
    videoButton.setAttribute("target","_blank");
    videoButton.setAttribute("title",video.title);
    var thumbnail = document.createElement('img');
    var imageLink;
    imageLink = "https://img.youtube.com/vi/" + extractWatchID(video.videolink) + "/default.jpg" ;
    //console.log(imageLink);
    thumbnail.setAttribute("src",imageLink);
    thumbnail.setAttribute("width",120);
    thumbnail.setAttribute("height",90);
    videoButton.append(thumbnail);
    /*  <a class='main-list-element>
            <image> </image>    
            <info>
                <videoTitle>KAKAROT!!!!</videoTitle>
                <subtext>You stupid  monkey!</subtext>
                <timeInfo>
                    <currentTime>0:39</currentTime>
                    <duration>15:01</duration>
                </timeInfo>
                <bar></bar>
            </info> 
        </main-list-element>*/
    var elementBody = document.createElement("div");
    elementBody.classList.add('element-body');

        var info = document.createElement("info");
            var videoTitle = document.createElement("videoTitle");
            videoTitle.textContent = video.title;
            videoTitle.style.width = titleWidth + "px"; 
            info.append(videoTitle);

            var subtext = document.createElement("subtext");
            subtext.textContent = video.channel;
            info.append(subtext);

            var timeInfo = document.createElement("timeInfo");

                var currentTime = document.createElement("currentTime");
                if(video.time<0){currentTime.textContent = secondsToHMS(0);}
                else{currentTime.textContent = secondsToHMS(video.time);}
                

                //need to account for video over an hour long 
                var duration = document.createElement("duration");
                duration.textContent = secondsToHMS(video.duration);
                
                timeInfo.append(currentTime);
                timeInfo.append(duration);
            info.append(timeInfo);

            var bar = document.createElement("bar");
            var barPx = ((video.time)/(video.duration))*maxBarWidth;
            barPx = Math.round(barPx);
            barPx = "width: " + barPx.toString() + "px"; 
            //bar.style.width =  barPx.toString() + "px";
            bar.setAttribute("style", barPx);
            //info.append(bar);
        elementBody.append(info);
        elementBody.append(bar);
    videoButton.append(elementBody);
    //videoButton.append(info);
    return videoButton;
}


/*  <a class='main-list-element>
            <element-body>
                <image> </image>    
                <info>
                    <videoTitle>KAKAROT!!!!</videoTitle>
                    <subtext>You stupid  monkey!</subtext>
                    <timeInfo>
                        <currentTime>0:39</currentTime>
                        <duration>15:01</duration>
                    </timeInfo>
                </info>
                <bar></bar> 
            </element-body>
        </main-list-element>*/