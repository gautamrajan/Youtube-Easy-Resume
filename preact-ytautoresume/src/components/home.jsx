import { h, Component, Fragment } from 'preact';
import Switch from 'preact-material-components/Switch';
import './styles/materialswitch.css';
import './styles/home.css';
import './styles/mainlist.css';
import SettingsPage from "./settings"
import Snackbar from 'preact-material-components/Snackbar';
import generateList from './list';
import {extractWatchID} from './utilities'
import { openDB, getVideos, setVideo, deleteVideo, getSettings, setSettings, migrateData } from '../indexedDB';

const DEBUG = true;

export default class Home extends Component {
    constructor() {
        super();
        this.state = {
            dataReady: false,
            settingsPage: false,
            paused: false,
            edit: false,
            listReady: false,
            listElements: [],
            selectedVideos: [],
            settings: {},
            lastClickedIndex: -1,
        }
        this.maxBarWidth = 226;
        this.marginRight = 0;
        this.titleWidth = 188;
        this.db = null;
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
        this.initializeDB();
    }

    async initializeDB() {
        try {
            this.db = await openDB();
            await migrateData(); // Migrate data from Chrome storage to IndexedDB
            await this.cleanDB();
            await this.getSettings();
            this.setList();
        } catch (error) {
            console.error('Error initializing DB:', error);
        }
    }

    handlePause = async (event) => {
        const newState = !this.state.paused;
        try {
            const settings = await getSettings(this.db);
            settings.pauseResume = newState;
            await setSettings(this.db, settings);
            this.setState({ paused: newState, settings });
            DEBUG && console.log("Pause state updated");
        } catch (error) {
            console.error('Error updating pause state:', error);
        }
    }

    deleteSelected = async () => {
        const deleteCounter = this.state.selectedVideos.length;
        if (deleteCounter > 0) {
            try {
                const videos = await getVideos(this.db);
                for (const selectedVideo of this.state.selectedVideos) {
                    await deleteVideo(this.db, selectedVideo.videolink);
                }
                this.setState({
                    edit: false,
                    listReady: false,
                    selectedVideos: []
                }, () => {
                    this.setList();
                    this.bar.MDComponent.show({
                        message: `${deleteCounter} ${deleteCounter > 1 ? "videos" : "video"} removed`
                    });
                    DEBUG && console.log("Edit mode: off");
                });
            } catch (error) {
                console.error('Error deleting videos:', error);
            }
        } else {
            this.setState({
                edit: false,
                selectedVideos: []
            }, () => {
                this.bar.MDComponent.show({
                    message: "No videos removed"
                });
                DEBUG && console.log("Edit mode: off");
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
    setList = async () => {
        DEBUG && console.log('setList called');
        let props = {
            edit: this.state.edit,
            selectedVideos: this.state.selectedVideos,
            marginRight: this.marginRight,
            maxBarWidth: this.maxBarWidth,
            settings: this.state.settings,
            eClickHandler: (video, index, event) => this.editVideoClick(video, index, event)
        }
        DEBUG && console.log('setList props', props);
    
        try {
            const videos = await getVideos(this.db);
            DEBUG && console.log('Retrieved videos for list', videos);
    
            const elementList = await generateList(props, videos);
            DEBUG && console.log('Generated element list', elementList);
    
            this.setState({
                listReady: elementList.length > 0,
                listElements: elementList
            }, () => { 
                DEBUG && console.log("Set list done", { 
                    listReady: this.state.listReady, 
                    listElementsCount: this.state.listElements.length 
                });
            });
        } catch (error) {
            console.error('Error generating list:', error);
        }
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
    handleShiftClick = async (currentIndex, selectedVideos) => {
        DEBUG && console.log('handleShiftClick called', { currentIndex, lastClickedIndex: this.state.lastClickedIndex });
        const start = Math.min(this.state.lastClickedIndex, currentIndex);
        const end = Math.max(this.state.lastClickedIndex, currentIndex);
    
        try {
            const videos = await getVideos(this.db);
            DEBUG && console.log('Retrieved videos from IndexedDB', videos);
    
            for (let i = start; i <= end; i++) {
                if (i >= 0 && i < videos.length) {
                    const video = videos[i];
                    const videoIndex = selectedVideos.findIndex(v => extractWatchID(v.videolink) === extractWatchID(video.videolink));
                    if (videoIndex === -1) {
                        selectedVideos.push(video);
                        DEBUG && console.log('Added video to selectedVideos', video);
                    }
                }
            }
    
            DEBUG && console.log('Updated selectedVideos', selectedVideos);
            this.setState({ selectedVideos }, () => {
                this.setList();
            });
        } catch (error) {
            console.error('Error in handleShiftClick:', error);
        }
    }
    getSettings = async () => {
        try {
            let settings = await getSettings(this.db);
            if (!settings) {
                settings = {
                    pauseResume: false,
                    minWatchTime: 60,
                    minVideoLength: 480,
                    markPlayedTime: 60,
                    deleteAfter: 30
                };
                await setSettings(this.db, settings);
            }
            this.setState({ 
                settings, 
                newSettings: settings, 
                dataReady: true, 
                paused: settings.pauseResume 
            });
        } catch (error) {
            console.error('Error getting settings:', error);
        }
    }

    cleanDB = async () => {
        try {
            const videos = await getVideos(this.db);
            for (const video of videos) {
                if (checkExpired(video, this.state.settings)) {
                    DEBUG && console.log("CLEANING EXPIRED LINK");
                    await deleteVideo(this.db, video.videolink);
                }
            }
        } catch (error) {
            console.error('Error cleaning DB:', error);
        }
    }
}

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
