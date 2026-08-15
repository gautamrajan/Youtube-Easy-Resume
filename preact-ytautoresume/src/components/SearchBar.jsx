import { h, Component } from 'preact';
import Icon from './Icon';
import './styles/searchbar.css';

class SearchBar extends Component {
    constructor(props) {
        super(props);
        this.inputRef = null;
    }

    componentDidMount() {
        if (this.inputRef) {
            this.inputRef.focus();
        }
    }

    handleInputChange = (e) => {
        const value = e.target.value;
        this.props.onSearchChange(value);
    }

    handleKeyDown = event => {
        if (event.key === 'Escape') {
            this.props.onBack();
        }
    }

    render() {
        const { onBack, value } = this.props;
        return (
            <div className="search-bar-container">
                <div className='button-wrapper search-back'>
                    <button type="button" className="back-button top-bar-button" onClick={onBack} aria-label="Close search">
                        <Icon name="back" />
                    </button>

                </div>
                <input
                    ref={(input) => { this.inputRef = input; }}
                    type="text"
                    aria-label="Search saved videos"
                    placeholder="Search videos..."
                    value={value}
                    onInput={this.handleInputChange}
                    onKeyDown={this.handleKeyDown}
                />
            </div>
        );
    }
}

export default SearchBar;
