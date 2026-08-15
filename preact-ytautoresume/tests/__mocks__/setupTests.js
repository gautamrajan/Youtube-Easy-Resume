global.flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
require('../../src/videoStorage');
