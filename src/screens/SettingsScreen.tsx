import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StorageService } from '../services/storage';
import { GithubService } from '../services/github';

export default function SettingsScreen() {
    const [username, setUsername] = useState('');
    const [repo, setRepo] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        const config = await StorageService.getConfig();
        if (config) {
            setUsername(config.username);
            setRepo(config.repo);
            setToken(config.token || '');
        }
    };

    const handleSave = async () => {
        if (!username || !repo) {
            Alert.alert('Error', 'Username and Repository are required.');
            return;
        }

        setLoading(true);
        try {
            await StorageService.saveConfig({
                username,
                repo,
                token: token || undefined
            });

            // Clear existing cache and fetch new data
            await StorageService.clearCache();

            // We can't easily trigger HomeScreen refresh from here directly without context/redux,
            // but resetting navigation to Home will trigger its useEffect/useFocusEffect.
            // However, we should try to prime the cache here if possible to ensure widget gets updated.

            // Prime the cache
            const tree = await GithubService.fetchFileTree();
            await StorageService.cacheFileTree(tree);

            if (tree.length > 0) {
                const randomProblem = tree[Math.floor(Math.random() * tree.length)];
                await StorageService.setDailyProblem(randomProblem);
            }

            Alert.alert('Success', 'Configuration saved! Repository loaded.', [
                { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save configuration.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>GitHub Configuration</Text>
            <Text style={styles.subtitle}>Enter your repository details to fetch problems.</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>GitHub Username</Text>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="e.g., dattu145"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Repository Name</Text>
                <TextInput
                    style={styles.input}
                    value={repo}
                    onChangeText={setRepo}
                    placeholder="e.g., DialyDSA-widget"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Personal Access Token (Optional)</Text>
                <TextInput
                    style={styles.input}
                    value={token}
                    onChangeText={setToken}
                    placeholder="Required for private repos"
                    secureTextEntry
                    autoCapitalize="none"
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.disabledButton]}
                onPress={handleSave}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.buttonText}>Save Configuration</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        color: '#000',
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    disabledButton: {
        backgroundColor: '#A5D6A7',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
