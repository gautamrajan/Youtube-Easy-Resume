import ListElement from "./listelement";
import { h } from 'preact';
const DEBUG = true;
export default function generateList(props) {
    //props -> edit, selectedVideos, marginRight, maxBarWidth, eClickHandler, settings
    var elementList = [];
    let maxBarWidth = 226;
    let marginRight = 0;
    //let titleWidth = 188;
    return new Promise((resolve) => {
        chrome.storage.local.get("videos", (data) => {
            //DEBUG && console.log("HERE");
            if (data.videos != undefined && data.videos.length != 0) {
                if (data.videos.length >= 4) {
                    //DEBUG && console.log("videos length greater than 4");
                    maxBarWidth = 211;
                    marginRight = 7;
                    for (var i = (data.videos.length - 1); !(i < 0); i--) {
                        if (checkCriteria(data.videos[i], props.settings)) {
                            elementList.push(
                                <ListElement
                                    video={data.videos[i]}
                                    edit={props.edit}
                                    selectedVideos={props.selectedVideos}
                                    marginRight={marginRight}
                                    maxBarWidth={maxBarWidth}
                                    eClickHandler={props.eClickHandler}
                                />
                            );
                        }
                    }
                    resolve(elementList);
                }
                else {
                    for (var i = (data.videos.length - 1); !(i < 0); i--) {
                        if (checkCriteria(data.videos[i],props.settings)) {
                            elementList.push(
                                <ListElement
                                    video={data.videos[i]}
                                    edit={props.edit}
                                    selectedVideos={props.selectedVideos}
                                    marginRight={marginRight}
                                    maxBarWidth={maxBarWidth}
                                    eClickHandler={props.eClickHandler}
                                />
                            );
                        }
                    }
                    resolve(elementList);
                }
            }
            
        })
    })
}

function checkCriteria(video, settings) {
    DEBUG && console.log("settings @ check criteria: ");
    console.log(JSON.stringify(settings));
    if (video.doNotResume) {
        return false;
    }
    else if (video.complete) {
        return false;
    }
    else if (video.time < settings.minWatchTime) {
        return false;
    }
    else if (video.duration < settings.minVideoLength) {
        return false;
    }
    else {
        return true;
    }
}