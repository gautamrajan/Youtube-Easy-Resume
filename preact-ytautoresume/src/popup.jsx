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
                        --scrollbarBG: /* #CFD8DC */transparent;
                        --thumbBG: /* #90A4AE */#d3d3d3; 
                        height:435px;
                    }

                    title{
                        text-overflow: ellipsis;
                        text-align: start;
                    }

                    body{
                        /* min-width: 350px; */
                        margin-top:0;   
                        width:350px;
                        /*min-height: 380px;*/
                        min-height:430px;
                        background-color: #181818;
                    }
                `}  
                </style>
            </div>
            
        )
    }
}
/* render(<title>Videos in progress <style jsx>{`title{text-overflow:ellipsis; text-align:start;}`}</style></title>,document.head); */
render(<App />, document.body);