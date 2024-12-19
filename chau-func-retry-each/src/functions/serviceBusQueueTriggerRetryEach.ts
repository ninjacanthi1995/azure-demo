import { app, InvocationContext, output } from "@azure/functions";
import { ServiceBusClient, ServiceBusReceivedMessage } from "@azure/service-bus";

const serviceBusConnectionString = process.env["chauservicebus_SERVICEBUS"];
const serviceBusClient = new ServiceBusClient(serviceBusConnectionString!);

export async function serviceBusQueueTriggerRetryEach(messages: ServiceBusReceivedMessage[], context: InvocationContext): Promise<void> {
    const receiver = serviceBusClient.createReceiver("chau-queue-retry-each");
    for (const message of messages) {
        try {
          context.log(`Processing message: ${message}`);
          
          // Simulate message processing logic
          if (message.body?.someCondition === false) {
            throw new Error("Message processing failed");
          }
    
          // Complete the message manually
          await receiver.completeMessage(message);
          context.log(`Message processed successfully: ${message}`);
        } catch (error) {
          context.error(`Error processing message: ${error.message}`);
    
          // Dead-letter the message manually
          await receiver.deadLetterMessage(message, {
            deadLetterReason: "ProcessingFailed",
            deadLetterErrorDescription: error.message,
          });
    
          context.log(`Message dead-lettered: ${message.body}`);
        }
    }
}

app.serviceBusQueue('serviceBusQueueTriggerRetryEach', {
    connection: 'chauservicebus_SERVICEBUS',
    queueName: 'chau-queue-retry-each',
    handler: serviceBusQueueTriggerRetryEach,
    cardinality: 'many',
});
