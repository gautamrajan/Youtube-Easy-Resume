import ListElement from "./listelement";
import { h } from 'preact';
const DEBUG = false;
export default function generateList(props) {
    //props -> edit, selectedVideos, marginRight, maxBarWidth, eClickHandler, settings
    var elementList = [];
    var maxBarWidth = 226;
    var marginRight = 0;
    //var titleWidth = 188;
    //let titleWidth = 188;
    return new Promise((resolve) => {
        chrome.storage.local.get("videos", (data) => {
            //DEBUG && console.log("HERE");
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
    //DEBUG && console.log("settings @ check criteria: ");
    //console.log(JSON.stringify(settings));
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