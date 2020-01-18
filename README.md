# mqtt-recaster
Subscribes and reposts messages to other system

With the mqtt-recaster you can read from one mqtt topic and post to an other topic, both can be on separate servers.
The current implementation has been made to use with the data services hub of KPN. If using a regular mqtt system
you probably want to change the implementation under `start.sh`.

## Usage
Build docker container using:
```
recaster_image="geerd/recasterimage"
docker build -f ./Dockerfile -t ${recaster_image}
docker push ${recaster_image}
```

Copy the configmap `variableconfigmap.skeleton.yaml` to `variableconfigmap.yaml` and define all the variables.
Deploy the configmap using:
```
kubectl apply -f variableconfigmap.yaml
```

Deploy the deployment using (change the image according to the step where you pushed the image):
```
recaster_image="geerd/recasterimage"
cat deployment.yaml | sed --expression="s|<<--recaster-image-->>|${recaster_image}|g" | kubectl apply -f -
```



