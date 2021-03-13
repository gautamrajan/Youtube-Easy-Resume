//content.js

//$.getscript("top/www.youtube.com/s/player/d29f3109/player_ias.vflset/en_US/base.js")
/* var currentURL = window.location.href;
var currentTime = g.k.getCurrentTime;

console.log("Current URL: " + currentURL);
console.log("Current time: " + currentTime);
 */

/* function runScriptOnPage() {
    var script = document.createElement('script');
    script.textContent = "console.log(\"Current Time\" + g.k.getCurrentTime());";
    (document.head||document.documentElement).appendChild(script);
    script.remove();
} */
var currentURL = window.location.href;
var video = document.querySelector("video");
console.log("Current URL: " + currentURL);
/* function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
} */

var ct = video.currentTime;
video.ontimeupdate = function(){
    ct = video.currentTime;
    console.log("Current time: " + ct);
};
