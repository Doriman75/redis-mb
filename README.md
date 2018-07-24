

# redis-mb
**redis-mb** is a Message Broker based on Redis and Node.js.

# Concept
The main concept of **redis-mb** is *Virtual Topic*. A *Virtual Topic* is like a topic where the producer send a message and consumers receive a copy of the message on their own queue.

Here an example of a *Virtual Topic* with one Producer and four Consumers.

![Virtual Topic](docs/vt.svg)


# API
## To consume a message from a queue
The api to dequeue a message from the *Virtual Topic* is:

```GET: /api/v1/queues/[virtual-topic]/[consumer]```

*virtual-topic* is the name of the virtual topic
*consumer* is the name of the consumer

if a message is available it is returned as body of the response and the http status is 200.
if a message is not available the response (returned after a timeout) is empty and the http status is 204.
**redis-mb** assumes that the client adopts the *long polling* technique to get the messages. The timeout before a response is provided is configurable.

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

### Example: getting a message from the virtual topic (no data available)
```
url: /api/v1/queues/email/email-sender
method: GET
HTTP Status: 204
```

## To produce a message in a topic
The api to enqueue a message in the *Virtual Topic* is:

```POST: /api/v1/topics/[virtual-topic]?metadata=[metadata-list]```

*virtual-topic* is the name of the virtual topic where to post the message.
*metadata-list* is the list of metadata to add to the message.
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


The body of the response is the list of the message actually enqueued.

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
    "to": "user@domain.com",
    "subject": "something about redis-mb",
    "body": "redis-mb is very simple"
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
      "to": "user@domain.com",
      "subject": "something about redis-mb",
      "body": "redis-mb is very simple",
      "metadata": {
          "uuid": "95c99d9b-bbeb-4a13-9633-483251b7c235",
          "timestamp_iso8061": "2018-07-23T16:20:04.561Z"
      }
  }
```


### Example: enqueue a list of messages in the topic 'email'

```
url: /api/v1/topics/email
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
[
    {
        "to": "user1@domain.com",
        "subject": "something about redis-mb 1",
        "body": "redis-mb is very simple",
        "metadata": {
            "uuid": "31f5bcd1-60a8-416b-9a0d-77caabe074a7",
            "host": "localhost:8080",
            "x-request-id": "4e43e3d8-80b0-4d83-8ef2-e794728baead"
        }
    },
    {
        "to": "user2@domain.com",
        "subject": "something about redis-mb 2",
        "body": "redis-mb is very good",
        "metadata": {
            "uuid": "09713d46-6f4b-4fcc-9dfa-63f38a1cc7c3",
            "host": "localhost:8080",
            "x-request-id": "4e43e3d8-80b0-4d83-8ef2-e794728baead"
        }
    },
    {
        "to": "user3@domain.com",
        "subject": "something about redis-mb 3",
        "body": "redis-mb is very light",
        "metadata": {
            "uuid": "ee8a16fc-8c65-44c7-88d1-3b8047c5ffba",
            "host": "localhost:8080",
            "x-request-id": "4e43e3d8-80b0-4d83-8ef2-e794728baead"
        }
    }
]
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
* In each message will be created a field named ```"_"``` in witch
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
