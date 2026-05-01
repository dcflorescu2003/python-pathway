#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Register the Swift plugin with Capacitor's bridge so JavaScript can call it.
CAP_PLUGIN(PyroIAPPlugin, "PyroIAP",
    CAP_PLUGIN_METHOD(ping, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(loadProducts, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(purchase, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(restore, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getActiveTransactions, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(openManageSubscriptions, CAPPluginReturnPromise);
)
