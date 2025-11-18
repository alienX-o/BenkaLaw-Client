import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

// 👇 Add these imports
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

    // 🚀 Initialize Firebase
    FirebaseApp.configure()

    // 🔔 Set up Messaging and Notification delegates
    Messaging.messaging().delegate = self
    UNUserNotificationCenter.current().delegate = self

    // Request notification permissions
    let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
    UNUserNotificationCenter.current().requestAuthorization(options: authOptions) { granted, error in
      if let error = error {
        print("Error requesting notification permission: \(error.localizedDescription)")
      } else {
        print("Notification permission granted: \(granted)")
      }
    }

    // Register for APNs
    application.registerForRemoteNotifications()

    // 🧠 React Native bootstrapping
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "BenkaLawClient",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // MARK: - APNs Registration
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
    let tokenParts = deviceToken.map { String(format: "%02.2hhx", $0) }
    let tokenString = tokenParts.joined()
    print("✅ APNs Device Token: \(tokenString)")
  }

  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("❌ Failed to register for remote notifications: \(error.localizedDescription)")
  }

  // MARK: - Messaging Delegate
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    print("🔥 FCM Registration Token: \(fcmToken ?? "none")")
    // You can post this token to NotificationCenter if you want JS to pick it up
  }

  // MARK: - Handle Foreground Notifications
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    let userInfo = notification.request.content.userInfo
    print("📩 Foreground notification received: \(userInfo)")
    completionHandler([.banner, .sound, .badge])
  }

  // MARK: - Handle Notification Tap
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler completionHandler: @escaping () -> Void) {
    let userInfo = response.notification.request.content.userInfo
    print("📬 Notification tapped: \(userInfo)")
    completionHandler()
  }
}

// Existing ReactNativeDelegate (no change)
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
