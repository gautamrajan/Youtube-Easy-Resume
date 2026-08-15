import { h, render } from 'preact';
import Home from './components/home';
import './components/styles/popup.css';

function App() {
    return (
        <main className="AppContainer">
            <Home />
        </main>
    );
}

render(<App />, document.body);
