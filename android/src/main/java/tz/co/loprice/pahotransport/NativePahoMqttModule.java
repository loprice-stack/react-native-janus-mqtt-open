package tz.co.loprice.pahotransport;

import android.util.Log;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;

import info.mqtt.android.service.MqttAndroidClient;
import info.mqtt.android.service.QoS;

import org.eclipse.paho.client.mqttv3.DisconnectedBufferOptions;
import org.eclipse.paho.client.mqttv3.IMqttActionListener;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.IMqttToken;
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.MqttTopic;

import java.util.Objects;


public class NativePahoMqttModule extends NativePahoMqttTransportSpec {

  MqttAndroidClient mqttAndroidClient;
  MqttConnectOptions mqttConnectOptions = new MqttConnectOptions();
  ReactApplicationContext reactContext;
  public NativePahoMqttModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public void setPahoOptions(ReadableMap options) {

    mqttConnectOptions.setAutomaticReconnect(options.getBoolean("reconnect"));
    mqttConnectOptions.setCleanSession(false);
    mqttConnectOptions.setMqttVersion(MqttConnectOptions.MQTT_VERSION_3_1_1);
    mqttConnectOptions.setKeepAliveInterval(options.getInt("keepAliveInterval"));
    //mqttConnectOptions.setWill(new MqttTopic(options.getString("willMessageOptions")));
    mqttConnectOptions.setUserName(options.getString("userName"));
    mqttConnectOptions.setPassword(Objects.requireNonNull(options.getString("password")).toCharArray());
    mqttAndroidClient = new MqttAndroidClient(getReactApplicationContext(), Objects.requireNonNull(options.getString("serverUrl")), options.getString("clientId"));
  }

  @Override
  public void connect(Callback onSuccess, Callback onError) {

    mqttAndroidClient.connect(mqttConnectOptions, getReactApplicationContext(), new IMqttActionListener() {
      @Override
      public void onSuccess(IMqttToken asyncActionToken) {
        DisconnectedBufferOptions disconnectedBufferOptions = new DisconnectedBufferOptions();
        disconnectedBufferOptions.setBufferEnabled(true);
        disconnectedBufferOptions.setBufferSize(100);
        disconnectedBufferOptions.setPersistBuffer(false);
        disconnectedBufferOptions.setDeleteOldestMessages(false);
        mqttAndroidClient.setBufferOpts(disconnectedBufferOptions);
        onSuccess.invoke();
      }

      @Override
      public void onFailure(IMqttToken asyncActionToken, Throwable exception) {

        onError.invoke(exception.toString());
        Log.d("NativePahoMqttModule","Failed asyncActionToken: " + asyncActionToken);
        Log.d("NativePahoMqttModule", exception.toString());
      }
    });
  }

  @Override
  public void onConnected(Callback onConnected) {

  }

  @Override
  public void disconnect() {

  }

  @Override
  public void onConnectionLost(Callback onConnectionLost) {

  }

  @Override
  public void onMessageArrived(Callback onMessageArrived) {

    mqttAndroidClient.setCallback(new MqttCallbackExtended() {
      @Override
      public void connectComplete(boolean reconnect, String serverURI) {
      }

      @Override
      public void connectionLost(Throwable cause) {
      }

      @Override
      public void messageArrived(String topic, MqttMessage message) throws Exception {

        try {
          //Use this for now and
          //Let PahoMqttTransportAndroid take care of this event
          reactContext.getJSModule(ReactContext.RCTDeviceEventEmitter.class).emit(topic, new String(message.getPayload()));

          //Callback.invoke(params) fires only once and crash on repeated invoke
          //onMessageArrived.invoke(payload.toString());

        } catch (Exception e) {
          Log.d("Exception onMessageArrived", e.toString());
        }
      }

      @Override
      public void deliveryComplete(IMqttDeliveryToken token) {

      }
    });

  }

  @Override
  public void onMessageDelivered(Callback onMessageDelivered) {

  }

  @Override
  public void publish(String topic, String message) {

    MqttMessage mqttMessage = new MqttMessage(message.getBytes());
    mqttAndroidClient.publish(topic, mqttMessage);
  }

  @Override
  public void subscribe(String topic) {
    mqttAndroidClient.subscribe(topic, QoS.AtMostOnce.getValue(), null, new IMqttActionListener() {
      @Override
      public void onSuccess(IMqttToken asyncActionToken) {
      }

      @Override
      public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
      }
    });
  }
}
