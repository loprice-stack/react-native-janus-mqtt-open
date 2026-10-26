#import <Foundation/Foundation.h>
#import "JanusMqttOpenImpl.h"
#import <ReactCommon/CxxTurboModuleUtils.h>

@interface JanusMqttOpenOnLoad : NSObject
@end

@implementation JanusMqttOpenOnLoad

using namespace facebook::react;

+ (void)load
{
  registerCxxModuleToGlobalModuleMap(
    std::string(JanusMqttOpenImpl::kModuleName),
    [](std::shared_ptr<CallInvoker> jsInvoker) {
      return std::make_shared<JanusMqttOpenImpl>(jsInvoker);
    }
  );
}

@end
