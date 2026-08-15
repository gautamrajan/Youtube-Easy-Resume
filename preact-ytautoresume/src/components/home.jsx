/* global chrome */
import { h, Component, Fragment } from 'preact';
import Switch from 'preact-material-components/Switch';
import './styles/materialswitch.css';
import './styles/home.css';
import './styles/mainlist.css';
import SettingsPage from "./settings"
import Snackbar from 'preact-material-components/Snackbar';
import generateList from './list';
import { extractWatchID, getDisplayedVideos } from './utilities'
import SearchBar from './SearchBar';
import ButtonBar from './ButtonBar';
import videoStorage from '../popupVideoStorage';

const DEBUG = false;
const DEFAULT_SETTINGS = Object.freeze({
    pauseResume: false,
    minWatchTime: 60,
    minVideoLength: 480,
    markPlayedTime: 60,
    deleteAfter: 30
});
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
            isSearching: false,
            searchQuery: '',
            storageError: false
        }
        this.maxBarWidth = 226;
        this.marginRight = 0;
        this.titleWidth = 188;
    }
    toggleSearch = () => {
        this.setState(prevState => ({ 
            isSearching: !prevState.isSearching, 
            searchQuery: '' 
        }), () => {
            if (!this.state.isSearching) {
                // Reset the list when exiting search mode
                this.setList();
            }
        });
    }

    handleSearchChange = (query) => {
        this.setState({ searchQuery: query }, this.setList);
    }
    moveToSettingsPage = ()=>{
        this.setState({
            settingsPage:true
        });
    }
    setEdit = () => {
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
    async componentDidMount() {
        try {
            await videoStorage.initialize();
            const settings = await initSettingsDB();
            await this.cleanDB(settings);
            // Async initialization completes after the first render by design.
            // eslint-disable-next-line react/no-did-mount-set-state
            this.setState({
                settings,
                newSettings: { ...settings },
                dataReady: true,
                paused: settings.pauseResume,
                storageError: false
            }, this.setList);
        } catch (error) {
            console.error("Unable to initialize extension storage:", error);
            // Render a recoverable state when extension storage is unavailable.
            // eslint-disable-next-line react/no-did-mount-set-state
            this.setState({
                dataReady: true,
                listReady: false,
                listElements: [],
                storageError: true
            });
        }
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
    deleteSelected = async () => {
        let delete_counter = this.state.selectedVideos.length;
        if (this.state.selectedVideos.length > 0) {
            await videoStorage.removeVideos(this.state.selectedVideos);
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
                //let buttonBar = this.buttonBar();
                return(
                    <div className="HomeContainer">
                        <div className="header-bar">
                            {!this.state.isSearching && <h1>Currently watching</h1>}
                            <ButtonBar 
                                isSearching={this.state.isSearching}
                                paused={this.state.paused}
                                edit={this.state.edit}
                                toggleSearch={this.toggleSearch}
                                handleSearchChange={this.handleSearchChange}
                                searchQuery={this.state.searchQuery}
                                setEdit={this.setEdit}
                                handlePause={this.handlePause}
                                moveToSettingsPage={this.moveToSettingsPage}
                                deleteSelected={this.deleteSelected}
                            />
                        </div>
                        <div className="main-list" id="main-list">
                            {this.state.listReady ? this.getList() : null}
                            {this.state.storageError ?
                            <h2>Could not load saved videos</h2> : null}
                            {!this.state.storageError && !this.state.listReady && this.state.listElements.length==0 ?
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
            searchQuery: this.state.searchQuery,
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
            const totalVideos = this.state.listElements.length;
    
            // Use displayed index directly
            const displayedIndex = index;
    
            DEBUG && console.log(`Clicked index: ${displayedIndex}`);
            DEBUG && console.log(`Last clicked index: ${this.state.lastClickedIndex}`);
    
            const videoIndex = newSelectedVideos.findIndex(v => extractWatchID(v.videolink) === extractWatchID(video.videolink));
    
            if (event.shiftKey && this.state.lastClickedIndex !== -1) {
                DEBUG && console.log(`Shift-click detected. Handling range from ${this.state.lastClickedIndex} to ${displayedIndex}`);
                this.handleShiftClick(this.state.lastClickedIndex, displayedIndex, newSelectedVideos);
            } else {
                if (videoIndex === -1) {
                    newSelectedVideos.push(video);
                    DEBUG && console.log(`Selected video: ${video.videolink}`);
                } else {
                    newSelectedVideos.splice(videoIndex, 1);
                    DEBUG && console.log(`Unselected video: ${video.videolink}`);
                }
                // Update lastClickedIndex to the current displayed index
                this.setState({
                    selectedVideos: newSelectedVideos,
                    lastClickedIndex: displayedIndex
                }, () => {
                    this.setList();
                    DEBUG && console.log(`Updated selected videos: ${JSON.stringify(newSelectedVideos.map(v => v.title))}`);
                });
            }
        } else {
            DEBUG && console.log("Edit mode is not active.");
        }
    }
    //TODO: Currentl implmentation grabs videos straight from DB without
    //checking if they're blacklisted or completed. Causing issues
    handleShiftClick = async (lastClickedDisplayedIndex, currentDisplayedIndex, selectedVideos) => {
        const start = Math.min(lastClickedDisplayedIndex, currentDisplayedIndex);
        const end = Math.max(lastClickedDisplayedIndex, currentDisplayedIndex);
    
        DEBUG && console.log(`Handling shift click from ${lastClickedDisplayedIndex} to ${currentDisplayedIndex} (start: ${start}, end: ${end})`);
    
        try {
            const displayedVideos = await getDisplayedVideos(this.state.settings, this.state.searchQuery);
            DEBUG && console.log("Displayed videos:", displayedVideos);
            let newSelectedVideos = [...selectedVideos]; // Clone to avoid direct mutation
    
            for (let i = start; i <= end; i++) {
                const video = displayedVideos[i];
                DEBUG && console.log("Shift-selected video " + i + ": " + video.title)
                if (video) {
                    const videoExists = newSelectedVideos.some(v => extractWatchID(v.videolink) === extractWatchID(video.videolink));
                    if (!videoExists) {
                        newSelectedVideos.push(video);
                        DEBUG && console.log(`Selected video during shift-click: ${video.title}`);
                    }
                }
            }
    
            this.setState({
                selectedVideos: newSelectedVideos,
                lastClickedIndex: currentDisplayedIndex // Update to current clicked index
            }, () => {
                this.setList();
                DEBUG && console.log(`Updated selected videos after shift-click: ${JSON.stringify(newSelectedVideos.map(v => v.title))}`);
            });
        } catch (error) {
            console.error("Error in handleShiftClick:", error);
        }
    }
    cleanDB = async (settings = this.state.settings) => {
        return videoStorage.deleteExpired(settings.deleteAfter);
    }
}

function getLocalStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, data => {
            const error = chrome.runtime && chrome.runtime.lastError;
            if (error) {
                reject(new Error(error.message));
                return;
            }
            resolve(data);
        });
    });
}

function setLocalStorage(values) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(values, () => {
            const error = chrome.runtime && chrome.runtime.lastError;
            if (error) {
                reject(new Error(error.message));
                return;
            }
            resolve();
        });
    });
}

async function initSettingsDB() {
    const data = await getLocalStorage("settings");
    const storedSettings = data.settings &&
        typeof data.settings === "object" &&
        !Array.isArray(data.settings) ? data.settings : {};
    const settings = { ...DEFAULT_SETTINGS, ...storedSettings };
    const missingSetting = Object.keys(DEFAULT_SETTINGS)
        .some(key => !Object.prototype.hasOwnProperty.call(storedSettings, key));

    if (!data.settings || missingSetting) {
        await setLocalStorage({ settings });
    }

    return settings;
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
