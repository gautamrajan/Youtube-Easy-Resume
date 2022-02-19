import { h } from 'preact';
import { extractWatchID, secondsToHMS } from './utilities';
const DEBUG = false;
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
                    <videoTitle>
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
                info {
                    cursor: pointer;
                }
                timeInfo {
                    cursor: pointer;
                }

            `}
            </style>
    </div>  
    )
}
