package com.dailydsawidget.widget

import android.content.Context
import android.graphics.Color
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONObject
import java.io.File
import com.dailydsawidget.R
import java.util.regex.Pattern

class CodeWidgetFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {

    private var codeLines: List<String> = ArrayList()
    
    // Basic Java Keywords for highlighting
    private val KEYWORDS = arrayOf(
        "public", "private", "protected", "class", "interface", "enum",
        "void", "int", "double", "float", "boolean", "String", "char",
        "if", "else", "for", "while", "return", "new", "this", "super",
        "static", "final", "import", "package", "try", "catch", "throw"
    )
    
    private val KEYWORD_COLOR = Color.parseColor("#CC7832") // Orange-ish
    private val STRING_COLOR = Color.parseColor("#6A8759") // Green-ish
    private val COMMENT_COLOR = Color.parseColor("#808080") // Grey

    override fun onCreate() {
        // Initial load
        loadData()
    }

    override fun onDataSetChanged() {
        // Reload data when notifyAppWidgetViewDataChanged is called
        loadData()
    }

    private fun loadData() {
        codeLines = ArrayList()
        try {
            val file = File(context.filesDir, "daily_problem.json")
            if (file.exists()) {
                val content = file.readText()
                val json = JSONObject(content)
                val fullCode = json.optString("code", "// No code available")
                codeLines = fullCode.split("\n")
            } else {
                codeLines = listOf("// Tap to fetch problem")
            }
        } catch (e: Exception) {
            e.printStackTrace()
            codeLines = listOf("// Error loading code")
        }
    }

    override fun onDestroy() {
        // Cleanup
    }

    override fun getCount(): Int {
        return codeLines.size
    }

    override fun getViewAt(position: Int): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_code_item)
        if (position < codeLines.size) {
            val line = codeLines[position]
            val highlighted = highlightSyntax(line)
            views.setTextViewText(R.id.code_line, highlighted)
        }
        return views
    }

    private fun highlightSyntax(line: String): SpannableString {
        val spannable = SpannableString(line)

        // Highlight Keywords
        for (keyword in KEYWORDS) {
            val pattern = Pattern.compile("\\b$keyword\\b")
            val matcher = pattern.matcher(line)
            while (matcher.find()) {
                spannable.setSpan(
                    ForegroundColorSpan(KEYWORD_COLOR),
                    matcher.start(),
                    matcher.end(),
                    0
                )
            }
        }

        // Highlight Strings (Simple quote matching)
        val stringPattern = Pattern.compile("\".*?\"")
        val stringMatcher = stringPattern.matcher(line)
        while (stringMatcher.find()) {
            spannable.setSpan(
                ForegroundColorSpan(STRING_COLOR),
                stringMatcher.start(),
                stringMatcher.end(),
                0
            )
        }

        // Highlight Comments (Simple // matching)
        val commentIndex = line.indexOf("//")
        if (commentIndex != -1) {
            spannable.setSpan(
                ForegroundColorSpan(COMMENT_COLOR),
                commentIndex,
                line.length,
                0
            )
        }

        return spannable
    }

    override fun getLoadingView(): RemoteViews? {
        return null
    }

    override fun getViewTypeCount(): Int {
        return 1
    }

    override fun getItemId(position: Int): Long {
        return position.toLong()
    }

    override fun hasStableIds(): Boolean {
        return true
    }
}
