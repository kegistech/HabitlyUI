import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import FirebaseMessaging

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // ============================================
    // STEP 1: Initialize Firebase FIRST (before React Native)
    // ============================================
    FirebaseApp.configure()
    
    // Set Firebase Messaging delegate
    Messaging.messaging().delegate = self

    // ============================================
    // STEP 2: Register for remote notifications
    // ============================================
    let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
    UNUserNotificationCenter.current().delegate = self
    UNUserNotificationCenter.current().requestAuthorization(
      options: authOptions,
      completionHandler: { granted, error in
        if let error = error {
          print("Notification permission error: \(error)")
        } else {
          print("Notification permission granted: \(granted)")
        }
      }
    )
    
    application.registerForRemoteNotifications()

    // ============================================
    // STEP 3: Standard React Native setup
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
  // STEP 4: Handle device token registration (APNs → FCM)
  // ============================================
  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    // Pass APNs token to Firebase
    Messaging.messaging().apnsToken = deviceToken
    print("APNs device token registered: \(deviceToken)")
  }
  
  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("Failed to register for remote notifications: \(error)")
  }
}

// ============================================
// STEP 5: Firebase Messaging Delegate
// ============================================
extension AppDelegate: MessagingDelegate {
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    guard let token = fcmToken else { return }
    
    print("FCM registration token: \(token)")
    
    // Store token in UserDefaults for React Native to access
    UserDefaults.standard.set(token, forKey: "fcm_token")
    
    // Post notification for React Native to listen
    let dataDict: [String: String] = ["token": token]
    NotificationCenter.default.post(
      name: Notification.Name("FCMToken"),
      object: nil,
      userInfo: dataDict
    )
  }
}

// ============================================
// STEP 6: UNUserNotificationCenter Delegate
// ============================================
extension AppDelegate: UNUserNotificationCenterDelegate {
  
  // Show notification even when app is in foreground
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    // For iOS 14+, use .banner instead of .alert
    if #available(iOS 14.0, *) {
      completionHandler([.banner, .badge, .sound])
    } else {
      completionHandler([.alert, .badge, .sound])
    }
  }
  
  // Handle notification tap when app is in background or quit
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    print("Notification tapped with data: \(userInfo)")
    
    // Handle navigation or deep linking here if needed
    completionHandler()
  }
}

// ============================================
// STEP 7: React Native Delegate (your existing code)
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