
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
generateList();
/* var elements = document.getElementsByClassName("main-list-element");
for(var i=0;i<elements.length;i++){
    
} */


function generateList(){
    //var db;
    //return new Promise(function(resolve){
        chrome.storage.local.get("videos",function(data){
            //db = data.videos;
            //resolve(db);
            if(data.videos.legnth != 0)
            {
                var fragment = document.createDocumentFragment();
                //console.log("video DB length: " + data.videos.length);
                for(var i=(data.videos.length - 1);!(i<0);i--){
                    console.log("generating item for video: " + i);
                    var newVidButton = generateListElement(data.videos[i]);
                    fragment.append(newVidButton);
                    //document.getElementById("main-list").append(videoButton)
                }
                document.getElementById("main-list").append(fragment);
            }
            /* else{
                //create no videos message
            } */
        });
    //})
    

}

function generateListElement(video){
    var videoButton = document.createElement("a");
    videoButton.classList.add('main-list-element');
    videoButton.setAttribute("href",video.videolink);
    videoButton.setAttribute("target","_blank");
    videoButton.setAttribute("title",video.title);
    var thumbnail = document.createElement('img');
    var imageLink;
    var start;
    var end;
    for(var i=0;i<video.videolink.length;i++){
        if(video.videolink[i]=='v' && video.videolink[i+1] == '='){
            start = i+2;
        }
        else if(video.videolink[i] =='&'){
            end = i-1;
        }
        else if(i==video.videolink.length-1){
            end=i;
        }
    }
    imageLink = "https://img.youtube.com/vi/" + video.videolink.substr(start,end) + "/default.jpg" ;
    console.log(imageLink);
    thumbnail.setAttribute("src",imageLink);
    thumbnail.setAttribute("width",120);
    thumbnail.setAttribute("height",90);
    videoButton.append(thumbnail);
    /* <info>
                    <videoTitle>KAKAROT!!!!</videoTitle>
                    <subtext>You stupid  monkey!</subtext>
                    <timeInfo>
                        <currentTime>0:39</currentTime>
                        <duration>15:01</duration>
                    </timeInfo>
                    <bar></bar>
                </info> */
    var info = document.createElement("info");

        var videoTitle = document.createElement("videoTitle");
        videoTitle.textContent = video.title;
        info.append(videoTitle);

        var subtext = document.createElement("subtext");
        subtext.textContent = video.channel;
        info.append(subtext);

        var timeInfo = document.createElement("timeInfo");

            var currentTime = document.createElement("currentTime");
            var cMinutes = Math.round(video.time);
            var cSeconds = cMinutes%60;
            cMinutes = cMinutes-cSeconds;
            cMinutes = cMinutes/60;
            cMinutes = cMinutes.toString();
            if(cSeconds <10){cSeconds = "0" + cSeconds.toString();}
            else{cSeconds = cSeconds.toString();};
            cSeconds = cSeconds.toString();
            currentTime.textContent = "Resume at " + cMinutes + ":" + cSeconds;

            //need to account for video over an hour long 
            var duration = document.createElement("duration");
            var dMinutes = Math.round(video.duration);
            var dSeconds = dMinutes%60;
            dMinutes = dMinutes-dSeconds;
            dMinutes = dMinutes/60;
            dMinutes = dMinutes.toString();
            if(dSeconds <10){dSeconds = "0" + dSeconds.toString();}
            else{dSeconds = dSeconds.toString();};
            duration.textContent = dMinutes + ":" + dSeconds;
            timeInfo.append(currentTime);
            timeInfo.append(duration);
        info.append(timeInfo);

        var bar = document.createElement("bar");
        var barPx = ((video.time)/(video.duration))*226;
        barPx = Math.round(barPx);
        barPx = "width: " + barPx.toString() + "px"; 
        //bar.style.width =  barPx.toString() + "px";
        bar.setAttribute("style", barPx);
        info.append(bar);

    videoButton.append(info);
    return videoButton;
    //document.getElementById("main-list").append(videoButton);
}