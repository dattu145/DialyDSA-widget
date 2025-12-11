const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAndroidWidget = (config) => {
    config = withWidgetManifest(config);
    config = withWidgetFiles(config);
    return config;
};

const withWidgetManifest = (config) => {
    return withAndroidManifest(config, async (config) => {
        const mainApplication = config.modResults.manifest.application[0];

        // Add Receiver
        const receivers = mainApplication.receiver || [];
        const hasWidget = receivers.some(
            (r) => r.$['android:name'] === '.widget.DailyWidgetProvider'
        );

        if (!hasWidget) {
            mainApplication.receiver = [
                ...(mainApplication.receiver || []),
                {
                    $: {
                        'android:name': '.widget.DailyWidgetProvider',
                        'android:label': 'Daily DSA',
                        'android:exported': 'true',
                    },
                    'intent-filter': [
                        {
                            action: [
                                { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
                                { $: { 'android:name': 'android.intent.action.USER_PRESENT' } },
                                { $: { 'android:name': 'com.dailydsawidget.ACTION_NEXT_PROBLEM' } },
                                { $: { 'android:name': 'com.dailydsawidget.ACTION_PREV_PROBLEM' } },
                            ],
                        },
                    ],
                    'meta-data': [
                        {
                            $: {
                                'android:name': 'android.appwidget.provider',
                                'android:resource': '@xml/daily_widget_info',
                            },
                        },
                    ],
                },
            ];
        }

        // Add Service
        const services = mainApplication.service || [];
        const hasService = services.some(
            (s) => s.$['android:name'] === '.widget.CodeWidgetService'
        );

        if (!hasService) {
            mainApplication.service = [
                ...(mainApplication.service || []),
                {
                    $: {
                        'android:name': '.widget.CodeWidgetService',
                        'android:permission': 'android.permission.BIND_REMOTEVIEWS',
                        'android:exported': 'false'
                    }
                }
            ];
        }

        return config;
    });
};

const withWidgetFiles = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const platformRoot = config.modRequest.platformProjectRoot;
            const packageName = config.android.package.replace(/\./g, '/');

            // Source paths
            const sourceDir = path.join(projectRoot, 'plugins', 'android');

            // Destination paths
            const destJavaDir = path.join(platformRoot, 'app', 'src', 'main', 'java', packageName, 'widget');
            const destResDir = path.join(platformRoot, 'app', 'src', 'main', 'res');

            // Ensure directories exist
            fs.mkdirSync(destJavaDir, { recursive: true });
            fs.mkdirSync(path.join(destResDir, 'layout'), { recursive: true });
            fs.mkdirSync(path.join(destResDir, 'xml'), { recursive: true });

            // Helper to copy and replace package
            const copyJava = (filename) => {
                const content = fs.readFileSync(path.join(sourceDir, 'src/main/java/com/dailydsawidget/widget', filename), 'utf8');
                const newContent = content.replace('package com.dailydsawidget.widget', `package ${config.android.package}.widget`);
                fs.writeFileSync(path.join(destJavaDir, filename), newContent);
            };

            copyJava('DailyWidgetProvider.kt');
            copyJava('CodeWidgetService.kt');
            copyJava('CodeWidgetFactory.kt');

            // Copy XML files
            fs.copyFileSync(
                path.join(sourceDir, 'src/main/res/layout/daily_widget.xml'),
                path.join(destResDir, 'layout', 'daily_widget.xml')
            );
            fs.copyFileSync(
                path.join(sourceDir, 'src/main/res/layout/widget_code_item.xml'),
                path.join(destResDir, 'layout', 'widget_code_item.xml')
            );
            fs.copyFileSync(
                path.join(sourceDir, 'src/main/res/xml/daily_widget_info.xml'),
                path.join(destResDir, 'xml', 'daily_widget_info.xml')
            );

            return config;
        },
    ]);
};

module.exports = withAndroidWidget;
