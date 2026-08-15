import { h } from 'preact';
import Switch from 'preact-material-components/Switch';
import SearchBar from './SearchBar';
import Icon from './Icon';

const ButtonBar = ({ 
    isSearching, 
    paused, 
    edit, 
    toggleSearch, 
    handleSearchChange, 
    searchQuery, 
    setEdit, 
    handlePause, 
    moveToSettingsPage, 
    deleteSelected 
}) => {
    if (isSearching) {
        return (
            <SearchBar 
                onBack={toggleSearch}
                onSearchChange={handleSearchChange}
                value={searchQuery}
            />
        );
    }

    if (!edit) {
        return (
            <div className="button-container">
                <div className="button-wrapper">
                    <button type="button" id="SearchButton" className="top-bar-button" onClick={toggleSearch} aria-label="Search videos">
                        <Icon name="search" />
                    </button>
                </div>  
                <div className="button-wrapper">
                    <button type="button" id="EditButton" className="top-bar-button" onClick={setEdit} aria-label="Delete videos">
                        <Icon name="delete" />
                    </button>
                </div>
                {/* <div className={`AR SwitchContainer ${paused ? "Off" : "On"}`}>
                    <label for="AutoResumeToggle">
                        <span className={`SwitchLabel ${paused ? "Off" : "On"}`} id="AutoRedSwitchLabel">{paused ? "OFF" : "ON"}</span>
                    </label>
                    <Switch name="AutoResumeToggle" checked={!paused} onChange={handlePause}/>
                </div> */}
                <div className="button-wrapper">
                    <button type="button" id="SettingsButton" className="top-bar-button" onClick={moveToSettingsPage} aria-label="Open settings">
                        <Icon name="settings" />
                    </button>
                </div>
                <style jsx>{`
                    .button-container{
                        margin-bottom:2px;
                    }
                    .SwitchLabel{
                        font-weight:600;
                    }
                    .SwitchLabel.On{
                        color:red;
                        padding-right:4px;
                    }
                    .SwitchLabel.Off{
                        color:white;
                        opacity: 0.4;
                    }    
                    .SwitchContainer.On{
                        margin-left:6px;
                    }
                `}</style>
            </div>
        );
    } else {
        return (
            <div className="button-container">
                <button className="button editmode" type="button" id="ConfirmDeleteButton" onClick={deleteSelected} aria-label="Delete selected videos">
                    <Icon name="check" />
                </button>
                <button className="button editmode" type="button" id="ExitEditButton" onClick={setEdit} aria-label="Cancel deleting videos">
                    <Icon name="close" />
                </button>
            </div>
        );
    }
};

export default ButtonBar;
