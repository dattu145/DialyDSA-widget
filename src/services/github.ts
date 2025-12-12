import { StorageService } from './storage';

export interface Problem {
    name: string;
    path: string;
    url: string;
    difficulty: string;
    topic: string;
    sha: string;
    // Enhanced Metadata
    intuition?: string;
    technique?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    seen?: boolean;
}

const BASE_URL = 'https://api.github.com/repos';
const RAW_URL = 'https://raw.githubusercontent.com';

export const GithubService = {
    async fetchFileTree(): Promise<Problem[]> {
        try {
            const config = await StorageService.getConfig();
            if (!config) throw new Error('Configuration missing');

            // Fetch File Tree
            const treeResponse = await fetch(
                `${BASE_URL}/${config.username}/${config.repo}/git/trees/main?recursive=1`,
                {
                    headers: config.token
                        ? { Authorization: `token ${config.token}` }
                        : {},
                }
            );

            if (!treeResponse.ok) {
                throw new Error(`GitHub API Error: ${treeResponse.statusText}`);
            }

            const treeData = await treeResponse.json();

            // Filter for files (blobs) and exclude common non-code assets
            const excludedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.jar', '.class'];
            const files = treeData.tree.filter((item: any) => {
                if (item.type !== 'blob') return false;
                const lowerPath = item.path.toLowerCase();
                return !excludedExtensions.some(ext => lowerPath.endsWith(ext));
            });

            // Fetch Metadata JSON (Optional)
            let metadata = {};
            try {
                const metaResponse = await fetch(
                    `${RAW_URL}/${config.username}/${config.repo}/main/problems_metadata.json`
                );
                if (metaResponse.ok) {
                    metadata = await metaResponse.json();
                }
            } catch (e) {
                // Ignore if metadata missing
            }

            return files.map((file: any) => this.parseProblemMetadata(file, metadata, config));
        } catch (error) {
            console.error('Error fetching file tree:', error);
            throw error;
        }
    },

    parseProblemMetadata(file: any, metadata: any, config: any): Problem {
        const parts = file.path.split('/');
        const fileName = parts[parts.length - 1];

        let difficulty = 'File';
        let topic = 'Root';

        if (parts.length > 1) {
            // Use top-level folder as difficulty/category if available
            difficulty = parts[0];
        }

        if (parts.length > 2) {
            // Use sub-folders as topic
            topic = parts.slice(1, parts.length - 1).join('/');
        } else if (parts.length === 2) {
            topic = parts[0];
        }

        const meta = metadata[file.path] || {};

        // Remove extension for display name, but keep it if it's significant
        const name = fileName.includes('.') ? fileName : fileName;

        return {
            name: name,
            path: file.path,
            url: `${RAW_URL}/${config.username}/${config.repo}/main/${file.path}`,
            difficulty,
            topic,
            sha: file.sha,
            intuition: meta.intuition || 'Not provided',
            technique: meta.technique || 'Not provided',
            timeComplexity: meta.timeComplexity || 'Not provided',
            spaceComplexity: meta.spaceComplexity || 'Not provided',
            seen: false,
        };
    },

    async fetchProblemContent(path: string): Promise<string> {
        try {
            const config = await StorageService.getConfig();
            if (!config) throw new Error('Configuration missing');

            const response = await fetch(
                `${RAW_URL}/${config.username}/${config.repo}/main/${path}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch file content');
            }

            return await response.text();
        } catch (error) {
            console.error('Error fetching problem content:', error);
            throw error;
        }
    },

    extractFolders(problems: Problem[]): string[] {
        const folders = new Set<string>();
        problems.forEach(p => {
            const parts = p.path.split('/');
            if (parts.length > 1) {
                // Remove filename
                const folderPath = parts.slice(0, parts.length - 1).join('/');
                folders.add(folderPath);
            }
        });
        return Array.from(folders).sort();
    }
};
