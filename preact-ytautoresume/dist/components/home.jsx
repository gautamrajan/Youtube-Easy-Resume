import { h, Component } from 'preact';
import './styles/home.css';
import MainList from "./mainlist";
import SettingsPage from "./settings"
export default class Home extends Component{
    constructor(){
        super();
        this.state = {
            dataReady:false,
            settingsPage: false,
            paused: false,
        }
    }
    moveToSettingsPage = ()=>{
        this.setState({
            settingsPage:true
        });
    }
    componentDidMount(){
        initSettingsDB().then(
            ()=>{
                chrome.storage.local.get("settings",(data)=>{
                    console.log("in constructor, data.settings.pauseResume = " + data.settings.pauseResume);
                    this.setState({
                        paused: data.settings.pauseResume,
                        dataReady:true,
                    });
                });
            }
        );
    }
    handlePause = ()=>{
        var newState;
        if(this.state.paused == false){
            newState = true;
        }else{newState = false}
        //let setPause = new Promise((resolve)=>{
            chrome.storage.local.set(
                {
                    settings:{
                        pauseResume: newState
                    }
                }
            ,()=>{
                this.setState({
                paused:newState
            })}
            );
        //});
        /* setPause.then(()=>{ 
            this.setState({
                paused:newState
            })
            }
        ); */

    }
    render(/* {},{paused} */){
        let paused = this.state.paused;
        let settingsPage = this.state.settingsPage;
        var pauseButtonText = "";
        console.log(paused);
        if(paused){pauseButtonText = "Unpause"}else{pauseButtonText = "Pause"};
        if(this.state.dataReady){
            if(settingsPage){
                return(<SettingsPage/>)
            }
            else{
                return(
                    <div className="HomeContainer">
                        <div className="header-bar">
                            <h1>Currently watching</h1>
                            <div className="button-container">
                                <button id="Pause" onClick={this.handlePause}>
                                    {pauseButtonText}
                                </button>
                                {/* <button type="button" id="ClearListButton"> Clear List </button> */}
                                <button type="button" id="SettingsButton" onClick={this.moveToSettingsPage}>
                                    {/* Settings */}
                                    <i class="fas fa-cog"></i>
                                </button>
                            </div>
                        </div>
                        <MainList/>

                    </div>
                )
            }
        }
        else{
            //loading...
            return(null);
        }
    }
}
function initSettingsDB(){
    return new Promise((resolve)=>{
        chrome.storage.local.getBytesInUse("settings",(bytes)=>{
            console.log("INIT SETTINGS DB");
            if(bytes == undefined || bytes == 0){
                console.log("BYTES==0 OR UNDEFINED");
                chrome.storage.local.set(
                {
                    settings:{
                        pauseResume:false,
                    }
                },()=>{resolve();})
            }
            else{
                console.log("BYTES!=0");
               resolve(); 
            }
            
        })
    })
}