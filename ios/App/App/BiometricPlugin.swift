import Foundation
import Capacitor
import LocalAuthentication

// Кастомный плагин: проверка по Face ID / Touch ID / код-паролю
// для доступа к скрытым фото.
@objc(BiometricPlugin)
public class BiometricPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BiometricPlugin"
    public let jsName = "Biometric"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "verify", returnType: CAPPluginReturnPromise)
    ]

    @objc func verify(_ call: CAPPluginCall) {
        let reason = call.getString("reason") ?? "Подтвердите личность"
        let context = LAContext()
        var error: NSError?

        if context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) {
            context.evaluatePolicy(
                .deviceOwnerAuthentication,
                localizedReason: reason
            ) { success, _ in
                call.resolve(["success": success])
            }
        } else {
            // Биометрия/код-пароль недоступны — не блокируем доступ
            call.resolve(["success": true])
        }
    }
}
