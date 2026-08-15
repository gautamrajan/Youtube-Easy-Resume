import { h, Component } from 'preact';
import Snackbar from 'preact-material-components/Snackbar';
import 'preact-material-components/Snackbar/style.css';
import Switch from 'preact-material-components/Switch';
import 'preact-material-components/Switch/style.css';
import './styles/settings.css';
import Home from './home';
import extensionApi from '../extensionApi';
import {
    normalizeSettings,
    NUMERIC_SETTING_RULES,
    settingsEqual,
    validateSettings
} from '../settings';
import Icon from './Icon';

const TIME_SETTING_KEYS = new Set(["minVideoLength", "minWatchTime", "markPlayedTime"]);

export default class SettingsPage extends Component {
    constructor() {
        super();
        this.state = {
            dataReady: false,
            goBack: false,
            settingsChanged: false,
            settings: {},
            newSettings: {},
            validationErrors: {},
            paused: false
        };
    }

    updateDraft = newSettings => {
        this.setState({
            newSettings,
            paused: newSettings.pauseResume,
            settingsChanged: !settingsEqual(this.state.settings, newSettings),
            validationErrors: validateSettings(newSettings)
        });
    };

    settingsChangedHandler = (event, setting) => {
        const rawValue = event.currentTarget.value;
        const inputValue = rawValue === "" ? Number.NaN : Number(rawValue);
        const value = TIME_SETTING_KEYS.has(setting) ? inputValue * 60 : inputValue;
        this.updateDraft({ ...this.state.newSettings, [setting]: value });
    };

    saveSettings = async event => {
        event?.preventDefault();
        const validationErrors = validateSettings(this.state.newSettings);
        if (Object.keys(validationErrors).length > 0) {
            this.setState({ validationErrors });
            return false;
        }

        const settings = normalizeSettings(this.state.newSettings);
        await extensionApi.storage.local.set({ settings });
        this.setState({
            settings,
            newSettings: settings,
            settingsChanged: false,
            validationErrors: {}
        }, () => {
            this.bar?.MDComponent?.show({
                message: "Settings saved successfully"
            });
        });
        return true;
    };

    async componentDidMount() {
        const data = await extensionApi.storage.local.get("settings");
        const settings = normalizeSettings(data.settings);
        if (!settingsEqual(data.settings, settings)) {
            await extensionApi.storage.local.set({ settings });
        }
        this.setState({
            settings,
            newSettings: settings,
            dataReady: true,
            paused: settings.pauseResume
        });
    }

    goBack = () => {
        this.setState({ goBack: true });
    };

    handlePause = () => {
        this.updateDraft({
            ...this.state.newSettings,
            pauseResume: !this.state.newSettings.pauseResume
        });
    };

    getInputValue(setting) {
        const value = this.state.newSettings[setting];
        if (!Number.isFinite(value)) {
            return "";
        }
        return TIME_SETTING_KEYS.has(setting) ? value / 60 : value;
    }

    renderNumberSetting({ setting, id, label, suffix, className = "" }) {
        const rule = NUMERIC_SETTING_RULES[setting];
        const isTimeSetting = TIME_SETTING_KEYS.has(setting);
        const min = isTimeSetting ? rule.min / 60 : rule.min;
        const max = isTimeSetting ? rule.max / 60 : rule.max;
        const error = this.state.validationErrors[setting];
        const errorId = `${id}Error`;
        const suffixId = `${id}Unit`;
        const describedBy = error ? `${suffixId} ${errorId}` : suffixId;

        return (
            <div className={`Setting ${className}`}>
                <label htmlFor={id} className="SettingLabel">{label}</label>
                <div className={`InputContainer ${className}`}>
                    <input
                        type="number"
                        className="NumInput"
                        name={id}
                        id={id}
                        min={min}
                        max={max}
                        step={rule.integer ? 1 : "any"}
                        required
                        value={this.getInputValue(setting)}
                        aria-invalid={error ? "true" : "false"}
                        aria-describedby={describedBy}
                        onInput={event => this.settingsChangedHandler(event, setting)}
                    />
                    <span id={suffixId}>{suffix}</span>
                </div>
                {error ? <span className="SettingError" id={errorId} role="alert">{error}</span> : null}
            </div>
        );
    }

    render() {
        if (this.state.goBack) {
            return <Home />;
        }
        if (!this.state.dataReady) {
            return null;
        }

        const paused = this.state.paused;
        const hasErrors = Object.keys(this.state.validationErrors).length > 0;
        return (
            <div className="SettingsContainer">
                <div className="header-bar SettingsHeader">
                    <h1>Settings</h1>
                    <div className="button-wrapper">
                        <button type="button" id="backButton" className="top-bar-button" onClick={this.goBack} aria-label="Close settings">
                            <Icon name="back" />
                        </button>
                    </div>
                </div>
                <form id="MainPanel" onSubmit={this.saveSettings}>
                    <div className="SettingsPanel">
                        <div className="Setting AutoResume">
                            <label id="AutoResumeLabel" htmlFor="AutoResumeToggle" className="SettingLabel">Auto Resume</label>
                            <div className={`AR SwitchContainer ${paused ? "Off" : "On"}`}>
                                <span className={`SwitchLabel ${paused ? "Off" : "On"}`} id="AutoResumeStatus" aria-live="polite">
                                    {paused ? "OFF" : "ON"}
                                </span>
                                <Switch
                                    id="AutoResumeToggle"
                                    name="AutoResumeToggle"
                                    checked={!paused}
                                    aria-labelledby="AutoResumeLabel AutoResumeStatus"
                                    onChange={this.handlePause}
                                />
                            </div>
                        </div>
                        {this.renderNumberSetting({
                            setting: "minVideoLength",
                            id: "MinVideoLengthInput",
                            label: "Only resume videos longer than:",
                            suffix: "minute(s)",
                            className: "MinVideoLength"
                        })}
                        {this.renderNumberSetting({
                            setting: "minWatchTime",
                            id: "MinWatchTimeInput",
                            label: "Only resume videos I watch for at least:",
                            suffix: "minute(s)",
                            className: "MinWatchTime"
                        })}
                        {this.renderNumberSetting({
                            setting: "markPlayedTime",
                            id: "ConsiderCompleteInput",
                            label: "Mark a video as played when it is:",
                            suffix: "minute(s) from the end",
                            className: "ConsiderComplete"
                        })}
                        {this.renderNumberSetting({
                            setting: "deleteAfter",
                            id: "DeleteAfterInput",
                            label: "Automatically remove videos after:",
                            suffix: "day(s)",
                            className: "DeleteAfter"
                        })}
                        <div className="MadeBy Message">
                            Made with ❤️ at
                            <a href="https://www.youtube.com/c/AnnenbergMedia" target="_blank" rel="noreferrer">Annenberg Media</a>
                        </div>
                    </div>
                    {this.state.settingsChanged
                        ? <button type="submit" id="SaveButton" disabled={hasErrors}>Save Settings</button>
                        : null}
                    <Snackbar ref={bar => { this.bar = bar; }} />
                </form>
            </div>
        );
    }
}
