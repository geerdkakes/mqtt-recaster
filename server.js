var mqtt=require('mqtt');
const args = require('minimist')(process.argv.slice(2));
var nodeCleanup = require('node-cleanup');
var port;
var receivingSecureUrl = false;
/*
 * receiving server options: 
 * -h url (if ommited mqtt://localhost is used)
 * -p port (if ommited port 1883 is used for mqtt and 8883 for mqtts)
 * -u user receiving server
 * -s passwd receiving server
 * -t topic to subscribe to ("#" if omitted)
 * -c Certificate file name receiving server
 * -k Private key file name receiving server
 * -r Root certificate file name-i <client_id>
 * -i <client_id>
 * -a reject unauthorised connection true or false
 * 
 * Sending server options
 * --sendingUrl url: MQTT URL
 * --sendingPort Port: 
 * --sendingQos qos: QOS value
 * --sendingUser
 * --sendingPasswd password: password for sending server
 * --sendingTopic topic: topic of sending server. If ommited the topic is used of receiving
 * --sendingCert
 * --sendingKey
 * --sendingRoot
 * --sendingRejectUnauthorised
 * --sendingClient
 * --retain <true|false>: set retainflag, default is false
 * 
 * Generic options
 *
 * -v <level> for verbose output
 
 *
 * When using TLS make sure the CA certificate is known. E.g. by
 * specifying the path wit an environment variable:
 *
 * export NODE_EXTRA_CA_CERTS=/Users/geerd/Developer/geoserver-k8s/etc/ca_certificate.pem
 *
 */

 // when running on the cluster with rabbitmq use "rabbitmq.default.svc.appfactory.local"
 // for the hostname

var mqtt_url = (typeof args.h === 'undefined' || args.h === null) ? "mqtt://localhost" : args.h;
var client_id = (typeof args.i === 'undefined' || args.i === null) ? "mqttjs02uni" : args.i;

if (mqtt_url.substring(0,5) === "mqtts") {
    secure = true;
 }

if (typeof args.p === 'undefined' || args.p === null) {
    // no port specified, we guess the port
    if (secure) {
        port = 8883;
    } else {
        port = 1883;
    }
} else {
    port = args.p;
}

var receivingUsername = (typeof args.u === 'undefined' || args.u === null) ? "testuser" : args.u;
var receivingPassword = (typeof args.s === 'undefined' || args.s === null) ? "passwd" : args.s;

var receivingKey = (typeof args.k === 'undefined' || args.k === null) ? null : fs.readFileSync(args.k);
var receivingCert = (typeof args.c === 'undefined' || args.c === null) ? null : fs.readFileSync(args.c);
var receivingCa = (typeof args.r === 'undefined' || args.r === null) ? null : fs.readFileSync(args.r);
var receivingRejectUnauthorized = (typeof args.a === 'undefined' || args.a === null || args.a === 'false') ? false : true;

var sendingUrl = (typeof args.sendingUrl === 'undefined' || args.sendingUrl === null) ? "mqtt://localhost" : args.sendingUrl;
var sendingSecure;
var sendingPort;
var receivingTopic = (typeof args.t === 'undefined' || args.t === null) ? "#" : args.t;
var verbose = (typeof args.v === 'undefined' || args.v === null) ? 0 : args.v;

if (sendingUrl.substring(0,5) === "mqtts") {
    sendingSecure = true;
 }

if (typeof args.sendingPort === 'undefined' || args.sendingPort === null) {
    // no port specified, we guess the port
    if (sendingSecure) {
        sendingPort = 8883;
    } else {
        sendingPort = 1883;
    }
} else {
    sendingPort = args.sendingPort;
}

