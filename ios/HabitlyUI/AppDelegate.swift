import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    
    // ============================================
    // STEP 1: Initialize Firebase (SAFELY)
    // ============================================
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }

    // ============================================
    // STEP 2: Configure APNs & Notification Delegates
    // ============================================
    UNUserNotificationCenter.current().delegate = self
    Messaging.messaging().delegate = self

    // Register application for remote notifications via APNs
    application.registerForRemoteNotifications()

    // ============================================
    // STEP 3: React Native Setup
    // ============================================
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "HabitlyUI",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // ============================================
  // STEP 4: APNs Token Registration Handler
  // ============================================
  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    // Explicitly pass APNs token to Firebase Messaging
    Messaging.messaging().apnsToken = deviceToken
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("Failed to register for remote notifications: \(error.localizedDescription)")
  }

  // ============================================
  // STEP 5: Firebase Messaging Delegate
  // ============================================
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    if let token = fcmToken {
      print("FCM Token Generated: \(token)")
    }
  }

  // ============================================
  // STEP 6: Foreground Notification Handling
  // ============================================
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    // Allow notifications to display while app is in foreground
    completionHandler([.banner, .sound, .badge])
  }
}

// ============================================
// React Native Delegate
// ============================================
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
