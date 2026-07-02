import 'react-native-gesture-handler';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { HapticTab, IconSymbol } from '@/src/components/atoms';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import AccountScreen from '@/src/screens/AccountScreen';
import BookDetailScreen from '@/src/screens/BookDetailScreen';
import BorrowHistoryScreen from '@/src/screens/BorrowHistoryScreen';
import CatalogScreen from '@/src/screens/CatalogScreen';
import HomeScreen from '@/src/screens/HomeScreen';
import ModalScreen from '@/src/screens/ModalScreen';
import ReaderScreen from '@/src/screens/ReaderScreen';
import LoginScreen from '@/src/screens/auth/LoginScreen';
import RegisterScreen from '@/src/screens/auth/RegisterScreen';
import { getPaperTheme } from '@/src/theme/paperTheme';
import type { RootStackParamList, RootTabParamList } from '@/src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function TabNavigator() {
  const colorScheme = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const theme = getPaperTheme(mode);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="books.vertical.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

/** Shown while Firebase resolves the initial persisted auth state. */
function SplashScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function RootNavigator() {
  const { user, initialising } = useAuth();
  const colorScheme = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const paperTheme = getPaperTheme(mode);

  if (initialising) return <SplashScreen />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: paperTheme.colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: paperTheme.colors.background },
      }}>
      {user ? (
        // ── Authenticated screens ──────────────────────────────────────────
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="Modal" component={ModalScreen} options={{ presentation: 'modal', title: 'Search' }} />
          <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: '' }} />
          <Stack.Screen name="BorrowHistory" component={BorrowHistoryScreen} options={{ title: 'Borrow History' }} />
          <Stack.Screen name="Reader" component={ReaderScreen} options={{ title: 'Now Reading' }} />
        </>
      ) : (
        // ── Auth screens ───────────────────────────────────────────────────
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const colorScheme = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const paperTheme = getPaperTheme(mode);

  return (
    <AuthProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer theme={mode === 'dark' ? DarkTheme : DefaultTheme}>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}