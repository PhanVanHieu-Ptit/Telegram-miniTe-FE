export async function getConnectedMqttClient() {
    const { getMqttClient } = await import("@/mqtt/mqtt.client");
    const client = getMqttClient({
        url: import.meta.env.VITE_MQTT_URL ?? "ws://localhost:9001",
        username: import.meta.env.VITE_MQTT_USER,
        password: import.meta.env.VITE_MQTT_PASS,
    });
    await client.connect();
    return client;
}
