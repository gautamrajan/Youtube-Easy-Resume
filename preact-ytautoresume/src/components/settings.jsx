import { h, Component } from 'preact';
import Home from './home';
export default class SettingsPage extends Component{
    constructor(){
        super();
        this.state = {
            goBack: false,
        }
    }
    goBack = ()=>{
        this.setState({
            goBack:true
        })
    }

    render(){
        let goBack = this.state.goBack;
        if(goBack){
            return(
                <Home/>
            )
        }
        else{
            return(
                <div className="SettingsContainer">
                    <div className="header-bar">
                    <h1>Settings</h1>
                        <button id="backButton" onClick={this.goBack}>
                            <i class="fa fa-chevron-left"></i>
                        </button>
                    </div>
                    <form className="SettingsPanel">
                        <div className="Setting MinVideoLength">
                            <label for="MinVideoLengthInput" className="SettingLabel">Only resume videos longer than: </label>
                            <div className="MinVideoLength InputContainer">
                                <input type="number" className="NumInput" name="MinVideoLengthInput" id="MinVideoLengthInput"/> minutes
                            </div>
                        </div>
                        <div className="Setting MinWatchTime">
                            <label for="MinWatchTimeInput" className="SettingLabel">Only resume videos I watch for longer than: </label>
                            <div className="MinWatchTime InputContainer">
                                <input type="number" className="NumInput" name="MinWatchTimeInput" id="MinWatchTimeInput"/> minutes
                            </div>
                        </div>
                    </form>
                    <style jsx>{`
                        .fa-chevron-left{
                            color:#ffffff;
                            margin-bottom: 5px;
                        }
                        .SettingsContainer{
                            display:block;
                            max-width:350px;
                            min-height:430px;
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
                            margin-bottom: 5px;
                            color: #ffffff;
                            /* border: 1px solid black; */
                        }
                        .SettingsPanel{
                            margin-top:10px;
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
                    `}
                    </style>

                </div>
            )   
        }
    }
}