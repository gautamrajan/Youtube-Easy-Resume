import {h, render, Component } from 'preact';
import Home from './components/home';
class App extends Component{
    constructor(){
        super();
    }
    render(){
        return(
            <div className="AppContainer">
               <Home/> 
                <style jsx>{`
                    html{
                        --scrollbarBG: transparent;
                        --thumbBG: #d3d3d3; 
                        height:435px;
                    }

                    title{
                        text-overflow: ellipsis;
                        text-align: start;
                    }

                    body{
                        margin-top:0;   
                        width:350px;
                        min-height:430px;
                        background-color: #181818;
                    }
                `}  
                </style>
            </div>
            
        )
    }
}
render(<App />, document.body);