#pragma once

#include <JanusMqttOpenSpecJSI.h>

#include <memory>

namespace facebook::react {

class JanusMqttOpenImpl
  : public NativeJanusMqttOpenCxxSpec<JanusMqttOpenImpl> {
public:
  JanusMqttOpenImpl(std::shared_ptr<CallInvoker> jsInvoker);

  double multiply(jsi::Runtime& rt, double a, double b);
};

}
