# redis-mb
**redis-mb** is a Message Broker based on Redis and Node.js. It exposes a simple REST API.

# Concept
The main concept of **redis-mb** is *Virtual Topic*. A *Virtual Topic* is like a topic where the producer send a message and consumers receive a copy of the message on their own queue.

Here an example of a *Virtual Topic* with one Producer and four Consumers.

![Virtual Topic](docs/vt.svg)

# Installation and start
To install the application you have:
- download the project from github using the command ```git clone https://github.com/Doriman75/redis-mb.git ```
- run ```npm install```
- start the application with  ```npm start``` or ```node server.js```


# API
## To consume a message from a queue
The api to dequeue a message from the *Virtual Topic* is:

```
GET: /api/v1/queues/<virtual-topic>/<consumer>[?n=<n>]
```

*virtual-topic* is the name of the virtual topic
*consumer* is the name of the consumer
*n* is the maximum number of message to dequeue (default: 1)

if a message is available it is returned as body of the response and the http status is 200.
if a message is not available the response (returned after a timeout) is empty and the http status is 204.
**redis-mb** assumes that the client adopts the *long polling* technique to get the messages. The timeout before a response is configurable.

### Example: getting a message from the virtual topic
```
url: /api/v1/queues/email/email-sender
method: GET
HTTP Status: 200
response:
{
  	"to":"user@domain.com",
  	"subject":"something about redis-mb",
  	"body":"redis-mb is very simple"
}
```

### Example: getting 5 messages from the virtual topic
```
url: /api/v1/queues/email/email-sender?n=5
method: GET
HTTP Status: 200
response:
[
  {
    	"to":"user1@domain.com",
    	"subject":"something about redis-mb1",
    	"body":"redis-mb is very simple1"
  },
  {
    	"to":"user2@domain.com",
    	"subject":"something about redis-mb2",
    	"body":"redis-mb is very simple2"
  },
  {
    	"to":"user3@domain.com",
    	"subject":"something about redis-mb3",
    	"body":"redis-mb is very simple3"
  },
  {
    	"to":"user4@domain.com",
    	"subject":"something about redis-mb4",
    	"body":"redis-mb is very simple4"
  },
  {
    	"to":"user5@domain.com",
    	"subject":"something about redis-mb5",
    	"body":"redis-mb is very simple5"
  }
]
```

### Example: getting a message from the virtual topic (no data available)

```

url: /api/v1/queues/email/email-sender
method: GET
HTTP Status: 204

```

## To produce a message in a topic
The api to enqueue a message in the *Virtual Topic* is:

```
POST: /api/v1/topics/[virtual-topic]?metadata=[metadata-list]&list=[boolean]&scheduled_at=[scheduled_at]
```

*virtual-topic* is the name of the virtual topic where to post the message.
*metadata-list* is the list of metadata to add to the message.
*list* is a boolean. If false the list of messages will be not returned. Usefull for performance reasons.
*scheduled_at* is the timestamp (in any string format accepted by ```new Date(scheduled_at) ``` javascript function)

The body of the request must be a valid json.
If the body is an object then it will be loaded in the topic.
If the body is an array then each element will be loaded in the topic one by one.
The query param metadata is a list of metadata that will be automatically added to each message.
The list of available metadata is:

 - ```uuid```: a random UUID.
 - ```timestamp```: number of milliseconds since 1/1/1970
 - ```timestamp_iso8061```: the timestamp in ISO8061 format (ie. 2018-07-23T16:00:45.333Z)
 - ```headers```: all headers in the http request
 - ```header[<header_name>]```: the header *header_name* in the http request.
 - ```scheduled_at```: the moment since the message can be dequeued.

The body of the response is number of the messages actually enqueued.

### Example: enqueue a message in the topic 'email'
```
url: /api/v1/topics/email
method: POST
body:
  {
  	"to":"user@domain.com",
  	"subject":"something about redis-mb",
  	"body":"redis-mb is very simple"
  }

response:
{
    "added": 1,
    "list": [
        {
            "to": "user@domain.com",
            "subject": "something about redis-mb",
            "body": "redis-mb is very simple"
        }
    ]
}
```


### Example: enqueue a message in the topic 'email' with some metadata
```
url: /api/v1/topics/email?metadata=uuid,timestamp_iso8061
method: POST
body:
  {
  	"to":"user@domain.com",
  	"subject":"something about redis-mb",
  	"body":"redis-mb is very simple"
  }

response:
{
    "added": 1,
    "list": [
        {
            "to": "user@domain.com",
            "subject": "something about redis-mb",
            "body": "redis-mb is very simple",
            "metadata": {
                "uuid": "927b08a3-b5a0-42d0-9595-362d6112e469",
                "timestamp_iso8061": "2018-07-26T10:06:35.903Z"
            }
        }
    ]
}
```

