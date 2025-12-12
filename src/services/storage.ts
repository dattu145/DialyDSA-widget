import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Problem, GithubService } from './github';

const KEYS = {
    HISTORY: 'dsa_history',
    DAILY_PROBLEM: 'dsa_daily_problem',
    LAST_FETCH_DATE: 'dsa_last_fetch_date',
    CACHE_TREE: 'dsa_file_tree',
};

const WIDGET_FILE_URI = FileSystem.documentDirectory + 'daily_problem.json';
const WIDGET_CACHE_URI = FileSystem.documentDirectory + 'problem_cache.json';

export const StorageService = {
    async saveHistory(problem: Problem) {
        try {
            const history = await this.getHistory();
            // Avoid duplicates at the top
            const newHistory = [problem, ...history.filter(p => p.path !== problem.path)].slice(0, 50);
            await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(newHistory));
        } catch (e) {
            console.error('Failed to save history', e);
        }
    },

    async getHistory(): Promise<Problem[]> {
        try {
            const json = await AsyncStorage.getItem(KEYS.HISTORY);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('Failed to get history', e);
            return [];
        }
    },

    async setDailyProblem(problem: Problem) {
        try {
            // Check if seen
            const history = await this.getHistory();
            const isSeen = history.some(p => p.path === problem.path);

            // Fetch full content for the widget
            let fullContent = '';
            try {
                fullContent = await GithubService.fetchProblemContent(problem.path);
            } catch (e) {
                console.error('Failed to fetch content for widget', e);
                fullContent = '// Failed to load code';
            }

            const config = await this.getConfig();
            const repoName = config ? config.repo : 'Unknown Repo';

            const problemWithMeta = {
                ...problem,
                seen: isSeen,
                code: fullContent, // Add code to the object stored for widget
                repoName: repoName
            };

            const json = JSON.stringify(problemWithMeta);
            await AsyncStorage.setItem(KEYS.DAILY_PROBLEM, json);
            await AsyncStorage.setItem(KEYS.LAST_FETCH_DATE, new Date().toISOString());

            // Write to file for Widget
            await FileSystem.writeAsStringAsync(WIDGET_FILE_URI, json);
        } catch (e) {
            console.error('Failed to set daily problem', e);
        }
    },

    async getDailyProblem(): Promise<Problem | null> {
        try {
            const json = await AsyncStorage.getItem(KEYS.DAILY_PROBLEM);
            return json ? JSON.parse(json) : null;
        } catch (e) {
            return null;
        }
    },

    async cacheFileTree(tree: Problem[]) {
        try {
            await AsyncStorage.setItem(KEYS.CACHE_TREE, JSON.stringify(tree));

            // Apply filter for widget
            const selectedFolder = await this.getSelectedFolder();
            let widgetTree = tree;
            if (selectedFolder && selectedFolder !== 'All') {
                widgetTree = tree.filter(p => p.path.startsWith(selectedFolder + '/'));
            }

            // Save for widget to pick random
            await FileSystem.writeAsStringAsync(WIDGET_CACHE_URI, JSON.stringify(widgetTree));
        } catch (e) {
            console.error('Failed to cache file tree', e);
        }
    },

    async saveSelectedFolder(folder: string) {
        try {
            await AsyncStorage.setItem('dsa_selected_folder', folder);
            // Re-cache with new filter
            const tree = await this.getCachedFileTree();
            if (tree.length > 0) {
                await this.cacheFileTree(tree);
            }
        } catch (e) {
            console.error('Failed to save selected folder', e);
        }
    },

    async getSelectedFolder(): Promise<string> {
        try {
            return await AsyncStorage.getItem('dsa_selected_folder') || 'All';
        } catch (e) {
            return 'All';
        }
    },

    async saveConfig(config: { username: string; repo: string; token?: string }) {
        try {
            await AsyncStorage.setItem('dsa_config', JSON.stringify(config));
        } catch (e) {
            console.error('Failed to save config', e);
        }
    },

    async getConfig(): Promise<{ username: string; repo: string; token?: string } | null> {
        try {
            const json = await AsyncStorage.getItem('dsa_config');
            return json ? JSON.parse(json) : null;
        } catch (e) {
            return null;
        }
    },

    async getCachedFileTree(): Promise<Problem[]> {
        try {
            const json = await AsyncStorage.getItem(KEYS.CACHE_TREE);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            return [];
        }
    },

    async getFilteredFileTree(): Promise<Problem[]> {
        try {
            const tree = await this.getCachedFileTree();
            const selectedFolder = await this.getSelectedFolder();
            if (selectedFolder && selectedFolder !== 'All') {
                return tree.filter(p => p.path.startsWith(selectedFolder + '/'));
            }
            return tree;
        } catch (e) {
            return [];
        }
    },

    async clearCache() {
        try {
            await AsyncStorage.multiRemove([
                KEYS.HISTORY,
                KEYS.DAILY_PROBLEM,
                KEYS.LAST_FETCH_DATE,
                KEYS.CACHE_TREE,
                'dsa_selected_folder'
            ]);
            // Also clear file system cache
            await FileSystem.deleteAsync(WIDGET_FILE_URI, { idempotent: true });
            await FileSystem.deleteAsync(WIDGET_CACHE_URI, { idempotent: true });
        } catch (e) {
            console.error('Failed to clear cache', e);
        }
    }
};
