import { h, Component } from 'preact';
import './styles/home.css';
import MainList from "./mainlist";
export default class Home extends Component{
    constructor(){
        super();
        /* this.state = {
            settingsPage: false,
            paused: false,
        } */
        initSettingsDB().then(
            ()=>{
                chrome.storage.local.get("settings",(data)=>{
                    this.state={
                        paused: data.settings.pauseResume,
                        settingsPage:false
                    }
                });
            }
        )

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
    render({},{paused}){
        return(
            <div className="HomeContainer">
                <div className="header-bar">
                    <h1>Videos in progress</h1>
                    <button id="Pause" onClick={this.handlePause}>
                        {/* <i id="PauseIcon" className="fa fa-pause-circle">
                            <div></div>
                        </i> */}
                        {paused ? "Pause" : "Unpause"}
                    </button>
                    <button type="button" id="ClearListButton"> Clear List </button>
                </div>
                <MainList/>
                <style jsx>{`
                    {/* #Pause{
                        display:flex;
                        flex-direction:column;
                        justify-content:center;
                        align-items:center;
                        background:none;
                        background-color:transparent;
                        border:none;
                        height:25px;
                        width:25px;
                        margin-bottom:3px;
                        font-size:20px;
                        color:rgba(99, 99, 99, 0.781);
                    }   
                    #Pause:active{
                        color:rgba(158, 158, 158, 0.781)
                    } */}
                `}  
                </style>
            </div>
        )
    }
}
function initSettingsDB(){
    return new Promise((resolve)=>{
        chrome.storage.local.getBytesInUse("settings",(bytes)=>{
            if(bytes == undefined || bytes == 0){
                chrome.storage.local.set(
                {
                    settings:{
                        pauseResume:false,
                    }
                })
            }
            resolve();
        })
    })
}