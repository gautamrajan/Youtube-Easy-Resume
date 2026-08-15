# YouTube Easy Resume

A Chrome and Firefox extension that adds auto-resume functionality to YouTube videos. Videos automatically resume from where you left off, and in-progress videos are displayed in a popup. Configurable settings control which videos resume, and a toggle is added to the YouTube player.

Both browsers use the same source and generated content/popup bundles. Browser-specific API namespace selection is isolated in `preact-ytautoresume/src/extensionApi.js`.
