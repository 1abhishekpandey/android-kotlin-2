import java.io.FileInputStream
import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

val sampleRudderPropertiesFile: File = rootProject.file("${projectDir}/rudderstack.properties")
val sampleRudderProperties = Properties().apply {
    sampleRudderPropertiesFile.canRead().apply { load(FileInputStream(sampleRudderPropertiesFile)) }
}

android {
    val composeCompilerVersion = "1.5.1"//RudderstackBuildConfig.Kotlin.COMPILER_EXTENSION_VERSION
    val androidCompileSdkVersion = 34//RudderstackBuildConfig.Android.COMPILE_SDK
    val androidMinSdkVersion = 21
    val majorVersion = 0
    val minVersion = 1
    val patchVersion = 0
    val libraryVersionName = "${majorVersion}.${minVersion}.${patchVersion}"
    val libraryVersionCode = majorVersion * 1000 + minVersion * 100 + patchVersion

    namespace = "com.rudderstack.android.sampleapp"
    compileSdk = androidCompileSdkVersion

    defaultConfig {
        applicationId = "com.rudderstack.android.sampleapp"
        minSdk = androidMinSdkVersion
        targetSdk = androidCompileSdkVersion
        versionCode = libraryVersionCode
        versionName = libraryVersionName
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
        buildConfigField(
            "String", "WRITE_KEY",
            sampleRudderProperties.getProperty("writeKey")
        )
        buildConfigField(
            "String", "CONTROL_PLANE_URL",
            sampleRudderProperties.getProperty("controlplaneUrl")
        )
        buildConfigField(
            "String", "DATA_PLANE_URL",
            sampleRudderProperties.getProperty("dataplaneUrl")
        )
    }

    buildTypes {
        named("release") {
            isMinifyEnabled = false
            setProguardFiles(
                listOf(
                    getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
                )
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = composeCompilerVersion
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("com.google.android.material:material:1.12.0")
    //compose
    implementation("androidx.compose.ui:ui:1.6.7")
    implementation("androidx.compose.ui:ui-tooling-preview:1.6.7")
    implementation("androidx.compose.ui:ui-tooling:1.6.7")
    implementation("androidx.compose.foundation:foundation:1.6.7")
    // Material Design
    implementation("androidx.compose.material:material:1.6.7")
    // Integration with activities
    implementation("androidx.activity:activity-compose:1.9.0")
    // Integration with ViewModels
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.0")
    // adding play services to generate advertising id
    implementation("com.google.android.gms:play-services-ads:22.1.0")

    implementation(project(":android"))
    implementation(project(":core"))
}

tasks.named("preBuild").configure {
    doFirst {
        val oldCommitFile = file("${rootProject.rootDir}/.git/hooks/pre-commit")
        val oldPushFile = file("${rootProject.rootDir}/.git/hooks/pre-push")
        val oldCommitMessageFile = file("${rootProject.rootDir}/.git/hooks/commit-msg")
        val newCommitFile = file("${rootProject.rootDir}/scripts/pre-commit")
        val newPushFile = file("${rootProject.rootDir}/scripts/pre-push")
        val newCommitMessageFile = file("${rootProject.rootDir}/scripts/commit-msg")
        if (
            oldCommitFile.length() != newCommitFile.length() ||
            oldPushFile.length() != newPushFile.length() ||
            oldCommitMessageFile.length() != newCommitMessageFile.length()
        ) {
            oldCommitFile.delete()
            oldPushFile.delete()
            oldCommitMessageFile.delete()
            println("Old hooks are deleted.")

            copy {
                from("${rootProject.rootDir}/scripts/")
                into("${rootProject.rootDir}/.git/hooks/")
                // to make the git hook executable
                fileMode = "0777".toInt(8)
            }
            println("New hooks are copied.")
        }
    }
}
