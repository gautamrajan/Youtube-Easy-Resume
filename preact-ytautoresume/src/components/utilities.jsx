
import videoStorage from '../popupVideoStorage';
import { getYouTubeVideoId } from '../youtubePage';

export function extractWatchID(link) {
    return getYouTubeVideoId(link);
}
export function secondsToHMS(timeInSeconds){
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

export function secondsToMinutes(seconds){
    if(seconds<60){
        return seconds;
    }
    else{
        return Math.round(seconds/60);
    }
}
export function minutesToSeconds(minutes){
    if(minutes == 0){
        return 0;
    }
    else{
        return minutes*60;
    }
}
export function checkCriteria(video, settings) {
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
    else if (videoStorage.isExpired(video, settings.deleteAfter)) {
        return false;
    }
    else {
        return true;
    }
}

export async function getDisplayedVideos(settings, searchQuery = '') {
    const videos = await videoStorage.getAllVideos();
    return videos.filter(video =>
        checkCriteria(video, settings) &&
        (searchQuery ?
            (video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.channel.toLowerCase().includes(searchQuery.toLowerCase()))
            : true
        )
    );
}
