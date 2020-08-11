/** handler.ts */

import { APIGatewayProxyEvent } from "aws-lambda"
import { APIGatewayProxyHandler } from "aws-lambda"
import { APIGatewayProxyResult } from "aws-lambda"
import { Context } from "aws-lambda"
import { Handler } from "aws-lambda"
import { ScheduledEvent } from "aws-lambda"
import { SQSEvent } from "aws-lambda"
import { SQSRecord } from "aws-lambda"

import { AWSError } from "aws-sdk"
import { SNS } from "aws-sdk"

export const onSchedule: Handler<ScheduledEvent> = async (event: ScheduledEvent, context: Context) => {
    console.log("Scheduled event received at: ", event.time)
    console.log("Scheduled event id: ", event.id)
    const sns = new SNS({
        region: process.env["AWS_REGION"] as string
    })
    const topic = process.env["TOPIC_ARN"] as string
    console.log("Posting to SNS topic: ", topic)
    console.log("Posting with event id: ", context.awsRequestId)
    const data = {
        id: context.awsRequestId,
        message: "Hello world!"
    }
    await sns.publish({
        TopicArn: topic,
        MessageAttributes: {
            EventType: {
                DataType: "String",
                StringValue: "HelloEvent"
            }
        },
        Message: JSON.stringify(data)
    }).promise().then((data: SNS.PublishResponse) => {
        console.log("Event published to SNS: ", data.MessageId)
    }).catch((err: AWSError) => {
        console.log(err, err.stack)
    })
}

export const fromRequest: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent, context: Context) => {
    console.log("HTTP method: ", event.httpMethod)
    console.log("Resource path: ", event.resource)
    console.log("Request path: ", event.path)
    console.log("Path parameters: ", event.pathParameters)
    console.log("Request query: ", event.queryStringParameters)
    console.log("Request headers: ", event.headers)
    console.log("Request body: ", event.body)

    const sns = new SNS({
        region: process.env["AWS_REGION"] as string
    })
    const topic = process.env["TOPIC_ARN"] as string
    console.log("Posting to SNS topic: ", topic)
    console.log("Posting with event id: ", context.awsRequestId)
    const data = {
        id: context.awsRequestId,
        message: "Hello world!"
    }
    const result: APIGatewayProxyResult = {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: ""
    }
    await sns.publish({
        TopicArn: topic,
        MessageAttributes: {
            EventType: {
                DataType: "String",
                StringValue: "HelloEvent"
            }
        },
        Message: JSON.stringify(data)
    }).promise().then((data: SNS.PublishResponse) => {
        console.log("Event published to SNS: ", data.MessageId)
        result.statusCode = 201
        result.body = JSON.stringify(data)
    }).catch((err: AWSError) => {
        result.statusCode = 500
        result.body = JSON.stringify(err)
        console.log(err, err.stack)
    })
    return result
}

export const respondTo: Handler<SQSEvent> = async (event: SQSEvent, context: Context) => {
    console.log("SQS event records: ", event.Records.length)
    event.Records.forEach((record: SQSRecord) => {
        console.log("Record message id: ", record.messageId)
        const body = JSON.parse(record.body)
        console.log("Body message id: ", body.MessageId)
        console.log("Body event type: ", body.MessageAttributes.EventType.Value)
        const data = JSON.parse(body.Message)
        console.log("Data id: ", data.id)
        console.log("Data message: ", data.message)
    })
}