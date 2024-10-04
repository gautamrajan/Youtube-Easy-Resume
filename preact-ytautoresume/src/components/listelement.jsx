import { h } from 'preact';
import { extractWatchID, secondsToHMS } from './utilities';
const DEBUG = false;

export default function ListElement(props) {
    //props -> video, index, edit, selectedVideos, marginRight, maxBarWidth, eClickHandler
    let video = props.video;
    let opts = {};
    let selectorName = ""; 
    if (props.edit) {
        if (props.selectedVideos.some(vid => extractWatchID(video.videolink) === extractWatchID(vid.videolink))) {
            DEBUG && console.log("VIDEO SELECTED!");
            selectorName = selectorName + " selected";
        }
        else {
            selectorName = selectorName + " unselected"
        }
    }
    if (!props.edit) { opts["href"] = video.videolink;}

    const handleClick = (event) => {
        if (props.edit) {
            props.eClickHandler(video, props.index, event);
        }
    };

    return (
        <div className={`list-element-container`} onClick={handleClick}>
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
                    .list-element-container {
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                }
                .unselected {   
                    opacity: 0.4;
                }
                info {
                    cursor: pointer;
                }
                timeInfo {
                    cursor: pointer;
                }
                img, videoTitle, subtext, currentTime, duration {
                    pointer-events: none;
                }
            `}
            </style>
        </div>  
    )
}