import ListElement from "./listelement";
import { h } from 'preact';
const DEBUG = false;
export default function generateList(props) {
    //props -> edit, selectedVideos, marginRight, maxBarWidth, eClickHandler, settings
    var elementList = [];
    var maxBarWidth = 226;
    var marginRight = 0;
    return new Promise((resolve) => {
        chrome.storage.local.get("videos", (data) => {
            if (data.videos != undefined && data.videos.length != 0) {
                let list_counter = 0;
                for (let i = 0; i < data.videos.length; i++){
                    if (checkCriteria(data.videos[i], props.settings)) {
                        list_counter++;
                        if (list_counter >= 4) {
                            maxBarWidth = 211;
                            marginRight = 7;
                            break;
                        }
                    }
                }
                for (var i = (data.videos.length - 1); !(i < 0); i--) {
                    if (checkCriteria(data.videos[i], props.settings)) {
                        elementList.push(
                            <ListElement
                                video={data.videos[i]}
                                edit={props.edit}
                                selectedVideos={props.selectedVideos}
                                marginRight={marginRight}
                                maxBarWidth={maxBarWidth}
                                //titleWidth = {titleWidth}
                                eClickHandler={props.eClickHandler}
                            />
                        );
                    }
                }
                resolve(elementList);
            }
            
        })
    })
}

function checkCriteria(video, settings) {
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
    else if (video.hasOwnProperty('timestamp') &&
        settings.hasOwnProperty('deleteAfter')&&
        daysSince(video.timestamp)>settings.deleteAfter) {
        return false;
    }
    else {
        return true;
    }
}
function daysSince(time1) {
    let current_time = new Date().getTime();
    let time_since_ms = current_time - time1;
    return Math.round(time_since_ms/86400000);
}