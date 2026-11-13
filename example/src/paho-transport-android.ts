/**
 * You must wrap your client in this class
 * if you must create your own implementation
 * just check the suggested functions which you
 * mustimplement in to you own wraper
 */
import { getNumericID, Logger, randomString } from '../../src/utils';
import type { JanusAdminOptions, JanusOptions } from '../../src/mqtt-transport';
import { DeviceEventEmitter } from 'react-native';
import { NativePahoMqttTransport } from 'react-native-janus-mqtt-open';

const LOG_NS = '[paho-transport-android.ts]';

export type PahoOptions = {
  serverUrl: string;
  port: number;
  clientId: string | undefined;
  userName: string;
  password: string;
  useSSL: boolean;
  keepAliveInterval: number;
  reconnect: boolean;
  willMessageOptions: willOptions;
  //onSuccess: any;
};

export type willOptions = {
  topic: string;
  qos: 0 | 1 | 2;
  retain: boolean;
  message: string;
};

class PahoTransportAndroid {
  //mqttclient: any;
  //@ts-ignore
  janus: JanusOptions = {};
  //@ts-ignore
  janusadmin: JanusAdminOptions = {};
  options: PahoOptions = {
    serverUrl: '',
    port: 0,
    clientId: '',
    userName: '',
    password: '',
    useSSL: true,
    keepAliveInterval: 60,
    reconnect: true,
    willMessageOptions: { topic: '', qos: 0, retain: false, message: '' },
    //onSuccess: undefined,
  };
  id: string;
  constructor(
    {
      serverUrl,
      port,
      clientId = randomString(),
      userName,
      password,
      useSSL = true,
      keepAliveInterval = 60,
      reconnect,
      willMessageOptions,
      //onSuccess,
    }: PahoOptions,
    janus: JanusOptions = {
      tojanus: 'tojanus',
      fromjanus: 'fromjanus',
      logs: false,
    },
    janusadmin: JanusAdminOptions = {
      tojanusadmin: 'tojanusadmin',
      fromjanusadmin: 'fromjanusadmin',
      admin_enabled: false,
    }
  ) {
    this.janus = janus;
    this.janusadmin = janusadmin;
    this.options.serverUrl = serverUrl;
    this.options.port = port;
    this.options.clientId = clientId;
    this.options.userName = userName;
    this.options.password = password;
    this.options.useSSL = useSSL;
    this.options.keepAliveInterval = keepAliveInterval;
    this.options.reconnect = reconnect;
    this.options.willMessageOptions = willMessageOptions;
    this.id = getNumericID();
    Logger(
      `${LOG_NS} [${this.id}] creating new paho android mqtt transport class`
    );
    NativePahoMqttTransport.setPahoOptions(this.options);
  }

  connect(onSuccess: () => void, onError: (error: string) => void) {
    NativePahoMqttTransport.connect(
      () => {
        onSuccess();
      },
      (error: string) => {
        onError(error);
      }
    );
  }

  testTransportation() {
    NativePahoMqttTransport.publish(
      this.janus.tojanus,
      JSON.stringify({ janus: 'info' })
    );
  }

  getJanusOptions() {
    return this.janus;
  }

  getJanusAdminOptions() {
    return this.janusadmin;
  }

  disconnect() {
    if (this.isClientDefined()) {
      NativePahoMqttTransport.disconnect();
    }
  }

  isClientDefined() {
    if (NativePahoMqttTransport) {
      return true;
    } else {
      Logger(
        `${LOG_NS} mqttclient is not defined:  mqttclient: "${JSON.stringify(NativePahoMqttTransport)}"`
      );
      return false;
    }
  }

  // called when the mqttclient loses its connection
  onConnected(onConnected: () => void) {
    NativePahoMqttTransport.onConnected = onConnected;
  }

  // called when the mqttclient loses its connection
  onConnectionLost(onConnectionLost: (error: any) => void) {
    DeviceEventEmitter.removeAllListeners();
    NativePahoMqttTransport.onConnectionLost(onConnectionLost);
  }

  // called when the message arrive
  //this is used by connection.ts
  onMessageArrived(onMessageArrived: (payload: string) => void) {
    if (this.isClientDefined()) {
      //We dont have good way to do this right now
      NativePahoMqttTransport.onMessageArrived(() => {});
      //Just simply listen to this one topic.
      // We will implement this the right way later
      DeviceEventEmitter.addListener('from-janus', (payload: string) => {
        onMessageArrived(payload);
      });
    }
  }

  // called when the message arrive
  //You can use some thing like this for your other implementation
  onMessageArrived2(onMessageArrived: (payload: string) => void) {
    if (this.isClientDefined()) {
      //We dont have good way to do this right now
      NativePahoMqttTransport.onMessageArrived(() => {});
      //Just simply listen to this any topic.
      // We will implement this the right way later
      DeviceEventEmitter.addListener(
        'any topic you wish to listern',
        (payload: string) => {
          onMessageArrived(payload);
        }
      );
    }
  }

  // called when the message arrive
  onMessageDelivered(onMessageDelivered: () => void) {
    if (this.isClientDefined()) {
      NativePahoMqttTransport.onMessageDelivered(onMessageDelivered);
    }
  }

  publish(topic: string, message: any) {
    if (this.isClientDefined()) {
      NativePahoMqttTransport.publish(topic, JSON.stringify(message));
    }
  }

  subscribe(topic: string) {
    if (this.isClientDefined()) {
      NativePahoMqttTransport.subscribe(topic);
    }
  }
}

export default PahoTransportAndroid;
