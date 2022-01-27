import { h } from 'preact';
const DEBUG = true;
export default function ListElement(props) {
    //props -> video, edit, selectedVideos, marginRight, maxBarWidth, eClickHandler
    let video = props.video;
    let opts = {};
    let selectorName = "";
    if (props.edit) {
        if (props.selectedVideos.some(vid => video.videolink === vid.videolink)) {
            console.log("VIDEO SELECTED!");
            selectorName = selectorName + " selected";
        }
        else {
            selectorName = selectorName + " unselected"
        }
    }
    //DEBUG && console.log("THUMBNAIL LINK: " + `https://img.youtube.com/vi/${extractWatchID(video.videolink)}/default.jpg`);
    if (!props.edit) { opts["href"] = video.videolink;}
    return (
        <div className={`list-element-container`} onClick={()=>props.eClickHandler(video)}>
            <a className={`main-list-element${selectorName}`} {...opts} target="_blank" title={video.title}
                style={`margin-right: ${props.marginRight}px;`}>
            <img src={`https://img.youtube.com/vi/${extractWatchID(video.videolink)}/default.jpg`} width="120" height="90"/>
            <div className={`element-body`}>
                <info>
                    <videoTitle width={`${props.titleWidth}px`}>
                        {video.title}
                    </videoTitle>
                    <subtext>
                        {video.channel}
                    </subtext>
                </info>
                <div className="time-display">
                    <timeInfo>
                        {video.time<0 ? <currentTime>0:00</currentTime>:<currentTime>{secondsToHMS(video.time)}</currentTime>}
                        <duration>{secondsToHMS(video.duration)}</duration>
                    </timeInfo>
                    <bar style={`width:${Math.round((video.time/video.duration)*props.maxBarWidth)}px`}></bar>
                </div>
            </div>
            </a>
            <style jsx>{`   
                .unselected {
                    opacity: 0.4;
                }
            `}
            </style>
    </div>  
    )
}
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
    //DEBUG && console.log("start: " + start + ", end: " + end); 
    //DEBUG && console.log("extractWatchID: " + result);
    return result;
}
function secondsToHMS(timeInSeconds){
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