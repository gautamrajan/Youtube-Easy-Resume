import extensionApi from './extensionApi';
import { createVideoStorage } from './videoStorage';

const videoStorage = createVideoStorage(extensionApi.storage.local);

export default videoStorage;
