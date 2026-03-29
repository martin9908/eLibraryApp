import AppNavigator from '@/src/navigation/AppNavigator';

if (__DEV__) {
  void import('@/src/lib/reactotron');
}

export default function App() {
  return <AppNavigator />;
}