#!/usr/bin/env bash

# Run script with the following environment variables:
# API_KEY="XXXXXX"
# CLIENT_ID="XXXXXX"
# TOKEN_API="https://xxxxxxxxx/xxx/xxx"
# MQTT_TOKEN_API="https://xxxxxxx/xxxx/xxx"
# TENANT="XXXXXXX"
# RECEIVER_TOPIC="xxxxxx"
# SENDING_HOST="xxxxx"
# SENDING_USER="xxxxxxx"
# SENDING_PASS="xxxxxxx"
# SENDING_CLIENT="xxxxxxxx"
# SENDING_TOPIC="xxxxxxx"



echo "getting resttoken with key for tenant ${TENANT} from url ${TOKEN_API}"

REST_TOKEN=`curl -H "apikey:${API_KEY}" -X POST --data "{ \"tenant\": \"${TENANT}\" }" ${TOKEN_API}`

MQTT_TOKEN=`curl -H "Authorization: Bearer $REST_TOKEN" -X POST --data "{ \"tenant\": \"${TENANT}\",\"id\": \"${CLIENT_ID}\"}" ${MQTT_TOKEN_API}`


pad4() {
  input="$1"
  local len=$(echo -n $input | wc -c)
  local npad=$(( (4 - (len % 4)) % 4 ))
  local pad=""
  for ((i=0; i<$npad; i++)) ; do
     pad="${pad}="
  done
  echo -n "${input}${pad}"
}

decode_jwt_body() {
  local jwt="$1"
  local splits=(${jwt//./ })
  pad4 ${splits[1]} | base64 -id
}

ENDPOINT="$(decode_jwt_body "$MQTT_TOKEN" | jq -r .endpoint)"

echo "using endpoint: ${ENDPOINT}"

node server.js -u ${CLIENT_ID} \
               -s ${MQTT_TOKEN} \
               -h mqtts://${ENDPOINT} \
               -v ${VERBOSE}  \
               -i ${CLIENT_ID} \
               -t ${RECEIVER_TOPIC} \
               --sendingUrl ${SENDING_HOST} \
               --sendingUser ${SENDING_USER} \
               --sendingPasswd ${SENDING_PASS} \
               --sendingClient ${SENDING_CLIENT} \
               --sendingTopic ${SENDING_TOPIC}