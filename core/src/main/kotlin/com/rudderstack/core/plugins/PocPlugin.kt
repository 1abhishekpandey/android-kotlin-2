package com.rudderstack.core.plugins

import com.rudderstack.core.Analytics
import com.rudderstack.core.internals.logger.TAG
import com.rudderstack.core.internals.models.MessageEvent
import com.rudderstack.core.internals.plugins.Plugin

class PocPlugin : Plugin {

    override val pluginType: Plugin.PluginType = Plugin.PluginType.PreProcess

    override lateinit var analytics: Analytics

    override fun execute(event: MessageEvent): MessageEvent {
        analytics.configuration.logger.debug(TAG, "PocPlugin running")
        return event
    }

}
