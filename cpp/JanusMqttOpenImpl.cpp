#include "JanusMqttOpenImpl.h"

namespace facebook::react {

JanusMqttOpenImpl::JanusMqttOpenImpl(
  std::shared_ptr<CallInvoker> jsInvoker
)
  : NativeJanusMqttOpenCxxSpec(std::move(jsInvoker)) {}

double JanusMqttOpenImpl::multiply(
  jsi::Runtime& rt,
  double a,
  double b
) {
  return a * b;
}

}
