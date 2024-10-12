import ListElement from "./listelement";
import { h } from 'preact';
import { openDB, getVideos } from '../indexedDB.js';

const DEBUG = true; // Changed to true for debugging

export default async function generateList(props) {
    DEBUG && console.log('generateList called with props:', props);
    //props -> edit, selectedVideos, marginRight, maxBarWidth, eClickHandler, settings
    var elementList = [];
    var maxBarWidth = 226;
    var marginRight = 0;

    try {
        const db = await openDB();
        const videos = await getVideos(db);
        DEBUG && console.log('Retrieved videos:', videos);

        if (videos && videos.length > 0) {
            let list_counter = 0;
            for (let i = 0; i < videos.length; i++){
                if (checkCriteria(videos[i], props.settings)) {
                    list_counter++;
                    if (list_counter >= 4) {
                        maxBarWidth = 211;
                        marginRight = 7;
                        break;
                    }
                }
            }

            for (var i = (videos.length - 1); i >= 0; i--) {
                if (checkCriteria(videos[i], props.settings)) {
                    elementList.push(
                        <ListElement
                            key={i}
                            video={videos[i]}
                            index={i}
                            edit={props.edit}
                            selectedVideos={props.selectedVideos}
                            marginRight={marginRight}
                            maxBarWidth={maxBarWidth}
                            eClickHandler={props.eClickHandler}
                        />
                    );
                }
            }
            DEBUG && console.log('Generated elementList:', elementList);
        } else {
            DEBUG && console.log('No videos found or videos array is empty');
        }
    } catch (error) {
        console.error('Error in generateList:', error);
    }

    return elementList;
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
        daysSince(video.timestamp) > settings.deleteAfter) {
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