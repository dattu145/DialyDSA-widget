import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StorageService } from '../services/storage';
import { Problem } from '../services/github';
import { useNavigation } from '@react-navigation/native';

export default function HistoryScreen() {
    const [history, setHistory] = useState<Problem[]>([]);
    const navigation = useNavigation<any>();

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const data = await StorageService.getHistory();
        setHistory(data);
    };

    const renderItem = ({ item }: { item: Problem }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('ProblemViewer', { problem: item })}
        >
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>{item.difficulty} • {item.topic}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={(item) => item.path}
                ListEmptyComponent={<Text style={styles.empty}>No history yet</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 10,
    },
    item: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
});
