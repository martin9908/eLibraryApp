import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/context/AuthContext';
import { getBrandColors } from '@/src/theme/brand';
import type { RootStackParamList } from '@/src/types/navigation';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
    const { signIn } = useAuth();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const brand = getBrandColors(colorScheme === 'dark' ? 'dark' : 'light');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignIn = async () => {
        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await signIn(email.trim(), password);
            // Navigation happens automatically via onAuthStateChanged → AppNavigator.
        } catch (e) {
            setError(friendlyAuthError(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            {/* ── Hero header ── */}
            <LinearGradient
                colors={brand.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, { paddingTop: insets.top + 32 }]}>
                <Text style={[styles.heroTitle, { color: brand.heroText }]}>eLibrary</Text>
                <Text style={[styles.heroSubtitle, { color: brand.heroSubtext }]}>
                    Your digital library, anywhere.
                </Text>
            </LinearGradient>

            {/* ── Form card ── */}
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={[styles.formScroll, { paddingBottom: insets.bottom + 24 }]}
                    keyboardShouldPersistTaps="handled">
                    <Text variant="headlineSmall" style={styles.formTitle}>
                        Sign in
                    </Text>
                    <Text variant="bodyMedium" style={styles.formSubtitle}>
                        Welcome back! Enter your library account details.
                    </Text>

                    <TextInput
                        label="Email address"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        returnKeyType="next"
                        left={<TextInput.Icon icon="email-outline" />}
                        style={styles.input}
                        mode="outlined"
                    />

                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoComplete="current-password"
                        returnKeyType="done"
                        onSubmitEditing={handleSignIn}
                        left={<TextInput.Icon icon="lock-outline" />}
                        right={
                            <TextInput.Icon
                                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                onPress={() => setShowPassword((v) => !v)}
                            />
                        }
                        style={styles.input}
                        mode="outlined"
                    />

                    {error ? (
                        <HelperText type="error" visible style={styles.helperText}>
                            {error}
                        </HelperText>
                    ) : null}

                    <Button
                        mode="contained"
                        onPress={handleSignIn}
                        loading={loading}
                        disabled={loading}
                        contentStyle={styles.buttonContent}
                        style={styles.button}>
                        Sign In
                    </Button>

                    <View style={styles.footer}>
                        <Text variant="bodyMedium" style={styles.footerText}>
                            Don't have an account?{' '}
                        </Text>
                        <Button
                            mode="text"
                            compact
                            onPress={() => navigation.navigate('Register')}
                            style={styles.linkButton}>
                            Register
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

function friendlyAuthError(e: unknown): string {
    if (!(e instanceof Error)) return 'Something went wrong. Please try again.';
    const code = (e as { code?: string }).code ?? '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        return 'No account found with those credentials.';
    }
    if (code === 'auth/wrong-password') return 'Incorrect password.';
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.';
    return e.message;
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },
    hero: {
        paddingHorizontal: 28,
        paddingBottom: 40,
    },
    heroTitle: {
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    heroSubtitle: {
        fontSize: 15,
        marginTop: 6,
    },
    formScroll: {
        paddingHorizontal: 24,
        paddingTop: 32,
        gap: 4,
    },
    formTitle: {
        fontWeight: '800',
        marginBottom: 4,
    },
    formSubtitle: {
        opacity: 0.6,
        marginBottom: 20,
    },
    input: {
        marginBottom: 12,
    },
    helperText: {
        marginBottom: 4,
    },
    button: {
        marginTop: 8,
        borderRadius: 12,
    },
    buttonContent: {
        height: 52,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    footerText: {
        opacity: 0.6,
    },
    linkButton: {
        marginLeft: -8,
    },
});
