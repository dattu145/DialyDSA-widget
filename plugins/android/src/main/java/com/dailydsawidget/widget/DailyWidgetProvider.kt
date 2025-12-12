package com.dailydsawidget.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.content.SharedPreferences
import org.json.JSONObject
import com.dailydsawidget.R

class DailyWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // There may be multiple widgets active, so update all of them
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Enter relevant functionality for when the first widget is created
    }

    override fun onDisabled(context: Context) {
        // Enter relevant functionality for when the last widget is disabled
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        val action = intent.action
        if (action == Intent.ACTION_USER_PRESENT) {
            // Optional: Auto-refresh on unlock (User might prefer manual now)
            // pickRandomProblem(context) 
        } else if (action == "com.dailydsawidget.ACTION_NEXT_PROBLEM") {
            pickRandomProblem(context, addToHistory = true)
        } else if (action == "com.dailydsawidget.ACTION_PREV_PROBLEM") {
            loadPreviousProblem(context)
        }
    }

    private fun pickRandomProblem(context: Context, addToHistory: Boolean = false) {
        try {
            val cacheFile = java.io.File(context.filesDir, "problem_cache.json")
            if (cacheFile.exists()) {
                val content = cacheFile.readText()
                val jsonArray = org.json.JSONArray(content)
                if (jsonArray.length() > 0) {
                    // 1. Save current to history if needed
                    if (addToHistory) {
                        val currentFile = java.io.File(context.filesDir, "daily_problem.json")
                        if (currentFile.exists()) {
                            val currentContent = currentFile.readText()
                            val historyFile = java.io.File(context.filesDir, "widget_history.json")
                            val historyArray = if (historyFile.exists()) {
                                org.json.JSONArray(historyFile.readText())
                            } else {
                                org.json.JSONArray()
                            }
                            historyArray.put(JSONObject(currentContent))
                            // Limit history
                            while (historyArray.length() > 20) {
                                historyArray.remove(0)
                            }
                            historyFile.writeText(historyArray.toString())
                        }
                    }

                    // 2. Pick new problem
                    val randomIndex = (0 until jsonArray.length()).random()
                    val randomProblem = jsonArray.getJSONObject(randomIndex)
                    
                    // 3. Check if code exists, if not fetch it
                    val code = randomProblem.optString("code", "")
                    if (code.isEmpty() || code == "// Failed to load code") {
                        // Fetch in background
                        fetchCodeAndSave(context, randomProblem)
                    } else {
                        // Save and update
                        val problemFile = java.io.File(context.filesDir, "daily_problem.json")
                        problemFile.writeText(randomProblem.toString())
                        updateWidgets(context)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun loadPreviousProblem(context: Context) {
        try {
            val historyFile = java.io.File(context.filesDir, "widget_history.json")
            if (historyFile.exists()) {
                val historyArray = org.json.JSONArray(historyFile.readText())
                if (historyArray.length() > 0) {
                    val lastProblem = historyArray.getJSONObject(historyArray.length() - 1)
                    
                    // Remove from history
                    historyArray.remove(historyArray.length() - 1)
                    historyFile.writeText(historyArray.toString())

                    // Save to daily_problem
                    val problemFile = java.io.File(context.filesDir, "daily_problem.json")
                    problemFile.writeText(lastProblem.toString())
                    
                    updateWidgets(context)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun fetchCodeAndSave(context: Context, problem: JSONObject) {
        // Show loading state first
        val loadingProblem = JSONObject(problem.toString())
        loadingProblem.put("code", "// Fetching code...")
        val problemFile = java.io.File(context.filesDir, "daily_problem.json")
        problemFile.writeText(loadingProblem.toString())
        updateWidgets(context)

        // Fetch in background thread
        Thread {
            try {
                // Construct raw URL
                // We need username/repo from somewhere. It's in the 'url' field of problem usually?
                // Or we can construct it if we have the path.
                // The problem object has 'url' which is the API url. We want raw content.
                // Let's assume 'url' field is the API url: https://api.github.com/repos/user/repo/contents/path
                // Or we can use the 'download_url' if available?
                // Our GithubService constructs 'url' as raw url? Let's check.
                // In GithubService: url: `${RAW_URL}/${CONFIG.GITHUB_USERNAME}/${CONFIG.GITHUB_REPO}/main/${file.path}`
                // So 'url' is the raw url! Perfect.
                
                val rawUrl = problem.optString("url", "")
                if (rawUrl.isNotEmpty()) {
                    val url = java.net.URL(rawUrl)
                    val connection = url.openConnection() as java.net.HttpURLConnection
                    connection.requestMethod = "GET"
                    connection.connectTimeout = 5000
                    connection.readTimeout = 5000
                    
                    if (connection.responseCode == 200) {
                        val text = connection.inputStream.bufferedReader().readText()
                        problem.put("code", text)
                        
                        // Save updated problem
                        problemFile.writeText(problem.toString())
                        
                        // Update UI
                        updateWidgets(context)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                // Update with error
                problem.put("code", "// Error fetching code. Tap to view in app.")
                problemFile.writeText(problem.toString())
                updateWidgets(context)
            }
        }.start()
    }

    private fun updateWidgets(context: Context) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val componentName = android.content.ComponentName(context, DailyWidgetProvider::class.java)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
        onUpdate(context, appWidgetManager, appWidgetIds)
    }

    companion object {
        internal fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val file = java.io.File(context.filesDir, "daily_problem.json")
            var problemName = "No Problem Set"
            var difficulty = ""
            var topic = "Open App to Fetch"
            var intuition = "Intuition: -"
            var technique = "Tech: -"
            var complexity = "Time: - | Space: -"
            var isSeen = false
            var repoName = ""
            
            if (file.exists()) {
                try {
                    val content = file.readText()
                    val json = JSONObject(content)
                    problemName = json.optString("name", "Unknown")
                    difficulty = json.optString("difficulty", "")
                    topic = json.optString("topic", "")
                    repoName = json.optString("repoName", "")
                    
                    val rawIntuition = json.optString("intuition", "")
                    intuition = if (rawIntuition.isNotEmpty()) "Intuition: $rawIntuition" else ""
                    
                    val rawTechnique = json.optString("technique", "")
                    technique = if (rawTechnique.isNotEmpty()) "Tech: $rawTechnique" else ""
                    
                    val time = json.optString("timeComplexity", "")
                    val space = json.optString("spaceComplexity", "")
                    
                    if (time.isNotEmpty() || space.isNotEmpty()) {
                        val t = if (time.isNotEmpty()) time else "-"
                        val s = if (space.isNotEmpty()) space else "-"
                        complexity = "Time: $t | Space: $s"
                    } else {
                        complexity = ""
                    }
                    
                    isSeen = json.optBoolean("seen", false)
                } catch (e: Exception) {
                    e.printStackTrace()
                    problemName = "Error reading data"
                }
            } else {
                problemName = "Tap to fetch"
            }

            val views = RemoteViews(context.packageName, R.layout.daily_widget)
            views.setTextViewText(R.id.widget_title, problemName)
            views.setTextViewText(R.id.widget_difficulty, "$difficulty • $topic")
            views.setTextViewText(R.id.widget_repo_name, repoName)

            // Conditional Metadata Display
            if (intuition.replace("Intuition: ", "").trim().isEmpty() || intuition == "Intuition: -") {
                views.setViewVisibility(R.id.widget_intuition, android.view.View.GONE)
            } else {
                views.setTextViewText(R.id.widget_intuition, intuition)
                views.setViewVisibility(R.id.widget_intuition, android.view.View.VISIBLE)
            }

            if (technique.replace("Tech: ", "").trim().isEmpty() || technique == "Tech: -") {
                views.setViewVisibility(R.id.widget_technique, android.view.View.GONE)
            } else {
                views.setTextViewText(R.id.widget_technique, technique)
                views.setViewVisibility(R.id.widget_technique, android.view.View.VISIBLE)
            }

            if (complexity.contains("Time: -") && complexity.contains("Space: -")) {
                 views.setViewVisibility(R.id.widget_complexity, android.view.View.GONE)
            } else {
                 views.setTextViewText(R.id.widget_complexity, complexity)
                 views.setViewVisibility(R.id.widget_complexity, android.view.View.VISIBLE)
            }
            
            if (isSeen) {
                views.setViewVisibility(R.id.widget_seen_badge, android.view.View.VISIBLE)
            } else {
                views.setViewVisibility(R.id.widget_seen_badge, android.view.View.GONE)
            }

            // Set up the ListView
            val intent = Intent(context, CodeWidgetService::class.java)
            views.setRemoteAdapter(R.id.widget_code_list, intent)
            views.setEmptyView(R.id.widget_code_list, R.id.widget_tap_hint)

            // Open App Intent
            val appIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (appIntent != null) {
                val pendingIntent = PendingIntent.getActivity(
                    context, 0, appIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
            }

            // Next Button Intent
            val nextIntent = Intent(context, DailyWidgetProvider::class.java)
            nextIntent.action = "com.dailydsawidget.ACTION_NEXT_PROBLEM"
            val nextPendingIntent = PendingIntent.getBroadcast(
                context, 1, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_next, nextPendingIntent)

            // Prev Button Intent
            val prevIntent = Intent(context, DailyWidgetProvider::class.java)
            prevIntent.action = "com.dailydsawidget.ACTION_PREV_PROBLEM"
            val prevPendingIntent = PendingIntent.getBroadcast(
                context, 2, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_prev, prevPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_code_list)
        }
    }
}
