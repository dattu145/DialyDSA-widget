import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import { GithubService, Problem } from '../services/github';
import { StorageService } from '../services/storage';

export default function HomeScreen() {
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(false);
    const [codeSnippet, setCodeSnippet] = useState('');
    const navigation = useNavigation();

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => navigation.navigate('Filter')} style={{ marginRight: 16 }}>
                        <Text style={{ color: '#007AFF', fontSize: 16 }}>Filter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Text style={{ color: '#007AFF', fontSize: 16 }}>Settings</Text>
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation]);

    const [repoName, setRepoName] = useState('');

    const loadDailyProblem = async () => {
        setLoading(true);
        try {
            // Load Repo Name
            const config = await StorageService.getConfig();
            if (config) setRepoName(config.repo);

            // Check if widget updated the problem file
            const widgetFile = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'daily_problem.json');
            let currentProblem: Problem | null = null;

            if (widgetFile.exists) {
                const content = await FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'daily_problem.json');
                currentProblem = JSON.parse(content);
            } else {
                currentProblem = await StorageService.getDailyProblem();
            }

            // Enforce Filter
            const selectedFolder = await StorageService.getSelectedFolder();
            if (currentProblem && selectedFolder !== 'All' && !currentProblem.path.startsWith(selectedFolder + '/')) {
                // Current problem doesn't match filter, fetch new one
                await fetchNewProblem();
                return;
            }

            if (currentProblem) {
                // Check if repoName is missing and update if needed
                if (!(currentProblem as any).repoName) {
                    const config = await StorageService.getConfig();
                    if (config) {
                        currentProblem = { ...currentProblem, repoName: config.repo } as any;
                        await StorageService.setDailyProblem(currentProblem!);
                    }
                }

                setProblem(currentProblem);
                // Also fetch snippet for the widget problem
                const problemContent = await GithubService.fetchProblemContent(currentProblem!.path);
                const lines = problemContent.split('\n').slice(0, 15).join('\n');
                setCodeSnippet(lines);
            } else {
                // If no stored problem and no widget problem, fetch a new one
                await fetchNewProblem();
            }
        } catch (error) {
            console.error('Failed to load daily problem', error);
            // Fallback to fetching a new problem if loading fails
            await fetchNewProblem();
        } finally {
            setLoading(false);
        }
    };

    const fetchNewProblem = async () => {
        setLoading(true);
        try {
            // Load Repo Name if not set
            if (!repoName) {
                const config = await StorageService.getConfig();
                if (config) setRepoName(config.repo);
            }

            let tree = await StorageService.getCachedFileTree();
            if (tree.length === 0) {
                tree = await GithubService.fetchFileTree();
                await StorageService.cacheFileTree(tree);
            }

            // Use filtered tree for selection
            const filteredTree = await StorageService.getFilteredFileTree();

            if (filteredTree.length > 0) {
                const randomProblem = filteredTree[Math.floor(Math.random() * filteredTree.length)];
                setProblem(randomProblem);
                await StorageService.setDailyProblem(randomProblem);
                await StorageService.saveHistory(randomProblem);

                // Fetch content for snippet
                const content = await GithubService.fetchProblemContent(randomProblem.path);
                const lines = content.split('\n').slice(0, 15).join('\n');
                setCodeSnippet(lines);
            } else if (tree.length > 0) {
                // Fallback to any problem if filter returns empty
                const randomProblem = tree[Math.floor(Math.random() * tree.length)];
                setProblem(randomProblem);
                await StorageService.setDailyProblem(randomProblem);
                const content = await GithubService.fetchProblemContent(randomProblem.path);
                const lines = content.split('\n').slice(0, 15).join('\n');
                setCodeSnippet(lines);
            }
        } catch (error) {
            console.error(error);
            // Fallback to cache if offline?
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Try to load existing daily problem first
        StorageService.getDailyProblem().then(p => {
            if (p) {
                setProblem(p);
                GithubService.fetchProblemContent(p.path).then(c => {
                    setCodeSnippet(c.split('\n').slice(0, 15).join('\n'));
                });
            } else {
                fetchNewProblem();
            }
        });
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>ViewWidget</Text>
            {repoName ? <Text style={styles.subHeader}>{repoName}</Text> : null}

            {loading && <ActivityIndicator size="large" color="#0000ff" />}

            {problem && !loading && (
                <ScrollView
                    style={styles.content}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNewProblem} />}
                >
                    <View style={styles.card}>
                        <Text style={styles.title}>{problem.name}</Text>
                        <View style={styles.badges}>
                            <Text style={styles.badge}>{problem.difficulty}</Text>
                            <Text style={styles.badge}>{problem.topic}</Text>
                        </View>

                        <Text style={styles.codeHeader}>Preview:</Text>
                        <View style={styles.codeBlock}>
                            <Text style={styles.codeText}>{codeSnippet}</Text>
                        </View>
                    </View>
                </ScrollView>
            )}

            <TouchableOpacity style={styles.button} onPress={fetchNewProblem}>
                <Text style={styles.buttonText}>New Random Problem</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => (navigation as any).navigate('History')}>
                <Text style={styles.secondaryButtonText}>View History</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
        paddingTop: 60,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    subHeader: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 20,
        marginTop: -15,
    },
    content: {
        flex: 1,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    badges: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    badge: {
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginRight: 10,
        fontSize: 14,
        color: '#333',
    },
    codeHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    codeBlock: {
        backgroundColor: '#2d2d2d',
        padding: 15,
        borderRadius: 10,
    },
    codeText: {
        color: '#f8f8f2',
        fontFamily: 'monospace',
        fontSize: 12,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
        marginTop: 10,
    },
    secondaryButtonText: {
        color: '#007AFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
