
# redis-mb
**redis-mb** is a Message Broker based on Redis and Node.js.

# Concept
The main concept of **redis-mb** is *Virtual Topic*. A *Virtual Topic* is like a topic where the producer send a message and consumers receive a copy of the message on their own queue.

Here an example of a *Virtual Topic* with one Producer and four Consumers.

![Virtual Topic](docs/vt.svg)


# API
## To consume a message from a queue


## To produce a message in a topic
The api to enqueue a message in the *Virtual Topic* is:

```POST: /api/v1/topics/[virtual-topic]?metadata=[metadata list]```

The body must be a valid json.
If the body is an object then it will be loaded in the topic.
If the body is an array then each element will be loaded in the topic one by one.
The query param metadata is a list of metadata that will be automatically added to each message.
The list of available metadata is:

 - ```uuid```: a random UUID.
 - ```timestamp```: number of milliseconds since 1/1/1970
 - ```timestamp_iso8061```: the timestamp in ISO8061 format (ie. 2018-07-23T16:00:45.333Z)
 - ```headers```: all headers in the http request
 - ```header[*header name*]```: the header *header name* in the http request.


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
[
    {
        "to": "user@domain.com",
        "subject": "something about redis-mb",
        "body": "redis-mb is very simple"
    }
]
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
[
    {
        "to": "user@domain.com",
        "subject": "something about redis-mb",
        "body": "redis-mb is very simple",
        "metadata": {
            "uuid": "95c99d9b-bbeb-4a13-9633-483251b7c235",
            "timestamp_iso8061": "2018-07-23T16:20:04.561Z"
        }
    }
]
```

# Configuration

## Configuration file
## Command line
