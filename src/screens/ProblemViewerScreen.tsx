import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { GithubService, Problem } from '../services/github';
import { useRoute } from '@react-navigation/native';

export default function ProblemViewerScreen() {
    const route = useRoute<any>();
    const { problem } = route.params;
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        try {
            const text = await GithubService.fetchProblemContent(problem.path);
            setContent(text);
        } catch (error) {
            setContent('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : (
                <ScrollView style={styles.scrollView}>
                    <Text style={styles.code}>{content}</Text>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loader: {
        marginTop: 50,
    },
    scrollView: {
        flex: 1,
        padding: 15,
    },
    code: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#333',
    },
});
