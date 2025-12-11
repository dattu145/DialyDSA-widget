package com.dailydsawidget.widget

import android.content.Intent
import android.widget.RemoteViewsService

class CodeWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return CodeWidgetFactory(this.applicationContext)
    }
}
