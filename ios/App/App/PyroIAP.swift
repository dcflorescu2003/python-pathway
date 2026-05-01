import Foundation
import StoreKit

/// StoreKit 2 wrapper for PyRo subscriptions.
/// Handles loading products, purchasing, restoring, and listening to transaction updates.
@available(iOS 15.0, *)
final class PyroIAP {

    static let shared = PyroIAP()

    /// Product IDs (must match exactly what's in App Store Connect).
    static let productIds: [String] = [
        "pyro_student_monthly_ios",
        "pyro_student_yearly_ios",
        "pyro_teacher_monthly_ios",
        "pyro_teacher_yearly_ios",
    ]

    /// Cache of products loaded from the App Store.
    private var products: [String: Product] = [:]

    /// Long-running task that listens for transaction updates from outside our app
    /// (renewals, refunds processed by Apple, etc.).
    private var updatesTask: Task<Void, Never>?

    /// Callback invoked whenever a transaction is observed (purchase, renewal, restore).
    /// Plugin sets this so it can forward signed transactions to JS via `notifyListeners`.
    var onTransaction: (([String: Any]) -> Void)?

    private init() {}

    // MARK: - Public API

    /// Start listening for transaction updates. Idempotent.
    func startListening() {
        if updatesTask != nil { return }
        updatesTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard let self = self else { return }
                if case .verified(let transaction) = result {
                    let payload = await self.makePayload(for: transaction, jws: result.jwsRepresentation)
                    self.onTransaction?(payload)
                    await transaction.finish()
                }
            }
        }
    }

    /// Load all PyRo products from the App Store.
    func loadProducts() async throws -> [[String: Any]] {
        let storeProducts = try await Product.products(for: PyroIAP.productIds)
        var out: [[String: Any]] = []
        for p in storeProducts {
            products[p.id] = p
            out.append([
                "productId": p.id,
                "priceString": p.displayPrice,
                "price": NSDecimalNumber(decimal: p.price).doubleValue,
                "currencyCode": p.priceFormatStyle.currencyCode,
                "title": p.displayName,
                "description": p.description,
            ])
        }
        return out
    }

    /// Purchase a product. `appAccountToken` should be the Supabase user UUID.
    /// Returns the verified transaction payload, or `["userCancelled": true]`.
    func purchase(productId: String, appAccountToken: String?) async throws -> [String: Any] {
        let product: Product
        if let cached = products[productId] {
            product = cached
        } else {
            let fetched = try await Product.products(for: [productId])
            guard let first = fetched.first else {
                throw PyroIAPError.productNotFound(productId)
            }
            products[productId] = first
            product = first
        }

        var options: Set<Product.PurchaseOption> = []
        if let tokenStr = appAccountToken, let uuid = UUID(uuidString: tokenStr) {
            options.insert(.appAccountToken(uuid))
        }

        let result = try await product.purchase(options: options)

        switch result {
        case .success(let verification):
            switch verification {
            case .verified(let transaction):
                let payload = await makePayload(for: transaction, jws: verification.jwsRepresentation)
                await transaction.finish()
                return payload
            case .unverified(_, let error):
                throw PyroIAPError.unverified(error.localizedDescription)
            }
        case .userCancelled:
            return ["userCancelled": true]
        case .pending:
            return ["pending": true]
        @unknown default:
            throw PyroIAPError.unknown
        }
    }

    /// Force a sync with App Store and return all currently active entitlements.
    func restore() async throws -> [[String: Any]] {
        try await AppStore.sync()
        var out: [[String: Any]] = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                let payload = await makePayload(for: transaction, jws: result.jwsRepresentation)
                out.append(payload)
            }
        }
        return out
    }

    /// Returns active entitlements without forcing a sync (faster, used at app launch).
    func getActiveTransactions() async -> [[String: Any]] {
        var out: [[String: Any]] = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                let payload = await makePayload(for: transaction, jws: result.jwsRepresentation)
                out.append(payload)
            }
        }
        return out
    }

    // MARK: - Private

    private func makePayload(for transaction: Transaction, jws: String) async -> [String: Any] {
        var payload: [String: Any] = [
            "productId": transaction.productID,
            "transactionId": String(transaction.id),
            "originalTransactionId": String(transaction.originalID),
            "signedTransaction": jws,
            "purchaseDate": transaction.purchaseDate.timeIntervalSince1970 * 1000,
        ]
        if let exp = transaction.expirationDate {
            payload["expirationDate"] = exp.timeIntervalSince1970 * 1000
            payload["expirationISO"] = ISO8601DateFormatter().string(from: exp)
        }
        if let token = transaction.appAccountToken {
            payload["appAccountToken"] = token.uuidString
        }
        if let revoke = transaction.revocationDate {
            payload["revocationDate"] = revoke.timeIntervalSince1970 * 1000
        }
        return payload
    }
}

@available(iOS 15.0, *)
enum PyroIAPError: LocalizedError {
    case productNotFound(String)
    case unverified(String)
    case unknown

    var errorDescription: String? {
        switch self {
        case .productNotFound(let id): return "Product not found: \(id)"
        case .unverified(let msg): return "Transaction unverified: \(msg)"
        case .unknown: return "Unknown StoreKit error"
        }
    }
}
