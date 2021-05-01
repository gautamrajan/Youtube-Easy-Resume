import { h,Fragment, Component } from 'preact';
import './styles/mainlist.css';
export default class MainList extends Component {
    constructor(){
        super();
        this.state = {
            listReady:false,
            listElements:[],
            maxBarWidth:226,
            marginRight:0,
            titleWidth:188,
        }
    }
    componentDidMount() {
        this.generateList();
    }
    generateList = () => {
        var elementList = [];
        //return new Promise((resolve)=>{
            chrome.storage.local.get("videos",(data)=>{
                console.log("HERE");
                if(data.videos!=undefined && data.videos.length!=0){
                    if(data.videos.length >=4){
                        this.setState({
                            maxBarWidth:211,
                            marginRight:7
                        })
                    }
                    for(var i=(data.videos.length - 1);!(i<0);i--){
                        //generateVideoElement
                        elementList.push(this.generateListElement(data.videos[i]));
                    }
                }
                this.setState({
                    listReady:true,
                    listElements: elementList
                }/* ,()=>{resolve();} */);
            })
        //})
    }
    returnList = () =>{
        return (
            <Fragment>
            {this.state.listElements}
            </Fragment>
        )
    }
    generateListElement = (video)=>{
        return(
            <a className="main-list-element" href={video.videolink} target="_blank" title={video.title}>
            <img src={`https://img.youtube.com/vi/${extractWatchID(video.videolink)}/default.jpg`} width="120" height="90"/>
            <div className="element-body">
                <info>
                    <videoTitle width={`${this.state.titleWidth}px`}>
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
                    <bar style={`width:${Math.round((video.time/video.duration)*this.state.maxBarWidth)}px`}></bar>
                </div>
            </div>
        </a>
        )
    }
    render(){
        if(this.state.listReady){
            return(
                <div className="main-list" id="main-list">
                    {this.returnList()}
                    <style jsx>{`
                        .main-list-element{
                            margin-right:${this.state.marginRight}
                        }  
                    `}
                    </style>
                </div>
            )
        }
        else{
            //loading indicator
            <div>LOADING...</div>
        }
    }
}

function secondsToHMS(timeInSeconds){
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

function extractWatchID(link){
    //console.log("extractWatchID " + link);
    var start = 0;
    var end = 0;
    for(var i=0;i<link.length;i++){
        if(link[i]=='v' && link[i+1] == '='){
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
    var result = link.slice(start,end);
    console.log("start: " + start + ", end: " + end); 
    console.log("extractWatchID:  " + result);
    return result;
}