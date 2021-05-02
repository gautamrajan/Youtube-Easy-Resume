import { h, Component } from 'preact';
import Home from './home';
export default class SettingsPage extends Component{
    constructor(){
        super();
        this.state = {
            dataReady:false,
            goBack: false,
            settingsChanged:false,
            settings:{},
        }
    }
    settingsChangedHandler = () =>{
        if(this.state.dataReady && !this.state.settingsChanged){
            this.setState({settingsChanged:true});
        }
    }
    secondsToMinutes = (seconds) => {
        if(seconds<60){
            return seconds;
        }
        else{
            return Math.round(seconds/60);
        }
    }
    componentDidMount(){
        chrome.storage.local.get("settings",(data)=>{
            this.setState({settings: data.settings, dataReady:true},);
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
        var initMVL = this.state.settings.minVideoLength;
        var initMWT = this.state.settings.minWatchTime;
        var initMPT = this.state.settings.markPlayedTime;
        let settingsChanged = this.state.settingsChanged;
        if(goBack){
            return(
                <Home/>
            )
        }
        if(dataReady){
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
                                    value={this.secondsToMinutes(initMVL)}
                                    onChange={()=>{this.settingsChangedHandler()}}/> minutes
                                </div>
                            </div>
                            <div className="Setting MinWatchTime">
                                <label for="MinWatchTimeInput" className="SettingLabel">Only resume videos I watch for at least: </label>
                                <div className="MinWatchTime InputContainer">
                                    <input type="number" className="NumInput" name="MinWatchTimeInput" id="MinWatchTimeInput"
                                    value={this.secondsToMinutes(initMWT)}
                                    onChange={this.settingsChangedHandler}/> minutes
                                </div>
                            </div>
                            <div className="Setting ConsiderComplete">
                                <label for="ConsiderCompleteInput" className="SettingLabel">Mark as video as played: </label>
                                <div className="ConsiderComplete InputContainer">
                                    <input type="number" className="NumInput" name="ConsiderCompleteInput" id="ConsiderCompleteInput"
                                    value={this.secondsToMinutes(initMPT)}
                                    onChange={this.settingsChangedHandler}/> 
                                    <select className="TimeUnitSelector" name="ConsiderCompleteUnits" id="ConsiderCompleteUnits">
                                        <option value="minutes">minutes</option>
                                        <option value="seconds">seconds</option>
                                    </select>
                                    away from the end.
                                </div>
                            </div>
                        </form>
                        {settingsChanged?<button type="button" id="SaveButton">Save Settings</button>:null}
                    </div>
                    {/* <div id="bottomContainer">
                        
                    </div> */}
                    


                    <style jsx>{`
                        body{
                            margin-bottom:0px;
                        }
                        .fa-chevron-left{
                            color:#ffffff;
                            margin-bottom: 5px;
                        }
                        .SettingsContainer{
                            display:flex;
                            flex-direction:column;
                            max-width:350px;
                            min-height:430px;
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
                            {/* background-color: rgba(99, 99, 99, 0.781); */}
                        }
                        div.header-bar button:active{
                            background-color: rgba(158, 158, 158, 0.781);
                        }
                        h1{
                            margin-top:10px;
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
                            margin-top:5px;
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