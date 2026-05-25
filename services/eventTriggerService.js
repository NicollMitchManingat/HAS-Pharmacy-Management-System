exports.sendNotification = async (payload, token) => {
    try {
        const notificationUrl = process.env.NOTIFICATION_SYSTEM_URL;
        if (!notificationUrl) {
            console.log("[Notification Stub] Would notify", payload.recipientEmail, ":", payload.message);
            return { success: true, message: "Notification triggered (stub)" };
        }

        const body = {
            senderSystem: process.env.SENDER_SYSTEM_NAME || "HAS-Pharmacy",
            recipientEmail: payload.recipientEmail,
            subject: payload.subject,
            message: payload.message
        };

        const response = await fetch(notificationUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => "(no body)");
            throw new Error(`Notification API returned ${response.status}: ${errorBody}`);
        }
        return { success: true, message: "Notification sent" };
    } catch (error) {
        console.error("Failed to trigger notification:", error);
        throw new Error("Notification system unavailable: " + error.message);
    }
};