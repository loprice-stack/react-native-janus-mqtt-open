package tz.co.loprice.pahotransport;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.BaseReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.HashMap;
import java.util.Map;

public class NativePahoMqttPackage extends BaseReactPackage {
  @Nullable
  @Override
  public NativeModule getModule(@NonNull String s, @NonNull ReactApplicationContext reactApplicationContext) {
    if (s.equals(NativePahoMqttModule.NAME)) {
      return new NativePahoMqttModule(reactApplicationContext);
    } else {
      return null;
    }
  }

  @NonNull
  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return new ReactModuleInfoProvider() {
      @Override
      public Map<String, ReactModuleInfo> getReactModuleInfos() {
        Map<String, ReactModuleInfo> map = new HashMap<>();
        map.put(NativePahoMqttModule.NAME, new ReactModuleInfo(
          NativePahoMqttModule.NAME,       // name
          NativePahoMqttModule.NAME,       // className
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCXXModule
          true   // isTurboModule
        ));
        return map;
      }
    };
  }

}
