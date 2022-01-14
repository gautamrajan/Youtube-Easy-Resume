import { h, Component, Fragment } from 'preact';
import Switch from 'preact-material-components/Switch';
import './styles/materialswitch.css';
import './styles/home.css';
import './styles/mainlist.css';
import MainList from "./mainlist";
import SettingsPage from "./settings"
import Snackbar from 'preact-material-components/Snackbar';
const DEBUG = true;
export default class Home extends Component{
    constructor(){
        super();
        this.state = {
            dataReady:false,
            settingsPage: false,
            paused: false,
            edit: false,
            //mainlist state
            listReady: false,
            listElements: [],
            selectedVideos:[],
            //maxBarWidth: 226,
            //marginRight: 0,
            //titleWidth: 188,
            settings: {},
        }
        this.maxBarWidth = 226;
        this.marginRight = 0;
        this.titleWidth = 188;
    }
    moveToSettingsPage = ()=>{
        this.setState({
            settingsPage:true
        });
    }
    setedit = () => {
        if (this.state.edit) {
            this.setState({
                edit: !this.state.edit,
                selectedVideos: []
            }, () => {
                //this.mainList.editChange();
                DEBUG && console.log("Edit mode: " + (this.state.edit ? "on" : "off"));
                this.setList();
            });
        }
        else {
            this.setState({
                edit: !this.state.edit
            }, () => {
                //this.mainList.editChange();
                DEBUG && console.log("Edit mode: " + (this.state.edit ? "on" : "off"));
                this.setList();
            });
        }
    }
    componentDidMount() {
        //cleanDB();
        initSettingsDB().then(
            ()=>{
                chrome.storage.local.get("settings",(data)=>{
                    DEBUG && console.log("in constructor, data.settings.pauseResume = " + data.settings.pauseResume);
                    this.setState({
                        paused: data.settings.pauseResume,
                        dataReady:true,
                    });
                });
            }
        ).then(() => {
            //moved from mainlist
            this.getSettings();
            this.setList();
            /* .then(() => { return this.generateList() })
            .then((elementList) => {
                this.setState({
: true,
                    listElements: elementList
                });
            }) */
        })
    }
    handlePause = (event)=>{
        var newState;
        {this.state.paused ? newState=false:newState=true}
        chrome.storage.local.get("settings",(data)=>{
            var tempSettings = data.settings;
            tempSettings.pauseResume = newState;
            chrome.storage.local.set({
                settings:tempSettings
            },()=>{
                this.setState({paused:newState});
                DEBUG && console.log("newState")
            })
        })
    }
    deleteSelected = () => {
        //alert("Selected Videos Deleted");
        let delete_counter = this.state.selectedVideos.length;
        if (this.state.selectedVideos.length > 0) {
            chrome.storage.local.get("videos", (data) => {
                let newList = data;
                for (let i = 0; i<data.videos.length; i++) {
                    if (this.state.selectedVideos.includes(data.videos[i].videolink)){
                        newList.videos.splice(i, 1);
                    }
                }
                chrome.storage.local.set(newList, () => {
                    DEBUG && console.log("Selected videos deleted");
                    //this.setedit;
                    this.setState({
                        edit: !this.state.edit,
                        selectedVideos: []
                    }, () => {
                        //this.mainList.editChange();
                        //TODO: fix view doesn't immediately update when deleting last video from list
                        this.bar.MDComponent.show({
                            message:`${delete_counter} ${delete_counter > 1 ? "videos":"video"} removed`
                        })
                        DEBUG && console.log("Edit mode: " + (this.state.edit ? "on" : "off"));
                        this.setList();
                    });
                })
            })
        }
        else {
            this.setState({
                edit: !this.state.edit,
                selectedVideos: []
            }, () => {
                //this.mainList.editChange();
                this.bar.MDComponent.show({
                    message:"No videos removed"
                })
                DEBUG && console.log("Edit mode: " + (this.state.edit ? "on" : "off"));
                this.setList();
            });
        }
    }

