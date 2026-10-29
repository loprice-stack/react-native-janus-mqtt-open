import { EventEmitter } from 'events';
import { getNumericID, Logger } from './utils';
import TransactionManager from './transaction-manager';
import { isErrorData, isResponseData, JANUS, JANUSMQTT } from './protocol';
import Session from './session';
import type {
  JanusAdminOptions,
  JanusOptions,
  MqttClientClass,
} from './mqtt-transport';
const LOG_NS = '[connection.ts]';

class Connection extends EventEmitter {
  _tm: any;
  _sessions: Map<number, Session>;
  id: number;
  name: string;
  //@ts-ignore
  _transport: MqttClientClass = undefined;
  //@ts-ignore
  _options: JanusOptions = {};
  //@ts-ignore
  _adminoptions: JanusAdminOptions = {};

  constructor(clientclass: MqttClientClass) {
    super();
    /**
     * The transaction manager used by this connection.
     */
    this._tm = new TransactionManager();

    /**
     * Keep track of the sessions.
     */
    this._sessions = new Map();

    /**
     * A numerical identifier assigned for logging purposes.
     */
    this.id = parseInt(getNumericID());

    /**
     * A more descriptive, not unique string (used for logging).
     */
    this.name = `[${this.id}]id}]`;

    try {
      if (clientclass) {
        Logger(clientclass);
        this._transport = clientclass;
        this._options = clientclass.janus;
        this._adminoptions = clientclass.janusadmin;
        this._transport.connect(
          () => {
            this.setJanusMessageListerner();
            this.setJanusMessageListerner2('status');
            Logger(`${LOG_NS}  connected successfully`);
          },
          (error: any) => {
            Logger(`${LOG_NS}  connection lost! reason: ${error}`);
          }
        );
      } else {
        Logger(
          `${LOG_NS} clientclass is not defined:  clientclass: "${clientclass}"`
        );
        return;
      }

      //Make sure to implement  in your MqttClientClass
      this._transport.onConnectionLost((error: any) => {
        this._signalClose(false);
        Logger(`${LOG_NS} [${this.id}] connection lost! reason [${error}]`);
      });

      //This function is very important an must be implemented in your MqttClientClass
      this._transport.onMessageArrived((message: any) => {
        Logger(`${LOG_NS} [${this.id}] received janus message: [${message}]`);
        //Make sure to filter all janus messages in your class
        //We expect only janus messages here

        this._handleMessage(JSON.parse(message));
      });
    } catch (error) {
      Logger(
        `${LOG_NS} [${this.id}] Error while initializing transport (${error})`
      );
    }
  }

  /**
   * Open a connection using the transport defined open method.
   * Users do not need to call this method, since the connection is opened by your Mqtt client
   */
  async open() {
    //Make sure to implement this function to your MqttClientClass
    //await this._transport.connect();
    return this;
  }

  /**
   * Gracefully close the connection using the transport defined close method.
   */
  async close() {
    //Make sure to implement this function to your MqttClientClass
    await this._transport.disconnect();
    return;
  }

  /**
   * Listen to message specified to options.
   */
  setJanusMessageListerner() {
    //Make sure to implement this function to your MqttClientClass
    this._transport.subscribe(this._options.fromjanus);
  }

  /**
   * Listen to admin message specified to options.
   */
  setJanusAdminMessageListerner() {
    //Make sure to implement this function to your MqttClientClass
    this._transport.subscribe(this._adminoptions.fromjanusadmin);
  }

  /**
   * Listen to message by explicity specification.
   */
  setJanusMessageListerner2(topic: string) {
    //Make sure to implement this function to your MqttClientClass
    this._transport.subscribe(topic);
  }

  /**
   * Send request to janus.
   */
  send(request: any) {
    //Make sure to implement this function to your MqttClientClass
    this._transport.publish(this._options.tojanus, request);
  }

  /**
   * Change tojanus topic
   */
  changeToJanusTopicOption(newtopic: string) {
    this._options.tojanus = newtopic;
  }

  /**
   * Change tojanusadmin topic
   */
  changeToJanusAdminTopicOption(newtopic: string) {
    this._adminoptions.tojanusadmin = newtopic;
  }

  /**
   * Change fromjanus topic
   */
  changeFromJanusTopicOption(newtopic: string) {
    //Change fromjanus and subscribe
    this._options.fromjanus = newtopic;
    this.setJanusMessageListerner();
  }

  /**
   * Change fromjanusadmin topic
   */
  changeFromJanusAdminTopicOption(newtopic: string) {
    //Change fromjanus and subscribe
    this._adminoptions.fromjanusadmin = newtopic;
    this.setJanusAdminMessageListerner();
  }

