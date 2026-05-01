import Foundation
import Capacitor
import UIKit

/// Capacitor bridge for StoreKit 2.
/// Exposed to JavaScript as `Capacitor.Plugins.PyroIAP`.
@objc(PyroIAPPlugin)
public class PyroIAPPlugin: CAPPlugin {

    public override func load() {
        super.load()
        if #available(iOS 15.0, *) {
            // Forward async transaction updates to JS listeners.
            PyroIAP.shared.onTransaction = { [weak self] payload in
                self?.notifyListeners("transactionUpdated", data: payload)
            }
            PyroIAP.shared.startListening()
        }
    }

    @objc func ping(_ call: CAPPluginCall) {
        call.resolve([
            "ok": true,
            "platform": "ios",
            "storeKit2Available": iosVersionAtLeast(15),
        ])
    }

    @objc func loadProducts(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else {
            call.reject("StoreKit 2 requires iOS 15+")
            return
        }
        Task {
            do {
                let products = try await PyroIAP.shared.loadProducts()
                call.resolve(["products": products])
            } catch {
                call.reject(error.localizedDescription, "LOAD_PRODUCTS_FAILED")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else {
            call.reject("StoreKit 2 requires iOS 15+")
            return
        }
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }
        let appAccountToken = call.getString("appAccountToken")
        Task {
            do {
                let payload = try await PyroIAP.shared.purchase(
                    productId: productId,
                    appAccountToken: appAccountToken
                )
                call.resolve(payload)
            } catch {
                call.reject(error.localizedDescription, "PURCHASE_FAILED")
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else {
            call.reject("StoreKit 2 requires iOS 15+")
            return
        }
        Task {
            do {
                let txs = try await PyroIAP.shared.restore()
                call.resolve(["transactions": txs])
            } catch {
                call.reject(error.localizedDescription, "RESTORE_FAILED")
            }
        }
    }

    @objc func getActiveTransactions(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else {
            call.resolve(["transactions": []])
            return
        }
        Task {
            let txs = await PyroIAP.shared.getActiveTransactions()
            call.resolve(["transactions": txs])
        }
    }

    @objc func openManageSubscriptions(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let url = URL(string: "itms-apps://apps.apple.com/account/subscriptions") {
                UIApplication.shared.open(url)
            }
            call.resolve()
        }
    }

    private func iosVersionAtLeast(_ major: Int) -> Bool {
        let v = ProcessInfo.processInfo.operatingSystemVersion
        return v.majorVersion >= major
    }
}
