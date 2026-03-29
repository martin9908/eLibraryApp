import Constants from 'expo-constants';
import Reactotron from 'reactotron-react-native';

declare global {
    interface Console {
        tron?: typeof Reactotron;
    }
}

function getExpoHost() {
    const hostUri =
        Constants.expoConfig?.hostUri ??
        Constants.manifest2?.extra?.expoClient?.hostUri ??
        Constants.manifest?.debuggerHost;

    if (!hostUri) {
        return 'localhost';
    }

    return hostUri.split(':')[0] ?? 'localhost';
}

const reactotron = Reactotron.configure({
    name: 'eLibraryApp',
    host: getExpoHost(),
})
    .useReactNative()
    .connect();

console.tron = reactotron;

export default reactotron;