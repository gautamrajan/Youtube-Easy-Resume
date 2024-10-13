import { h } from 'preact';
import Switch from 'preact-material-components/Switch';
import SearchBar from './SearchBar';

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
                    <button type="button" id="SearchButton" className="top-bar-button" onClick={toggleSearch}>
                        <i class="fas fa-search"></i>
                    </button>
                </div>  
                <div className="button-wrapper">
                    <button type="button" id="EditButton" className="top-bar-button" onClick={setEdit}>
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                <div className={`AR SwitchContainer ${paused ? "Off" : "On"}`}>
                    <label for="AutoResumeToggle">
                        <span className={`SwitchLabel ${paused ? "Off" : "On"}`} id="AutoRedSwitchLabel">{paused ? "OFF" : "ON"}</span>
                    </label>
                    <Switch name="AutoResumeToggle" checked={!paused} onChange={handlePause}/>
                </div>
                <button type="button" id="SettingsButton" className="top-bar-button" onClick={moveToSettingsPage}>
                    <i class="fas fa-cog"></i>
                </button>
                <style jsx>{`
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
                <button className="button editmode" type="button" id="ConfirmDeleteButton" onClick={deleteSelected}>
                    <i class="fas fa-check"></i>
                </button>
                <button className="button editmode" type="button" id="ExitEditButton" onClick={setEdit}>
                    <i class="fa fa-times" aria-hidden="true"></i>
                </button>
            </div>
        );
    }
};

export default ButtonBar;