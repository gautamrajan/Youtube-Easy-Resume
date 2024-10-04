import { h, Component, Fragment } from 'preact';
import Switch from 'preact-material-components/Switch';
import './styles/materialswitch.css';
import './styles/home.css';
import './styles/mainlist.css';
import SettingsPage from "./settings"
import Snackbar from 'preact-material-components/Snackbar';
import generateList from './list';
import {extractWatchID} from './utilities'
const DEBUG = true;
export default class Home extends Component{
    constructor(){
        super();
        this.state = {
            dataReady:false,
            settingsPage: false,
            paused: false,
            edit: false,
            listReady: false,
            listElements: [],
            selectedVideos:[],
            settings: {},
            lastClickedIndex: -1,
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
                DEBUG && console.log("Edit mode: " + (this.state.edit ? "on" : "off"));
                this.setList();
            });
        }
        else {
            this.setState({
                edit: !this.state.edit
            }, () => {
                DEBUG && console.log("Edit mode: " + (this.state.edit ? "on" : "off"));
                this.setList();
            });
        }
    }
    componentDidMount() {
        //cleanDB();
        initSettingsDB().then(this.cleanDB()).then(() => {
            this.getSettings().then(
                this.setList
            );
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
        let delete_counter = this.state.selectedVideos.length;
        if (this.state.selectedVideos.length > 0) {
            chrome.storage.local.get("videos", (data) => {
                let newList = data;
                DEBUG && console.log("HERE");
                for (let x = 0; x < this.state.selectedVideos.length;x++) {
                    DEBUG && console.log("LOOKING FOR " + this.state.selectedVideos[x].videolink);
                    for (let i = 0; i < newList.videos.length; i++){
                        if (newList.videos[i].videolink == this.state.selectedVideos[x].videolink) {
                            DEBUG && console.log("FOUND ELEMENT TO DELETE: " + this.state.selectedVideos[x].videolink);
                            newList.videos.splice(i, 1);
                        }
                    }
                }
                DEBUG && console.log("STATE OF DB AFTER DELETIONS: ");
                DEBUG && console.log(newList.videos);
                chrome.storage.local.set(newList, () => {

                    this.setState({
                        edit: !this.state.edit,
                        listReady:false,
                        selectedVideos: []
                    }, () => {
                        this.setList();
                        this.bar.MDComponent.show({
                            message:`${delete_counter} ${delete_counter > 1 ? "videos":"video"} removed`
                        })
                        DEBUG && console.log("Edit mode: " + (this.state.edit ? "on" : "off"));
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
        //DEBUG && console.log(paused);
        if(paused){pauseButtonText = "Unpause"}else{pauseButtonText = "Pause"};
        if (!this.state.edit) {
            return(
                <div className="button-container">
                    <button type="button" id="EditButton" onClick={this.setedit}>
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <div className={`AR SwitchContainer ${this.state.paused ? "Off" : "On"}`}>
                        <label for="AutoResumeToggle">
                            <span className={`SwitchLabel ${this.state.paused ? "Off" : "On"}`} id="AutoRedSwitchLabel">{this.state.paused ? "OFF" : "ON"}</span>
                            {/* Resume */}
                        </label>
                        <Switch name="AutoResumeToggle" checked={!paused} ref={pauseSwitch=>{this.switch=pauseSwitch;}}
                                onChange={(event)=>{this.handlePause(event)}}/>
                    </div>
                    <button type="button" id="SettingsButton" onClick={this.moveToSettingsPage}>
                        <i class="fas fa-cog"></i>
                    </button>
                    <style jsx>{`
                        .SwitchLabel{
                            font-weight:600;
                        }
                        .SwitchLabel.On{
                            color:red;
                            padding-right:4px;
                        }
                        .SwitchLabel.Off{
                            color:white;
                            opacity: 0.4;
                        }    
                        .SwitchContainer.On{
                            margin-left:6px;
                        }
                    `}
                    </style>
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
        //DEBUG && console.log(paused);
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
                        <div className="main-list" id="main-list">
                            {this.state.listReady ? this.getList() : null}
                            {!this.state.listReady && this.state.listElements.length==0 ?
                            <h2>No videos</h2> : null}
                            <style jsx>{`
                                .main-list-element{
                                    margin-right:${this.props.marginRight}
                                }  
                                h2 {
                                    margin-top: 42vh;
                                    text-align: center;
                                    color: #ffffff;
                                    font-size: 1.8em;
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
        //props -> edit, selectedVideos, marginRight, maxBarWidth, editVideoClick
        let props = {
            edit: this.state.edit,
            selectedVideos: this.state.selectedVideos,
            marginRight: this.marginRight,
            maxBarWidth: this.maxBarWidth,
            settings: this.state.settings,
            eClickHandler: (video, index, event) => this.editVideoClick(video, index, event)
        }
        generateList(props).then((elementList) => {
        //this.generateList().then((elementList) => {
            //return elementList;
            this.setState({
                listReady: elementList.length==0 ? false : true,
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
    eClickHandler = (video)=>{this.editVideoClick(video)}
    editVideoClick = (video, index, event) => {
        if (this.state.edit) {
            let newSelectedVideos = [...this.state.selectedVideos];
            const videoIndex = newSelectedVideos.findIndex(v => extractWatchID(v.videolink) === extractWatchID(video.videolink));

            if (event.shiftKey && this.state.lastClickedIndex !== -1) {
                this.handleShiftClick(index, newSelectedVideos);
            } else {
                if (videoIndex === -1) {
                    newSelectedVideos.push(video);
                } else {
                    newSelectedVideos.splice(videoIndex, 1);
                }
            }

            this.setState({
                selectedVideos: newSelectedVideos,
                lastClickedIndex: index
            }, () => {
                this.setList();
                DEBUG && console.log(`${videoIndex === -1 ? 'Selected' : 'Unselected'} video: ${video.videolink}`);
            });
        } else {
            DEBUG && console.log("false alarm");
        }
    }
    handleShiftClick = (currentIndex, selectedVideos) => {
        const start = Math.min(this.state.lastClickedIndex, currentIndex);
        const end = Math.max(this.state.lastClickedIndex, currentIndex);

        chrome.storage.local.get("videos", (data) => {
            const videos = data.videos;
            for (let i = start; i <= end; i++) {
                const video = videos[i];
                const videoIndex = selectedVideos.findIndex(v => extractWatchID(v.videolink) === extractWatchID(video.videolink));
                if (videoIndex === -1) {
                    selectedVideos.push(video);
                }
            }
        });
    }
    getSettings = () => {
        return new Promise((resolve) => {
            chrome.storage.local.get("settings", (data) => {
                if (data.settings != undefined) {
                    this.setState({ settings: data.settings, newSettings: data.settings, dataReady: true, paused: data.settings.pauseResume},
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
    cleanDB = ()=>{
        return new Promise((resolve) => {
            chrome.storage.local.get("videos", (data) => {
                let fixedDB = data;
                for (let i = fixedDB.videos.length - 1; i >= 0; i--){
                    if (checkExpired(fixedDB.videos[i], this.state.settings)) {
                        DEBUG && console.log("CLEANING EXPIRED LINK");
                        fixedDB.videos.splice(i, 1);
                    }
                }
                chrome.storage.local.set(fixedDB,()=>{resolve()});
            })
        })
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
                        markPlayedTime: 60,
                        deleteAfter:30
                    }
                },()=>{resolve();})
            }
            else {
                DEBUG && console.log("BYTES!=0");
                chrome.storage.local.get("settings", (data) => {
                    DEBUG && console.log(data.settings);
                    let current_settings = data.settings;
                    if (!current_settings.hasOwnProperty('deleteAfter')) {
                        DEBUG && console.log("here");

                        chrome.storage.local.set(
                            {
                                settings:{
                                    pauseResume: current_settings.pauseResume,
                                    minVideoLength: current_settings.minVideoLength,
                                    minWatchTime: current_settings.minWatchTime,
                                    markPlayedTime: current_settings.markPlayedTime,
                                    deleteAfter:30
                                }
                            },()=>{resolve();})
                    }
                })
               resolve(); 
            }
            
        })
    })
    
}
//TEMP FIX

function checkExpired(video,settings) {
    if (video.hasOwnProperty('timestamp')) {
        DEBUG && console.log(video.title + " Timestamp: " + video.timestamp);
        let current_time = new Date().getTime();
        let time_since_ms = current_time - video.timestamp;
        let diff = Math.round(time_since_ms/86400000);
        if (diff > settings.deleteAfter) {
            return true;
        }
    }
    return false;
   
}
function checkWatchable(link){
    if(link.indexOf("watch?") > -1 && link.indexOf("?t=")>-1){
        DEBUG && console.log("IGNORING TIMESTAMPED LINK");
        return false;
    }
    
    else if (link.indexOf("watch?") > -1) {
        return true;
    }
    else{
        DEBUG && console.log("NOT A WATCHABLE LINK");
        return false;
    }
}
