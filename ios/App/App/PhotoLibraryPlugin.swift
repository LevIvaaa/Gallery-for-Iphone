import Foundation
import Capacitor
import Photos

// Кастомный плагин: удаление фото из медиатеки устройства (и iCloud).
// PHAssetChangeRequest.deleteAssets сам показывает системный диалог
// подтверждения Apple — как у сторонних приложений (напр. Google Фото).
@objc(PhotoLibraryPlugin)
public class PhotoLibraryPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PhotoLibraryPlugin"
    public let jsName = "PhotoLibrary"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "deletePhotos", returnType: CAPPluginReturnPromise)
    ]

    @objc func deletePhotos(_ call: CAPPluginCall) {
        guard let ids = call.getArray("identifiers", String.self), !ids.isEmpty else {
            call.reject("identifiers required")
            return
        }
        let assets = PHAsset.fetchAssets(withLocalIdentifiers: ids, options: nil)
        if assets.count == 0 {
            call.resolve(["deleted": false, "reason": "not_found"])
            return
        }
        PHPhotoLibrary.shared().performChanges({
            PHAssetChangeRequest.deleteAssets(assets)
        }, completionHandler: { success, error in
            if success {
                call.resolve(["deleted": true])
            } else {
                // пользователь нажал «Запретить» в системном диалоге или ошибка
                call.resolve(["deleted": false, "reason": error?.localizedDescription ?? "cancelled"])
            }
        })
    }
}