### Example: enqueue a message in the topic 'email' scheduled at a specific date, with specific metadata
```
url: /api/v1/topics/email?scheduled_at=2018-07-26T11:52&metadata=uuid,scheduled_at,timestamp_iso8061,header[x-request-id]
method: POST
body:
  {
  	"to":"user@domain.com",
  	"subject":"something about redis-mb",
  	"body":"redis-mb is very simple"
  }

response:
{
    "added": 1,
    "list": [
        {
            "to": "user@domain.com",
            "subject": "something about redis-mb",
            "body": "redis-mb is very simple",
            "metadata": {
                "uuid": "ec343254-5cc6-4333-bb55-eb463c39f915",
                "scheduled_at": "2018-07-26T11:52",
                "timestamp_iso8061": "2018-07-26T10:07:45.966Z",
                "x-request-id": "ec5450a2-84d1-4a84-8b30-085be284b07e"
            }
        }
    ]
}
```


### Example: enqueue a list of messages in the topic 'email'

```
url: /api/v1/topics/email?list=false
method: POST
body:
[
  {
  	"to":"user1@domain.com",
  	"subject":"something about redis-mb 1",
  	"body":"redis-mb is very simple"
  },
  {
  	"to":"user2@domain.com",
  	"subject":"something about redis-mb 2",
  	"body":"redis-mb is very good"
  },
  {
  	"to":"user3@domain.com",
  	"subject":"something about redis-mb 3",
  	"body":"redis-mb is very light"
  }
]

response:
{
    "added": 3
}
```

### Example: enqueue a list of messages in the topic 'email' with some metadata

```
url: /api/v1/topics/email?metadata=header[host],header[x-request-id],uuid
method: POST
body:
[
  {
  	"to":"user1@domain.com",
  	"subject":"something about redis-mb 1",
  	"body":"redis-mb is very simple"
  },
  {
  	"to":"user2@domain.com",
  	"subject":"something about redis-mb 2",
  	"body":"redis-mb is very good"
  },
  {
  	"to":"user3@domain.com",
  	"subject":"something about redis-mb 3",
  	"body":"redis-mb is very light"
  }
]

response:
{
    "added": 3,
    "list": [
        {
            "to": "user1@domain.com",
            "subject": "something about redis-mb 1",
            "body": "redis-mb is very simple",
            "metadata": {
                "uuid": "7180837f-dbb1-47ed-8b0c-4b828bd40ae7",
                "host": "localhost:8080",
                "x-request-id": "515d2f31-c696-4c44-9469-52d232faa50c"
            }
        },
        {
            "to": "user2@domain.com",
            "subject": "something about redis-mb 2",
            "body": "redis-mb is very good",
            "metadata": {
                "uuid": "1e5b74b6-6e21-46f8-a9d3-18ee3e476251",
                "host": "localhost:8080",
                "x-request-id": "515d2f31-c696-4c44-9469-52d232faa50c"
            }
        },
        {
            "to": "user3@domain.com",
            "subject": "something about redis-mb 3",
            "body": "redis-mb is very light",
            "metadata": {
                "uuid": "4ded51e4-e057-42fb-b44c-4fd6390426cc",
                "host": "localhost:8080",
                "x-request-id": "515d2f31-c696-4c44-9469-52d232faa50c"
            }
        }
    ]
}
```

# Configuration

## Redis
Redis is used to store the messages and the configuration about the consumers and topics.
To configure a topic you should build a set with the key "topic:[*topic name*]" and a member for each consumer.

### Examples: configure the topic "email"
To configure a topic named "email" with two consumers ("email-consumer" and "logger" use the following commands:

```
 sadd topics:email email-consumer logger
```

to add another consumer ("another-consumer") the command is:
```
 sadd topics:email another-consumer
```

to remove the consumer "logger" the command is:
```
 srem topics:email logger
```
to remove the topic "email" the command is:
```
 del topics:email
```


## Configuration file
It is possible to use a configuration file (in json format) to set the property of redis-mb.

### List of properties

* ```port```: the port where the server runs
* ```redis```: the configuration object for ioredis
* ```long_polling.retry```: number of tries before return "no data"
* ```long_polling.interval```: milliseconds between the tries
* ```metadata.list```: the default metadata added to the message
* ```metadata.field_name```: the field of the message where to put the metadata


### Example a configuration file with all properties set
In the following example we have:
* the timeout before returning "no data" is 5 seconds (interval = 500, retry = 10)
* The HTTP port where the server runs is 8080
* In each message will be created a field named ```"_"``` where will be put the metadata.
```
{
  "long_polling": {
    "interval": 500,
    "retry": 10
  },
  "metadata": {
    "list": "uuid, timestamp_iso8061, header[x-request-id]",
    "field_name" : "_"
  },
  "port": 8080
}
```

## Command line
The only command line parameter is the name of the config file to use.

Example:

```node mb.js conf.json```
