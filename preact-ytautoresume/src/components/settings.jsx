import { h, Component } from 'preact';
import Snackbar from 'preact-material-components/Snackbar';
import 'preact-material-components/Snackbar/style.css';
import './styles/settings.css';
import Home from './home';

//TODO: Input validation for settings
export default class SettingsPage extends Component{
    constructor(){
        super();
        this.state = {
            dataReady:false,
            goBack: false,
            settingsChanged:false,
            settings:{},
            newSettings:{},
            savedSnackbar:false,
        }
    }
    settingsChangedHandler = (e,setting,minutes) =>{
        console.log("At settingsChangedHandler: " + setting);
        var modifiedSettings = {};
        modifiedSettings = Object.assign(modifiedSettings, this.state.newSettings);
        if(minutes){
            console.log("minutes case, setting name: " + setting);
            console.log("minutes case, value: " + e.target.value);
            modifiedSettings[setting] = minutesToSeconds(e.target.value);
        }
        else{
            modifiedSettings[setting] = e.target.value;
        }

        
        this.setState({newSettings:modifiedSettings},()=>{
            this.settingsChangedChecker();
        })       
    }
    settingsChangedChecker = () =>{
        var noSettingsChanged = true;
        for(let key of Object.keys(this.state.settings)){
            if(this.state.settings[key] !== this.state.newSettings[key]){
                noSettingsChanged = false;
                this.setState({
                    settingsChanged: true
                },()=>{return;})
            }
        }
        if(noSettingsChanged && this.state.settingsChanged){
            this.setState({
                settingsChanged:false,
            })
        }

    }
    saveSettings = () =>{
        chrome.storage.local.set(
            {
                settings:this.state.newSettings
            },()=>{
                console.log("SETTINGS CHANGED IN STORAGE");
                this.setState({
                    settings: this.state.newSettings,
                    settingsChanged:false,
                },()=>{
                    this.bar.MDComponent.show({
                        message:"Settings saved successfully"
                    })
                })
            }
        )
    }
    
    componentDidMount(){
        chrome.storage.local.get("settings",(data)=>{
            if(data.settings != undefined){
                this.setState({settings: data.settings, newSettings:data.settings, dataReady:true});
            }
            else{
                chrome.storage.local.set({
                    settings:{
                        pauseResume:false,
                        minWatchTime:60,
                        minVideoLength:480,
                        markPlayedTime:60,
                    }
                },()=>{this.setState({settings: data.settings, newSettings:data.settings, dataReady:true});});
            }
        })
    }
    goBack = ()=>{
        this.setState({
            goBack:true
        })
    }
    
    render(){
        let goBack = this.state.goBack;
        let dataReady = this.state.dataReady;
        var initMVL = this.state.newSettings.minVideoLength;
        var initMWT = this.state.newSettings.minWatchTime;
        var initMPT = this.state.newSettings.markPlayedTime;
        let settingsChanged = this.state.settingsChanged;
        if(goBack){
            return(
                <Home/>
            )
        }
        if(dataReady){
            console.log("DATA READY: " + dataReady);
            return(
                <div className="SettingsContainer">
                    <div className="header-bar">
                        <h1>Settings</h1>
                        <button id="backButton" onClick={this.goBack}>
                            <i class="fa fa-chevron-left"></i>
                        </button>
                    </div>
                    <div id="MainPanel">
                        <form className="SettingsPanel">
                            <div className="Setting MinVideoLength">
                                <label for="MinVideoLengthInput" className="SettingLabel">Only resume videos longer than: </label>
                                <div className="MinVideoLength InputContainer">
                                    <input type="number" className="NumInput" name="MinVideoLengthInput" id="MinVideoLengthInput"
                                    value={secondsToMinutes(initMVL)}
                                    onInput={(event)=>{this.settingsChangedHandler(event,"minVideoLength",true)}}/> minute(s)
                                </div>
                            </div>
                            <div className="Setting MinWatchTime">
                                <label for="MinWatchTimeInput" className="SettingLabel">Only resume videos I watch for at least: </label>
                                <div className="MinWatchTime InputContainer">
                                    <input type="number" className="NumInput" name="MinWatchTimeInput" id="MinWatchTimeInput"
                                    value={secondsToMinutes(initMWT)}
                                    onInput={(event)=>{this.settingsChangedHandler(event,"minWatchTime",true)}}/> minute(s)
                                </div>
                            </div>
                            <div className="Setting ConsiderComplete">
                                <label for="ConsiderCompleteInput" className="SettingLabel">Mark as video as played: </label>
                                <div className="ConsiderComplete InputContainer">
                                    <input type="number" className="NumInput" name="ConsiderCompleteInput" id="ConsiderCompleteInput"
                                    value={secondsToMinutes(initMPT)}
                                    onInput={(event)=>{this.settingsChangedHandler(event,"markPlayedTime",true)}}/> 
                                    <select className="TimeUnitSelector" name="ConsiderCompleteUnits" id="ConsiderCompleteUnits">
                                        <option value="minutes">minute(s)</option>
                                        {/* <option value="seconds">second(s)</option> */}
                                    </select>
                                    away from the end.
                                </div>
                            </div>
                            <div className="MadeBy Message">
                                Made with ❤️ at
                                <a href="https://www.uscannenbergmedia.com/" target="_blank">Annenberg Media</a>
                                <style jsx>{`
                                    .Message {
                                        color: white;
                                        margin-top:8px;
                                        font-size: 15px;
                                        display: inline-block;
                                        flex-direction:row;
                                        justify-content:flex-start;
                                    }                              
                                    a:link{
                                        margin-left: 5px;
                                        color:#a10000;
                                        font-weight: bold;
                                        text-decoration: none;
                                    }  
                                    a:visited{
                                        margin-left: 5px;
                                        color:#a10000;
                                        font-weight: bold;
                                        text-decoration: none;
                                    }
                                    a:hover{
                                        color: red;
                                        font-weight: bold;
                                    }
                                    a:active{
                                        color: #990000;
                                    }
                                `}
                                </style>
                            </div>
                        </form>
                        {settingsChanged?<button type="button" id="SaveButton" onClick={()=>this.saveSettings()}>Save Settings</button>
                        :null}
                        <Snackbar ref={bar => { this.bar = bar; }} />
                    </div>
                </div>
            )   
        }
        else{
            return (null);
        }
    }
}
function secondsToMinutes(seconds){
    if(seconds<60){
        return seconds;
    }
    else{
        return Math.round(seconds/60);
    }
}
function minutesToSeconds(minutes){
    if(minutes == 0){
        return 0;
    }
    else{
        return minutes*60;
    }
}