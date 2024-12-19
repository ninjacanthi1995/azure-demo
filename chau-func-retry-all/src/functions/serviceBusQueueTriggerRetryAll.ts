import { app, InvocationContext } from "@azure/functions";

export async function serviceBusQueueTriggerRetryAll(messages: unknown[], context: InvocationContext): Promise<void> {
    context.log('Service bus queue function processed message:', messages);
    // throw new Error('This is a retry all error');
}

app.serviceBusQueue('serviceBusQueueTriggerRetryAll', {
    connection: 'chauservicebus_SERVICEBUS',
    queueName: 'chau-queue-retry-all',
    handler: serviceBusQueueTriggerRetryAll,
    cardinality: 'many',
});
