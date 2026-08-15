import { h, Fragment } from 'preact';
import { extractWatchID, secondsToHMS } from './utilities';

export default function ListElement(props) {
    const video = props.video;
    const selected = props.edit && props.selectedVideos.some(candidate => {
        return extractWatchID(video.videolink) === extractWatchID(candidate.videolink);
    });
    const selectionClass = props.edit ? (selected ? " selected" : " unselected") : "";
    const progress = video.duration > 0
        ? Math.round((video.time / video.duration) * props.maxBarWidth)
        : 0;
    const progressWidth = Math.max(0, Math.min(props.maxBarWidth, progress));
    const content = (
        <Fragment>
            <img src="icons/icon128.png" width="120" height="90" alt="" />
            <div className="element-body">
                <div className="video-info">
                    <span className="video-title">{video.title}</span>
                    <span className="video-channel">{video.channel}</span>
                </div>
                <div className="time-display">
                    <div className="time-info">
                        <span>{secondsToHMS(Math.max(0, video.time))}</span>
                        <span>{secondsToHMS(video.duration)}</span>
                    </div>
                    <span className="progress-bar" style={{ width: `${progressWidth}px` }} aria-hidden="true" />
                </div>
            </div>
        </Fragment>
    );
    const style = {
        marginRight: `${props.marginRight}px`,
        width: `calc(100% - ${props.marginRight + 2}px)`
    };

    if (props.edit) {
        return (
            <button
                type="button"
                className={`main-list-element${selectionClass}`}
                style={style}
                aria-pressed={selected}
                aria-label={`${selected ? "Deselect" : "Select"} ${video.title}`}
                onClick={event => props.eClickHandler(video, props.index, event)}
            >
                {content}
            </button>
        );
    }

    return (
        <a
            className="main-list-element"
            href={video.videolink}
            target="_blank"
            rel="noreferrer"
            title={video.title}
            aria-label={`Open ${video.title}`}
            style={style}
        >
            {content}
        </a>
    );
}
