/**
 * Generic class
 *
 *  Copy and use this class to implement and wrap your mqtt client
 *
 * Initialize your mqtt client first and pass this class as object in the connection class
 * eg,  connection = await new Connection(new MqttClientClass());
 *
 * Make sure to implement all the required functions
 *
 * Class name can be anything
 */

import { Logger } from './utils';

//const LOG_NS = '[mqtt-transport.ts]';

//These types are required by Connection class
export type MqttClientClass = {
  janus: JanusOptions;
  janusadmin: JanusAdminOptions;

  connect: (onSuccess: Function, onError: Function) => void;
  onConnected: (onConnected: Function) => void;

  disconnect: () => void;
  onConnectionLost: (onConnectionLost: Function) => void;

  onMessageArrived: (onMessageArrived: Function) => void;
  onMessageDelivered: (onMessageDelivered: Function) => void;

  publish: (topic: string, message: string) => void;
  subscribe: (topic: string) => void;
};

export type JanusOptions = {
  tojanus: string;
  fromjanus: string;
  logs: boolean;
};

export type JanusAdminOptions = {
  tojanusadmin: string;
  fromjanusadmin: string;
  admin_enabled: boolean;
};

class MqttTransport {
  client: any;
  options: JanusOptions;
  adminoptions: JanusAdminOptions;
  constructor(
    client: any,
    options: JanusOptions,
    adminoptions: JanusAdminOptions
  ) {
    this.client = client;
    this.options = options;
    this.adminoptions = adminoptions;
  }

  //connect(onsuccess: Function): void
  connect(onsuccess: Function) {
    if (this.isClientDefined()) {
      this.client
        .connect()
        .then((success: any) => {
          onsuccess(success);
        })
        .catch((error: any) => {
          Logger(error);
        });
    }
  }

  // called when the mqttclient is connected
  onConnected(onConnected: any) {
    this.client.onConnectionLost = onConnected;
  }

  disconnect() {
    if (this.isClientDefined()) {
      this.client.disconnect();
    }
  }

  //Check to see if client is defined in this class
  isClientDefined() {
    if (this.client) {
      return true;
    } else {
      return false;
    }
  }

  // called when the mqttclient loses its connection
  onConnectionLost(onConnectionLost: any) {
    this.client.onConnectionLost = onConnectionLost;
  }

  // called when the message arrive
  onMessageArrived(onMessageArrived: any) {
    //Connection.ts expects only janus messages
    //Make sure to do the filtering yourself

    if (this.isClientDefined()) {
      this.client.onMessageArrived = (payload: any) => {
        const message = payload.payloadString;
        onMessageArrived(JSON.parse(message));
      };
    }
  }

  // called when the message arrive
  onMessageDelivered(onMessageDelivered: any) {
    if (this.isClientDefined()) {
      this.client.onMessageDelivered = onMessageDelivered;
    }
  }

  publish(topic: string, message: any) {
    if (this.isClientDefined()) {
      this.client.publish(topic, message);
    }
  }

  subscribe(topic: string) {
    if (this.isClientDefined()) {
      this.client.subscribe(topic);
    }
  }
}

export default MqttTransport;
