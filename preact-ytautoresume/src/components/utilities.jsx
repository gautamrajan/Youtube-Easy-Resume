
export function extractWatchID(link) {
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
    return result;
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
    else if (video.hasOwnProperty('timestamp') &&
        settings.hasOwnProperty('deleteAfter') &&
        daysSince(video.timestamp) > settings.deleteAfter) {
        return false;
    }
    else {
        return true;
    }
}export function daysSince(time1) {
    let current_time = new Date().getTime();
    let time_since_ms = current_time - time1;
    return Math.round(time_since_ms / 86400000);
}

