# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#    http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native & Hermes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-dontwarn com.facebook.react.**

# Yoga Layout Engine
-keep class com.facebook.yoga.** { *; }

# General AndroidX & Multidex support
-keep class androidx.multidex.** { *; }
-dontwarn androidx.multidex.**

# Keep generic React Native packages or third-party native bridges if needed
# -keep class com.kegistech.** { *; }

# Keep your app's BuildConfig so environment variables can be read
-keep class com.kegistech.habitly.BuildConfig { *; }

# Keep React Native Config native module classes
-keep class com.lugg.RNCConfig.** { *; }
-dontwarn com.lugg.RNCConfig.**