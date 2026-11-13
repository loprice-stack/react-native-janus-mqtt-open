import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

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
export interface Spec extends TurboModule {
  //This set paho options and initializes PahoClient
  //mqttAndroidClient = new MqttAndroidClient(
  //            getReactApplicationContext(),
  //            options.getString("serverUrl"),
  //            options.getString("clientId"));
  //Provide protocol and port for your connection. eg, serverUrl: 'wss://example.co.tz:5281'
  setPahoOptions: (options: PahoOptions) => void;

  //conect
  connect: (onSuccess: () => void, onError: (error: string) => void) => void;
  onConnected: (onConnected: () => void) => void;

  disconnect: () => void;
  onConnectionLost: (onConnectionLost: (error: string) => void) => void;

  //Listern for massage. This is called automatically by connection.ts
  //You dont need to bother with this for janus
  onMessageArrived: (onMessageArrived: (payload: string) => void) => void;
  onMessageDelivered: (onMessageDelivered: () => void) => void;

  //publish
  publish: (topic: string, message: string) => void;

  //subscribe
  subscribe: (topic: string) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativePahoMqttTransport'
);
