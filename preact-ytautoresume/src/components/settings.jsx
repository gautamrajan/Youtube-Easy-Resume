import { h, Component } from 'preact';
import Snackbar from 'preact-material-components/Snackbar';
import 'preact-material-components/Snackbar/style.css';
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
        /* if(modifiedSettings[setting]!=this.state.newSettings[setting]){
            
        } */
        
        /* else if(this.state.settings[setting]!=this.state.newSettings[setting]){
    
            console.log("settings changed case");
            this.setState({settingsChanged:true,newSettings:modifiedSettings});
        }
        else{
            this.setState({
                settingsChanged:false
            })
        } */
        /* this.setState({
            newSettings:modifiedSettings,
        },()=>{
            if(this.state.settings[setting]!=this.state.newSettings[setting]){
                console.log("settings changed case");
                this.setState({settingsChanged:true,newSettings:modifiedSettings});
            }
            else{
                this.setState({
                    settingsChanged:false
                })
            }
        }); */
        

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
                                        <option value="seconds">second(s)</option>
                                    </select>
                                    away from the end.
                                </div>
                            </div>
                        </form>
                        {settingsChanged?<button type="button" id="SaveButton" onClick={()=>this.saveSettings()}>Save Settings</button>
                        :null}
                        <Snackbar ref={bar=>{this.bar=bar;}}/>
                    </div>
                    
                    


                    <style jsx>{`
                        .fa-chevron-left{
                            color:#ffffff;
                            /* margin-bottom: 5px; */
                        }
                        .SettingsContainer{
                            display:flex;
                            flex-direction:column;
                            max-width:350px;
                            min-height:435px;
                            /*background-color:green;*/
                        }
                        div.header-bar{
                            display: flex;
                            flex-direction: row;
                            align-items: flex-end;
                            flex-wrap: nowrap;
                            justify-content: space-between;
                            border-bottom: 1px solid #aaaaaa;  
                            vertical-align: middle;
                            text-align: center;
                        }
                        div.header-bar button{
                            font-size:20px;
                            margin-bottom:5px;
                            border-radius: 10px;
                            border: none;
                            color: #ffffff;
                            background-color: transparent;
                            text-align: center;
                            vertical-align: middle;
                            {/* background-color: rgba(99, 99, 99, 0.781); */}
                        }
                        div.header-bar button:active{
                            background-color: rgba(158, 158, 158, 0.781);
                        }
                        h1{
                            margin-top:5px;
                            /*margin-bottom: 5px;*/
                            color: #ffffff;
                            /* border: 1px solid black; */
                        }
                        #MainPanel{
                            max-height:100%;
                            /*background-color:blue;*/
                            display:flex;
                            flex-grow:1;
                            flex-direction:column;
                            justify-content:space-between;
                        }
                        .SettingsPanel{
                            max-height:100%;
                        }
                        .Setting {
                            margin-top:8px;
                            display: flex;
                            flex-direction:column;
                            justify-content:start;
                            align-items:start;
                            color: #ffffff
                        }
                        .SettingLabel{
                            font-weight:bold;
                            font-size:17px;
                        }
                        .InputContainer{
                            display:inline-flex;
                            justify-content:flex-start;
                            align-items:start;
                            flex-direction:row;
                            max-width:50%;
                            border-radius:5px;
                            margin-top:8px;
                            font-size:15px;
                        }
                        .ConsiderComplete.InputContainer{
                            max-width:80%;
                        }
                        .ConsiderComplete .NumInput{
                            max-width:54px;
                        }
                        .ConsiderComplete select{
                            margin-top:3px;
                            margin-right:4px;
                            border:none;
                            border-radius:10px;
                            background:rgba(255, 255, 255, 0.568);
                            outline:none;

                        }
                        .NumInput{
                            width:30%;
                            height:50%;
                            margin-right:3px;
                            border:none;
                            background-color:rgba(255, 255, 255, 0.123);
                            color:#ffffff;
                            text-align:center;
                            font-weight:bold;
                            outline:none;
                            border-bottom:1px solid #ffffff;
                            -webkit-appearance: textfield;
                            -moz-appearance: textfield;
                            appearance: textfield;
                        }
                        .NumInput::-webkit-inner-spin-button, 
                        .NumInput::-webkit-outer-spin-button { 
                        -webkit-appearance: none;
                        }
                        
                        #SaveButton{
                            border-top-left-radius: 22px;
                            border-top-right-radius: 22px;
                            border:none;
                            font-weight:600;
                            font-size:17px;
                            color:#ffffff;
                            width:110%;
                            height:40px;
                            align-self:center;
                            background-color:red;
                        }
                        #SaveButton:active{
                            background-color:#c20000;
                        }
                        
                    `}
                    </style>

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