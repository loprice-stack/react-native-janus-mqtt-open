cmake_minimum_required(VERSION 3.13)
project(JanusMqttOpen)

add_library(
    react-native-janus-mqtt-open    STATIC
    ../cpp/JanusMqttOpenImpl.cpp
)

set_target_properties(
    react-native-janus-mqtt-open PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
    CXX_EXTENSIONS OFF
)

target_include_directories(
    react-native-janus-mqtt-open    PUBLIC
    ../cpp
)

target_link_libraries(
    react-native-janus-mqtt-open    jsi
    reactnative
    react_codegen_JanusMqttOpenSpec
)
