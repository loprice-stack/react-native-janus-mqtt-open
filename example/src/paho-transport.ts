/**
 * You must wrap your client in this class
 * if you must create your own implementation
 * just check the suggested functions which you
 * mustimplement in to you own wraper
 */
import Paho from 'paho-mqtt';
import { getNumericID, Logger, randomString } from '../../src/utils';
import type { JanusAdminOptions, JanusOptions } from '../../src/mqtt-transport';

const LOG_NS = '[paho-transport.ts]';

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

class PahoTransport {
  mqttclient: any;
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
    //this.options.onSuccess = onSuccess;
    this.id = getNumericID();
    Logger(`${LOG_NS} [${this.id}] creating new mqtt transport connection`);
    const client = new Paho.Client(serverUrl, Number(port), clientId);
    this.mqttclient = client;
  }

  connect(onSuccess: Function) {
    this.mqttclient.connect({
      userName: this.options.userName,
      password: this.options.password,
      useSSL: this.options.useSSL,
      keepAliveInterval: 60,
      onSuccess: onSuccess,
      willMessage: this.message(),
    });
  }

  private message() {
    var lastWillMessage = new Paho.Message(
      this.options.willMessageOptions.message
    );
    lastWillMessage.destinationName = this.options.willMessageOptions.topic;
    lastWillMessage.qos = this.options.willMessageOptions.qos;
    lastWillMessage.retained = this.options.willMessageOptions.retain;
    return lastWillMessage;
  }

  testTransportation() {
    this.publish(this.janus.tojanus, { janus: 'info' });
  }

  getJanusOptions() {
    return this.janus;
  }

  getJanusAdminOptions() {
    return this.janusadmin;
  }

  disconnect() {
    if (this.isClientDefined()) {
      this.mqttclient.disconnect();
    }
  }

  isClientDefined() {
    if (this.mqttclient) {
      return true;
    } else {
      Logger(
        `${LOG_NS} mqttclient is not defined:  mqttclient: "${JSON.stringify(this.mqttclient)}"`
      );

      return false;
    }
  }

  // called when the mqttclient loses its connection
  onConnected(onConnected: any) {
    this.mqttclient.onConnected = onConnected;
  }

  // called when the mqttclient loses its connection
  onConnectionLost(onConnectionLost: any) {
    this.mqttclient.onConnectionLost = onConnectionLost;
  }

  // called when the message arrive
  onMessageArrived(onMessageArrived: any) {
    //Do the filtering before sending message to react-native-janus-mqtt-open
    //Make sure only janus messages are passed
    if (this.isClientDefined()) {
      this.mqttclient.onMessageArrived = (payload: any) => {
        if (
          this.janus.fromjanus === payload.topic ||
          this.janusadmin.fromjanusadmin === payload.topic
        ) {
          const janus_message = payload.payloadString;
          onMessageArrived(janus_message);
        }
      };
    }
  }

  // called when the message arrive
  onMessageDelivered(onMessageDelivered: any) {
    if (this.isClientDefined()) {
      this.mqttclient.onMessageDelivered = onMessageDelivered;
    }
  }

  publish(topic: string, message: any) {
    if (this.isClientDefined()) {
      this.mqttclient.publish(topic, JSON.stringify(message));
    }
  }

  subscribe(topic: String) {
    if (this.isClientDefined()) {
      this.mqttclient.subscribe(topic);
      Logger(`${LOG_NS} successfully subscribe to topic: ${topic}`);
    }
  }
}

export default PahoTransport;