var sendingQos = (typeof args.sendingQos === 'undefined' || args.sendingQos === null) ? 0 : args.sendingQos;
var sendingUser = (typeof args.sendingUser === 'undefined' || args.sendingUser === null) ? "none" : args.sendingUser;
var sendingPasswd = (typeof args.sendingPasswd === 'undefined' || args.sendingPasswd === null) ? "none" : args.sendingPasswd;
var sendingTopic = (typeof args.sendingTopic === 'undefined' || args.sendingTopic === null) ? "" : args.sendingTopic;;
var sendingCert = (typeof args.sendingCert === 'undefined' || args.sendingCert === null) ? null : fs.readFileSync(args.sendingCert);
var sendingKey = (typeof args.sendingKey === 'undefined' || args.sendingKey === null) ? null : fs.readFileSync(args.sendingKey);
var sendingRoot = (typeof args.sendingRoot === 'undefined' || args.sendingRoot === null) ? null : fs.readFileSync(args.sendingRoot);
var sendingClient = (typeof args.sendingClient === 'undefined' || args.sendingClient === null) ? defaultSendingClientID : args.sendingClient;
var retain = (typeof args.retain === 'undefined' || args.retain === null) ? false : args.retain;
var sendingRejectUnauthorised =  (typeof args.sendingRejectUnauthorised === 'undefined' || args.sendingRejectUnauthorised === null) ? false : args.sendingRejectUnauthorised;

// Setting receiving mqtt options
var mqtt_receiving_options = {
    clientId: client_id,
    username: receivingUsername,
    password: receivingPassword,
    port: port,
    clean:false,
};

mqtt_receiving_options.key = receivingKey;
mqtt_receiving_options.cert = receivingCert;
mqtt_receiving_options.ca = receivingCa;
mqtt_receiving_options.rejectUnauthorized = receivingRejectUnauthorized;


// setting sending mqtt options
var mqtt_sending_options = {
    clientId: sendingClient,
    username: sendingUser,
    password: sendingPasswd,
    port: sendingPort,
    clean:false,
};

mqtt_sending_options.key = sendingKey;
mqtt_sending_options.cert = sendingCert;
mqtt_sending_options.ca = sendingRoot;
mqtt_sending_options.rejectUnauthorized = sendingRejectUnauthorised;


var message_options = {
    retain:false,
    qos:(typeof args.q === 'undefined' || args.q === null) ? 0 : args.q
};


// connect to receiving MQTT system
var receiverConnected = false;
if (verbose) {
    console.log("Connecting to receiving system " + mqtt_url);
    console.log("using options:");
    console.log(mqtt_receiving_options);
}

var receiverClient  = mqtt.connect(mqtt_url,
                                   mqtt_receiving_options
                           );



// Connect to sending MQTT system
var sendingConnected = false;
if (verbose) {
    console.log("Connecting to sending " + sendingUrl);
    console.log("using options:");
    console.log(mqtt_sending_options);
}

var sendingClient  = mqtt.connect(sendingUrl,
                                   mqtt_sending_options
                           );


// On connect to receiving system subscribe to receiving topic
receiverClient.on("connect",function(){
    receiverConnected = receiverClient.connected;
    if (verbose ) {
        console.log("Connected to receiving system: " + receiverConnected);
        console.log("Subscribing to: " + receivingTopic);
    }

    receiverClient.subscribe(receivingTopic, function (err) {
        if (!err) {
          console.log("subscribed to topic " + receivingTopic);
          sendtime = 0; // enable sending
        } else console.log( "error subscribing:" + err );
    });
});

// On error of receiving system exit
receiverClient.on("error", function(error){
   console.error("Can't connect "+error);
   process.exit(1);
});


// On connect to sending system set status accordingly
sendingClient.on("connect",function(){
    sendingConnected = sendingClient.connected;
    if (verbose ) {
        console.log("Connected to sending system: " + sendingConnected);
        console.log("Ready to publish messages to: " + sendingTopic);
    }
});

// On error of sending system exit
sendingClient.on("error", function(error){
    console.error("Can't connect "+error);
    process.exit(1);
 });


//handle incoming messages on receiving syste
receiverClient.on('message',function(topic, message, packet){
    if (verbose >= 3 ) {
        console.log("incomming message with message: " + message);
    }

    // send message
    if (sendingConnected) {
        if (verbose >=2) {
            console.log("re-publishing message to topic: " + sendingTopic);
        }
        sendingClient.publish(sendingTopic, message, message_options);
    }


});


nodeCleanup(function (exitCode, signal) {
    console.log("exiting with signal " + signal);

});