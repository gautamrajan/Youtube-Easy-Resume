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
                            <label for="MinVideoLengthInput">Only resume videos longer than: </label>
                            <div className="MinVideoLength InputContainer">
                                <input type="number" name="MinVideoLengthInput" id="MinVideoLengthInput"/> minutes
                            </div>
                            
                        </div>
                    </form>
                    <style jsx>{`
                        .fa-chevron-left{
                            color:#ffffff;
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
                            display: flex;
                            flex-direction:row;
                            justify-content:space-between;
                            align-items:center;
                            color: #ffffff;
                            font-size:15px;
                        }
                        .InputContainer{
                            display:inline-flex;
                            justify-content:flex-end;
                            align-items:center;
                            flex-direction:row;
                            max-width:50%;
                        }
                        #MinVideoLengthInput{
                            width:40%;
                            height:50%;
                            margin-right:3px;
                        }
                    `}
                    </style>

                </div>
            )   
        }
    }
}