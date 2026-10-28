# react-native-janus-mqtt-open

react-native-janus-mqtt-open gives you an easy way to use mqtt client of your choice to connect to the Janus WebRTC serverer is an extension of Janode Node.js adapter for the Janus WebRTC server using MQTT as a transport

## Installation


```sh
npm install react-native-janus-mqtt-open
```
## Usage

A brief usage for the janus implementation. Check on example app for more

```ts
/**
 * Generic class
 * 
 *  Copy and use this class to implement and wrap your mqtt client
 * 
 * Initialize your mqtt client first and pass this class as an object in the connection class
 * eg,  connection = await new Connection(new MqttClientClass());
 * 
 * Make sure to implement all the required functions
 * 
 * Class name can be anything
 */

import { Logger } from "./utils";


//const LOG_NS = '[mqtt-transport.ts]';

//These types are required by Connection class
export type MqttClientClass = {

  janus: JanusOptions
  janusadmin: JanusAdminOptions

  connect: (onSuccess: Function, onError: Function) => void
  onConnected: (onConnected: Function) => void

  disconnect: () => void
  onConnectionLost: (onConnectionLost: Function) => void

  onMessageArrived: (onMessageArrived: Function) => void
  onMessageDelivered: (onMessageDelivered: Function) => void

  publish: (topic: string, message: string) => void
  subscribe: (topic: string) => void

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

  client: any
  options: JanusOptions
  adminoptions: JanusAdminOptions
  constructor(client: any, options: JanusOptions, adminoptions: JanusAdminOptions) {
    this.client = client
    this.options = options
    this.adminoptions = adminoptions
  }


  connect(onsuccess: Function) {
    if (this.isClientDefined()) {
      this.client.connect().then((success: any) => {
        onsuccess(success)
      }).catch((error: any) => {
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
      return true
    } else {
      return false
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
        const message = payload.payloadString
        onMessageArrived(JSON.parse(message))
      }
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


```


Create conection and session

```ts

import { Connection } from 'react-native-janus-mqtt-open';
import { Logger } from '../../src/utils';
import type Session from '../../src/session';
import VideocallHandle from '../../src/plugins/videocall-plugin';
import Paho from 'paho-mqtt';


let connection: Connection;
let session: Session;
let handle: any;


  async function janusMqttConect() {

      const mqttclass = await new MqttTransport(
      new Paho.Client(serverUrl, Number(port), clientId),
        { tojanus: "to-janus", fromjanus: "from-janus", logs: false },
        { tojanusadmin: "to-janus-admin", fromjanusadmin: "from-janus-admin", admin_enabled: false }
      )
      connection = await new Connection(mqttclass);

  }


  async function createSession() {
    try {
      session = await connection.create();
    } catch (error: any){
      Logger(error);
    }
  }

  async function createHandle() {
    try {
      handle = await session.attach(VideocallHandle);
    } catch (error: any){
      Logger(error);
    }
  }


```

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