    buttonBar = () => {
        let paused = this.state.paused;
        var pauseButtonText = "";
        DEBUG && console.log(paused);
        if(paused){pauseButtonText = "Unpause"}else{pauseButtonText = "Pause"};
        if (!this.state.edit) {
            return(
                <div className="button-container">
                    <button type="button" id="EditButton" onClick={this.setedit}>
                        <i class="fas fa-edit"></i>
                    </button>
                    <div className="AR SwitchContainer">
                        <label for="AutoResumeToggle">
                            <span id="AutoRedSwitchLabel">Auto</span>
                            Resume
                        </label>
                        <Switch name="AutoResumeToggle" checked={!paused} ref={pauseSwitch=>{this.switch=pauseSwitch;}}
                                onChange={(event)=>{this.handlePause(event)}}/>
                    </div>
                    <button type="button" id="SettingsButton" onClick={this.moveToSettingsPage}>
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            )
        }
        else{
            return (
                <div className="button-container">
                    <button className = "button editmode" type="button" id="ConfirmDeleteButton" onClick={this.deleteSelected}>
                        <i class="fas fa-check"></i>
                    </button>
                    <button className = "button editmode" type="button" id="ExitEditButton" onClick={this.setedit}>
                        <i class="fa fa-times" aria-hidden="true"></i>
                    </button>
                </div>
            )
        }
    }
    render(){
        let paused = this.state.paused;
        let settingsPage = this.state.settingsPage;
        var pauseButtonText = "";
        DEBUG && console.log(paused);
        if(paused){pauseButtonText = "Unpause"}else{pauseButtonText = "Pause"};
        if(this.state.dataReady){
            if(settingsPage){
                return(<SettingsPage/>)
            }
            else {
                let buttonBar = this.buttonBar();
                return(
                    <div className="HomeContainer">
                        <div className="header-bar">
                            <h1>Currently watching</h1>
                            {buttonBar}
                        </div>
                        {/* <MainList {...this.state} listReady={true} listElements={this.returnList()}
                            maxBarWidth={this.maxBarWidth} marginRight={this.marginRight}
                            titleWidth={this.titleWidth}/> */}
                        <div className="main-list" id="main-list">
                            {this.state.listReady ? this.getList() : null}
                            <style jsx>{`
                                .main-list-element{
                                margin-right:${this.props.marginRight}
                            }  
                            `}
                            </style>
                        </div>
                        <Snackbar ref={bar=>{this.bar=bar;}}/>
                    </div>
                )
            }
        }
        else{
            //loading...
            return(null);
        }
    }
    setList = () => {
        this.generateList().then((elementList) => {
            //return elementList;
            this.setState({
                listReady: true,
                listElements: elementList
            },()=>{DEBUG && console.log("Set list done")})
        });
    }
    getList = () => {
        return (
            <Fragment>
                {this.state.listElements}
            </Fragment>
        )
    }
    //functions moved from mainlist
    generateList = () => {
        var elementList = [];
        return new Promise((resolve) => {
            chrome.storage.local.get("videos", (data) => {
                //DEBUG && console.log("HERE");
                if (data.videos != undefined && data.videos.length != 0) {
                    if (data.videos.length >= 4) {
                        //DEBUG && console.log("videos length greater than 4");
                        this.maxBarWidth = 211;
                        this.marginRight = 7;
                        for (var i = (data.videos.length - 1); !(i < 0); i--) {
                            if (this.checkCriteria(data.videos[i])) {
                                elementList.push(this.generateListElement(data.videos[i]));
                            }
                        }
                        resolve(elementList);
                    }
                    else {
                        for (var i = (data.videos.length - 1); !(i < 0); i--) {
                            if (this.checkCriteria(data.videos[i])) {
                                elementList.push(this.generateListElement(data.videos[i]));
                            }
                        }
                        resolve(elementList);
                    }
                }
                
            })
        })
    }
    editVideoClick = (video) => {
        let newSelectedVideos = this.state.selectedVideos;
        if (this.state.edit) {
            if (this.state.selectedVideos.includes(video.videolink)) {
                newSelectedVideos.splice(newSelectedVideos.indexOf(video.videolink), 1);
                this.setState({
                    selectedVideos: newSelectedVideos
                }, () => {
                    this.setList();
                    DEBUG && console.log(`UN-selected video: ${video.videolink}`);
                });
            }
            else {
                newSelectedVideos.push(video.videolink);
                this.setState({
                    selectedVideos: newSelectedVideos
                }, () => {
                    this.setList();
                    DEBUG && console.log(`selected video: ${video.videolink}`);
                });
            }
            
        }
        else {
            DEBUG && console.log("false alarm");
        }
    }
    generateListElement = (video) => {
        let edit = this.state.edit;
        let selectedVideos = this.state.selectedVideos;
        let opts = {};
        let selectorName = "";
        if (edit) {
            if (selectedVideos.includes(video.videolink)) {
                selectorName = selectorName + " selected";
            }
            else {
                selectorName = selectorName + " unselected"
            }
        }
        DEBUG && console.log("THUMBNAIL LINK: " + `https://img.youtube.com/vi/${extractWatchID(video.videolink)}/default.jpg`);
        if (!edit) { opts["href"] = video.videolink;}
        return (
            <div className={`list-element-container`} onClick={()=>this.editVideoClick(video)}>
                <a className={`main-list-element${selectorName}`} {...opts} target="_blank" title={video.title}
                    style={`margin-right: ${this.marginRight}px;`}>
                <img src={`https://img.youtube.com/vi/${extractWatchID(video.videolink)}/default.jpg`} width="120" height="90"/>
                <div className={`element-body`}>
                    <info>
                        <videoTitle width={`${this.titleWidth}px`}>
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
                        <bar style={`width:${Math.round((video.time/video.duration)*this.maxBarWidth)}px`}></bar>
                    </div>
                    
                </div>
                </a>
                <style jsx>{`   
                    .unselected {
                        opacity: 0.4;
                    }
                `}
                </style>
        </div>  
        )
    }
    getSettings = () => {
        return new Promise((resolve) => {
            chrome.storage.local.get("settings", (data) => {
                if (data.settings != undefined) {
                    this.setState({ settings: data.settings, newSettings: data.settings, dataReady: true },
                        () => { resolve(); });
                }
                else {
                    chrome.storage.local.set({
                        settings: {
                            pauseResume: false,
                            minWatchTime: 60,
                            minVideoLength: 480,
                            markPlayedTime: 60,
                        }
                    }, () => {
                        this.setState({ settings: data.settings, newSettings: data.settings, dataReady: true },
                            () => { resolve(); });
                    });
                }
            });
        });
    }
    checkCriteria = (video) => {
        if (video.doNotResume) {
            return false;
        }
        else if (video.complete) {
            return false;
        }
        else if (video.time < this.state.settings.minWatchTime) {
            return false;
        }
        else {
            return true;
        }
    }
}
function initSettingsDB(){
    return new Promise((resolve)=>{
        chrome.storage.local.getBytesInUse("settings",(bytes)=>{
            DEBUG && console.log("INIT SETTINGS DB");
            if(bytes == undefined || bytes == 0){
                DEBUG && console.log("BYTES==0 OR UNDEFINED");
                chrome.storage.local.set(
                {
                    settings:{
                        pauseResume: false,
                        minVideoLength: 600,
                        minWatchTime: 60,
                        markPlayedTime:60
                    }
                },()=>{resolve();})
            }
            else{
                DEBUG && console.log("BYTES!=0");
               resolve(); 
            }
            
        })
    })
}
function extractWatchID(link){
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
    DEBUG && console.log("start: " + start + ", end: " + end); 
    DEBUG && console.log("extractWatchID: " + result);
    return result;
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
//TEST DEVELOPMENT FUNCTION
function cleanDB() {
    return new Promise((resolve) => {
        chrome.storage.local.get("videos", (data) => {
            let fixedDB = data.slice();
            for (let i = 0; i < data.videos.length; i++){
                if (extractWatchID(data.videos[i].videolink).length==0){
                    fixedDB.videos.splice(i, 1);
                }
            }
            chrome.storage.local.set(fixedDB,()=>{resolve()});
        })
    })
}