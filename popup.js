








function generateList(link){
    var result = -1;
    return new Promise(function(resolve){

        chrome.storage.local.get("videos",function(data){
            console.log("videos.length at checkStoredLinks: "+ data.videos.length);
            if(data.videos.legnth != 0)
            {
                for(i=0;i<data.videos.length;i++){
                    if(data.videos[i].videolink == link){
                        console.log("link == videolink; INDEX: " + i);
                        console.log("MATCH FOUND: " + data.videos[i].title + ", " + data.videos[i].channel);
                        //return i;
                        result = i;
                        break;
                    }
                    /* else{
                        console.log("link != videolink");
                    } */
                    //return -1;
                    //resolve(-1);
                }
            }
            //return -1;
            resolve(result);
        });
        //return -1;

   /*      if(done == false){
            console.log("third resolve statement: ");
            resolve(-1);
        } */
    });
}