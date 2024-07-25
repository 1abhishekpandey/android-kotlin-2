package com.rudderstack.android

import android.app.Application
import com.rudderstack.core.Analytics

open class Analytics(
    val application: Application,
    configuration: Configuration,
) : Analytics(
    configuration
)