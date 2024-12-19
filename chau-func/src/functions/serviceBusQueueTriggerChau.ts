import { app, InvocationContext } from "@azure/functions";

export async function serviceBusQueueTriggerChau(messages: unknown, context: InvocationContext): Promise<void> {
    context.log('Service bus queue function processed message:', messages);
    context.log('Service bus queue function context:', context);
}

app.serviceBusQueue('serviceBusQueueTriggerChau', {
    connection: 'chauservicebus_SERVICEBUS',
    queueName: 'chau-queue',
    handler: serviceBusQueueTriggerChau,
    cardinality: 'many',
});
