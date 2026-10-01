const redactionPatterns = [

    // Email addresses
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,

    // Indian phone numbers
    /(?:\+91[\s-]?)?[6-9]\d{9}/g,

    // International phone numbers
    /\+\d{1,3}[\s-]?\d{6,14}/g,
];

export const redactMessage = (message) => {
    let redactedMessage = message;
    let isRedacted = false;

    for (const pattern of redactionPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(redactedMessage)) {
            redactedMessage =
                redactedMessage.replace(
                    pattern,
                    "[REDACTED]"
                );
            isRedacted = true;
        }
        pattern.lastIndex = 0;
    }
    
    return {
        message: redactedMessage,
        isRedacted,
    };
};