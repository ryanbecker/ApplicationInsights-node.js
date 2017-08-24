// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
import Client = require("../../Library/Client");
import { channel, IStandardEvent } from "diagnostic-channel";

import { redis } from "diagnostic-channel-publishers";

let clients: Client[] = [];

export const subscriber = (event: IStandardEvent<redis.IRedisData>) => {
    clients.forEach((client) => {
        if (event.data.commandObj.command === "info") {
            // We don't want to report 'info', it's irrelevant
            return;
        }
        client.trackDependency(
            {
                target: event.data.address,
                name: event.data.commandObj.command,
                data: event.data.commandObj.command,
                duration: event.data.duration,
                success: !event.data.err,
                /* TODO: transmit result code from redis */
                resultCode: event.data.err ? "1" : "0",
                dependencyTypeName: "redis"
            });

    });
};

export function enable(enabled: boolean, client: Client) {
    if (enabled) {
        if (clients.length === 0) {
            channel.subscribe<redis.IRedisData>("redis", subscriber);
        };
        clients.push(client);
    } else {
        clients = clients.filter((c) => c != client);
        if (clients.length === 0) {
            channel.unsubscribe("redis", subscriber);
        }
    }
}