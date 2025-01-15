plugins {
    `kotlin-dsl`
    id("java-library")

    kotlin("jvm") version "1.9.10"
    `version-catalog`
}
repositories {
    gradlePluginPortal()
    mavenCentral()
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.1")
}