  /**
   * Cleanup the connection closing all owned transactions and emitting the destroyed event
   * and removing all registered listeners.
   */
  _signalClose(graceful: boolean) {
    /* Close all pending transactions inside this connection with an error */
    this._tm.closeAllTransactionsWithError(
      null,
      new Error('connection closed')
    );
    /* Clear tx table */
    this._tm.clear();
    /* Clear session table */
    this._sessions.clear();

    /* Did we really mean to close it? */
    if (graceful) {
      /* This is a greceful teardown */
      /**
       * The connection has been gracefully closed.
       */
      this.emit(JANUSMQTT.EVENT.CONNECTION_CLOSED, { id: this.id });
    } else {
      /* If this event is unexpected emit an error */
      const error = new Error('unexpected disconnection');
      /**
       * The connection has been unexpectedly closed.
       */
      this.emit(JANUSMQTT.EVENT.CONNECTION_ERROR, error);
    }

    /* Remove all listeners to avoid leaks */
    this.removeAllListeners();
  }

  /**
   * Create a new session in this connection.
   *
   *
   * const session = await connection.create();
   * Logger.info(`***** SESSION CREATED *****`);
   */
  async create(ka_interval: number = 30) {
    Logger(`${LOG_NS} ${this.name} creating new session`);

    const request = {
      janus: JANUS.REQUEST.CREATE_SESSION,
    };

    try {
      const {
        //@ts-ignore
        data: { id },
      } = await this.sendRequest(request);
      /* Increase the maximum number of listeners for this connection */
      /* The session will register two listeners */
      this.setMaxListeners(this.getMaxListeners() + 2);

      /* Create a new Session and add it to the table */
      const session_instance = new Session(this, id, ka_interval);
      this._sessions.set(session_instance.id, session_instance);

      /* On session destroy delete the entry from session map and decrease the number of listeners */
      session_instance.once(JANUSMQTT.EVENT.SESSION_DESTROYED, ({ id }) => {
        this._sessions.delete(id);
        this.setMaxListeners(this.getMaxListeners() - 2);
      });

      Logger(`${LOG_NS} ${this.name} session created (id=${id})`);
      return session_instance;
    } catch (error) {
      Logger(`${LOG_NS} ${this.name} session creation error (${error})`);
      throw error;
    }
  }

  /**
   * Send a request from this connection using the transport defined send method
   */
  async sendRequest(request: any) {
    /* Add connection properties */
    request.transaction = (await request.transaction)
      ? request.transaction
      : getNumericID();

    return new Promise((resolve, reject) => {
      /* Create a new transaction if the transaction does not exist */
      /* Use promise resolve and reject fn as callbacks for the transaction */
      this._tm.createTransaction({
        id: request.transaction,
        owner: this,
        request: request.janus,
        done: resolve,
        error: reject,
      });
      try {
        //Make sure to implement this function to your MqttClientClass
        //to send message to janus
        this._transport.publish(
          this._adminoptions.admin_enabled
            ? this._adminoptions.tojanusadmin
            : this._options.tojanus,
          request
        );

        Logger(
          `${LOG_NS} ${this.name} sent request to janus: ${JSON.stringify(request)}`
        );
      } catch (error: any) {
        /* In case of error quickly close the transaction */
        this._tm.closeTransactionWithError(request.transaction, this, error);
        reject(error);
        return;
      }
    });
  }

  /**
   * Manage a message sent to this session.  If a session is involved let it manage the message.
   * If the message involves a owned transaction and the response is a definitive one,
   * the transaction will be closed
   */
  _handleMessage(janus_message: any) {
    const { session_id, transaction, janus } = janus_message;

    //Logger(session_id);
    //Logger(transaction);
    //Logger(janus);
    //Logger("--------session_id--------transaction------------janus------------------------------");

    /* Check if a session is involved */
    if (session_id) {
      /* Look for the session in the map */
      const session = this._sessions.get(session_id);
      /* If the handle is missing notifies the user */
      if (!session) {
        Logger(
          `${LOG_NS} ${this.name} session ${session_id} not found for incoming message ${janus}`
        );
        return;
      }

      try {
        /* Let the session manage the message */
        session._handleMessage(janus_message);
      } catch (error) {
        Logger(
          `${LOG_NS} ${this.name} error while handling message (${error})`
        );
      }
      return;
    }

    /* Check if a transaction is involved */
    if (transaction) {
      Logger(
        `${LOG_NS} ${this.name} received ${janus} for transaction ${transaction}`
      );

      /* Not owned by this connection? */
      if (this._tm.getTransactionOwner(transaction) !== this) {
        Logger(
          `${LOG_NS} ${this.name} transaction ${transaction} not found for incoming messsage ${janus}`
        );
        return;
      }

      /*
       * Pending connection transaction management.
       * Close transaction in case of:
       * 1) Definitive response
       */
      if (isResponseData(janus_message)) {
        if (isErrorData(janus_message)) {
          const error = new Error(
            `${janus_message.error.code} ${janus_message.error.reason}`
          );
          return this._tm.closeTransactionWithError(transaction, this, error);
        }

        this._tm.closeTransactionWithSuccess(transaction, this, janus_message);
      }

      return;
    }

    /* No session, no transaction? */
    Logger(
      `${LOG_NS} ${this.name} unexpected janus message directed to the connection ${JSON.stringify(janus_message)}`
    );
  }
}

export default Connection;
