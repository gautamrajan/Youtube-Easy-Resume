import { h } from 'preact';

const ICON_PATHS = {
    back: 'M19 12H5m6-6-6 6 6 6',
    check: 'm5 12 4 4L19 6',
    close: 'M6 6l12 12M18 6 6 18',
    delete: 'M5 7h14M9 7V4h6v3m2 0-1 13H8L7 7m3 4v5m4-5v5',
    search: 'M10.5 5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm4 9.5L20 20',
    settings: 'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'
};

export default function Icon({ name }) {
    return (
        <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d={ICON_PATHS[name]} fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
