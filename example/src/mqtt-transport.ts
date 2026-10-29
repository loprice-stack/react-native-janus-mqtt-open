/**
 * You must wrap your client in this class
 * if you must create your own implementation
 * just check the suggested functions which you
 * mustimplement in to you own wraper
 */

import { getNumericID, Logger, randomString } from '../../src/utils';
import type { JanusAdminOptions, JanusOptions } from '../../src/mqtt-transport';
import mqtt from 'mqtt';

const LOG_NS = '[mqtt-transport.ts]';

export type MqttOptions = {
  protocol: mqtt.BaseMqttProtocol | undefined;
  host: string;
  port: number;
  path: string;
  protocolVersion: 5 | 4 | 3 | undefined;
  clientId: string | undefined;
  username: string;
  password: string;
  reconnectPeriod: number;
  queueQoSZero: boolean;
  resubscribe: boolean;
  clean: boolean;
  keepalive: number;
  properties: number;
  sessionExpiryInterval: 600;
  forceNativeWebSocket: true;
};

class MqttTransport {
  mqttclient: any;
  //@ts-ignore
  janus: JanusOptions = {};
  //@ts-ignore
  janusadmin: JanusAdminOptions = {};
  options: MqttOptions = {
    protocol: 'wss',
    host: '',
    port: 0,
    path: '/mqtt',
    protocolVersion: 5,
    clientId: '',
    username: '',
    password: '',
    reconnectPeriod: 500,
    queueQoSZero: false,
    resubscribe: true,
    clean: true,
    keepalive: 60,
    properties: 0,
    sessionExpiryInterval: 600,
    forceNativeWebSocket: true,
  };
  id: string;
  constructor(
    {
      protocol = 'wss',
      host,
      port = 0,
      path = '/mqtt',
      protocolVersion = 5,
      clientId = randomString(),
      username,
      password,
      reconnectPeriod = 500,
      queueQoSZero = false,
      resubscribe = true,
      clean = true,
      keepalive = 60,
      properties = 0,
      sessionExpiryInterval = 600,
      forceNativeWebSocket = true,
    }: MqttOptions,
    janus: JanusOptions = {
      tojanus: 'to-janus',
      fromjanus: 'from-janus',
      logs: false,
    },
    janusadmin: JanusAdminOptions = {
      tojanusadmin: 'to-janus-admin',
      fromjanusadmin: 'from-janus-admin',
      admin_enabled: false,
    }
  ) {
    this.janus = janus;
    this.janusadmin = janusadmin;
    this.options.protocol = protocol;
    this.options.host = host;
    this.options.port = port;
    this.options.path = path;
    this.options.protocolVersion = protocolVersion;
    this.options.clientId = clientId;
    this.options.username = username;
    this.options.password = password;
    this.options.reconnectPeriod = reconnectPeriod;
    this.options.queueQoSZero = queueQoSZero;
    this.options.resubscribe = resubscribe;
    this.options.clean = clean;
    this.options.keepalive = keepalive;
    this.options.properties = properties;
    this.options.sessionExpiryInterval = sessionExpiryInterval;
    this.options.forceNativeWebSocket = forceNativeWebSocket;
    this.id = getNumericID();

    Logger(`${LOG_NS} [${this.id}] creating new mqtt transport connection`);
  }

  connect(onSuccess: Function, onError: Function) {
    const client = mqtt.connect(this.options.host, {
      protocol: this.options.protocol,
      host: this.options.host,
      port: this.options.port,
      path: this.options.path,
      protocolVersion: this.options.protocolVersion,
      clientId: this.options.clientId,
      username: this.options.username,
      password: this.options.password,
      reconnectPeriod: this.options.reconnectPeriod,
      queueQoSZero: this.options.queueQoSZero,
      resubscribe: this.options.resubscribe,
      clean: this.options.clean,
      keepalive: this.options.keepalive,
      properties:
        this.options.protocolVersion === 5
          ? {
              sessionExpiryInterval: 600,
            }
          : undefined,
      forceNativeWebSocket: this.options.forceNativeWebSocket,
    });

    this.mqttclient = client;
    this.mqttclient.on('connect', () => {
      onSuccess();
    });

    this.mqttclient.on('error', (error: any) => {
      onError(error);
    });
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
    this.mqttclient.on('disconnect', () => {
      onConnectionLost();
    });
  }

  // called when the message arrive
  onMessageArrived(onMessageArrived: any) {
    //Do the filtering before sending message to react-native-janus-mqtt-open
    //Make sure only janus messages are passed
    if (this.isClientDefined()) {
      this.mqttclient.on('message', (topic: string, message: any) => {
        if (
          this.janus.fromjanus === topic ||
          this.janusadmin.fromjanusadmin === topic
        ) {
          const janus_message = message.toString();
          onMessageArrived(janus_message);
        }
      });
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
export default MqttTransport;
