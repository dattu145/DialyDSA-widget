import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StorageService } from '../services/storage';
import { GithubService } from '../services/github';
import { useNavigation } from '@react-navigation/native';

export default function FilterScreen() {
    const [folders, setFolders] = useState<string[]>([]);
    const [selected, setSelected] = useState<string>('All');
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const tree = await StorageService.getCachedFileTree();
            const extracted = GithubService.extractFolders(tree);
            setFolders(['All', ...extracted]);

            const current = await StorageService.getSelectedFolder();
            setSelected(current);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (folder: string) => {
        setSelected(folder);
        await StorageService.saveSelectedFolder(folder);
        // Go back after selection
        navigation.goBack();
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Select Folder for Widget</Text>
            <Text style={styles.subHeader}>Only problems from the selected folder will appear on the widget.</Text>

            <FlatList
                data={folders}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.item,
                            item === selected && styles.selectedItem
                        ]}
                        onPress={() => handleSelect(item)}
                    >
                        <Text style={[
                            styles.text,
                            item === selected && styles.selectedText
                        ]}>{item}</Text>
                        {item === selected && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    subHeader: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        marginBottom: 8,
        borderRadius: 8,
        elevation: 2,
    },
    selectedItem: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
        borderWidth: 1,
    },
    text: {
        fontSize: 16,
        color: '#333',
    },
    selectedText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    checkmark: {
        color: '#4CAF50',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
