import ListElement from "./listelement";
import { h } from 'preact';
const DEBUG = false;

export default function generateList(props) {
    //props -> edit, selectedVideos, marginRight, maxBarWidth, eClickHandler, settings, searchQuery
    var elementList = [];
    var maxBarWidth = 226;
    var marginRight = 0;
    return new Promise((resolve) => {
        chrome.storage.local.get("videos", (data) => {
            if (data.videos != undefined && data.videos.length != 0) {
                let filteredVideos = data.videos.filter(video => 
                    checkCriteria(video, props.settings) &&
                    (props.searchQuery ? 
                        (video.title.toLowerCase().includes(props.searchQuery.toLowerCase()) ||
                        video.channel.toLowerCase().includes(props.searchQuery.toLowerCase()))
                        : true
                    )
                );

                let list_counter = 0;
                for (let i = 0; i < filteredVideos.length; i++){
                    list_counter++;
                    if (list_counter >= 4) {
                        maxBarWidth = 211;
                        marginRight = 7;
                        break;
                    }
                }

                for (var i = (filteredVideos.length - 1); !(i < 0); i--) {
                    elementList.push(
                        <ListElement
                            key={i}
                            video={filteredVideos[i]}
                            index={i}
                            edit={props.edit}
                            selectedVideos={props.selectedVideos}
                            marginRight={marginRight}
                            maxBarWidth={maxBarWidth}
                            eClickHandler={props.eClickHandler}
                        />
                    );
                }
                resolve(elementList);
            } else {
                resolve([]);
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