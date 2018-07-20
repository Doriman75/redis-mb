# redis-mb
**redis-mb** is a Message Broker based on Redis and Node.js.

# Concept
The main concept of **redis-mb** is *Virtual Topic*. A *Virtual Topic* is like a topic where the producer send a message and consumers receive a copy of the message on their own queue.

Here an example of a *Virtual Topic* with one Producer and four Consumers.

```mermaid
graph LR
producer[Producer]-->topic((Topic))
topic-->queue1(Queue1)
topic-->queue2(Queue2)
topic-->queue3(Queue3)
topic-->queue4(Queue4)
queue1-->consumer1[Consumer 1]
queue2-->consumer2[Consumer 2]
queue3-->consumer3[Consumer 3]
queue4-->consumer4[Consumer 4]
```
