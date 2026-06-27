import Foundation
import Capacitor
import Photos

// Кастомный плагин медиатеки:
//  - getAssets: быстрый список идентификаторов+метаданных (без пикселей)
//  - getThumbnail: миниатюра/полное фото по id как файл (ленивая подгрузка,
//    через системный кэш PHImageManager — как в нативной галерее)
//  - deletePhotos: удаление с системным подтверждением
@objc(PhotoLibraryPlugin)
public class PhotoLibraryPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PhotoLibraryPlugin"
    public let jsName = "PhotoLibrary"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getAssets", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getThumbnail", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deletePhotos", returnType: CAPPluginReturnPromise),
    ]

    private let isoFormatter = ISO8601DateFormatter()
    private let manager = PHCachingImageManager()

    // ===== Список ассетов (быстро, без изображений) =====
    @objc func getAssets(_ call: CAPPluginCall) {
        let limit = call.getInt("limit") ?? 0
        let options = PHFetchOptions()
        options.sortDescriptors = [
            NSSortDescriptor(key: "creationDate", ascending: true)
        ]
        if limit > 0 { options.fetchLimit = limit }

        let result = PHAsset.fetchAssets(with: .image, options: options)
        var assets: [[String: Any]] = []
        assets.reserveCapacity(result.count)
        result.enumerateObjects { asset, _, _ in
            var loc: [String: Any] = [:]
            if let l = asset.location {
                loc = [
                    "lat": l.coordinate.latitude,
                    "lng": l.coordinate.longitude,
                    "altitude": l.altitude,
                ]
            }
            assets.append([
                "id": asset.localIdentifier,
                "creationDate": asset.creationDate.map { self.isoFormatter.string(from: $0) } ?? "",
                "width": asset.pixelWidth,
                "height": asset.pixelHeight,
                "favorite": asset.isFavorite,
                "location": loc,
            ])
        }
        call.resolve(["assets": assets])
    }

    // ===== Миниатюра / полное фото по идентификатору (ленивая) =====
    @objc func getThumbnail(_ call: CAPPluginCall) {
        guard let id = call.getString("identifier") else {
            call.reject("identifier required")
            return
        }
        let size = call.getInt("size") ?? 256

        // Кэш на диске
        let safe = id.replacingOccurrences(of: "[^A-Za-z0-9]", with: "_", options: .regularExpression)
        let dir = NSTemporaryDirectory()
        let path = (dir as NSString).appendingPathComponent("thumb_\(safe)_\(size).jpg")
        if FileManager.default.fileExists(atPath: path) {
            call.resolve(["path": path])
            return
        }

        let assets = PHAsset.fetchAssets(withLocalIdentifiers: [id], options: nil)
        guard let asset = assets.firstObject else {
            call.resolve(["path": ""])
            return
        }

        let opt = PHImageRequestOptions()
        opt.isSynchronous = false
        opt.deliveryMode = size >= 1000 ? .highQualityFormat : .fastFormat
        opt.resizeMode = .fast
        opt.isNetworkAccessAllowed = true

        let target = CGSize(width: size, height: size)
        let mode: PHImageContentMode = size >= 1000 ? .aspectFit : .aspectFill

        manager.requestImage(for: asset, targetSize: target, contentMode: mode, options: opt) { image, _ in
            guard let img = image, let data = img.jpegData(compressionQuality: 0.8) else {
                call.resolve(["path": ""])
                return
            }
            do {
                try data.write(to: URL(fileURLWithPath: path), options: .atomic)
                call.resolve(["path": path])
            } catch {
                call.resolve(["path": ""])
            }
        }
    }

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
                call.resolve(["deleted": false, "reason": error?.localizedDescription ?? "cancelled"])
            }
        })
    }
}
